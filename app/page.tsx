import { EmailAuthForm } from "@/components/email-auth-form"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Akses File Anda</h1>
            <p className="text-muted-foreground">Masukkan email Anda untuk melihat dan mengelola file</p>
          </div>
          <EmailAuthForm />
        </div>
      </main>
    </div>
  )
}
