import { Heart, Mail, ArrowRight, ImageIcon, Users, Globe } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FeatureCard } from "@/components/ui/feature-card"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/charity-background.jpeg')" }}
        />
        <div className="absolute inset-0 bg-black/60" /> {/* Black overlay with 60% opacity */}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-white">NBD CHARITY</h1>
            </div>
            <nav>
              <ul className="flex gap-6">
                <li>
                  <Link href="/app" className="text-white hover:text-primary transition-colors">
                    Application
                  </Link>
                </li>
                <li>
                  <a
                    href="https://t.me/nbdcharity"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-primary transition-colors"
                  >
                    Telegram
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 flex-1 flex flex-col">
          {/* Hero Section */}
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Nourris Un Orphelin</h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8">
                Rejoignez notre mission pour aider les orphelins et faire une différence dans leur vie. Ensemble, nous
                pouvons apporter espoir et soutien à ceux qui en ont le plus besoin.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/app">
                    <Mail className="h-5 w-5" />
                    Accéder à l'application
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                >
                  <a href="https://t.me/nbdcharity" target="_blank" rel="noopener noreferrer">
                    Rejoindre notre Telegram
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-16">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Notre Application</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={ImageIcon}
                title="Envoi d'Images"
                description="Envoyez facilement des images aux bénéficiaires et aux donateurs pour montrer l'impact de leurs contributions."
              />
              <FeatureCard
                icon={Users}
                title="Gestion des Contacts"
                description="Importez et gérez facilement vos contacts pour une communication efficace avec les donateurs et les bénéficiaires."
              />
              <FeatureCard
                icon={Globe}
                title="Impact Global"
                description="Contribuez à notre mission mondiale d'aide aux orphelins et faites une différence dans leur vie."
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="container mx-auto py-6 px-4 text-center text-white/70">
          <p>© 2025 NBD CHARITY - Zakat Al fitri</p>
        </footer>
      </div>
    </div>
  )
}
