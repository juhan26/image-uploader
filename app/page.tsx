"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Upload,
  Mail,
  X,
  Send,
  FileSpreadsheet,
  User,
  Phone,
  History,
  Heart,
  ArrowDown,
  ImageIcon,
  Users,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sendEmail } from "./actions"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"
import imageCompression from "browser-image-compression"
import BatchUpload from "@/components/batch-upload"
import EmailHistory from "@/components/email-history"
import EmailTemplates, { type EmailTemplate } from "@/components/email-templates"

// Tambahkan CSS untuk layar extra small
const styles = `
  @media (min-width: 475px) {
    .xs\\:inline {
      display: inline;
    }
    .xs\\:hidden {
      display: none;
    }
  }
`

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

// Feature Card Component
function FeatureCard({
  icon: Icon,
  title,
  description,
}: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardHeader>
        <div className="bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-white/80">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}

export default function Page() {
  const [email, setEmail] = useState("")
  const [nameQuery, setNameQuery] = useState("")
  const [numberQuery, setNumberQuery] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activeTab, setActiveTab] = useState("name")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const { toast } = useToast()

  // Add these new state variables after the existing state declarations
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tambahkan state baru untuk opsi pengiriman
  const [useAttachments, setUseAttachments] = useState(true) // Default ke true karena Blob suspended

  // Tambahkan state untuk template email
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default")
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)

  // Konstanta untuk limit file
  const MAX_FILES = 20 // Ubah dari 5 menjadi 20

  // Load templates from localStorage
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem("emailTemplates")
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates) as EmailTemplate[]
        if (Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
          setTemplates(parsedTemplates)

          // Set default template
          const defaultTemplate = parsedTemplates.find((t) => t.id === "default") || parsedTemplates[0]
          setSelectedTemplateId(defaultTemplate.id)
          setSelectedTemplate(defaultTemplate)
        } else {
          // Create default template if parsed data is invalid
          createDefaultTemplate()
        }
      } else {
        // Create default template if no saved templates
        createDefaultTemplate()
      }
    } catch (error) {
      console.error("Error loading templates:", error)
      // Create default template on error
      createDefaultTemplate()
    }
  }, [])

  // Function to create and set default template
  const createDefaultTemplate = () => {
    const defaultTemplate: EmailTemplate = {
      id: "default",
      name: "Default Template",
      subject: "NBD CHARITY - Zakat Al fitri 2025",
      body: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NBD CHARITY - Zakat Al fitri 2025</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>NBD CHARITY - Zakat Al fitri 2025</h2>
      <p>Merci pour vote confiance, n'hésitez pas à me contacter si vous voulez parrainer les orphelins sur le long terme </p>

      <p>Rejoignez le groupe telegram en cliquant sur ce lien : </p>

      <p> https://t.me/nbdcharity </p>

      <p> Qu'Allah vous récompense </p>
      {{content}}
      <p style="margin-top: 30px; color: #666;">Envoyé via sender.juhndaa.my.id</p>
    </body>
    </html>
  `,
    }
    setTemplates([defaultTemplate])
    setSelectedTemplateId(defaultTemplate.id)
    setSelectedTemplate(defaultTemplate)
    localStorage.setItem("emailTemplates", JSON.stringify([defaultTemplate]))
  }

  // Update selected template when templates change or selectedTemplateId changes
  useEffect(() => {
    const template = templates.find((t) => t.id === selectedTemplateId)
    if (template) {
      setSelectedTemplate(template)
    }
  }, [templates, selectedTemplateId])

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

    // Limit to MAX_FILES total
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${MAX_FILES} images`,
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

    if (!selectedTemplate) {
      toast({
        title: "Template required",
        description: "Please select an email template",
        variant: "destructive",
      })
      return
    }

    // Prevent multiple submissions
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append("email", email)

      // Add contact information if available
      if (selectedContact) {
        formData.append("contactNumber", String(selectedContact.NUMBER))
        formData.append("contactName", selectedContact.NAME)
      }

      // Add template information
      formData.append("templateId", selectedTemplate.id)
      formData.append("templateSubject", selectedTemplate.subject)
      formData.append("templateBody", selectedTemplate.body)
      formData.append("senderName", selectedTemplate.senderName || "NBD CHARITY") // Add sender name

      // Add attachment option
      formData.append("useAttachments", useAttachments.toString())

      // Add files
      files.forEach((file) => {
        formData.append("files", file)
      })

      setProgress(30)

      // Send email with a delay to allow UI to update
      setTimeout(async () => {
        try {
          setProgress(50)
          const result = await sendEmail(formData)
          setProgress(100)

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
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to send images",
              variant: "destructive",
            })

            // Show more detailed error if available
            if (result.errorDetails) {
              console.error("Detailed error:", result.errorDetails)
            }

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
          // Ensure we reset the submitting state
          setIsSubmitting(false)
        }
      }, 500)
    } catch (error) {
      console.error("Client error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
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
  }

  // Function to select a contact from number search
  const selectContactByNumber = (contact: Contact) => {
    setNumberQuery(String(contact.NUMBER))
    setEmail(contact.EMAIL)
    setSelectedContact(contact)
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

    // Limit to MAX_FILES total
    if (files.length + droppedFiles.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${MAX_FILES} images`,
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

  // Function to scroll to app section
  const scrollToApp = () => {
    const appSection = document.getElementById("app-section")
    if (appSection) {
      appSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <style jsx global>
        {styles}
      </style>
      {/* Landing Page Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/charity-background.jpeg')" }}
          />
          <div className="absolute inset-0 bg-black/60" /> {/* Black overlay with 60% opacity */}
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Header */}
          <header className="container mx-auto py-4 sm:py-6 px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold text-white">NBD CHARITY</h1>
              </div>
              <nav>
                <ul className="flex gap-3 sm:gap-6">
                  <li>
                    <button
                      onClick={scrollToApp}
                      className="text-sm sm:text-base text-white hover:text-primary transition-colors"
                    >
                      Application
                    </button>
                  </li>
                  <li>
                    <a
                      href="https://t.me/nbdcharity"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm sm:text-base text-white hover:text-primary transition-colors"
                    >
                      Telegram
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="container mx-auto px-4 flex-1 flex flex-col">
            {/* Hero Section */}
            <div className="flex flex-col items-center justify-center text-center py-10 sm:py-16 md:py-20">
              <div className="max-w-3xl mx-auto px-4">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 sm:mb-6">
                  Nourris Un Orphelin
                </h1>
                <p className="text-base sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8">
                  Rejoignez notre mission pour aider les orphelins et faire une différence dans leur vie. Ensemble, nous
                  pouvons apporter espoir dan dukungan kepada mereka yang paling membutuhkan.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button onClick={scrollToApp} size="default" className="gap-2 w-full sm:w-auto">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Accéder à l'application</span>
                    <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                  <Button
                    asChild
                    size="default"
                    variant="outline"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white w-full sm:w-auto"
                  >
                    <a
                      href="https://t.me/nbdcharity"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm sm:text-base"
                    >
                      Rejoindre notre Telegram
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="py-10 sm:py-16 px-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">Notre Application</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                <FeatureCard
                  icon={ImageIcon}
                  title="Envoi d'Images"
                  description="Envoyez facilement des images aux bénéficiaires et aux donateurs pour montrer l'impact de leurs contributions."
                />
                <FeatureCard
                  icon={Users}
                  title="Gestion des Contacts"
                  description="Importez et gérez facilement vos contacts pour une communication efficace avec les donateurs dan les bénéficiaires."
                />
                <FeatureCard
                  icon={FileText}
                  title="Templates Personnalisés"
                  description="Créez et utilisez des templates d'email personnalisés pour différentes campagnes et communications."
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* App Section */}
      <div id="app-section" className="bg-background py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">NBD CHARITY - Email Sender</h2>

          <Tabs defaultValue="single" className="max-w-2xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm">
              <TabsTrigger value="single">Single Email</TabsTrigger>
              <TabsTrigger value="batch">Batch Upload</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Riwayat</span>
                <span className="xs:hidden">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <Card>
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-xl sm:text-2xl">Send Images via Email</CardTitle>
                  <CardDescription className="text-sm">
                    Upload up to {MAX_FILES} images and send them to any email address
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
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
                        <div className="relative">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <Input
                              id="name-search"
                              type="text"
                              placeholder="Type to search by name..."
                              value={nameQuery}
                              onChange={(e) => setNameQuery(e.target.value)}
                              disabled={contacts.length === 0}
                            />
                          </div>
                          <div
                            className={`absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto ${
                              nameQuery && filteredByName.length > 0 ? "" : "hidden"
                            }`}
                          >
                            {filteredByName.slice(0, 10).map((contact) => (
                              <button
                                key={`${contact.EMAIL}-${contact.NUMBER}`}
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                                onClick={() => selectContactByName(contact)}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{contact.NAME}</span>
                                  <div className="flex text-xs text-muted-foreground gap-2">
                                    <span>{contact.EMAIL}</span>
                                    <span>•</span>
                                    <span>#{contact.NUMBER}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Search by Number */}
                      <TabsContent value="number" className="space-y-2">
                        <Label htmlFor="number-search">Search Contact by Number</Label>
                        <div className="relative">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <Input
                              id="number-search"
                              type="text"
                              placeholder="Type to search by number..."
                              value={numberQuery}
                              onChange={(e) => setNumberQuery(e.target.value)}
                              disabled={contacts.length === 0}
                            />
                          </div>
                          <div
                            className={`absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto ${
                              numberQuery && filteredByNumber.length > 0 ? "" : "hidden"
                            }`}
                          >
                            {filteredByNumber.slice(0, 10).map((contact) => (
                              <button
                                key={`${contact.EMAIL}-${contact.NUMBER}`}
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                                onClick={() => selectContactByNumber(contact)}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">#{contact.NUMBER}</span>
                                  <div className="flex text-xs text-muted-foreground gap-2">
                                    <span>{contact.NAME}</span>
                                    <span>•</span>
                                    <span>{contact.EMAIL}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Selected Contact Info */}
                    <div className={`p-3 bg-muted rounded-md ${selectedContact ? "" : "hidden"}`}>
                      <p className="text-sm font-medium">Selected Contact:</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">#{selectedContact?.NUMBER}</span>
                        <span>-</span>
                        <span>{selectedContact?.NAME}</span>
                      </div>
                    </div>

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

                    {/* Template Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="template-select">Email Template</Label>
                      <div className="relative">
                        <select
                          id="template-select"
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedTemplate && (
                        <p className="text-xs text-muted-foreground">Subject: {selectedTemplate.subject}</p>
                      )}
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
                      <Label>Upload Images (Max {MAX_FILES})</Label>
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
                            {files.length}/{MAX_FILES} images selected (images will be compressed)
                          </span>
                        </Label>
                      </div>

                      <div
                        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 mt-4 ${
                          previews.length > 0 ? "" : "hidden"
                        }`}
                      >
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
                    </div>
                    <div className={`mt-4 ${isSubmitting ? "" : "hidden"}`}>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Sending email... {progress}%</p>
                    </div>
                  </CardContent>

                  <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || files.length === 0 || !email || !selectedTemplate}
                    >
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

            <TabsContent value="templates">
              <EmailTemplates />
            </TabsContent>

            <TabsContent value="history">
              <EmailHistory />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 NBD CHARITY - Zakat Al fitri</p>
        </div>
      </footer>
    </>
  )
}
