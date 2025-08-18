import { Cloud } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-lg sm:text-xl font-bold text-foreground">CloudShare</h1>
        </div>
      </div>
    </header>
  )
}
