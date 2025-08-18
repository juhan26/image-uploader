"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileSpreadsheet, Search, Mail, Send, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Contact {
  number: string
  name: string
  email: string
}

export default function BulkSendPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchNumber, setSearchNumber] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [subject, setSubject] = useState("NBD CHARITY")
  const [isUploading, setIsUploading] = useState(false)
  const [sendAsAttachment, setSendAsAttachment] = useState(true)
  const [importStatus, setImportStatus] = useState<{
    total: number
    successful: number
    failed: number
    isImporting: boolean
  }>({
    total: 0,
    successful: 0,
    failed: 0,
    isImporting: false,
  })

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("[v0] File selected:", file.name, file.type, file.size)
    setImportStatus({ total: 0, successful: 0, failed: 0, isImporting: true })

    try {
      let text = ""

      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // For Excel files, we need to use a proper Excel parser
        // Since we can't use external libraries, we'll ask user to save as CSV
        toast({
          title: "Excel File Detected",
          description:
            "Please save your Excel file as CSV format (.csv) for better compatibility. Go to File > Save As > CSV in Excel.",
          variant: "destructive",
        })
        setImportStatus({ total: 0, successful: 0, failed: 0, isImporting: false })
        return
      } else if (file.name.endsWith(".csv") || file.type === "text/csv" || file.type === "application/vnd.ms-excel") {
        text = await file.text()
        console.log("[v0] File content preview:", text.substring(0, 200))
      } else {
        toast({
          title: "Unsupported File Type",
          description: "Please upload CSV files only. Save your Excel file as CSV format first.",
          variant: "destructive",
        })
        setImportStatus({ total: 0, successful: 0, failed: 0, isImporting: false })
        return
      }

      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "")
      console.log("[v0] Total lines found:", lines.length)

      if (lines.length < 2) {
        toast({
          title: "Invalid File",
          description: "File must contain at least a header row and one data row",
          variant: "destructive",
        })
        setImportStatus({ total: 0, successful: 0, failed: 0, isImporting: false })
        return
      }

      const firstLine = lines[0]
      let delimiter = ","
      if (firstLine.includes(";")) delimiter = ";"
      else if (firstLine.includes("\t")) delimiter = "\t"

      console.log("[v0] Using delimiter:", delimiter)
      console.log("[v0] Header line:", firstLine)

      // Parse headers with better cleaning
      const headers = firstLine
        .toLowerCase()
        .split(delimiter)
        .map((h) => h.trim().replace(/['"]/g, ""))

      console.log("[v0] Parsed headers:", headers)

      const numberIndex = headers.findIndex(
        (h) => h.includes("number") || h.includes("no") || h.includes("nomor") || h === "a" || h.startsWith("num"),
      )
      const nameIndex = headers.findIndex(
        (h) => h.includes("name") || h.includes("nama") || h === "b" || h.includes("full"),
      )
      const emailIndex = headers.findIndex(
        (h) => h.includes("email") || h.includes("mail") || h === "c" || h.includes("e-mail"),
      )

      console.log("[v0] Column indices - Number:", numberIndex, "Name:", nameIndex, "Email:", emailIndex)

      if (numberIndex === -1 || nameIndex === -1 || emailIndex === -1) {
        toast({
          title: "Invalid Headers",
          description: `Headers found: ${headers.join(", ")}. Need columns for NUMBER, NAME, and EMAIL.`,
          variant: "destructive",
        })
        setImportStatus({ total: 0, successful: 0, failed: 0, isImporting: false })
        return
      }

      const parsedContacts: Contact[] = []
      let successful = 0
      let failed = 0

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map((v) => v.trim().replace(/['"]/g, ""))
        console.log(`[v0] Row ${i}:`, values)

        if (values.length >= Math.max(numberIndex, nameIndex, emailIndex) + 1) {
          const contact = {
            number: values[numberIndex]?.trim() || "",
            name: values[nameIndex]?.trim() || "",
            email: values[emailIndex]?.trim() || "",
          }

          console.log(`[v0] Parsed contact ${i}:`, contact)

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (contact.name && contact.email && emailRegex.test(contact.email)) {
            parsedContacts.push(contact)
            successful++
          } else {
            failed++
            console.log(`[v0] Skipped invalid contact at row ${i + 1}:`, contact)
          }
        } else {
          failed++
          console.log(`[v0] Skipped row ${i + 1} - insufficient columns:`, values)
        }
      }

      console.log("[v0] Final results - Successful:", successful, "Failed:", failed)

      setContacts(parsedContacts)
      setImportStatus({
        total: lines.length - 1,
        successful,
        failed,
        isImporting: false,
      })

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successful} contacts${failed > 0 ? `, ${failed} failed` : ""}`,
      })
    } catch (error) {
      console.error("[v0] Excel import error:", error)
      toast({
        title: "Import Failed",
        description: "Error reading file. Please save as CSV format and try again.",
        variant: "destructive",
      })
      setImportStatus({ total: 0, successful: 0, failed: 0, isImporting: false })
    }
  }

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

    if (files.length + images.length > 20) {
      toast({
        title: "Too many images",
        description: "Maximum 20 images allowed",
        variant: "destructive",
      })
      return
    }

    setImages((prev) => [...prev, ...files])
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length + images.length > 20) {
      toast({
        title: "Too many images",
        description: "Maximum 20 images allowed",
        variant: "destructive",
      })
      return
    }
    setImages((prev) => [...prev, ...files])
  }

  const filteredContacts = contacts.filter((contact) => {
    const nameMatch = searchTerm.trim() === "" || contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    const numberMatch = searchNumber.trim() === "" || contact.number.includes(searchNumber)

    // If both fields are empty, show all contacts
    if (searchTerm.trim() === "" && searchNumber.trim() === "") {
      return true
    }

    // If only one field is filled, search by that field only
    if (searchTerm.trim() !== "" && searchNumber.trim() === "") {
      return nameMatch
    }

    if (searchNumber.trim() !== "" && searchTerm.trim() === "") {
      return numberMatch
    }

    // If both fields are filled, contact must match both criteria
    return nameMatch && numberMatch
  })

  const handleSendImages = async () => {
    if (!selectedContact) {
      toast({
        title: "No contact selected",
        description: "Please select a contact first",
        variant: "destructive",
      })
      return
    }

    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload at least one image",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Upload images to blob storage
      const imageUrls = []
      for (const image of images) {
        const formData = new FormData()
        formData.append("file", image)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const { url } = await response.json()
          imageUrls.push(url)
        }
      }

      // Send email with images
      const emailResponse = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: selectedContact,
          subject,
          imageUrls,
          sendAsAttachment,
        }),
      })

      if (emailResponse.ok) {
        toast({
          title: "Images sent successfully",
          description: `${images.length} images sent to ${selectedContact.name}`,
        })
        setImages([])
        setSelectedContact(null)
      }
    } catch (error) {
      toast({
        title: "Error sending images",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Send Images via Email</h1>
          <p className="text-gray-600 mt-2">Upload up to 20 images and send them to any email address</p>
        </div>

        {/* Import Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Import Contacts (Excel/CSV)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Import Excel/CSV with contacts</p>
              <p className="text-sm text-gray-500 mb-4">(File with 'NUMBER', 'NAME', and 'EMAIL' columns)</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
                id="excel-upload"
                disabled={importStatus.isImporting}
              />
              <Label htmlFor="excel-upload" className="cursor-pointer">
                <Button
                  variant="outline"
                  className="pointer-events-none bg-transparent"
                  disabled={importStatus.isImporting}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importStatus.isImporting ? "Importing..." : "Choose Excel/CSV File"}
                </Button>
              </Label>
            </div>

            {(importStatus.total > 0 || contacts.length > 0) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {importStatus.successful > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{importStatus.successful} imported</span>
                      </div>
                    )}
                    {importStatus.failed > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{importStatus.failed} failed</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total contacts: <span className="font-medium">{contacts.length}</span>
                  </div>
                </div>
                {importStatus.failed > 0 && (
                  <p className="text-xs text-gray-500 mt-2">Failed rows may have missing or invalid email addresses</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Contacts */}
        {contacts.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Search by Name (Optional)</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Type to search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Search by Number (Optional)</Label>
                  <Input
                    placeholder="Search by number..."
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">
                  Showing {filteredContacts.length} of {contacts.length} contacts
                  {(searchTerm.trim() !== "" || searchNumber.trim() !== "") && (
                    <span className="text-blue-600 ml-1">
                      (filtered by {searchTerm.trim() !== "" ? "name" : ""}
                      {searchTerm.trim() !== "" && searchNumber.trim() !== "" ? " and " : ""}
                      {searchNumber.trim() !== "" ? "number" : ""})
                    </span>
                  )}
                </div>
                {(searchTerm.trim() !== "" || searchNumber.trim() !== "") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setSearchNumber("")
                    }}
                    className="text-xs"
                  >
                    Clear Search
                  </Button>
                )}
              </div>

              {/* Contact List */}
              <div className="max-h-40 overflow-y-auto border rounded-lg">
                {filteredContacts.map((contact, index) => (
                  <div
                    key={index}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedContact?.email === contact.email ? "bg-blue-50 border-blue-200" : ""
                    }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                      </div>
                      <span className="text-sm text-gray-500">{contact.number}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Contact */}
        {selectedContact && (
          <Card>
            <CardContent className="pt-6">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{selectedContact.email}</span>
                <span className="text-sm text-gray-500">({selectedContact.name})</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Template */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Email Template</Label>
              <Select defaultValue="default">
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Template</SelectItem>
                  <SelectItem value="charity">Charity Template</SelectItem>
                  <SelectItem value="business">Business Template</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Metode Pengiriman</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="attachment" checked={sendAsAttachment} onCheckedChange={setSendAsAttachment} />
                <Label htmlFor="attachment" className="text-sm">
                  Kirim gambar sebagai lampiran email (direkomendasikan)
                </Label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gambar akan dikirim sebagai lampiran email. Ukuran maksimum total: 10MB.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Images */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Images (Max 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              onDrop={handleImageDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Click or drag images here to upload</p>
              <p className="text-sm text-gray-500 mb-4">
                {images.length}/20 images selected (images will be compressed)
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <Label htmlFor="image-upload" className="cursor-pointer">
                <Button variant="outline" className="pointer-events-none bg-transparent">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Images
                </Button>
              </Label>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image) || "/placeholder.svg"}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <button
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send Button */}
        <Button
          onClick={handleSendImages}
          disabled={!selectedContact || images.length === 0 || isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
        >
          <Send className="w-5 h-5 mr-2" />
          {isUploading ? "Sending Images..." : "Send Images"}
        </Button>
      </div>
    </div>
  )
}
