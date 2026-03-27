import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/home/hero-section'
import { FeaturesSection } from '@/components/home/features-section'
import { TechSection } from '@/components/home/tech-section'
import { CTASection } from '@/components/home/cta-section'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col dark:bg-slate-950 bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <TechSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
