"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, FileSpreadsheet, Download, Check, AlertCircle, RefreshCw, Layers, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { sendEmail } from "@/app/actions"
import type { EmailTemplate } from "@/components/email-templates"

// Error boundary wrapper
function SafeComponent({ children }: { children: React.ReactNode }) {
  try {
    return <>{children}</>
  } catch (error) {
    console.error("Component error:", error)
    return <div className="text-red-500">Error loading component</div>
  }
}

// Define contact type with uppercase field names to match Excel
type Contact = {
  NUMBER: string | number
  NAME: string
  EMAIL: string
}

// Define file mapping type
type FileMapping = {
  originalFile: File
  originalName: string
  newName: string
  number: string | number
  matched: boolean
  preview?: string
}

export default function BatchUpload() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [fileMappings, setFileMappings] = useState<FileMapping[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState("")
  const [matchStats, setMatchStats] = useState({ matched: 0, unmatched: 0, total: 0 })
  const [activeTab, setActiveTab] = useState("all")
  const [uploadMethod, setUploadMethod] = useState("individual")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [zipExtractionProgress, setZipExtractionProgress] = useState(0)
  const [extractingZip, setExtractingZip] = useState(false)
  const [isSending, setIsSending] = useState(isSending)
  const [sendingProgress, setSendingProgress] = useState(0)
  const [useAttachments, setUseAttachments] = useState(true)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default")
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)

  // Load templates from localStorage
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem("emailTemplates")
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates)
        if (Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
          setTemplates(parsedTemplates)

          // Set default template
          const defaultTemplate = parsedTemplates.find((t) => t.id === "default") || parsedTemplates[0]
          setSelectedTemplateId(defaultTemplate.id)
          setSelectedTemplate(defaultTemplate)
        }
      }
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }, [])

  // Update selected template when templates change or selectedTemplateId changes
  useEffect(() => {
    const template = templates.find((t) => t.id === selectedTemplateId)
    if (template) {
      setSelectedTemplate(template)
    }
  }, [templates, selectedTemplateId])

  // Handle Excel file import
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Assume first sheet contains the data
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<Contact>(worksheet)

        // Validate data has NUMBER field
        const validData = jsonData.filter((item) => "NUMBER" in item && "NAME" in item && "EMAIL" in item)

        setContacts(validData)

        toast({
          title: "Excel file imported",
          description: `${validData.length} contacts loaded successfully`,
        })

        // If files are already uploaded, process the matching
        if (files.length > 0) {
          processFileMatching(files, validData)
        }
      } catch (error) {
        console.error("Error parsing Excel file:", error)
        toast({
          title: "Import failed",
          description: "Could not parse the Excel file. Please check the format.",
          variant: "destructive",
        })
      }
    }

    reader.readAsArrayBuffer(file)
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    // Check if files exceed the limit
    if (selectedFiles.length > 1400) {
      toast({
        title: "Too many files",
        description: "You can only upload a maximum of 1400 images",
        variant: "destructive",
      })
      return
    }

    // Filter for image files only
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      toast({
        title: "No valid images",
        description: "Please select image files only",
        variant: "destructive",
      })
      return
    }

    setFiles(imageFiles)
    toast({
      title: "Files selected",
      description: `${imageFiles.length} image files selected`,
    })

    // If contacts are already loaded, process the matching
    if (contacts.length > 0) {
      processFileMatching(imageFiles, contacts)
    }
  }

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

    if (droppedFiles.length === 0) {
      toast({
        title: "No valid images",
        description: "Please drop image files only",
        variant: "destructive",
      })
      return
    }

    // Check if files exceed the limit
    if (droppedFiles.length > 1400) {
      toast({
        title: "Too many files",
        description: "You can only upload a maximum of 1400 images",
        variant: "destructive",
      })
      return
    }

    setFiles(droppedFiles)
    toast({
      title: "Files dropped",
      description: `${droppedFiles.length} image files selected`,
    })

    // If contacts are already loaded, process the matching
    if (contacts.length > 0) {
      processFileMatching(droppedFiles, contacts)
    }
  }

  // Handle ZIP file upload
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name.toLowerCase().endsWith(".zip")) {
      toast({
        title: "Invalid file",
        description: "Please select a ZIP file",
        variant: "destructive",
      })
      return
    }

    setExtractingZip(true)
    setProcessingStep("Extracting ZIP file...")
    setZipExtractionProgress(0)

    try {
      // Read the ZIP file
      const JSZip = (await import("jszip")).default
      const zipData = await JSZip.loadAsync(file)

      // Get all files from the ZIP
      const zipEntries = Object.keys(zipData.files).filter((filename) => !zipData.files[filename].dir)

      if (zipEntries.length === 0) {
        throw new Error("ZIP file is empty")
      }

      // Check if there are too many files
      if (zipEntries.length > 1400) {
        throw new Error("ZIP contains more than 1400 files")
      }

      const extractedFiles: File[] = []
      let processedEntries = 0

      // Process each file in the ZIP
      for (const filename of zipEntries) {
        const zipEntry = zipData.files[filename]

        // Skip directories
        if (zipEntry.dir) continue

        // Get the file extension
        const fileExt = filename.split(".").pop()?.toLowerCase() || ""
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(fileExt)

        if (isImage) {
          // Get the file data as blob
          const blob = await zipEntry.async("blob")

          // Convert to File object with proper name
          const fileBaseName = filename.split("/").pop() || filename
          const file = new File([blob], fileBaseName, { type: `image/${fileExt === "jpg" ? "jpeg" : fileExt}` })

          extractedFiles.push(file)
        }

        // Update progress
        processedEntries++
        const progress = Math.floor((processedEntries / zipEntries.length) * 100)
        setZipExtractionProgress(progress)
      }

      if (extractedFiles.length === 0) {
        throw new Error("No image files found in ZIP")
      }

      // Set the extracted files
      setFiles(extractedFiles)

      toast({
        title: "ZIP extracted",
        description: `${extractedFiles.length} image files extracted from ZIP`,
      })

      // If contacts are already loaded, process the matching
      if (contacts.length > 0) {
        processFileMatching(extractedFiles, contacts)
      }
    } catch (error) {
      console.error("Error extracting ZIP:", error)
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Failed to extract ZIP file",
        variant: "destructive",
      })
    } finally {
      setExtractingZip(false)
    }
  }

  // Process file matching
  const processFileMatching = async (imageFiles: File[], contactData: Contact[]) => {
    setIsProcessing(true)
    setProcessingStep("Analyzing files...")
    setProcessingProgress(10)

    try {
      // Extract numbers from filenames using regex
      const fileNumberRegex = /(\d+)/
      const mappings: FileMapping[] = []
      let matched = 0
      let unmatched = 0

      // Create a map of NUMBER values from contacts for quick lookup
      const numberMap = new Map<string, Contact>()
      contactData.forEach((contact) => {
        numberMap.set(String(contact.NUMBER), contact)
      })

      // Process files in batches to avoid UI freezing
      const batchSize = 50
      const totalFiles = imageFiles.length

      for (let i = 0; i < totalFiles; i += batchSize) {
        const batch = imageFiles.slice(i, i + batchSize)

        // Update progress
        setProcessingProgress(10 + Math.floor((i / totalFiles) * 60))
        setProcessingStep(`Processing files ${i + 1} to ${Math.min(i + batchSize, totalFiles)} of ${totalFiles}...`)

        // Process this batch
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            batch.forEach((file) => {
              const originalName = file.name
              const match = originalName.match(fileNumberRegex)
              const fileNumber = match ? match[1] : null

              // Try to find a matching contact by NUMBER
              const matchedContact = fileNumber ? numberMap.get(fileNumber) : undefined

              if (matchedContact) {
                matched++
                mappings.push({
                  originalFile: file,
                  originalName,
                  newName: `${matchedContact.NUMBER} - ${matchedContact.NAME}.jpg`,
                  number: matchedContact.NUMBER,
                  matched: true,
                })
              } else {
                unmatched++
                mappings.push({
                  originalFile: file,
                  originalName,
                  newName: originalName,
                  number: fileNumber || "unknown",
                  matched: false,
                })
              }
            })
            resolve()
          }, 0)
        })
      }

      // Generate previews for the first 20 files
      setProcessingStep("Generating previews...")
      setProcessingProgress(80)

      const previewLimit = Math.min(mappings.length, 20)
      for (let i = 0; i < previewLimit; i++) {
        const mapping = mappings[i]
        const preview = URL.createObjectURL(mapping.originalFile)
        mappings[i] = { ...mapping, preview }
      }

      setFileMappings(mappings)
      setMatchStats({
        matched,
        unmatched,
        total: mappings.length,
      })

      setProcessingProgress(100)
      setProcessingStep("Processing complete")

      toast({
        title: "File matching complete",
        description: `Matched ${matched} files, ${unmatched} files could not be matched.`,
      })
    } catch (error) {
      console.error("Error processing files:", error)
      toast({
        title: "Processing failed",
        description: "An error occurred while processing the files.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Download renamed files as a zip
  const downloadRenamedFiles = async () => {
    if (fileMappings.length === 0) {
      toast({
        title: "No files to download",
        description: "Please process files first.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingStep("Preparing files for download...")
    setProcessingProgress(10)

    try {
      // Import JSZip dynamically to reduce initial load time
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      // Add files to zip with new names
      const totalFiles = fileMappings.length
      let processedFiles = 0

      for (const mapping of fileMappings) {
        zip.file(mapping.newName, mapping.originalFile)
        processedFiles++

        // Update progress every 50 files
        if (processedFiles % 50 === 0 || processedFiles === totalFiles) {
          setProcessingProgress(10 + Math.floor((processedFiles / totalFiles) * 80))
          setProcessingStep(`Adding files to archive: ${processedFiles}/${totalFiles}`)
        }
      }

      setProcessingStep("Generating zip file...")
      setProcessingProgress(90)

      // Generate zip file
      const content = await zip.generateAsync({ type: "blob" })

      // Create download link
      const url = URL.createObjectURL(content)
      const link = document.createElement("a")
      link.href = url
      link.download = "renamed_images.zip"
      document.body.appendChild(link)
      link.click()

      // Clean up
      URL.revokeObjectURL(url)
      document.body.removeChild(link)

      setProcessingProgress(100)
      setProcessingStep("Download complete")

      toast({
        title: "Download started",
        description: "Your renamed files are being downloaded as a zip archive.",
      })
    } catch (error) {
      console.error("Error creating zip file:", error)
      toast({
        title: "Download failed",
        description: "An error occurred while creating the zip file.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Send images via email to matched contacts
  const handleSendImages = async () => {
    if (fileMappings.length === 0) {
      toast({
        title: "No files to send",
        description: "Please process files first.",
        variant: "destructive",
      })
      return
    }

    // Filter only matched files
    const matchedMappings = fileMappings.filter((m) => m.matched)

    if (matchedMappings.length === 0) {
      toast({
        title: "No matched files",
        description: "There are no files matched with contacts to send.",
        variant: "destructive",
      })
      return
    }

    // Prevent multiple submissions
    if (isSending) {
      return
    }

    setIsSending(true)
    setSendingProgress(10)
    setProcessingStep("Preparing to send images...")

    try {
      // Group files by contact number
      const contactMap = new Map<string, { files: File[]; contact: Contact }>()

      // Find the corresponding contact for each file
      for (const mapping of matchedMappings) {
        const contactNumber = String(mapping.number)
        const contact = contacts.find((c) => String(c.NUMBER) === contactNumber)

        if (contact) {
          if (!contactMap.has(contactNumber)) {
            contactMap.set(contactNumber, { files: [], contact })
          }
          contactMap.get(contactNumber)?.files.push(mapping.originalFile)
        }
      }

      // Convert map to array for easier processing
      const contactGroups = Array.from(contactMap.values())

      if (contactGroups.length === 0) {
        throw new Error("Could not find contact information for any matched files")
      }

      setProcessingStep(`Sending emails to ${contactGroups.length} contacts...`)

      // Send emails to each contact
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < contactGroups.length; i++) {
        const { files, contact } = contactGroups[i]

        // Update progress
        setSendingProgress(10 + Math.floor((i / contactGroups.length) * 80))
        setProcessingStep(`Sending email ${i + 1}/${contactGroups.length} to ${contact.NAME}...`)

        // Create FormData for this contact
        const formData = new FormData()
        formData.append("email", contact.EMAIL)
        formData.append("contactNumber", String(contact.NUMBER))
        formData.append("contactName", contact.NAME)
        formData.append("useAttachments", useAttachments.toString())

        // Add template information
        if (selectedTemplate) {
          formData.append("templateId", selectedTemplate.id)
          formData.append("templateSubject", selectedTemplate.subject)
          formData.append("templateBody", selectedTemplate.body)
          formData.append("senderName", selectedTemplate.senderName || "NBD CHARITY") // Add sender name
        }

        // Add files to FormData
        files.forEach((file) => {
          formData.append("files", file)
        })

        // Send the email
        try {
          const result = await sendEmail(formData)

          if (result.success) {
            successCount++
            // Show toast for each successful email
            toast({
              title: "Email sent",
              description: `Successfully sent email to ${contact.EMAIL}`,
            })
          } else {
            failCount++
            console.error(`Failed to send email to ${contact.EMAIL}:`, result.error)
            // Show toast for each failed email
            toast({
              title: "Failed to send email",
              description: `Failed to send email to ${contact.EMAIL}: ${result.error || "Unknown error"}`,
              variant: "destructive",
            })
          }
        } catch (error) {
          failCount++
          console.error(`Error sending email to ${contact.EMAIL}:`, error)
          toast({
            title: "Error",
            description: `Error sending email to ${contact.EMAIL}`,
            variant: "destructive",
          })
        }

        // Small delay to prevent UI freezing
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      setSendingProgress(100)
      setProcessingStep("Sending complete")

      if (successCount > 0) {
        toast({
          title: "Emails sent",
          description: `Successfully sent ${successCount} emails${failCount > 0 ? `, ${failCount} failed` : ""}`,
          variant: failCount > 0 ? "warning" : "default",
        })
      } else {
        toast({
          title: "Failed to send emails",
          description: "All email sending attempts failed. Please check the console for details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending images:", error)
      toast({
        title: "Sending failed",
        description: error instanceof Error ? error.message : "An error occurred while sending the images.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // Reset everything
  const resetAll = () => {
    // Clean up any object URLs
    fileMappings.forEach((mapping) => {
      if (mapping.preview) {
        URL.revokeObjectURL(mapping.preview)
      }
    })

    setContacts([])
    setFiles([])
    setFileMappings([])
    setMatchStats({ matched: 0, unmatched: 0, total: 0 })
    setActiveTab("all")

    // Reset file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (zipInputRef.current) {
      zipInputRef.current.value = ""
    }

    toast({
      title: "Reset complete",
      description: "All data has been cleared.",
    })
  }

  // Filter mappings based on active tab
  const filteredMappings =
    activeTab === "all"
      ? fileMappings
      : activeTab === "matched"
        ? fileMappings.filter((m) => m.matched)
        : fileMappings.filter((m) => !m.matched)

  return (
    <SafeComponent>
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
            Batch File Processor
          </CardTitle>
          <CardDescription className="text-sm">
            Upload up to 1400 images and match them with NUMBER values from your Excel data
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          {/* Step 1: Import Excel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Step 1: Import Excel Data</Label>
              {contacts.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {contacts.length} contacts loaded
                </Badge>
              )}
            </div>
            <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Input
                id="excel-batch-upload"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcelImport}
              />
              <Label htmlFor="excel-batch-upload" className="cursor-pointer flex flex-col items-center">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Import Excel with contacts</span>
                <span className="text-xs text-muted-foreground mt-1">
                  (Excel file with 'NUMBER', 'NAME', and 'EMAIL' columns)
                </span>
              </Label>
            </div>
          </div>

          {/* Step 2: Upload Image Files */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Step 2: Upload Image Files</Label>
              {files.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {files.length} files selected
                </Badge>
              )}
            </div>

            {/* Simple tabs for upload method */}
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium ${
                  uploadMethod === "individual"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setUploadMethod("individual")}
              >
                Individual Files
              </button>
              <button
                className={`flex-1 py-2 px-4 text-sm font-medium ${
                  uploadMethod === "zip" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setUploadMethod("zip")}
              >
                ZIP Archive
              </button>
            </div>

            {uploadMethod === "individual" ? (
              <div
                className={`border-2 ${isDragging ? "border-primary bg-primary/5" : "border-dashed"} rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Input
                  id="batch-file-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                />
                <Label htmlFor="batch-file-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">
                    {isDragging ? "Drop images here" : "Click or drag images here to upload"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    (Up to 1400 images, filenames should contain numbers that match the NUMBER field in Excel)
                  </span>
                </Label>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Input
                  id="zip-upload"
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={handleZipUpload}
                  ref={zipInputRef}
                />
                <Label htmlFor="zip-upload" className="cursor-pointer flex flex-col items-center">
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Click to upload a ZIP file</span>
                  <span className="text-xs text-muted-foreground mt-1">(ZIP archive containing up to 1400 images)</span>
                </Label>
              </div>
            )}

            {extractingZip && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{processingStep}</span>
                  <span className="text-sm text-muted-foreground">{zipExtractionProgress}%</span>
                </div>
                <Progress value={zipExtractionProgress} className="h-2" />
              </div>
            )}
          </div>

          {/* Processing Status */}
          {(isProcessing || extractingZip || isSending) && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{processingStep}</span>
                <span className="text-sm text-muted-foreground">
                  {extractingZip ? zipExtractionProgress : isSending ? sendingProgress : processingProgress}%
                </span>
              </div>
              <Progress
                value={extractingZip ? zipExtractionProgress : isSending ? sendingProgress : processingProgress}
                className="h-2"
              />
            </div>
          )}

          {/* Results Section */}
          {fileMappings.length > 0 && !isProcessing && !isSending && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Results</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-50">
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                    {matchStats.matched} Matched
                  </Badge>
                  <Badge variant="outline" className="bg-amber-50">
                    <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                    {matchStats.unmatched} Unmatched
                  </Badge>
                </div>
              </div>

              <Alert variant={matchStats.unmatched > 0 ? "warning" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Processing Complete</AlertTitle>
                <AlertDescription>
                  {matchStats.unmatched > 0
                    ? `${matchStats.matched} files were matched with contact numbers, but ${matchStats.unmatched} files could not be matched.`
                    : `All ${matchStats.matched} files were successfully matched with contact numbers.`}
                </AlertDescription>
              </Alert>

              {/* Simple tabs for filteringg results */}
              <div className="flex border rounded-md overflow-hidden mb-4">
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    activeTab === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => setActiveTab("all")}
                >
                  All Files ({matchStats.total})
                </button>
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    activeTab === "matched" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => setActiveTab("matched")}
                >
                  Matched ({matchStats.matched})
                </button>
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    activeTab === "unmatched" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => setActiveTab("unmatched")}
                >
                  Unmatched ({matchStats.unmatched})
                </button>
              </div>

              <ScrollArea className="h-[300px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] sm:w-[80px] text-xs sm:text-sm">Preview</TableHead>
                      <TableHead className="text-xs sm:text-sm">Original Filename</TableHead>
                      <TableHead className="text-xs sm:text-sm">New Filename</TableHead>
                      <TableHead className="w-[80px] sm:w-[100px] text-xs sm:text-sm">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMappings.map((mapping, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {mapping.preview ? (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden border">
                              <img
                                src={mapping.preview || "/placeholder.svg"}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded bg-muted flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No preview</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] sm:text-xs truncate max-w-[100px] sm:max-w-none">
                          {mapping.originalName}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] sm:text-xs truncate max-w-[100px] sm:max-w-none">
                          {mapping.newName}
                        </TableCell>
                        <TableCell>
                          {mapping.matched ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-[10px] sm:text-xs">
                              <Check className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                              <span className="hidden xs:inline">Matched</span>
                              <span className="xs:hidden">✓</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] sm:text-xs">
                              <AlertCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                              <span className="hidden xs:inline">Unmatched</span>
                              <span className="xs:hidden">!</span>
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Template Selection */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="batch-template-select">Email Template</Label>
            <div className="relative">
              <select
                id="batch-template-select"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={isSending}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedTemplate && <p className="text-xs text-muted-foreground">Subject: {selectedTemplate.subject}</p>}
          </div>

          {/* Delivery Method */}
          <div className="space-y-2">
            <Label>Metode Pengiriman</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="batch-use-attachments"
                checked={useAttachments}
                onChange={(e) => setUseAttachments(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="batch-use-attachments" className="text-sm font-normal">
                Kirim gambar sebagai lampiran email (direkomendasikan)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {useAttachments
                ? "Gambar akan dikirim sebagai lampiran email. Ukuran maksimum total: 10MB."
                : "Gambar akan diunggah ke Vercel Blob dan ditampilkan dalam email."}
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
          <Button variant="outline" onClick={resetAll} disabled={isProcessing || isSending}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <Button
              onClick={downloadRenamedFiles}
              disabled={isProcessing || isSending || fileMappings.length === 0}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Files
            </Button>

            <Button
              onClick={handleSendImages}
              disabled={isProcessing || isSending || fileMappings.length === 0 || matchStats.matched === 0}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Matched Emails
            </Button>
          </div>
        </CardFooter>
      </Card>
    </SafeComponent>
  )
}
