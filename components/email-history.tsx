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
      } else {
        setHistory([]) // Ensure history is an empty array if nothing in localStorage
      }
    } catch (error) {
      console.error("Error loading email history:", error)
      setHistory([]) // Set to empty on error
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
        // Endpoint clean-blob sudah dihapus, jadi ini akan gagal.
        // Jika Anda ingin fungsionalitas ini kembali, kita perlu membuatnya lagi.
        // Untuk saat ini, ini akan menghasilkan error jika dipanggil.
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
          description: "Terjadi kesalahan saat menghubungi server atau endpoint tidak ditemukan.",
          variant: "destructive",
        })
      } finally {
        setIsCleaningBlob(false)
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6">
        <div>
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
            Riwayat Pengiriman Email
          </CardTitle>
          <CardDescription className="text-sm">
            Daftar semua email yang telah dikirim melalui aplikasi ini
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadHistory} className="text-xs bg-transparent">
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Refresh
          </Button>
          {/* Tombol clean Blob storage dinonaktifkan karena endpoint sudah dihapus */}
          <Button
            variant="outline"
            size="sm"
            onClick={cleanBlobStorage}
            disabled={true}
            className="text-xs bg-transparent"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Bersihkan Blob (Dinonaktifkan)</span>
            <span className="xs:hidden">Blob (Off)</span>
          </Button>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory} className="text-xs bg-transparent">
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Hapus Riwayat</span>
              <span className="xs:hidden">Hapus</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6">
        <ScrollArea className="h-[400px]">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px] sm:w-[100px] text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Penerima</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Kontak</TableHead>
                  <TableHead className="w-[80px] sm:w-[100px] text-xs sm:text-sm">Gambar</TableHead>
                  <TableHead className="w-[100px] sm:w-[150px] text-xs sm:text-sm">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.status === "success" ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 text-[10px] sm:text-xs">
                          <Check className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                          <span className="hidden xs:inline">Terkirim</span>
                          <span className="xs:hidden">✓</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 text-[10px] sm:text-xs">
                          <X className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                          <span className="hidden xs:inline">Gagal</span>
                          <span className="xs:hidden">✗</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                      {item.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                      {item.contactName && item.contactNumber ? (
                        <span>
                          #{item.contactNumber} - {item.contactName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.imageCount}</TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
