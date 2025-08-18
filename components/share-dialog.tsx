"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Share2, Mail, Plus, X, Send } from "lucide-react"

interface StoredFile {
  name: string
  url: string
  size: number
  type: string
}

interface ShareDialogProps {
  files: StoredFile[]
  trigger?: React.ReactNode
}

export function ShareDialog({ files, trigger }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [emails, setEmails] = useState<string[]>([])
  const [currentEmail, setCurrentEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addEmail = () => {
    if (currentEmail && currentEmail.includes("@") && !emails.includes(currentEmail)) {
      setEmails([...emails, currentEmail])
      setCurrentEmail("")
      setError(null)
    }
  }

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addEmail()
    }
  }

  const handleShare = async () => {
    if (emails.length === 0) {
      setError("Tambahkan minimal satu alamat email")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const senderEmail = localStorage.getItem("userEmail")

      const response = await fetch("/api/share-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmails: emails,
          files,
          senderEmail,
          message: message.trim() || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Gagal membagikan file")
      }

      // Reset form and close dialog
      setEmails([])
      setCurrentEmail("")
      setMessage("")
      setIsOpen(false)

      // Show success message (in real app, use toast notification)
      alert(`File berhasil dibagikan ke ${emails.length} penerima!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Bagikan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Bagikan File via Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File preview */}
          <div>
            <Label className="text-sm font-medium">File yang akan dibagikan:</Label>
            <div className="mt-2 space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  <img
                    src={file.url || "/placeholder.svg"}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email input */}
          <div>
            <Label htmlFor="email-input">Alamat Email Penerima</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="email-input"
                type="email"
                placeholder="nama@contoh.com"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addEmail}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Email tags */}
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {emails.map((email, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <button type="button" onClick={() => removeEmail(email)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Pesan (Opsional)</Label>
            <Textarea
              id="message"
              placeholder="Tambahkan pesan untuk penerima..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleShare} disabled={isLoading || emails.length === 0} className="flex-1">
              {isLoading ? (
                "Mengirim..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
