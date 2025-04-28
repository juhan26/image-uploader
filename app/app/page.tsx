"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Mail, X, Send, FileSpreadsheet, Search, User, Phone, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sendEmail } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"
import imageCompression from "browser-image-compression"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import BatchUpload from "@/components/batch-upload"
import EmailHistory from "@/components/email-history"

// Define contact type with uppercase field names to match Excel
type Contact = {
  NUMBER: string | number
  NAME: string
  EMAIL: string
}

// Define email history item type
type EmailHistoryItem = {
  id: string
  email: string
  contactName?: string
  contactNumber?: string
  timestamp: number
  status: "success" | "failed"
  imageCount: number
  errorMessage?: string
}

export default function Page() {
  const [email, setEmail] = useState("")
  const [nameQuery, setNameQuery] = useState("")
  const [numberQuery, setNumberQuery] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [namePopoverOpen, setNamePopoverOpen] = useState(false)
  const [numberPopoverOpen, setNumberPopoverOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("name")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const { toast } = useToast()

  // Add these new state variables after the existing state declarations
  const [isDragging, setIsDragging] = useState(false)

  // Tambahkan state baru untuk opsi pengiriman
  const [useAttachments, setUseAttachments] = useState(true) // Default ke true karena Blob suspended

  // Save email history to localStorage
  const saveEmailHistory = (historyItem: EmailHistoryItem) => {
    try {
      // Get existing history
      const existingHistory = localStorage.getItem("emailSendingHistory")
      let history: EmailHistoryItem[] = []

      if (existingHistory) {
        history = JSON.parse(existingHistory)
      }

      // Add new item
      history.push(historyItem)

      // Limit history to last 100 items
      if (history.length > 100) {
        history = history.slice(-100)
      }

      // Save back to localStorage
      localStorage.setItem("emailSendingHistory", JSON.stringify(history))
    } catch (error) {
      console.error("Error saving email history:", error)
    }
  }

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

        // Validate data has NAME, EMAIL, and NUMBER fields
        const validData = jsonData.filter(
          (item) =>
            "NUMBER" in item &&
            "NAME" in item &&
            "EMAIL" in item &&
            typeof item.NAME === "string" &&
            typeof item.EMAIL === "string",
        )

        setContacts(validData)

        toast({
          title: "Excel file imported",
          description: `${validData.length} contacts loaded successfully`,
        })
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

  // Handle image compression and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    // Limit to 5 files total
    if (files.length + selectedFiles.length > 5) {
      toast({
        title: "Too many files",
        description: "You can only upload a maximum of 5 images",
        variant: "destructive",
      })
      return
    }

    // Compression options
    const options = {
      maxSizeMB: 1, // Max file size in MB
      maxWidthOrHeight: 1200, // Resize to this dimension (keeping aspect ratio)
      useWebWorker: true, // Use web worker for better performance
      fileType: "image/jpeg", // Convert all images to JPEG for better compression
    }

    try {
      // Process each file with compression
      const processedFiles: File[] = []
      const newPreviews: string[] = []

      for (const file of selectedFiles) {
        // Only compress image files
        if (file.type.startsWith("image/")) {
          const compressedFile = await imageCompression(file, options)
          processedFiles.push(compressedFile)

          // Create preview URL
          const previewUrl = URL.createObjectURL(compressedFile)
          newPreviews.push(previewUrl)
        } else {
          // For non-image files, keep as is
          processedFiles.push(file)
          const previewUrl = URL.createObjectURL(file)
          newPreviews.push(previewUrl)
        }
      }

      setFiles((prev) => [...prev, ...processedFiles])
      setPreviews((prev) => [...prev, ...newPreviews])

      toast({
        title: "Images compressed",
        description: `${processedFiles.length} images processed and ready to send`,
      })
    } catch (error) {
      console.error("Error compressing images:", error)
      toast({
        title: "Compression failed",
        description: "Could not compress the images. Please try again.",
        variant: "destructive",
      })
    }
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setFiles(files.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to send",
        variant: "destructive",
      })
      return
    }

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("email", email)

      // Add contact information if available
      if (selectedContact) {
        formData.append("contactNumber", String(selectedContact.NUMBER))
        formData.append("contactName", selectedContact.NAME)
      }

      // Dalam fungsi handleSubmit, tambahkan parameter useAttachments ke formData
      formData.append("useAttachments", useAttachments.toString())

      files.forEach((file) => {
        formData.append("files", file)
      })

      const result = await sendEmail(formData)

      if (result.success) {
        toast({
          title: "Success!",
          description: `Images sent to ${email}`,
        })

        // Save to history if historyItem is available
        if (result.historyItem) {
          saveEmailHistory(result.historyItem)
        }

        // Reset form
        setEmail("")
        setFiles([])
        setPreviews([])
        setSelectedContact(null)
        setNameQuery("")
        setNumberQuery("")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send images",
          variant: "destructive",
        })

        // Save failed attempt to history
        if (result.historyItem) {
          saveEmailHistory(result.historyItem)
        }
      }
    } catch (error) {
      console.error("Client error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter contacts based on search queries
  const filteredByName = contacts.filter((contact) => contact.NAME.toLowerCase().includes(nameQuery.toLowerCase()))

  const filteredByNumber = contacts.filter((contact) => String(contact.NUMBER).includes(numberQuery))

  // Function to select a contact from name search
  const selectContactByName = (contact: Contact) => {
    setNameQuery(contact.NAME)
    setEmail(contact.EMAIL)
    setSelectedContact(contact)
    setNamePopoverOpen(false)
  }

  // Function to select a contact from number search
  const selectContactByNumber = (contact: Contact) => {
    setNumberQuery(String(contact.NUMBER))
    setEmail(contact.EMAIL)
    setSelectedContact(contact)
    setNumberPopoverOpen(false)
  }

  // Add these drag and drop handler functions before the return statement
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
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

    // Limit to 5 files total
    if (files.length + droppedFiles.length > 5) {
      toast({
        title: "Too many files",
        description: "You can only upload a maximum of 5 images",
        variant: "destructive",
      })
      return
    }

    // Compression options
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: "image/jpeg",
    }

    try {
      // Process each file with compression
      const processedFiles: File[] = []
      const newPreviews: string[] = []

      for (const file of droppedFiles) {
        const compressedFile = await imageCompression(file, options)
        processedFiles.push(compressedFile)

        // Create preview URL
        const previewUrl = URL.createObjectURL(compressedFile)
        newPreviews.push(previewUrl)
      }

      setFiles((prev) => [...prev, ...processedFiles])
      setPreviews((prev) => [...prev, ...newPreviews])

      toast({
        title: "Images compressed",
        description: `${processedFiles.length} images processed and ready to send`,
      })
    } catch (error) {
      console.error("Error compressing images:", error)
      toast({
        title: "Compression failed",
        description: "Could not compress the images. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NBD CHARITY - Email Sender</h1>
        <Button variant="outline" asChild>
          <a href="/">Retour à l'accueil</a>
        </Button>
      </div>

      <Tabs defaultValue="single" className="max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Email</TabsTrigger>
          <TabsTrigger value="batch">Batch Upload</TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Send Images via Email</CardTitle>
              <CardDescription>Upload up to 5 images and send them to any email address</CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Excel Import Section */}
                <div className="space-y-2">
                  <Label>Import Contacts (Excel)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <Input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleExcelImport}
                    />
                    <Label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">Import Excel with contacts</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        (Excel file with 'NUMBER', 'NAME', and 'EMAIL' columns)
                      </span>
                    </Label>
                  </div>
                  {contacts.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">{contacts.length} contacts imported</p>
                  )}
                </div>

                {/* Search Tabs */}
                <Tabs defaultValue="name" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="name">Search by Name</TabsTrigger>
                    <TabsTrigger value="number">Search by Number</TabsTrigger>
                  </TabsList>

                  {/* Search by Name */}
                  <TabsContent value="name" className="space-y-2">
                    <Label htmlFor="name-search">Search Contact by Name</Label>
                    <Popover open={namePopoverOpen} onOpenChange={setNamePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={namePopoverOpen}
                          className="w-full justify-between"
                          disabled={contacts.length === 0}
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {nameQuery || "Search for a contact by name..."}
                          </div>
                          <Search className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search by name..."
                            value={nameQuery}
                            onValueChange={setNameQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No contacts found.</CommandEmpty>
                            <CommandGroup>
                              {filteredByName.map((contact) => (
                                <CommandItem
                                  key={`${contact.EMAIL}-${contact.NUMBER}`}
                                  onSelect={() => selectContactByName(contact)}
                                >
                                  <div className="flex flex-col">
                                    <span>{contact.NAME}</span>
                                    <div className="flex text-xs text-muted-foreground gap-2">
                                      <span>{contact.EMAIL}</span>
                                      <span>•</span>
                                      <span>#{contact.NUMBER}</span>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </TabsContent>

                  {/* Search by Number */}
                  <TabsContent value="number" className="space-y-2">
                    <Label htmlFor="number-search">Search Contact by Number</Label>
                    <Popover open={numberPopoverOpen} onOpenChange={setNumberPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={numberPopoverOpen}
                          className="w-full justify-between"
                          disabled={contacts.length === 0}
                        >
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {numberQuery || "Search for a contact by number..."}
                          </div>
                          <Search className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search by number..."
                            value={numberQuery}
                            onValueChange={setNumberQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No contacts found.</CommandEmpty>
                            <CommandGroup>
                              {filteredByNumber.map((contact) => (
                                <CommandItem
                                  key={`${contact.EMAIL}-${contact.NUMBER}`}
                                  onSelect={() => selectContactByNumber(contact)}
                                >
                                  <div className="flex flex-col">
                                    <span>#{contact.NUMBER}</span>
                                    <div className="flex text-xs text-muted-foreground gap-2">
                                      <span>{contact.NAME}</span>
                                      <span>•</span>
                                      <span>{contact.EMAIL}</span>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </TabsContent>
                </Tabs>

                {/* Selected Contact Info */}
                {selectedContact && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">Selected Contact:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">#{selectedContact.NUMBER}</span>
                      <span>-</span>
                      <span>{selectedContact.NAME}</span>
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="recipient@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Delivery Method */}
                <div className="space-y-2">
                  <Label>Metode Pengiriman</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-attachments"
                      checked={useAttachments}
                      onChange={(e) => setUseAttachments(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="use-attachments" className="text-sm font-normal">
                      Kirim gambar sebagai lampiran email (direkomendasikan)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {useAttachments
                      ? "Gambar akan dikirim sebagai lampiran email. Ukuran maksimum total: 10MB."
                      : "Gambar akan diunggah ke Vercel Blob dan ditampilkan dalam email."}
                  </p>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Upload Images (Max 5)</Label>
                  <div
                    className={`border-2 ${isDragging ? "border-primary bg-primary/5" : "border-dashed"} rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">
                        {isDragging ? "Drop images here" : "Click or drag images here to upload"}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {files.length}/5 images selected (images will be compressed)
                      </span>
                    </Label>
                  </div>

                  {previews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                            <img
                              src={preview || "/placeholder.svg"}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm opacity-90 hover:opacity-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting || files.length === 0 || !email}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Images
                    </span>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="batch">
          <BatchUpload />
        </TabsContent>

        <TabsContent value="history">
          <EmailHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
