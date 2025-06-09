"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    id: 1,
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/AdobeStock_255872685_Preview-F6ztlC0FsdeqfOaEmz2cHtYdusIgnd.jpeg",
    title: "Step Into the Future of Fashion",
    subtitle: "Discover styles matched to your vibe – powered by AI.",
    cta: "Shop Now",
    cta2: "Try Smart Search",
  },
  {
    id: 2,
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sam-szuchan-IkIO52cp0Ws-unsplash.jpg-3dab45safDrNjuJL0xrt06MM5Lwr58.jpeg",
    title: "Curated With Intelligence",
    subtitle: "Real-time results. Smart style matching. Only what matters.",
    cta: "Explore Collection",
    cta2: "Browse Picks",
  },
  {
    id: 3,
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/erwi-FaOqT78N2DE-unsplash.jpg-wJwCZWypZD6ISa9aj4FXdxrpXDr3Qn.jpeg",
    title: "Style Meets Intelligence",
    subtitle: "Shop confident. Discover fits you didn't even know you wanted.",
    cta: "Browse Styles",
    cta2: "Get Inspired",
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentSlide, isAutoPlaying])

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(true)

  return (
    <div
      className="relative mt-12 w-full h-[500px] md:h-[600px] overflow-hidden rounded-2xl mb-16"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Enhanced overlay with gradient for better text readability */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 z-10"
            style={{
              background: "linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)",
            }}
          ></div>

          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          ></div>

          {/* Content */}
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="container mx-auto px-8 md:px-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="max-w-xl relative"
              >
                {/* Semi-transparent backdrop for text */}
                <div className="absolute -left-6 -right-6 -top-6 -bottom-6 bg-black/30 backdrop-blur-sm rounded-xl z-0"></div>

                <div className="relative z-10 p-6">
                  {/* Text with shadow for better readability */}
                  <h2
                    className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    {slides[currentSlide].title}
                  </h2>
                  <p className="text-lg text-zinc-100 mb-8" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                    {slides[currentSlide].subtitle}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button className="group bg-white text-zinc-900 hover:bg-purple-600 hover:text-white transition-colors duration-300 shadow-lg">
                      {slides[currentSlide].cta}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button className="group bg-transparent border border-white text-white hover:bg-white/20 transition-colors duration-300 shadow-lg">
                      {slides[currentSlide].cta2}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/50 text-white hover:bg-purple-600 transition-colors duration-300"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/50 text-white hover:bg-purple-600 transition-colors duration-300"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSlide === index ? "bg-white w-8" : "bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

