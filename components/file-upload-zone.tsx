"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, ImageIcon, X, CheckCircle } from "lucide-react"
import { put } from "@vercel/blob"

interface UploadedFile {
  name: string
  url: string
  size: number
  type: string
}

export function FileUploadZone() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const userEmail = localStorage.getItem("userEmail")
      if (!userEmail) {
        throw new Error("User email not found")
      }

      const uploadPromises = acceptedFiles.map(async (file, index) => {
        // Create a unique filename with user email prefix
        const filename = `${userEmail}/${Date.now()}-${file.name}`

        // Upload to Vercel Blob
        const blob = await put(filename, file, {
          access: "public",
        })

        // Update progress
        const progress = ((index + 1) / acceptedFiles.length) * 100
        setUploadProgress(progress)

        return {
          name: file.name,
          url: blob.url,
          size: file.size,
          type: file.type,
        }
      })

      const results = await Promise.all(uploadPromises)

      // Store uploaded files in localStorage (in real app, this would be in a database)
      const existingFiles = JSON.parse(localStorage.getItem(`files_${userEmail}`) || "[]")
      const updatedFiles = [...existingFiles, ...results]
      localStorage.setItem(`files_${userEmail}`, JSON.stringify(updatedFiles))

      setUploadedFiles(results)

      // Refresh the page to show new files in gallery
      window.location.reload()
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
              }
              ${uploading ? "pointer-events-none opacity-50" : ""}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>

              {uploading ? (
                <div className="w-full max-w-xs space-y-2">
                  <p className="text-sm font-medium">Mengupload file...</p>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}% selesai</p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {isDragActive ? "Lepaskan file di sini" : "Upload Gambar"}
                    </h3>
                    <p className="text-muted-foreground mb-4">Drag & drop gambar atau klik untuk memilih file</p>
                    <Button variant="outline">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Pilih Gambar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mendukung: JPEG, PNG, GIF, WebP (Maks. 10MB per file)</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              File Berhasil Diupload
            </h3>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeUploadedFile(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
