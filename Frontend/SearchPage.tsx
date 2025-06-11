"use client";

/* ----------------------------------------------------------------------
   src/pages/SearchPage.tsx – revamped UI + original backend logic
   ------------------------------------------------------------------- */
import React, { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Search as SearchIcon,
  ArrowRight,
  Search,
  Brain,
  Clock,
  Star,
  Camera,
  Info,
  Sparkles,
} from "lucide-react";
import { search } from "@/hooks/useSearch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ParticleBackground } from "@/components/particle-background";
import { FeatureHighlight } from "@/components/feature-highlight";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import {
  Shirt,
  Sparkles as SparklesIcon,
  Footprints,
  Layers,
  Scissors,
  ShoppingBag,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { HeroSlider } from "@/components/hero-slider";
import { DiscountCoupons } from "@/components/discount-coupons";
// NEW: import ProductDisplay and Product type
import { ProductDisplay, Product } from "@/components/product-display";
import FloatingNavbar from "@/components/floating-navbar";
import CartButton    from "@/components/CartButton";
import ContactModal  from "@/components/ContactModal";
import { CartProvider } from "@/context/CartContext";
import { InteractiveFooter } from "@/components/interactive-footer";
import { useNavigate } from "react-router-dom";

  
/* ------------------------------------------------------------------
   Types
   ------------------------------------------------------------------ */
export interface Hit {
  id: number;
  rank: number;
  name: string;
  image: string;
  rating: number;
  numReviews: number;
  price?: number;
  discount?: number;
  why: string;
  patch?: string | null;
}

/* ------------------------------------------------------------------
   Component
   ------------------------------------------------------------------ */
export default function SearchPage() {
  /* Search inputs & results */
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[]>([]);
  const [patchPreview, setPatchPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // put these two in the parent component that will show the UI
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCartOpen,       setIsCartOpen]          = useState(false);
  const navigate = useNavigate();

  /* Category selection */
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  

  /* ----------------------------------------------------------------
     Helper: extract tags from the `why` field to match ProductDisplay
     ---------------------------------------------------------------- */
  const extractTags = (why: string, rating?: number): string[] => {
    const tags: string[] = [];
    const text = why.toLowerCase();
    
    // Add trending tag for high-rated products (4 stars or higher)
    if (rating !== undefined && rating >= 4) {
      tags.push("trending");
    } else if (text.includes("trending")) {
      tags.push("trending");
    }
    
    if (text.includes("new")) tags.push("new");
    if (text.includes("eco")) tags.push("eco");
    return tags;
  };

  /* ----------------------------------------------------------------
     Build the Record<string,Product[]> map that ProductDisplay expects
     ---------------------------------------------------------------- */
  const productsMap: Record<string, Product[]> = {};
  if (selectedCategory) {
    productsMap[selectedCategory] = hits.map((h) => ({
      id:         h.id,
      name:       h.name,
      price:      `${h.price?.toFixed(2) ?? "0.00"} AED`,
      image:      h.image,
      tags:       extractTags(h.why, h.rating),
      category:   selectedCategory,
      // Optional: pass through rank as popularity
      popularity: h.rank,
      // Add rating and review count
      rating:     h.rating,
      numReviews: h.numReviews,
      // Add the required why field
      why:        h.why
      // dateAdded left undefined unless your backend provides it
    }));
  }

  /* -------------------------------------------------------------
     Input validation helper
     ------------------------------------------------------------- */
  const isValidSearchQuery = (text: string): boolean => {
    // Skip validation if empty (the existing check for empty will handle this)
    if (!text.trim()) return true;
    
    // Check if query is too short (but not empty)
    if (text.trim().length < 2) return false;
    
    // Check if query has too many special characters
    const specialCharsRatio = (text.match(/[^a-zA-Z0-9\s]/g)?.length || 0) / text.length;
    if (specialCharsRatio > 0.4) return false;
    
    // Check for keyboard mashing patterns (repeated characters)
    const repeatedCharsPattern = /(.)\1{3,}/;
    if (repeatedCharsPattern.test(text)) return false;
    
    return true;
  };

  /* -------------------------------------------------------------
     Search-submit handler
     ------------------------------------------------------------- */

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query && !file) {
      toast.error("Type something or drop an image first ✨");
      return;
    }
    
    // Validate the search query
    if (query && !isValidSearchQuery(query)) {
      toast.error("Please enter a valid search term ✨");
      return;
    }

    setLoading(true);

    try {
      // Pass both text and File directly via react-router state
      navigate("/search-results", {
        state: {
          query,
          file,    // this is your real File object (or null)
        },
      });
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed 😢");
      setLoading(false);
    }
  };
    
  

  /* -------------------------------------------------------------
     UI
     ------------------------------------------------------------- */
  return (
    <CartProvider>
      <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white overflow-hidden relative">
        
        {/* NEW: Navbar */}
        <FloatingNavbar
          cartOpen={isCartOpen}
          onCartToggle={() => setIsCartOpen(o => !o)}
          onContactClick={() => setIsContactModalOpen(true)}
          onScrollToSection={(section) => {
            const el = document.getElementById(section);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
        
        {/* Particle background */}
        <ParticleBackground />

        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Content container */}
        <div id="home" className="container mx-auto px-4 py-36 relative z-10">
          {/* Hero headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 leading-tight">
            Find What You{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Mean</span>
              <span className="absolute bottom-0 left-0 w-full h-full bg-purple-600 rounded-lg -rotate-1"></span>
            </span>
            . Not Just<br />
            What You{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Type</span>
              <span className="absolute bottom-0 left-0 w-full h-full bg-blue-600 rounded-lg rotate-1"></span>
            </span>
            .
          </h1>
          <section id="search">

          {/* Hero sub-headline */}
          <p className="text-lg md:text-xl text-zinc-300 text-center mb-12 max-w-3xl mx-auto">
            Revolutionize the way you shop with AI-powered semantic search that understands<br />
            your intent — whether you{" "}
            <span className="relative inline-block px-1">
              <span className="relative z-10">type it, describe it, or show it</span>
              <span className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-r from-purple-600/80 to-blue-600/80 rounded-md"></span>
            </span>.
          </p>

          {/* Search bar + uploader */}
          
          <form
            onSubmit={onSubmit}
            className="w-full max-w-3xl mx-auto bg-zinc-800/50 backdrop-blur-lg rounded-2xl p-4 border border-zinc-700 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="peer rounded-full text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 flex items-center gap-2 px-4 py-2 transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setFile(f);
                      setFileURL(f ? URL.createObjectURL(f) : null);
                    }}
                  />
                </Button>

                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-2 w-max max-w-xs px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity duration-200 z-20 text-xs text-zinc-300">
                  You can search with both image and text together. Upload an image and add descriptive text for better results.
                </div>
              </div>
              <span className="text-sm text-zinc-400 whitespace-nowrap">
                Search with image + text for better results
              </span>
            </div>

            {fileURL && (
              <div className="mt-2 mb-4 flex justify-center">
                <div className="relative">
                  <img
                    src={fileURL}
                    alt="Selected preview"
                    className="max-h-40 object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 text-zinc-300 hover:text-white"
                    onClick={() => {
                      setFile(null);
                      setFileURL(null);
                    }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  className="w-full bg-zinc-900 border-zinc-700 h-14 pl-12 pr-12 text-lg rounded-xl shadow-lg shadow-purple-500/10"
                  placeholder={fileURL ? "Add descriptive text..." : "Search for products..."}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSubmit(e)}
                  disabled={loading}
                />
                {query && (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-zinc-200"
                    onClick={() => setQuery("")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="h-14 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-medium transition duration-300"
              >
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            {/* Example search chips */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                { type: "both",  label: "similar floral dress", value: "similar floral dress", url: "/red-floral-dress.jpg" },
                { type: "both",  label: "white sneakers",           value: "white sneakers",           url: "/white-sneakers.jpg" },
                { type: "text",  label: "minimalist office outfit", value: "minimalist office outfit" },
                { type: "image", label: "blue denim jacket",        url: "/blue-denim-jacket.jpg" },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={async () => {
                    // 1) set query if there is one
                    if (s.value) {
                      setQuery(s.value);
                    }
                  
                    // 2) if we have an image URL, fetch + wrap it in a File
                    if (s.url) {
                      try {
                        const res  = await fetch(s.url);
                        const blob = await res.blob();
                  
                        const exampleFile = new File(
                          [blob],
                          `${s.label.replace(/\s+/g, "_")}.jpg`,
                          { type: blob.type }
                        );
                        setFile(exampleFile);
                        setFileURL(URL.createObjectURL(exampleFile));
                      } catch (err) {
                        console.error("Failed to load example image", err);
                        setFile(null);
                        setFileURL(null);
                      }
                    } else {
                      // 3) text-only: clear any leftover file
                      setFile(null);
                      setFileURL(null);
                    }
                  }}
                  
                  className="flex items-center gap-1 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-full text-sm transition"
                >
                  {s.type === "both" && <>
                    <SearchIcon className="h-4 w-4" />
                    <ImageIcon  className="h-4 w-4" />
                  </>}
                  {s.type === "text"  && <SearchIcon className="h-4 w-4" />}
                  {s.type === "image" && <ImageIcon className="h-4 w-4" />}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </form>
        </section>

          {/* Loader */}
          {loading && (
            <div className="mt-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {/* Feature highlights */}
          <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureHighlight icon={<Search className="h-6 w-6 text-purple-400" />} title="Multimodal search" description="Search with text + image input for precise results" />
            <FeatureHighlight icon={<Brain  className="h-6 w-6 text-blue-400"   />} title="Powered by CLIP Model" description="State-of-the-art AI model for understanding context" />
            <FeatureHighlight icon={<Clock  className="h-6 w-6 text-cyan-400"   />} title="Intuitive results" description="Context-aware search that adapts to your needs" />
          </div>

          {/* Additional feature chips */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="flex items-center gap-2 px-4 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-full text-sm transition">
              <Star className="h-4 w-4 text-yellow-400" /> Enhanced with ratings & reviews
            </button>
            <button className="flex items-center gap-2 px-4 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-full text-sm transition">
              <ImageIcon className="h-4 w-4 text-green-400" /> Visual search capabilities
            </button>
            <button className="flex items-center gap-2 px-4 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-full text-sm transition">
              <Brain className="h-4 w-4 text-purple-400" /> Future of fashion retail
            </button>
          </div>

          {/* NEW: Virtual Try-On Feature Promotion */}
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.7, delay: 0.3 }}
             className="max-w-6xl mx-auto mt-16 rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 shadow-xl shadow-purple-500/10"
           >
             {/* Header Bar */}
             <div className="w-full bg-gradient-to-r from-purple-900/40 via-zinc-900/30 to-blue-900/40 py-3 px-6 flex items-center justify-between border-b border-purple-500/20">
               <div className="flex items-center gap-3">
                 <motion.div 
                   className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-xl"
                   whileHover={{ scale: 1.05, rotate: 5 }}
                   transition={{ type: "spring", stiffness: 300 }}
                 >
                   <Camera className="h-5 w-5 text-white" />
                 </motion.div>
                 <div>
                   <motion.h3
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.5, duration: 0.5 }}
                     className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent"
                   >
                     Virtual Try-On Experience
                   </motion.h3>
                 </div>
               </div>
               <div className="rounded-full bg-pink-500 text-white text-xs font-bold px-3 py-1 shadow-lg">
                 EXCLUSIVE
               </div>
             </div>

             <div className="flex flex-col lg:flex-row">
               {/* Video showcase - now larger and more prominent */}
               <div className="lg:w-3/5 p-6 relative overflow-hidden flex items-center justify-center">
                 <motion.div 
                   className="absolute inset-0 opacity-30"
                   animate={{ 
                     background: ['radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.3) 0%, rgba(30, 64, 175, 0.1) 50%, rgba(0, 0, 0, 0) 70%)', 
                                'radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.3) 0%, rgba(30, 64, 175, 0.1) 50%, rgba(0, 0, 0, 0) 70%)']
                   }}
                   transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
                 />
                 
                 <div className="relative mx-auto flex flex-col items-center justify-center w-full">
                   <motion.div
                     className="relative z-10 rounded-xl border-2 border-purple-500/70 shadow-2xl shadow-purple-500/20 overflow-hidden aspect-video w-full max-w-[800px]"
                     whileHover={{ scale: 1.02 }}
                     transition={{ type: "spring", stiffness: 300, damping: 15 }}
                   >
                     {/* Improved video player */}
                     <div className="relative w-full h-full bg-black/40">
                       <video 
                         autoPlay 
                         loop 
                         muted 
                         playsInline
                         controls
                         className="w-full h-full object-cover"
                       >
                         <source src="/tryon-tab.mp4" type="video/mp4" />
                         Your browser does not support the video tag.
                       </video>
                       
                       {/* Subtle overlay for better text visibility when needed */}
                       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900/30 pointer-events-none"></div>
                       
                       {/* Video border light effect */}
                       <motion.div 
                         className="absolute inset-0 pointer-events-none"
                         animate={{ 
                           boxShadow: ['inset 0 0 15px rgba(139, 92, 246, 0.3)', 
                                      'inset 0 0 25px rgba(139, 92, 246, 0.5)', 
                                      'inset 0 0 15px rgba(139, 92, 246, 0.3)'] 
                         }}
                         transition={{ duration: 3, repeat: Infinity }}
                       />
                       
                       {/* Highlight glint */}
                       <motion.div 
                         className="absolute top-0 right-0 w-20 h-[400%] bg-white/10 -rotate-45"
                         animate={{ x: ['-400%', '400%'] }}
                         transition={{ duration: 5, repeat: Infinity, repeatDelay: 3 }}
                       />
                     </div>
                   </motion.div>
                   
                   {/* Video caption */}
                   <div className="mt-4 bg-zinc-800/70 backdrop-blur-sm rounded-lg p-3 border border-zinc-700/50 w-full max-w-[800px] mx-auto">
                     <div className="flex items-start gap-2">
                       <SparklesIcon className="h-4 w-4 mt-0.5 text-purple-400 flex-shrink-0" />
                       <p className="text-sm text-zinc-300">
                         <span className="text-purple-300 font-medium">See it in action: </span> 
                         Our cutting-edge AI technology lets you virtually "wear" any clothing item from our collection. No more uncertainty about how items will look on you!
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Right side - content */}
               <div className="lg:w-2/5 p-6 border-t lg:border-t-0 lg:border-l border-purple-500/20 relative">
                 <motion.div 
                   className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"
                   animate={{ scale: [1, 1.2, 1] }}
                   transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
                 />
                 
                 <div className="relative z-10">
                   {/* Enhanced description section */}
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.6, duration: 0.5 }}
                     className="bg-gradient-to-br from-purple-900/30 to-zinc-900/30 backdrop-blur-md rounded-xl p-5 border border-purple-500/20 shadow-lg shadow-purple-500/5 mb-6"
                   >
                     <div className="flex items-start">
                       <div className="mr-4 mt-1">
                         <motion.div
                           className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center"
                           animate={{ 
                             boxShadow: ['0 0 0px rgba(139, 92, 246, 0)', '0 0 15px rgba(139, 92, 246, 0.5)', '0 0 0px rgba(139, 92, 246, 0)']
                           }}
                           transition={{ duration: 2, repeat: Infinity }}
                         >
                           <Camera className="h-6 w-6 text-white" />
                         </motion.div>
                       </div>
                       <div>
                         <h4 className="text-xl font-medium text-white mb-2">Experience Virtual Fashion</h4>
                         <p className="text-zinc-300 text-base leading-relaxed">
                           Try before you buy with our <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-medium">AI-powered virtual fitting room</span>. 
                           See exactly how items look on you without the hassle of physical try-ons.
                         </p>
                       </div>
                     </div>
                   </motion.div>
                   
                   {/* Enhanced features title */}
                   <div className="mb-4 flex items-center">
                     <div className="h-px flex-grow bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0"></div>
                     <h4 className="mx-3 text-base font-medium text-white">Key Features</h4>
                     <div className="h-px flex-grow bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0"></div>
                   </div>
                   
                   {/* Enhanced feature list */}
                   <div className="space-y-4 mb-6">
                     {[
                       { 
                         icon: <SparklesIcon className="h-5 w-5 text-white" />, 
                         color: "from-purple-600 to-indigo-600",
                         title: "Virtual Wardrobe",
                         text: "Try on any clothing item using your own photo" 
                       },
                       { 
                         icon: <Clock className="h-5 w-5 text-white" />, 
                         color: "from-blue-600 to-cyan-600",
                         title: "Save Time",
                         text: "Accurate digital fittings in seconds, not minutes" 
                       },
                       { 
                         icon: <ShoppingBag className="h-5 w-5 text-white" />, 
                         color: "from-pink-600 to-rose-600",
                         title: "Members Only",
                         text: "Exclusive feature for our valued customers" 
                       }
                     ].map((item, i) => (
                       <motion.div
                         key={i}
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.8 + (i * 0.1), duration: 0.5 }}
                         whileHover={{ y: -5, transition: { duration: 0.2 } }}
                         className="group"
                       >
                         <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/60 backdrop-blur-sm rounded-xl border border-zinc-700/50 overflow-hidden transition-all duration-300 group-hover:border-purple-500/30 group-hover:shadow-lg group-hover:shadow-purple-500/10">
                           <div className={`h-1.5 w-full bg-gradient-to-r ${item.color}`}></div>
                           <div className="p-4 flex items-start gap-4">
                             <div className={`rounded-lg bg-gradient-to-br ${item.color} p-3 flex-shrink-0`}>
                               {item.icon}
                             </div>
                             <div>
                               <h5 className="font-medium text-white mb-1">{item.title}</h5>
                               <p className="text-sm text-zinc-300">{item.text}</p>
                             </div>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                   
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 1, duration: 0.5 }}
                     className="bg-gradient-to-br from-yellow-900/20 to-zinc-900/40 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/20 mb-6"
                   >
                     <div className="flex items-start gap-3">
                       <div className="rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-500/30 p-2 mt-0.5">
                         <Info className="h-5 w-5 text-yellow-400" />
                       </div>
                       <div>
                         <h4 className="text-base font-medium text-yellow-300 mb-1">How to use Virtual Try-On:</h4>
                         <p className="text-sm text-zinc-300">
                           Browse our collection, select any product, and click the <span className="text-white font-semibold bg-gradient-to-r from-pink-500 to-purple-500 px-2 py-0.5 rounded-full text-[11px] ml-0.5 mr-0.5">Try On</span> button to see how it looks on you!
                         </p>
                       </div>
                     </div>
                   </motion.div>
                   
                   <motion.div 
                     className="flex justify-center"
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: 1.1, duration: 0.5, type: "spring" }}
                   >
                     <motion.button
                       className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm px-8 py-4 rounded-xl shadow-lg shadow-purple-900/30 flex items-center gap-2 group w-full justify-center"
                       whileHover={{ scale: 1.03, y: -2 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => {
                         const categories = document.getElementById('categories');
                         if (categories) {
                           categories.scrollIntoView({ behavior: 'smooth' });
                           toast("Start browsing products to try on clothes virtually!", {
                             description: "Select any product and look for the Try-On button",
                             action: {
                               label: "Got it",
                               onClick: () => console.log("Toast acknowledged"),
                             },
                           });
                         }
                       }}
                     >
                       <span>Start browsing to try it now</span>
                       <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                       <motion.div 
                         className="absolute top-0 left-0 right-0 h-full w-12 bg-white/20 skew-x-[45deg]"
                         animate={{ x: ['-150%', '250%'] }}
                         transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                       />
                     </motion.button>
                   </motion.div>
                 </div>
               </div>
             </div>
           </motion.div>

          {/* Hero slider & discount coupons */}
          <HeroSlider />
          <DiscountCoupons />

          {/* Categories Section */}
          <div id="categories" className="mx-auto mt-12 mb-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-10 text-center">
              Shop by{" "}
              <span className="relative inline-block px-2">
                <span className="relative z-10">Category</span>
                <span className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-r from-purple-600/80 to-blue-600/80 rounded-md"></span>
              </span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: "T-shirts", icon: <Shirt        className="h-6 w-6 text-zinc-300 group-hover:text-purple-300 transition-colors duration-300" /> },
                { name: "Sneakers", icon:<Footprints   className="h-6 w-6 text-zinc-300 group-hover:text-purple-300 transition-colors duration-300" /> },
                { name: "Dresses",  icon: <img src="/icons/dress.svg"       alt="Dresses" className="h-6 w-6" /> },
                { name: "Jackets",  icon: <img src="/icons/jacket.svg"      alt="Jackets" className="h-6 w-6" /> },
                { name: "Pants",    icon: <img src="/icons/pants.svg"       alt="Pants"   className="h-6 w-6" /> },
                { name: "Bags",     icon: <ShoppingBag className="h-6 w-6 text-zinc-300 group-hover:text-purple-300 transition-colors duration-300" /> },
              ].map((category) => {
                const isSelected = selectedCategory === category.name;
                return (
                  <div
                    key={category.name}
                    onClick={async () => {
                      setSelectedCategory(category.name);
                      const res = await fetch(
                        `/api/products_by_category?category=${encodeURIComponent(category.name)}`
                      );
                      if (res.ok) {
                        const products: Hit[] = await res.json();
                        setHits(products);
                        setPatchPreview(null);
                      } else {
                        console.error("browse API failed:", res.status);
                      }
                    }}
                    className={`
                      group relative overflow-hidden rounded-xl border border-zinc-800
                      bg-zinc-900/30 backdrop-blur-sm transition-all duration-300
                      ${isSelected
                        ? "border-purple-500/50 shadow-lg shadow-purple-500/20"
                        : "hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
                      }
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 opacity-0 group-hover:from-purple-500/20 group-hover:to-blue-500/20 group-hover:opacity-100 transition-all duration-500" />
                    <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full">
                      <div className={`
                        p-3 rounded-full mb-3 transition-colors duration-300
                        ${isSelected ? "bg-purple-900/20" : "bg-zinc-800/50 group-hover:bg-purple-900/20"}
                      `}>
                        {React.cloneElement(category.icon, {
                          className: `
                            h-6 w-6
                            ${isSelected ? "text-purple-300" : "text-zinc-300 group-hover:text-purple-300"}
                            transition-colors duration-300
                          `.trim(),
                        })}
                      </div>
                      <span className={`
                        text-zinc-300 transition-colors duration-300
                        ${isSelected ? "text-white" : "group-hover:text-white"}
                      `}>
                        {category.name}
                      </span>
                      <div className={`
                        absolute bottom-4 left-1/2 -translate-x-1/2 h-0.5
                        bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300
                        ${isSelected ? "w-1/2" : "w-0 group-hover:w-1/2"}
                      `} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Patch preview */}
          {patchPreview && (
            <div className="mt-20 max-w-xs mx-auto">
              <Card className="bg-white/5 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-white">
                    Patch used for matching
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={patchPreview}
                    alt="patch"
                    className="w-full rounded-lg object-cover"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* NEW: product display */}
          <div className="mt-12">
            <ProductDisplay
              categoryName={selectedCategory}
              products={productsMap}
            />
          </div>
        </div>

{/* Interactive Footer */}
<InteractiveFooter />
        
         {/* ────────── CONTACT MODAL ────────── */}
         <ContactModal
          open={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      </main>
    </CartProvider>
  );
}



