"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageIcon, Share2, Download, Trash2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShareDialog } from "@/components/share-dialog"

interface StoredFile {
  name: string
  url: string
  size: number
  type: string
  uploadedAt?: string
}

export function ImageGallery() {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<StoredFile[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail")
    if (userEmail) {
      const storedFiles = JSON.parse(localStorage.getItem(`files_${userEmail}`) || "[]")
      setFiles(storedFiles)
    }
  }, [])

  const handleDownload = async (file: StoredFile) => {
    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleDelete = (fileToDelete: StoredFile) => {
    const userEmail = localStorage.getItem("userEmail")
    if (userEmail) {
      const updatedFiles = files.filter((file) => file.url !== fileToDelete.url)
      setFiles(updatedFiles)
      localStorage.setItem(`files_${userEmail}`, JSON.stringify(updatedFiles))
    }
  }

  const handleShare = async (file: StoredFile) => {
    try {
      await navigator.clipboard.writeText(file.url)
      alert("Link berhasil disalin ke clipboard!")
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const toggleFileSelection = (file: StoredFile) => {
    setSelectedFiles((prev) => {
      const isSelected = prev.some((f) => f.url === file.url)
      if (isSelected) {
        return prev.filter((f) => f.url !== file.url)
      } else {
        return [...prev, file]
      }
    })
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedFiles([])
  }

  const selectAllFiles = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles([...files])
    }
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Belum ada file</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Upload gambar pertama Anda untuk mulai membangun galeri
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Galeri Gambar ({files.length} file)
            </CardTitle>
            <div className="flex items-center gap-2">
              {isSelectionMode && (
                <>
                  <Button variant="outline" size="sm" onClick={selectAllFiles}>
                    {selectedFiles.length === files.length ? "Batal Pilih Semua" : "Pilih Semua"}
                  </Button>
                  {selectedFiles.length > 0 && (
                    <ShareDialog
                      files={selectedFiles}
                      trigger={
                        <Button size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Bagikan ({selectedFiles.length})
                        </Button>
                      }
                    />
                  )}
                </>
              )}
              <Button variant="outline" size="sm" onClick={toggleSelectionMode}>
                {isSelectionMode ? "Selesai" : "Pilih File"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <Card key={index} className="overflow-hidden relative">
                {isSelectionMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedFiles.some((f) => f.url === file.url)}
                      onCheckedChange={() => toggleFileSelection(file)}
                      className="bg-white/90 border-2"
                    />
                  </div>
                )}

                <div className="aspect-square relative bg-muted">
                  <img
                    src={file.url || "/placeholder.svg"}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {file.type.split("/")[1]?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <Eye className="h-3 w-3 mr-1" />
                            Lihat
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{file.name}</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <img
                              src={file.url || "/placeholder.svg"}
                              alt={file.name}
                              className="max-w-full max-h-[70vh] object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>

                      <ShareDialog
                        files={[file]}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Share2 className="h-3 w-3" />
                          </Button>
                        }
                      />

                      <Button variant="outline" size="sm" onClick={() => handleDownload(file)}>
                        <Download className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
