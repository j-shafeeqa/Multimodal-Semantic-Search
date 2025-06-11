"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Facebook,
  Twitter,
  Instagram,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  HelpCircle,
  MapPin,
  X,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function InteractiveFooter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  // Toggle mobile accordion sections
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  // Handle newsletter subscription
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim() !== "") {
      // Here you would typically send this to your API
      setSubscribed(true)
      setTimeout(() => {
        setSubscribed(false)
        setEmail("")
      }, 3000)
    }
  }

  // Handle location selection
  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location)
    setShowLocationModal(false)
  }

  return (
    <footer className="relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/80 pointer-events-none"></div>
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>

      {/* Social media bar */}
      <div className="relative z-10 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-6 gap-4">
            {[
              {
                icon: <Facebook className="h-5 w-5" />,
                color: "bg-[#1877F2]/10 hover:bg-[#1877F2]/20",
                label: "Facebook",
                href: "https://facebook.com"
              },
              { 
                icon: <Twitter className="h-5 w-5" />, 
                color: "bg-black/10 hover:bg-black/20", 
                label: "Twitter",
                href: "https://twitter.com"
              },
              {
                icon: <Instagram className="h-5 w-5" />,
                color: "bg-[#E4405F]/10 hover:bg-[#E4405F]/20",
                label: "Instagram",
                href: "https://instagram.com"
              },
            ].map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full transition-all",
                  "border border-zinc-800 backdrop-blur-sm",
                  social.color,
                )}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {social.icon}
                <span className="sr-only">{social.label}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="relative z-10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Newsletter subscription */}
            <div className="lg:col-span-2">
              <motion.div
                className="bg-zinc-900/40 backdrop-blur-md rounded-xl p-6 border border-zinc-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-xl font-bold mb-2">
                  <span className="relative inline-block">
                    <span className="relative z-10">Subscribe</span>
                    <span className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-r from-purple-600/80 to-blue-600/80 rounded-md"></span>
                  </span>{" "}
                  to our awesome emails
                </h3>
                <p className="text-zinc-400 mb-4">Get our latest offers and news straight in your inbox.</p>

                <form onSubmit={handleSubscribe} className="relative">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      className="bg-zinc-800/50 border-zinc-700 focus:border-purple-500 h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6"
                    >
                      Subscribe
                    </Button>
                  </div>

                  <AnimatePresence>
                    {subscribed && (
                      <motion.div
                        className="absolute -bottom-8 left-0 text-green-400 text-sm flex items-center gap-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Thanks! You're now subscribed.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>

              {/* App download section */}
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-xl font-bold mb-2">Download our apps</h3>
                <p className="text-zinc-400 mb-4">Shop our products and offers on-the-go.</p>

                <div className="flex flex-wrap gap-3">
                  {[
                    { name: "App Store", icon: "apple", href: "https://apps.apple.com" },
                    { name: "Google Play", icon: "google-play", href: "https://play.google.com" },
                    { name: "AppGallery", icon: "huawei", href: "https://appgallery.huawei.com" },
                  ].map((app, index) => (
                    <motion.a
                      key={app.name}
                      href={app.href}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 backdrop-blur-sm rounded-lg border border-zinc-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      {app.icon === "apple" && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.21 2.33-.91 3.57-.84 1.5.09 2.63.64 3.38 1.64-3.03 1.96-2.36 5.5.3 6.77-.8 1.91-1.95 3.85-3.33 5.6ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.26 2.01-1.76 4.07-3.74 4.25Z" />
                        </svg>
                      )}
                      {app.icon === "google-play" && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4.52 2.73c-.65.31-1.04.99-1.04 1.74v15.08c0 .75.39 1.42 1.04 1.74l.07.03 8.44-8.44v-.18l-8.44-8.44-.07.03Z" />
                          <path d="M17.01 10.27 14.51 7.77 4.52 17.76c.34.18.78.21 1.15.07l11.34-6.59Z" />
                          <path d="M17.01 10.27 5.67 3.68c-.37-.14-.81-.11-1.15.07l9.99 9.99 2.5-2.5Z" />
                          <path d="M4.52 17.76c.34.18.78.21 1.15.07l11.34-6.59-2.5-2.5-9.99 9.99Z" />
                        </svg>
                      )}
                      {app.icon === "huawei" && (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.67 7.53c.87-.25 1.73-.42 2.6-.55.87-.13 1.75-.2 2.63-.2.88 0 1.76.07 2.63.2.87.13 1.73.3 2.6.55.87.25 1.73.57 2.6.95.87.38 1.75.82 2.63 1.32-.88-.5-1.76-.94-2.63-1.32-.87-.38-1.73-.7-2.6-.95-.87-.25-1.75-.42-2.63-.55-.88-.13-1.75-.2-2.63-.2-.88 0-1.76.07-2.63.2-.87.13-1.73.3-2.6.55-.87.25-1.73.57-2.6.95-.87.38-1.75.82-2.63 1.32.88-.5 1.76-.94 2.63-1.32.87-.38 1.73-.7 2.6-.95Z" />
                          <path d="M12 4.04c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8Zm0 13.33c-2.94 0-5.33-2.39-5.33-5.33S9.06 6.71 12 6.71s5.33 2.39 5.33 5.33-2.39 5.33-5.33 5.33Z" />
                          <path d="M12 9.38c-1.47 0-2.67 1.2-2.67 2.67 0 1.47 1.2 2.67 2.67 2.67 1.47 0 2.67-1.2 2.67-2.67 0-1.47-1.2-2.67-2.67-2.67Z" />
                        </svg>
                      )}
                      <span>{app.name}</span>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Location selector */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-zinc-900/40 backdrop-blur-md rounded-xl p-6 border border-zinc-800 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-medium">Delivery Location</h3>
                </div>

                <p className="text-zinc-400 mb-4">Add your location to get accurate delivery times</p>

                <button
                  onClick={() => setShowLocationModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/70 hover:bg-zinc-700/70 rounded-lg border border-zinc-700 transition-colors"
                >
                  <span>{selectedLocation || "Select your area"}</span>
                  <ChevronDown className="h-5 w-5 text-zinc-400" />
                </button>
              </div>

              {/* Contact information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Phone className="h-5 w-5 text-purple-400" />,
                    title: "Talk to us",
                    content: "800-GLAMORA",
                    subtext: "(800-452-6672)",
                  },
                  {
                    icon: <HelpCircle className="h-5 w-5 text-blue-400" />,
                    title: "Help Centre",
                    content: "help.glamora.com",
                    subtext: "FAQs & Support",
                  },
                  {
                    icon: <Mail className="h-5 w-5 text-pink-400" />,
                    title: "Write to us",
                    content: "support@glamora.com",
                    subtext: "Customer Service",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="bg-zinc-900/40 backdrop-blur-sm rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-colors"
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.1)" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="p-2 bg-zinc-800/70 rounded-full mb-3">{item.icon}</div>
                      <h4 className="text-sm text-zinc-400 mb-1">{item.title}</h4>
                      <p className="font-medium">{item.content}</p>
                      <p className="text-xs text-zinc-500">{item.subtext}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Categories navigation */}

          {/* Additional links */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "About",
                links: [
                  { label: "Feedback", href: "/feedback" },
                  { label: "Careers", href: "/careers" },
                  { label: "Take a tour", href: "/tour" },
                  { label: "Affiliate program", href: "/affiliate" }
                ],
              },
              {
                title: "Help",
                links: [
                  { label: "Contact us", href: "/contact" },
                  { label: "Shipping", href: "/shipping" },
                  { label: "Return Process", href: "/returns" },
                  { label: "Return Policy", href: "/policy/returns" },
                  { label: "Help", href: "/help" }
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Terms & Conditions", href: "/terms" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Cookie Policy", href: "/cookie-policy" },
                  { label: "Accessibility", href: "/accessibility" }
                ],
              },
            ].map((section, index) => (
              <div key={index} className="space-y-4">
                {/* Desktop view */}
                <div className="hidden md:block">
                  <motion.h3
                    className="text-lg font-bold mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    {section.title}
                  </motion.h3>
                  <ul className="space-y-2">
                    {section.links.map((link, linkIndex) => (
                      <motion.li
                        key={linkIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 + linkIndex * 0.05 }}
                      >
                        <a href={link.href} className="text-zinc-400 hover:text-white hover:underline transition-colors">
                          {link.label}
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Mobile accordion */}
                <div className="md:hidden">
                  <button
                    className="flex items-center justify-between w-full py-2 border-b border-zinc-800"
                    onClick={() => toggleSection(section.title)}
                  >
                    <h3 className="text-lg font-bold">{section.title}</h3>
                    {expandedSection === section.title ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSection === section.title && (
                      <motion.ul
                        className="space-y-2 py-3"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {section.links.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <a href={link.href} className="text-zinc-400 hover:text-white hover:underline transition-colors">
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-zinc-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 opacity-80"></div>
                <span className="relative text-white font-bold text-xl">G</span>
              </div>
              <span className="font-bold text-xl">Glamora</span>
            </div>

            <div className="text-zinc-400 text-sm">© 2025 Glamora Fashion. All rights reserved.</div>

            <div className="flex items-center gap-4">
              <motion.button
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-full text-sm border border-zinc-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Globe className="h-4 w-4" />
                <span>English</span>
                <ChevronDown className="h-4 w-4" />
              </motion.button>

              <div className="flex gap-3">
                {[
                  { icon: <Facebook className="h-4 w-4" />, label: "Facebook", href: "https://facebook.com" },
                  { icon: <Twitter className="h-4 w-4" />, label: "Twitter", href: "https://twitter.com" },
                  { icon: <Instagram className="h-4 w-4" />, label: "Instagram", href: "https://instagram.com" },
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    className="text-zinc-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {social.icon}
                    <span className="sr-only">{social.label}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location modal */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Select your location</h2>
                  <button
                    className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
                    onClick={() => setShowLocationModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {[
                    "Abu Dhabi",
                    "Dubai",
                    "Sharjah",
                    "Umm Al Qaiwain",
                    "Fujairah",
                    "Ajman",
                    "Ras Al Khaimah"
                  ].map((location) => (
                    <button
                      key={location}
                      className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-between"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <span>{location}</span>
                      {selectedLocation === location && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-purple-500"
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <button
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-md text-white font-medium"
                    onClick={() => setShowLocationModal(false)}
                  >
                    Confirm Location
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  )
}
