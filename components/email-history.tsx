"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, Clock, RefreshCw, Mail, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"

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

export default function EmailHistory() {
  const [history, setHistory] = useState<EmailHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCleaningBlob, setIsCleaningBlob] = useState(false)
  const { toast } = useToast()

  // Load email history from localStorage
  const loadHistory = () => {
    setIsLoading(true)
    try {
      const savedHistory = localStorage.getItem("emailSendingHistory")
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as EmailHistoryItem[]
        // Sort by timestamp (newest first)
        parsedHistory.sort((a, b) => b.timestamp - a.timestamp)
        setHistory(parsedHistory)
      }
    } catch (error) {
      console.error("Error loading email history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load history on component mount
  useEffect(() => {
    loadHistory()
  }, [])

  // Clear history
  const clearHistory = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua riwayat pengiriman email?")) {
      localStorage.removeItem("emailSendingHistory")
      setHistory([])
    }
  }

  // Clean Blob storage
  const cleanBlobStorage = async () => {
    if (
      confirm(
        "Apakah Anda yakin ingin membersihkan semua file di Blob storage? Ini akan menghapus semua gambar yang telah diunggah.",
      )
    ) {
      setIsCleaningBlob(true)
      try {
        const response = await fetch("/api/clean-blob")
        const data = await response.json()

        if (data.success) {
          toast({
            title: "Blob storage dibersihkan",
            description: data.message,
          })
        } else {
          toast({
            title: "Gagal membersihkan Blob storage",
            description: data.error || "Terjadi kesalahan saat membersihkan Blob storage",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error cleaning Blob storage:", error)
        toast({
          title: "Gagal membersihkan Blob storage",
          description: "Terjadi kesalahan saat menghubungi server",
          variant: "destructive",
        })
      } finally {
        setIsCleaningBlob(false)
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Riwayat Pengiriman Email
          </CardTitle>
          <CardDescription>Daftar semua email yang telah dikirim melalui aplikasi ini</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={cleanBlobStorage} disabled={isCleaningBlob}>
            <Trash2 className="h-4 w-4 mr-2" />
            {isCleaningBlob ? "Membersihkan..." : "Bersihkan Blob"}
          </Button>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <X className="h-4 w-4 mr-2" />
              Hapus Riwayat
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Belum ada riwayat pengiriman email</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead className="w-[100px]">Jumlah Gambar</TableHead>
                  <TableHead className="w-[150px]">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.status === "success" ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          Terkirim
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          <X className="h-3 w-3 mr-1" />
                          Gagal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>
                      {item.contactName && item.contactNumber ? (
                        <span>
                          #{item.contactNumber} - {item.contactName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{item.imageCount} gambar</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
