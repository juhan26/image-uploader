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
  FolderArchive,
  Archive,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sendEmail } from "./actions"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"
import imageCompression from "browser-image-compression"
import EmailHistory from "@/components/email-history"
import EmailTemplates, { type EmailTemplate } from "@/components/email-templates"

type Language = "id" | "en" | "fr"

const dictionary = {
  id: {
    hero: {
      badge: "Layanan Pengiriman Foto Premium",
      title: "Kirim Foto Berharga Anda dengan Mudah",
      subtitle: "Platform profesional untuk fotografer untuk mengirim hasil karya langsung ke email klien. Cepat, aman, dan berkelas.",
      getStarted: "Mulai Sekarang",
      learnMore: "Pelajari Lebih Lanjut",
    },
    features: {
      bulk: {
        title: "Unggah Massal",
        description: "Unggah file ZIP dan kirim ke banyak klien sekaligus secara otomatis.",
      },
      compression: {
        title: "Kompresi Cerdas",
        description: "Optimalkan ukuran gambar tanpa mengurangi kualitas secara signifikan.",
      },
      tracking: {
        title: "Pelacakan Riwayat",
        description: "Pantau status pengiriman email Anda secara real-time.",
      },
    },
    app: {
      tabs: {
        single: "Kirim Tunggal",
        bulk: "Unggah Massal",
        history: "Riwayat",
        templates: "Template Email",
      },
      search: {
        placeholderName: "Cari berdasarkan nama...",
        placeholderNumber: "Cari berdasarkan nomor...",
        noContacts: "Belum ada kontak. Impor data Excel terlebih dahulu.",
        selected: "Kontak terpilih",
      },
      upload: {
        title: "Unggah Foto",
        dragDrop: "Seret dan lepas foto di sini",
        or: "atau",
        browse: "Pilih File",
        dropActive: "Letakkan gambar di sini",
        selectedHint: "gambar dipilih (akan dikompresi)",
      },
      sections: {
        single: {
          title: "Kirim Gambar via Email",
          description: "Unggah hingga {max} gambar dan kirim ke alamat email mana pun",
          importLabel: "Impor Kontak (Excel)",
          importHint: "Impor Excel dengan kontak (Kolom: NUMBER, NAME, EMAIL)",
          importStatus: "kontak terimpor",
          searchName: "Cari Kontak berdasarkan Nama",
          searchNumber: "Cari Kontak berdasarkan Nomor",
          placeholderName: "Ketik untuk mencari nama...",
          placeholderNumber: "Ketik untuk mencari nomor...",
          emailLabel: "Alamat Email",
          templateLabel: "Template Email",
          methodLabel: "Metode Pengiriman",
          attachmentLabel: "Kirim gambar sebagai lampiran email (direkomendasikan)",
          attachmentHint: "Gambar akan dikirim sebagai lampiran. Maks 10MB.",
          uploadLabel: "Unggah Gambar",
          uploadHint: "Klik atau seret gambar ke sini untuk mengunggah",
          sendButton: "Kirim Gambar",
          sending: "Mengirim...",
          sendingProgress: "Mengirim email...",
          selectedContact: "Kontak Terpilih:",
          methodHint: "Gambar akan diunggah ke cloud dan ditampilkan dalam email.",
        },
        bulk: {
          title: "Unggah Massal (ZIP)",
          description: "Unggah file ZIP yang berisi folder dengan nama nomor kontak",
          step1: "Langkah 1: Impor Excel Kontak",
          step2: "Langkah 2: Unggah Folder ZIP",
          zipHint: "ZIP harus berisi folder yang diawali dengan nomor (misal: '1 - Juhan')",
          readyLabel: "Siap dikirim",
          sendButton: "Mulai Pengiriman Massal",
          contactsLoaded: "kontak dimuat",
          importRequired: "Anda harus mengimpor file Excel terlebih dahulu.",
          importButton: "Impor",
          processingZip: "Memproses file ZIP...",
          dropZip: "Lepaskan file ZIP di sini",
          sendingStatus: "Mengirim",
          waitingStatus: "Menunggu",
          images: "gambar",
          success: "OK",
          failed: "GAGAL",
        }
      },
      dashboard: {
        title: "Pengirim Email Profesional",
        subtitle: "Kelola pengiriman email Anda dengan mudah. Pilih antara pengiriman tunggal atau unggah massal.",
        featuresTitle: "Fitur Utama",
      },
      footer: {
        description: "Platform pengiriman foto premium untuk fotografer profesional.",
        nav: "Navigasi",
        connect: "Hubungi",
        privacy: "Privasi",
        terms: "Ketentuan",
        rights: "Hak cipta dilindungi undang-undang.",
      }
    },
  },
  en: {
    hero: {
      badge: "Premium Photo Delivery Service",
      title: "Send Your Precious Photos with Ease",
      subtitle: "Professional platform for photographers to deliver work directly to client emails. Fast, secure, and elegant.",
      getStarted: "Get Started",
      learnMore: "Learn More",
    },
    features: {
      bulk: {
        title: "Bulk Upload",
        description: "Upload ZIP files and send to multiple clients automatically.",
      },
      compression: {
        title: "Smart Compression",
        description: "Automatic image optimization for fast delivery without losing quality.",
      },
      tracking: {
        title: "Delivery Tracking",
        description: "Track your email delivery status in real-time.",
      },
    },
    app: {
      tabs: {
        single: "Single Email",
        bulk: "Bulk ZIP",
        templates: "Templates",
        history: "History",
      },
      search: {
        placeholderName: "Search by name...",
        placeholderNumber: "Search by number...",
        noContacts: "No contacts yet. Import Excel data first.",
        selected: "Selected contact",
      },
      upload: {
        title: "Upload Photos",
        dragDrop: "Drag and drop photos here",
        or: "or",
        browse: "Choose Files",
        dropActive: "Drop images here",
        selectedHint: "images selected (will be compressed)",
      },
      sections: {
        single: {
          title: "Send Images via Email",
          description: "Upload up to {max} images and send to any email address",
          importLabel: "Import Contacts (Excel)",
          importHint: "Import Excel with contacts (Columns: NUMBER, NAME, EMAIL)",
          importStatus: "contacts imported",
          searchName: "Search Contact by Name",
          searchNumber: "Search Contact by Number",
          placeholderName: "Type to search name...",
          placeholderNumber: "Type to search number...",
          emailLabel: "Email Address",
          templateLabel: "Email Template",
          methodLabel: "Delivery Method",
          attachmentLabel: "Send images as email attachments (recommended)",
          attachmentHint: "Images will be sent as attachments. Max 10MB.",
          uploadLabel: "Upload Images",
          uploadHint: "Click or drag images here to upload",
          sendButton: "Send Images",
          sending: "Sending...",
          sendingProgress: "Sending email...",
          selectedContact: "Selected Contact:",
          methodHint: "Images will be uploaded to the cloud and displayed in the email.",
        },
        bulk: {
          title: "Bulk Upload (ZIP)",
          description: "Upload a ZIP file containing folders named by contact numbers",
          step1: "Step 1: Import Contacts Excel",
          step2: "Step 2: Upload ZIP Folder",
          zipHint: "ZIP should contain folders starting with numbers (e.g., '1 - Juhan')",
          readyLabel: "Ready to send",
          sendButton: "Start Bulk Send",
          contactsLoaded: "contacts loaded",
          importRequired: "You must import an Excel file first.",
          importButton: "Import",
          processingZip: "Processing ZIP...",
          dropZip: "Drop ZIP here",
          sendingStatus: "Sending",
          waitingStatus: "Waiting",
          images: "images",
          success: "OK",
          failed: "FAIL",
        }
      },
      dashboard: {
        title: "Professional Email Sender",
        subtitle: "Manage your email deliveries with ease. Choose between single sending or bulk upload.",
        featuresTitle: "Key Features",
      },
      footer: {
        description: "Premium photo delivery platform for professional photographers.",
        nav: "Navigation",
        connect: "Connect",
        privacy: "Privacy",
        terms: "Terms",
        rights: "All rights reserved.",
      }
    },
  },
  fr: {
    hero: {
      badge: "Service de Livraison de Photos Premium",
      title: "Livre vos précieuses photos avec facilité",
      subtitle: "Plateforme professionnelle pour les photographes pour livrer leur travail directement aux e-mails des clients. Rapide, sécurisé et élégant.",
      getStarted: "Commencer",
      learnMore: "En savoir plus",
    },
    features: {
      bulk: {
        title: "Envoi groupé",
        description: "Téléchargez des fichiers ZIP et envoyez-les à plusieurs clients automatiquement.",
      },
      compression: {
        title: "Compression intelligente",
        description: "Optimisation automatique des images pour une livraison rapide sans perte de qualité.",
      },
      tracking: {
        title: "Suivi de livraison",
        description: "Suivez l'état de livraison de vos e-mails en temps réel.",
      },
    },
    app: {
      tabs: {
        single: "E-mail simple",
        bulk: "Envoi groupé (ZIP)",
        templates: "Modèles",
        history: "Historique",
      },
      search: {
        placeholderName: "Rechercher par nom...",
        placeholderNumber: "Rechercher par numéro...",
        noContacts: "Pas encore de contacts. Importez d'abord les données Excel.",
        selected: "Contact sélectionné",
      },
      upload: {
        title: "Télécharger des photos",
        dragDrop: "Faites glisser et déposez des photos ici",
        or: "ou",
        browse: "Parcourir les fichiers",
        dropActive: "Déposez les images ici",
        selectedHint: "images sélectionnées (seront compressées)",
      },
      sections: {
        single: {
          title: "Envoyer des images par e-mail",
          description: "Téléchargez jusqu'à {max} images et envoyez-les à n'importe quelle adresse e-mail",
          importLabel: "Importer des contacts (Excel)",
          importHint: "Importer un Excel avec des contacts (Colonnes : NUMBER, NAME, EMAIL)",
          importStatus: "contacts importés",
          searchName: "Rechercher un contact par nom",
          searchNumber: "Rechercher un contact par numéro",
          placeholderName: "Tapez pour rechercher un nom...",
          placeholderNumber: "Tapez pour rechercher un numéro...",
          emailLabel: "Adresse e-mail",
          templateLabel: "Modèle d'e-mail",
          methodLabel: "Méthode de livraison",
          attachmentLabel: "Envoyer des images en tant que pièces jointes (recommandé)",
          attachmentHint: "Les images seront envoyées en pièces jointes. Max 10 Mo.",
          uploadLabel: "Télécharger des images",
          uploadHint: "Cliquez ou faites glisser des images ici pour les télécharger",
          sendButton: "Envoyer les images",
          sending: "Envoi...",
          sendingProgress: "Envoi de l'e-mail...",
          selectedContact: "Contact Sélectionné:",
          methodHint: "Les images seront téléchargées sur le cloud et affichées dans l'e-mail.",
        },
        bulk: {
          title: "Envoi groupé (ZIP)",
          description: "Téléchargez un fichier ZIP contenant des dossiers nommés par numéros de contact",
          step1: "Étape 1 : Importer l'Excel des contacts",
          step2: "Étape 2 : Télécharger le dossier ZIP",
          zipHint: "Le ZIP doit contenir des dossiers commençant par des numéros (ex: '1 - Juhan')",
          readyLabel: "Prêt à envoyer",
          sendButton: "Démarrer l'envoi groupé",
          contactsLoaded: "contacts chargés",
          importRequired: "Vous devez d'abord importer un fichier Excel.",
          importButton: "Importer",
          processingZip: "Traitement du ZIP...",
          dropZip: "Déposez le ZIP ici",
          sendingStatus: "Envoi",
          waitingStatus: "En attente",
          images: "images",
          success: "OK",
          failed: "ÉCHEC",
        }
      },
      dashboard: {
        title: "Expéditeur d'e-mails professionnel",
        subtitle: "Gérez vos envois d'e-mails en toute simplicité. Choisissez entre un envoi simple ou un téléchargement groupé.",
        featuresTitle: "Fonctionnalités clés",
      },
      footer: {
        description: "Plateforme premium de livraison de photos pour les photographes professionnels.",
        nav: "Navigation",
        connect: "Connecter",
        privacy: "Confidentialité",
        terms: "Conditions",
        rights: "Tous droits réservés.",
      }
    },
  },
}

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
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeInUp 0.8s ease-out forwards;
  }
  .glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
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

