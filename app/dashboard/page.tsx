"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { FileUploadZone } from "@/components/file-upload-zone"
import { ImageGallery } from "@/components/image-gallery"
import { UserInfo } from "@/components/user-info"

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const email = localStorage.getItem("userEmail")
    if (!email) {
      router.push("/")
      return
    }
    setUserEmail(email)
  }, [router])

  if (!userEmail) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <UserInfo email={userEmail} />
        </div>

        <div className="grid gap-4 sm:gap-8">
          <FileUploadZone />
          <ImageGallery />
        </div>
      </main>
    </div>
  )
}
