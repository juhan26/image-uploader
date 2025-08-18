import { Cloud } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-foreground">CloudShare</h1>
        </div>
      </div>
    </header>
  )
}