// Define bulk item type
type BulkItem = {
  id: string
  folderName: string
  contact: Contact | null
  files: File[]
  status: "idle" | "processing" | "sending" | "success" | "failed"
  error?: string
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
  const [language, setLanguage] = useState<Language>("id")
  const t = dictionary[language]

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

  const [isDragging, setIsDragging] = useState(false)
  const [isBulkDragging, setIsBulkDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [useAttachments, setUseAttachments] = useState(true)

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default")
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)

  const [bulkItems, setBulkItems] = useState<BulkItem[]>([])
  const [isZipping, setIsZipping] = useState(false)
  const [isBulkSending, setIsBulkSending] = useState(false)

  const MAX_FILES = 20

  // Load templates from localStorage
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem("emailTemplates")
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates) as EmailTemplate[]
        if (Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
          setTemplates(parsedTemplates)

          const defaultTemplate = parsedTemplates.find((t) => t.id === "default") || parsedTemplates[0]
          setSelectedTemplateId(defaultTemplate.id)
          setSelectedTemplate(defaultTemplate)
        } else {
          createDefaultTemplate()
        }
      } else {
        createDefaultTemplate()
      }
    } catch (error) {
      console.error("Error loading templates:", error)
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
      const existingHistory = localStorage.getItem("emailSendingHistory")
      let history: EmailHistoryItem[] = []

      if (existingHistory) {
        history = JSON.parse(existingHistory)
      }

      history.push(historyItem)

      if (history.length > 100) {
        history = history.slice(-100)
      }

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

        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet)

        const validData = jsonData
          .map((row: any) => {
            const normalizedRow: any = {}
            Object.keys(row).forEach((key) => {
              normalizedRow[key.toUpperCase()] = row[key]
            })
            return normalizedRow as Contact
          })
          .filter(
            (item) =>
              "NUMBER" in item &&
              "NAME" in item &&
              "EMAIL" in item &&
              item.NAME &&
              item.EMAIL &&
              String(item.EMAIL).includes("@"),
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
    // Reset input
    e.target.value = ""
  }

  // Handle image compression and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${MAX_FILES} images`,
        variant: "destructive",
      })
      return
    }

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: "image/jpeg",
    }

    try {
      const processedFiles: File[] = []
      const newPreviews: string[] = []

      for (const file of selectedFiles) {
        if (file.type.startsWith("image/")) {
          const compressedBlob = await imageCompression(file, options)
          const compressedFile = new File([compressedBlob], file.name, {
            type: file.type,
            lastModified: file.lastModified,
          })
          processedFiles.push(compressedFile)

          const previewUrl = URL.createObjectURL(compressedFile)
          newPreviews.push(previewUrl)
        } else {
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

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append("email", email)

      if (selectedContact) {
        formData.append("contactNumber", String(selectedContact.NUMBER))
        formData.append("contactName", selectedContact.NAME)
      }

      formData.append("templateId", selectedTemplate.id)
      formData.append("templateSubject", selectedTemplate.subject)
      formData.append("templateBody", selectedTemplate.body)
      formData.append("senderName", selectedTemplate.senderName || "NBD CHARITY")

      formData.append("useAttachments", useAttachments.toString())

      files.forEach((file) => {
        formData.append("files", file)
      })

      setProgress(30)

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

            if (result.historyItem) {
              saveEmailHistory(result.historyItem)
            }

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

            if (result.errorDetails) {
              console.error("Detailed error:", result.errorDetails)
            }

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

  const filteredByName = contacts.filter((contact) => contact.NAME.toLowerCase().includes(nameQuery.toLowerCase()))

  const filteredByNumber = contacts.filter((contact) => String(contact.NUMBER).includes(numberQuery))

  const selectContactByName = (contact: Contact) => {
    setNameQuery(contact.NAME)
    setEmail(contact.EMAIL)
    setSelectedContact(contact)
  }

  const selectContactByNumber = (contact: Contact) => {
    setNumberQuery(String(contact.NUMBER))
    setEmail(contact.EMAIL)
    setSelectedContact(contact)
  }

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

    if (files.length + droppedFiles.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${MAX_FILES} images`,
        variant: "destructive",
      })
      return
    }

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: "image/jpeg",
    }

    try {
      const processedFiles: File[] = []
      const newPreviews: string[] = []

      for (const file of droppedFiles) {
        const compressedBlob = await imageCompression(file, options)
        const compressedFile = new File([compressedBlob], file.name, {
          type: file.type,
          lastModified: file.lastModified,
        })
        processedFiles.push(compressedFile)

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

  const handleBulkDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBulkDragging(true)
  }

  const handleBulkDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBulkDragging(false)
  }

  const handleBulkDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBulkDragging(true)
  }

  const handleBulkDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsBulkDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile || !droppedFile.name.endsWith(".zip")) {
      toast({
        title: "Invalid file",
        description: "Please drop a single ZIP file",
        variant: "destructive",
      })
      return
    }

    await processZipFile(droppedFile)
  }

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processZipFile(file)
    }
    // Reset input
    e.target.value = ""
  }

  const processZipFile = async (file: File) => {
    if (!contacts.length) {
      toast({
        title: "Import Excel First",
        description: "Please import your contacts Excel file before uploading ZIP",
        variant: "destructive",
      })
      return
    }

    setIsZipping(true)
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    try {
      const zipData = await file.arrayBuffer()
      const content = await zip.loadAsync(zipData)

      const groupedFiles: Record<string, { files: File[]; folderName: string }> = {}

      // Process each file in the zip
      for (const [path, zipEntry] of Object.entries(content.files)) {
        if (zipEntry.dir) continue // Skip directories

        // Normalize path to ignore leading/trailing slashes and system folders
        const cleanPath = path.replace(/\\/g, "/").replace(/^\//, "")
        const pathParts = cleanPath.split("/")

        // Skip system files and files at root
        const fileName = pathParts[pathParts.length - 1]
        if (fileName.startsWith(".") || pathParts.includes("__MACOSX")) continue

        // Check if it's an image
        const extension = fileName.split(".").pop()?.toLowerCase()
        const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")
        if (!isImage) continue

        // Determine the relevant folder name (the immediate parent folder)
        // If it's deep like "Root/123/img.jpg", folderName is "123"
        // If it's "123/img.jpg", folderName is "123"
        if (pathParts.length < 2) continue
        const folderName = pathParts[pathParts.length - 2]

        const blob = await zipEntry.async("blob")
        const extractedFile = new File([blob], fileName, { type: `image/${extension === "jpg" ? "jpeg" : extension}` })

        if (!groupedFiles[folderName]) {
          groupedFiles[folderName] = { files: [], folderName }
        }
        groupedFiles[folderName].files.push(extractedFile)
      }

      const newBulkItems: BulkItem[] = []

      // Match folders with contacts
      Object.values(groupedFiles).forEach((group) => {
        // Extract all numeric sequences from the folder name (e.g., "406 - 692701968" -> ["406", "692701968"])
        const numericSequences = group.folderName.match(/\d+/g) || []

        let matchedContact: Contact | null = null

        // Try to match any of the numeric sequences against our contacts
        for (const seq of numericSequences) {
          const found = contacts.find((c) => String(c.NUMBER) === seq)
          if (found) {
            matchedContact = found
            break
          }
        }

        // If no match found by sequence, try matching the whole folder name as a fallback
        if (!matchedContact) {
          const folderNumber = group.folderName.trim()
          matchedContact = contacts.find((c) => String(c.NUMBER) === folderNumber) || null
        }

        newBulkItems.push({
          id: Math.random().toString(36).substr(2, 9),
          folderName: group.folderName,
          contact: matchedContact,
          files: group.files,
          status: "idle",
        })
      })

      if (Object.keys(groupedFiles).length === 0) {
        toast({
          title: "ZIP is empty",
          description: "No folders or images were found in the ZIP file.",
          variant: "destructive",
        })
        return
      }

      newBulkItems.sort((a, b) => {
        const numA = a.contact ? Number(a.contact.NUMBER) : parseInt(a.folderName.match(/\d+/)?.[0] || "0", 10);
        const numB = b.contact ? Number(b.contact.NUMBER) : parseInt(b.folderName.match(/\d+/)?.[0] || "0", 10);
        return numA - numB;
      });

      setBulkItems(newBulkItems)

      if (newBulkItems.length > 0) {
        toast({
          title: "ZIP Processed",
          description: `Found ${newBulkItems.length} matching folders out of ${Object.keys(groupedFiles).length} total folders.`,
        })
      } else {
        toast({
          title: "No Matches Found",
          description: `Found ${Object.keys(groupedFiles).length} folders, but none matched your contacts.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error unzipping file:", error)
      toast({
        title: "Error unzipping",
        description: "Could not process the ZIP file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsZipping(false)
    }
  }

  const sendBulkItem = async (item: BulkItem) => {
    if (!item.contact) {
      setBulkItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "failed", error: "Kontak belum dipilih" } : i)))
      return
    }

    if (!selectedTemplate) return

    setBulkItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "sending", error: undefined } : i)))

    try {
      const formData = new FormData()
      formData.append("email", item.contact.EMAIL)
      formData.append("contactNumber", String(item.contact.NUMBER))
      formData.append("contactName", item.contact.NAME)
      formData.append("templateId", selectedTemplate.id)
      formData.append("templateSubject", selectedTemplate.subject)
      formData.append("templateBody", selectedTemplate.body)
      formData.append("senderName", selectedTemplate.senderName || "NBD CHARITY")
      formData.append("useAttachments", useAttachments.toString())

      const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true, fileType: "image/jpeg" }

      for (const file of item.files) {
        const compressedBlob = await imageCompression(file, options)
        const compressedFile = new File([compressedBlob], file.name, { type: file.type, lastModified: file.lastModified })
        formData.append("files", compressedFile)
      }

      const result = await sendEmail(formData)

      if (result.success) {
        setBulkItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "success" } : i)))
        if (result.historyItem) saveEmailHistory(result.historyItem)
      } else {
        setBulkItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "failed", error: result.error } : i)))
      }
    } catch (error) {
      console.error(`Error sending bulk item ${item.contact.NAME || "unknown"}:`, error)
      setBulkItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "failed", error: error instanceof Error ? error.message : "Unknown error" } : i)))
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleResendSingle = async (item: BulkItem) => {
    if (isBulkSending) return
    if (!selectedTemplate) {
      toast({ title: "Template required", description: "Please select an email template", variant: "destructive" })
      return
    }
    // Set lock so startBulkSend cannot run concurrently
    const originalBulkSending = isBulkSending
    setIsBulkSending(true)
    await sendBulkItem(item)
    setIsBulkSending(originalBulkSending) // Restore previous state or false
  }

  const startBulkSend = async () => {
    if (isBulkSending || bulkItems.length === 0 || !selectedTemplate) return

    setIsBulkSending(true)

    const itemsToProcess = bulkItems.filter((item) => item.status === "idle" || item.status === "failed")

    if (itemsToProcess.length === 0) {
      setIsBulkSending(false)
      toast({
        title: "Nothing to process",
        description: "All items have already been processed successfully.",
      })
      return
    }

    for (const item of itemsToProcess) {
      await sendBulkItem(item)
    }

    setIsBulkSending(false)
    toast({
      title: "Bulk Process Finished",
      description: "Finished processing all items in the list.",
    })
  }

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
        {/* Visual Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-slate-950" />
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-[20%] -right-[15%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[80px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.8)_100%)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Header */}
          <header className="container mx-auto py-4 sm:py-6 px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img
                  src="/nbd-logo.png"
                  alt="NBD Charity Logo"
                  className="h-9 sm:h-11 w-auto brightness-110"
                />
              </div>
              <div className="flex items-center gap-4">
                <nav className="hidden md:block">
                  <ul className="flex gap-6">
                    <li>
                      <button
                        onClick={scrollToApp}
                        className="text-sm sm:text-base text-white/90 hover:text-primary transition-colors font-medium"
                      >
                        {t.app.tabs.single}
                      </button>
                    </li>
                    <li>
                      <a
                        href="https://t.me/nbdcharity"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm sm:text-base text-white/90 hover:text-primary transition-colors font-medium"
                      >
                        Telegram
                      </a>
                    </li>
                  </ul>
                </nav>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-9 px-3">
                      <Globe className="h-4 w-4 mr-2" />
                      <span className="uppercase font-bold">{language}</span>
                      <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
                    <DropdownMenuItem onClick={() => setLanguage("id")} className="focus:bg-primary/20 focus:text-white cursor-pointer">
                      🇮🇩 Bahasa Indonesia
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage("en")} className="focus:bg-primary/20 focus:text-white cursor-pointer">
                      🇺🇸 English
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage("fr")} className="focus:bg-primary/20 focus:text-white cursor-pointer">
                      🇫🇷 Français
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col">
            <div className="container mx-auto px-4 py-12 sm:py-24 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
              <div className="text-left max-w-2xl animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary-foreground text-xs font-semibold mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  {t.hero.badge}
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
                  {t.hero.title}
                </h1>
                <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
                  {t.hero.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={scrollToApp} size="lg" className="h-14 px-10 text-lg font-bold shadow-2xl shadow-primary/40 hover:scale-105 transition-all">
                    {t.hero.getStarted}
                    <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-14 px-10 text-lg font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    {t.hero.learnMore}
                  </Button>
                </div>
              </div>

              <div className="relative w-full max-w-[500px] aspect-square animate-float">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary/20 blur-[120px] rounded-full opacity-50" />
                <div className="relative z-10 w-full h-full rounded-[2.5rem] overflow-hidden glass shadow-2xl border border-white/10 transform transition-transform duration-700 hover:scale-[1.02]">
                  <img
                    src="/mascot.png"
                    alt="NBD Charity Platform"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="container mx-auto px-4 py-20">
              <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
                {t.app.dashboard.featuresTitle}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                <FeatureCard
                  icon={Archive}
                  title={t.features.bulk.title}
                  description={t.features.bulk.description}
                />
                <FeatureCard
                  icon={ImageIcon}
                  title={t.features.compression.title}
                  description={t.features.compression.description}
                />
                <FeatureCard
                  icon={History}
                  title={t.features.tracking.title}
                  description={t.features.tracking.description}
                />
              </div>
            </div>
          </main>
        </div>

        {/* App Section */}
        <div id="app-section" className="bg-background py-16 sm:py-24 relative z-10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
                  {t.app.dashboard.title}
                </h2>
                <div className="h-1.5 w-24 bg-primary mx-auto rounded-full mb-6" />
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                  {t.app.dashboard.subtitle}
                </p>
              </div>

              <Tabs defaultValue="single" className="w-full">
                <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm h-14 p-1 bg-muted/50 rounded-xl mb-8">
                  <TabsTrigger value="single" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300">
                    {t.app.tabs.single}
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300">
                    {t.app.tabs.bulk}
                  </TabsTrigger>
                  <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300">
                    {t.app.tabs.templates}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300">
                    <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">{t.app.tabs.history}</span>
                    <span className="xs:hidden">Hist.</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="single">
                  <Card>
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-xl sm:text-2xl">{t.app.sections.single.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {t.app.sections.single.description.replace("{max}", MAX_FILES.toString())}
                      </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                        {/* Excel Import Section */}
                        <div className="space-y-2">
                          <Label>{t.app.sections.single.importLabel}</Label>
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
                              <span className="text-sm font-medium">{t.app.sections.single.importLabel}</span>
                              <span className="text-xs text-muted-foreground mt-1 text-balance">
                                {t.app.sections.single.importHint}
                              </span>
                            </Label>
                          </div>
                          {contacts.length > 0 && (
                            <p className="text-xs text-muted-foreground text-center">{contacts.length} {t.app.sections.single.importStatus}</p>
                          )}
                        </div>

                        {/* Search Tabs */}
                        <Tabs defaultValue="name" value={activeTab} onValueChange={setActiveTab}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="name">{t.app.sections.single.searchName.split(" ").pop()}</TabsTrigger>
                            <TabsTrigger value="number">{t.app.sections.single.searchNumber.split(" ").pop()}</TabsTrigger>
                          </TabsList>

                          {/* Search by Name */}
                          <TabsContent value="name" className="space-y-2">
                            <Label htmlFor="name-search">{t.app.sections.single.searchName}</Label>
                            <div className="relative">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="name-search"
                                  type="text"
                                  placeholder={t.app.sections.single.placeholderName}
                                  value={nameQuery}
                                  onChange={(e) => setNameQuery(e.target.value)}
                                  disabled={contacts.length === 0}
                                />
                              </div>
                              <div
                                className={`absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto transition-all duration-300 ${nameQuery && filteredByName.length > 0
                                  ? "opacity-100 h-auto pointer-events-auto"
                                  : "opacity-0 h-0 overflow-hidden pointer-events-none"
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
                            <Label htmlFor="number-search">{t.app.sections.single.searchNumber}</Label>
                            <div className="relative">
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="number-search"
                                  type="text"
                                  placeholder={t.app.sections.single.placeholderNumber}
                                  value={numberQuery}
                                  onChange={(e) => setNumberQuery(e.target.value)}
                                  disabled={contacts.length === 0}
                                />
                              </div>
                              <div
                                className={`absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto transition-all duration-300 ${numberQuery && filteredByNumber.length > 0
                                  ? "opacity-100 h-auto pointer-events-auto"
                                  : "opacity-0 h-0 overflow-hidden pointer-events-none"
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
                        <div
                          className={`p-3 bg-muted rounded-md transition-all duration-300 ${selectedContact ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden pointer-events-none"
                            }`}
                        >
                          <p className="text-sm font-medium">{t.app.sections.single.selectedContact}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">#{selectedContact?.NUMBER}</span>
                            <span>-</span>
                            <span>{selectedContact?.NAME}</span>
                          </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-2">
                          <Label htmlFor="email">{t.app.sections.single.emailLabel}</Label>
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
                          <Label htmlFor="template-select">{t.app.sections.single.templateLabel}</Label>
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
                          <Label>{t.app.sections.single.methodLabel}</Label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="use-attachments"
                              checked={useAttachments}
                              onChange={(e) => setUseAttachments(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="use-attachments" className="text-sm font-normal">
                              {t.app.sections.single.attachmentLabel}
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {useAttachments
                              ? t.app.sections.single.attachmentHint
                              : t.app.sections.single.methodHint}
                          </p>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                          <Label>{t.app.sections.single.uploadLabel} (Max {MAX_FILES})</Label>
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
                              <span className="text-sm font-medium text-balance leading-relaxed">
                                {isDragging ? t.app.upload.dropActive : t.app.sections.single.uploadHint}
                              </span>
                              <span className="text-xs text-muted-foreground mt-1">
                                {files.length}/{MAX_FILES} {t.app.upload.selectedHint}
                              </span>
                            </Label>
                          </div>

                          <div
                            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 mt-4 transition-all duration-300 ${previews.length > 0
                              ? "opacity-100 h-auto pointer-events-auto"
                              : "opacity-0 h-0 overflow-hidden pointer-events-none"
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
                        <div
                          className={`mt-4 transition-all duration-300 ${isSubmitting ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden pointer-events-none"
                            }`}
                        >
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{t.app.sections.single.sendingProgress} {progress}%</p>
                        </div>
                      </CardContent>

                      <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <Button
                          type="submit"
                          className="w-full h-12 text-base font-bold"
                          disabled={isSubmitting || files.length === 0 || !email || !selectedTemplate}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {t.app.sections.single.sending}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Send className="h-5 w-5" />
                              {t.app.sections.single.sendButton}
                            </span>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>

                <TabsContent value="bulk">
                  <Card>
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-xl sm:text-2xl">{t.app.sections.bulk.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {t.app.sections.bulk.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 px-4 sm:px-6">
                      {/* Step 1: Ensure Excel is imported */}
                      <div className={`p-4 rounded-lg border flex items-center gap-4 ${contacts.length > 0 ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
                        <Input
                          id="bulk-excel-upload"
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={handleExcelImport}
                        />
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${contacts.length > 0 ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                          {contacts.length > 0 ? <CheckCircle2 className="h-6 w-6" /> : <FileSpreadsheet className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{t.app.sections.bulk.step1}</p>
                          <p className="text-xs text-muted-foreground">
                            {contacts.length > 0 ? `${contacts.length} ${t.app.sections.bulk.contactsLoaded}.` : t.app.sections.bulk.importRequired}
                          </p>
                        </div>
                        {contacts.length === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById("bulk-excel-upload")?.click()}
                          >
                            {t.app.sections.bulk.importButton}
                          </Button>
                        )}
                      </div>

                      {/* Step 2: ZIP Upload */}
                      <div className="space-y-2">
                        <Label>{t.app.sections.bulk.step2}</Label>
                        <div
                          className={`border-2 ${isBulkDragging ? "border-primary bg-primary/5" : "border-dashed"} rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors relative min-h-[160px] flex items-center justify-center`}
                          onDragEnter={handleBulkDragEnter}
                          onDragOver={handleBulkDragOver}
                          onDragLeave={handleBulkDragLeave}
                          onDrop={handleBulkDrop}
                          onClick={() => document.getElementById("zip-upload")?.click()}
                        >
                          <div className="flex flex-col items-center pointer-events-none">
                            {isZipping ? (
                              <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                            ) : (
                              <FolderArchive className={`h-10 w-10 mb-2 ${isBulkDragging ? "text-primary" : "text-muted-foreground"}`} />
                            )}
                            <span className="text-sm font-medium">
                              {isZipping ? t.app.sections.bulk.processingZip : isBulkDragging ? t.app.sections.bulk.dropZip : t.app.sections.bulk.zipHint.split("(")[0].trim()}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                              {t.app.sections.bulk.zipHint}
                            </span>
                          </div>
                        </div>
                        <Input
                          id="zip-upload"
                          type="file"
                          accept=".zip"
                          className="hidden"
                          onChange={handleZipUpload}
                          disabled={isZipping}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bulk Items List */}
                  {bulkItems.length > 0 && (
                    <div className="mt-8 space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-bold">{t.app.sections.bulk.readyLabel} ({bulkItems.length})</Label>
                        <Button
                          onClick={startBulkSend}
                          disabled={isBulkSending || !selectedTemplate}
                          size="sm"
                          className="gap-2 h-10 px-4"
                        >
                          {isBulkSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                          {t.app.sections.bulk.sendButton}
                        </Button>
                      </div>

                      <div className="border rounded-xl divide-y max-h-96 overflow-auto bg-card shadow-sm">
                        {bulkItems.map((item) => (
                          <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 overflow-hidden w-full">
                              <Archive className="h-5 w-5 text-primary flex-shrink-0" />
                              <div className="flex flex-col min-w-0 w-full">
                                <span className="font-semibold text-sm truncate">{item.folderName}</span>
                                {item.contact ? (
                                  <span className="text-xs text-muted-foreground truncate">{item.contact.EMAIL} • {item.files.length} {t.app.sections.bulk.images}</span>
                                ) : (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-destructive font-semibold">Kontak Tidak Ditemukan</span>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-6 px-2 text-xs py-0">Pilih Kontak</Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="max-h-60 overflow-auto">
                                        {contacts.length > 0 ? (
                                          contacts.map((c) => (
                                            <DropdownMenuItem key={c.EMAIL} onClick={() => {
                                              setBulkItems(prev => prev.map(i => i.id === item.id ? { ...i, contact: c } : i))
                                            }} className="focus:bg-primary/20 cursor-pointer">
                                              <div className="flex flex-col">
                                                <span className="font-medium text-xs">{c.NAME}</span>
                                                <span className="text-xs text-muted-foreground">{c.EMAIL}</span>
                                              </div>
                                            </DropdownMenuItem>
                                          ))
                                        ) : (
                                          <div className="p-2 text-xs text-center text-muted-foreground">Belum ada kontak</div>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {item.status === "sending" && (
                                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  {t.app.sections.bulk.sendingStatus}
                                </div>
                              )}
                              {item.status === "success" && (
                                <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-wider">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {t.app.sections.bulk.success}
                                </div>
                              )}
                              {item.status === "failed" && (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2 text-destructive font-bold text-xs uppercase tracking-wider">
                                    <AlertCircle className="h-3 w-3" />
                                    {t.app.sections.bulk.failed}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-6 px-1.5 text-xs py-0" 
                                    onClick={() => handleResendSingle(item)}
                                    disabled={isBulkSending}
                                  >
                                    Kirim Ulang
                                  </Button>
                                </div>
                              )}
                              {item.status === "idle" && (
                                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{t.app.sections.bulk.waitingStatus}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </TabsContent>

                <TabsContent value="templates">
                  <EmailTemplates />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <EmailHistory />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 bg-slate-950 text-white py-20 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <img
                    src="/nbd-logo.png"
                    alt="NBD Charity Logo"
                    className="h-8 w-auto brightness-125"
                  />
                </div>
                <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                  {t.app.footer.description}
                </p>
              </div>

              <div className="flex flex-col gap-6 md:items-center">
                <h4 className="font-bold uppercase tracking-[0.2em] text-[10px] text-white/40">{t.app.footer.nav}</h4>
                <nav>
                  <ul className="flex flex-col gap-3 md:items-center">
                    <li><button onClick={scrollToApp} className="text-sm text-white/60 hover:text-primary transition-colors font-medium">{t.app.tabs.single}</button></li>
                    <li><a href="https://t.me/nbdcharity" target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-primary transition-colors font-medium">Telegram</a></li>
                  </ul>
                </nav>
              </div>

              <div className="flex flex-col gap-6 md:items-end">
                <h4 className="font-bold uppercase tracking-[0.2em] text-[10px] text-white/40">{t.app.footer.connect}</h4>
                <div className="flex gap-4">
                  <Button size="icon" variant="outline" className="rounded-full bg-white/5 border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all duration-300">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-white/30 text-xs">
                © {new Date().getFullYear()} NBD Charity. {t.app.footer.rights}
              </p>
              <div className="flex gap-8">
                <a href="#" className="text-xs text-white/30 hover:text-white transition-colors">{t.app.footer.privacy}</a>
                <a href="#" className="text-xs text-white/30 hover:text-white transition-colors">{t.app.footer.terms}</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
