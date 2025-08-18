"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Files,
  Share2,
  HardDrive,
  LogOut,
  Eye,
  Trash2,
  Download,
  Mail,
  Upload,
  Plus,
  Edit,
  FileText,
} from "lucide-react"

interface AdminDashboardProps {
  onLogout: () => void
}

interface UserData {
  email: string
  fileCount: number
  totalSize: number
  lastActive: string
}

interface FileData {
  name: string
  url: string
  size: number
  owner: string
  uploadedAt: string
}

interface ShareData {
  id: string
  senderEmail: string
  recipientEmails: string[]
  fileCount: number
  sharedAt: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  createdAt: string
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [allFiles, setAllFiles] = useState<FileData[]>([])
  const [shares, setShares] = useState<ShareData[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    totalShares: 0,
    totalStorage: 0,
  })
  const [uploadForm, setUploadForm] = useState({
    donorEmail: "",
    files: [] as File[],
  })
  const [isUploading, setIsUploading] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    content: "",
  })
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)

  useEffect(() => {
    loadAdminData()
    loadTemplates()
  }, [])

  const loadAdminData = () => {
    // Load all user data from localStorage (in real app, this would be from database)
    const allUserEmails: string[] = []
    const allUserFiles: FileData[] = []
    const allUserShares: ShareData[] = []

    // Scan localStorage for user data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("files_")) {
        const email = key.replace("files_", "")
        allUserEmails.push(email)

        const userFiles = JSON.parse(localStorage.getItem(key) || "[]")
        userFiles.forEach((file: any) => {
          allUserFiles.push({
            ...file,
            owner: email,
            uploadedAt: new Date().toISOString(), // Mock date
          })
        })
      }

      if (key?.startsWith("shares_")) {
        const email = key.replace("shares_", "")
        const userShares = JSON.parse(localStorage.getItem(key) || "[]")
        allUserShares.push(...userShares)
      }
    }

    // Process user data
    const userData: UserData[] = allUserEmails.map((email) => {
      const userFiles = allUserFiles.filter((file) => file.owner === email)
      const totalSize = userFiles.reduce((sum, file) => sum + file.size, 0)

      return {
        email,
        fileCount: userFiles.length,
        totalSize,
        lastActive: new Date().toISOString(), // Mock date
      }
    })

    // Calculate stats
    const totalStorage = allUserFiles.reduce((sum, file) => sum + file.size, 0)

    setUsers(userData)
    setAllFiles(allUserFiles)
    setShares(allUserShares)
    setStats({
      totalUsers: userData.length,
      totalFiles: allUserFiles.length,
      totalShares: allUserShares.length,
      totalStorage,
    })
  }

  const loadTemplates = () => {
    const savedTemplates = localStorage.getItem("email_templates")
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates))
    } else {
      // Set default templates
      const defaultTemplates: EmailTemplate[] = [
        {
          id: "default",
          name: "Default Template",
          subject: "NBD CHARITY - Foto Anda",
          content: `Halo,

Terima kasih atas dukungan Anda untuk NBD CHARITY.

Kami telah mengupload foto-foto terbaru untuk Anda. Silakan login ke sistem untuk melihat foto-foto tersebut.

Salam hangat,
Tim NBD CHARITY`,
          createdAt: new Date().toISOString(),
        },
        {
          id: "donation",
          name: "Donation Thank You",
          subject: "Terima Kasih atas Donasi Anda",
          content: `Halo,

Terima kasih atas donasi yang telah Anda berikan untuk NBD CHARITY.

Sebagai bentuk apresiasi, kami telah menyiapkan foto-foto kegiatan yang didukung oleh donasi Anda.

Dengan hormat,
Tim NBD CHARITY`,
          createdAt: new Date().toISOString(),
        },
      ]
      setTemplates(defaultTemplates)
      localStorage.setItem("email_templates", JSON.stringify(defaultTemplates))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated")
    onLogout()
  }

  const handleDonorPhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.donorEmail || uploadForm.files.length === 0) return

    setIsUploading(true)

    try {
      const uploadedFiles = []

      for (const file of uploadForm.files) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const { url } = await response.json()
          uploadedFiles.push({
            name: file.name,
            url,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          })
        }
      }

      // Save files to donor's account
      const existingFiles = JSON.parse(localStorage.getItem(`files_${uploadForm.donorEmail}`) || "[]")
      const updatedFiles = [...existingFiles, ...uploadedFiles]
      localStorage.setItem(`files_${uploadForm.donorEmail}`, JSON.stringify(updatedFiles))

      // Send email notification to donor
      const template = templates.find((t) => t.id === "default")
      if (template) {
        await fetch("/api/share-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: uploadedFiles,
            recipients: [uploadForm.donorEmail],
            message: template.content.replace("{fileCount}", uploadedFiles.length.toString()),
            senderEmail: "admin@cloudshare.com",
            subject: template.subject,
          }),
        })
      }

      // Reset form and reload data
      setUploadForm({ donorEmail: "", files: [] })
      loadAdminData()
      alert(`Berhasil mengupload ${uploadedFiles.length} foto untuk ${uploadForm.donorEmail}`)
    } catch (error) {
      console.error("Upload error:", error)
      alert("Gagal mengupload foto")
    }

    setIsUploading(false)
  }

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.content) return

    const newTemplate: EmailTemplate = {
      id: editingTemplate || Date.now().toString(),
      name: templateForm.name,
      subject: templateForm.subject,
      content: templateForm.content,
      createdAt: editingTemplate
        ? templates.find((t) => t.id === editingTemplate)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    }

    let updatedTemplates
    if (editingTemplate) {
      updatedTemplates = templates.map((t) => (t.id === editingTemplate ? newTemplate : t))
    } else {
      updatedTemplates = [...templates, newTemplate]
    }

    setTemplates(updatedTemplates)
    localStorage.setItem("email_templates", JSON.stringify(updatedTemplates))

    // Reset form
    setTemplateForm({ name: "", subject: "", content: "" })
    setEditingTemplate(null)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
    })
    setEditingTemplate(template.id)
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (templateId === "default") {
      alert("Template default tidak bisa dihapus")
      return
    }

    if (confirm("Yakin ingin menghapus template ini?")) {
      const updatedTemplates = templates.filter((t) => t.id !== templateId)
      setTemplates(updatedTemplates)
      localStorage.setItem("email_templates", JSON.stringify(updatedTemplates))
    }
  }

  const cancelEdit = () => {
    setTemplateForm({ name: "", subject: "", content: "" })
    setEditingTemplate(null)
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Pengguna terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total File</CardTitle>
              <Files className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">File terupload</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Berbagi</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShares}</div>
              <p className="text-xs text-muted-foreground">File dibagikan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.totalStorage)}</div>
              <p className="text-xs text-muted-foreground">Total penyimpanan</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload">Upload Foto Donator</TabsTrigger>
            <TabsTrigger value="templates">Template Email</TabsTrigger>
            <TabsTrigger value="users">Pengguna</TabsTrigger>
            <TabsTrigger value="files">File</TabsTrigger>
            <TabsTrigger value="shares">Aktivitas Berbagi</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Foto untuk Donator</CardTitle>
                <CardDescription>Upload foto dan kirim otomatis ke email donator</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDonorPhotoUpload} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="donorEmail">Email Donator</Label>
                    <Input
                      id="donorEmail"
                      type="email"
                      placeholder="donator@email.com"
                      value={uploadForm.donorEmail}
                      onChange={(e) => setUploadForm({ ...uploadForm, donorEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photos">Pilih Foto</Label>
                    <Input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setUploadForm({ ...uploadForm, files: Array.from(e.target.files || []) })}
                      required
                    />
                    {uploadForm.files.length > 0 && (
                      <p className="text-sm text-muted-foreground">{uploadForm.files.length} foto dipilih</p>
                    )}
                  </div>

                  <Button type="submit" disabled={isUploading} className="w-full">
                    {isUploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload & Kirim ke Donator
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Cara Kerja:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Masukkan email donator</li>
                    <li>2. Pilih foto-foto yang ingin diupload</li>
                    <li>3. Sistem akan mengupload foto dan menyimpannya ke akun donator</li>
                    <li>4. Email notifikasi otomatis dikirim ke donator</li>
                    <li>5. Donator bisa login dengan emailnya untuk melihat foto</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Form */}
              <Card>
                <CardHeader>
                  <CardTitle>{editingTemplate ? "Edit Template" : "Buat Template Baru"}</CardTitle>
                  <CardDescription>Buat atau edit template email untuk pengiriman foto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Nama Template</Label>
                    <Input
                      id="templateName"
                      placeholder="Contoh: Template Donasi"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateSubject">Subject Email</Label>
                    <Input
                      id="templateSubject"
                      placeholder="Contoh: NBD CHARITY - Foto Anda"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateContent">Isi Email</Label>
                    <Textarea
                      id="templateContent"
                      placeholder="Tulis isi email di sini..."
                      rows={8}
                      value={templateForm.content}
                      onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveTemplate} className="flex-1">
                      {editingTemplate ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Template
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Simpan Template
                        </>
                      )}
                    </Button>
                    {editingTemplate && (
                      <Button variant="outline" onClick={cancelEdit}>
                        Batal
                      </Button>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Tips:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Gunakan nama yang mudah diingat untuk template</li>
                      <li>• Subject yang jelas akan meningkatkan open rate</li>
                      <li>• Tulis pesan yang personal dan ramah</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Template List */}
              <Card>
                <CardHeader>
                  <CardTitle>Template Tersimpan</CardTitle>
                  <CardDescription>Daftar semua template email yang tersedia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div key={template.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground mb-1">Subject: {template.subject}</p>
                            <p className="text-xs text-muted-foreground">Dibuat: {formatDate(template.createdAt)}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            {template.id !== "default" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                          <p className="line-clamp-3">{template.content}</p>
                        </div>

                        {template.id === "default" && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Template Default
                          </Badge>
                        )}
                      </div>
                    ))}

                    {templates.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Belum ada template tersimpan</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Manajemen Pengguna</CardTitle>
                <CardDescription>Daftar semua pengguna dan aktivitas mereka</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{user.email}</h4>
                          <p className="text-sm text-muted-foreground">
                            {user.fileCount} file • {formatFileSize(user.totalSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{user.fileCount} file</Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {users.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">Belum ada pengguna terdaftar</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Manajemen File</CardTitle>
                <CardDescription>Semua file yang diupload pengguna</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <img
                          src={file.url || "/placeholder.svg"}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {file.owner} • {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {allFiles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">Belum ada file terupload</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shares Tab */}
          <TabsContent value="shares">
            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Berbagi</CardTitle>
                <CardDescription>Log semua aktivitas berbagi file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shares.map((share, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                          <Share2 className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-medium">{share.senderEmail}</h4>
                          <p className="text-sm text-muted-foreground">
                            Berbagi {share.fileCount} file ke {share.recipientEmails.length} penerima
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(share.sharedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{share.fileCount} file</Badge>
                        <Badge variant="secondary">{share.recipientEmails.length} penerima</Badge>
                      </div>
                    </div>
                  ))}

                  {shares.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">Belum ada aktivitas berbagi</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
