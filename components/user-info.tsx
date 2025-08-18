"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserInfoProps {
  email: string
}

export function UserInfo({ email }: UserInfoProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("userEmail")
    router.push("/")
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Selamat datang!</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </CardContent>
    </Card>
  )
}
