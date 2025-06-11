"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronDown, SlidersHorizontal, Heart, ShoppingCart, Eye, ArrowUpDown, Check, ChevronUp, Star, HelpCircle, Sparkles, MessageCircle, ThumbsUp, Camera } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCart } from "@/context/CartContext"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"

// Product type definition
export type Product = {
  id: number
  name: string
  price: string
  image: string
  tags: string[]
  category: string
  dateAdded?: string // For "newest first" sorting
  popularity?: number // For "popularity" sorting
  rating?: number // Star rating
  numReviews?: number // Number of reviews
  why: string // Why this product is recommended
  reviews?: Review[] // Array of reviews
}

// Review type definition
export type Review = {
  id: number
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  date: string
  helpful: number
}

// Mock reviews generator
const generateMockReviews = (productId: number, numReviews: number = 0, rating: number = 0): Review[] => {
  if (!numReviews || numReviews <= 0) return [];
  
  const reviewCount = Math.min(numReviews, 5); // Limit to 5 reviews for performance
  const reviews: Review[] = [];
  
  const reviewTexts = [
    "Absolutely love it! The quality exceeded my expectations and it fits perfectly.",
    "Great product, but shipping took longer than expected. Overall satisfied with my purchase.",
    "Good value for the price. I would recommend to friends looking for something similar.",
    "Exactly what I was looking for. The colors are vibrant and true to the photos.",
    "It's okay, but not as good as I hoped. The material feels a bit cheaper than expected.",
    "Perfect fit and excellent quality! Will definitely buy from this brand again.",
    "Impressed with the attention to detail. It's clearly well-made and durable.",
    "Nice product but runs a bit small. Consider sizing up when ordering.",
    "The design is beautiful and I've received many compliments already!",
    "Comfortable and stylish - exactly what I needed for my wardrobe update."
  ];
  
  const names = [
    "Alex Johnson", "Jamie Smith", "Taylor Brown", "Jordan Lee", 
    "Casey Williams", "Morgan Davis", "Riley Wilson", "Avery Miller",
    "Quinn Thomas", "Cameron Martinez", "Jordan Parker", "Drew Anderson"
  ];
  
  // Calculate how many of each rating to generate based on the overall rating
  const distributedRatings = calculateRatingDistribution(reviewCount, rating);
  
  for (let i = 0; i < reviewCount; i++) {
    const reviewRating = distributedRatings[i];
    const today = new Date();
    const randomDaysAgo = Math.floor(Math.random() * 90) + 1; // Random date in last 90 days
    const date = new Date(today.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
    
    reviews.push({
      id: productId * 100 + i,
      userId: `user${Math.floor(Math.random() * 1000)}`,
      userName: names[Math.floor(Math.random() * names.length)],
      rating: reviewRating,
      comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
      date: date.toISOString().split('T')[0],
      helpful: Math.floor(Math.random() * 20)
    });
  }
  
  return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by newest
};

// Helper to calculate a distribution of ratings that averages to the given rating
const calculateRatingDistribution = (count: number, averageRating: number): number[] => {
  const result: number[] = [];
  let total = averageRating * count;
  
  // Start with whole number part of the rating for each review
  for (let i = 0; i < count; i++) {
    const baseRating = Math.floor(averageRating);
    result.push(baseRating);
    total -= baseRating;
  }
  
  // Distribute the remainder to some reviews to match the average
  let remaining = Math.round(total);
  for (let i = 0; i < remaining; i++) {
    if (result[i] < 5) {  // Cap at 5 stars
      result[i]++;
    }
  }
  
  // Shuffle the array for a more realistic distribution
  return result.sort(() => Math.random() - 0.5);
};

type ProductDisplayProps = {
  categoryName: string | null
  products: Record<string, Product[]>
  showWhySection?: boolean // Add prop to control visibility of "Why this result?" section
}

type SortOption = "featured" | "price-low-high" | "price-high-low" | "newest" | "popularity" | "rating-high-low" | "rating-low-high"

export function ProductDisplay({ categoryName, products, showWhySection = false }: ProductDisplayProps) {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<SortOption>("featured")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [visibleCount, setVisibleCount] = useState(8)
  const { addToCart } = useCart()
  const [expandedWhyId, setExpandedWhyId] = useState<number|null>(null)
  const [expandedReviewsId, setExpandedReviewsId] = useState<number|null>(null)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  // Log to debug
  useEffect(() => {
    console.log('Current expanded ID:', expandedWhyId);
  }, [expandedWhyId]);

  // Update filtered products when category, filters, or sort option changes
  useEffect(() => {
    if (!categoryName) {
      setFilteredProducts([])
      return
    }

    let result = [...(products[categoryName] || [])]

    // Apply tag filters
    if (activeFilters.length > 0) {
      result = result.filter((product) => product.tags.some((tag) => activeFilters.includes(tag)))
    }
    
    // Apply rating filter
    if (ratingFilter !== null) {
      result = result.filter((product) => {
        // Ensure product has rating data and is equal to or higher than the selected filter
        return product.rating !== undefined && product.rating >= ratingFilter && product.numReviews && product.numReviews > 0
      })
    }

    // Apply sorting
    result = sortProducts(result, sortOption)

    setFilteredProducts(result)
    setVisibleCount(8) // Reset visible count when products change
  }, [categoryName, activeFilters, sortOption, products, ratingFilter])

  // Sort products based on selected option
  const sortProducts = (productsToSort: Product[], option: SortOption): Product[] => {
    const productsCopy = [...productsToSort]

    switch (option) {
      case "price-low-high":
        return productsCopy.sort((a, b) => {
          const priceA = Number.parseFloat(a.price.replace(/[^0-9.]/g, ""))
          const priceB = Number.parseFloat(b.price.replace(/[^0-9.]/g, ""))
          return priceA - priceB
        })
      case "price-high-low":
        return productsCopy.sort((a, b) => {
          const priceA = Number.parseFloat(a.price.replace(/[^0-9.]/g, ""))
          const priceB = Number.parseFloat(b.price.replace(/[^0-9.]/g, ""))
          return priceB - priceA
        })
      case "newest":
        return productsCopy.sort((a, b) => {
          const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0
          const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0
          return dateB - dateA
        })
      case "popularity":
        return productsCopy.sort((a, b) => {
          const popA = a.popularity || 0
          const popB = b.popularity || 0
          return popB - popA
        })
      case "rating-high-low":
        return productsCopy.sort((a, b) => {
          const ratingA = a.rating || 0
          const ratingB = b.rating || 0
          return ratingB - ratingA
        })
      case "rating-low-high":
        return productsCopy.sort((a, b) => {
          const ratingA = a.rating || 0
          const ratingB = b.rating || 0
          return ratingA - ratingB
        })
      case "featured":
      default:
        return productsCopy
    }
  }

  // Toggle filter
  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]))
  }

  // Modify the toggleShowMore function
  const handleShowMore = () => {
    // Add 8 more products, but don't exceed the total
    setVisibleCount(prev => Math.min(prev + 8, filteredProducts.length))
  }
  
  // Handle show less
  const handleShowLess = () => {
    setVisibleCount(8)
    // Scroll back to top of product section
    const productSection = document.getElementById("product-section")
    if (productSection) {
      productSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Get display name for sort option
  const getSortDisplayName = (option: SortOption): string => {
    switch (option) {
      case "featured":
        return "Featured"
      case "price-low-high":
        return "Price: Low to High"
      case "price-high-low":
        return "Price: High to Low"
      case "newest":
        return "Newest First"
      case "popularity":
        return "Most Popular"
      case "rating-high-low":
        return "Rating: High to Low"
      case "rating-low-high":
        return "Rating: Low to High"
    }
  }

  // Handle virtual try-on
  const handleVirtualTryOn = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Add detailed debug logging
    console.log('ProductDisplay - handleVirtualTryOn called with product:', product);
    console.log('ProductDisplay - Product ID:', product.id);
    console.log('ProductDisplay - Product Name:', product.name);
    console.log('ProductDisplay - Product Image:', product.image);
    
    // Validate required fields
    if (!product.id || !product.name || !product.image) {
      console.error('ProductDisplay - Missing required fields:', {
        id: product.id,
        name: product.name,
        image: product.image
      });
      toast.error("Product information is incomplete");
      return;
    }
    
    // Ensure product has all required fields
    const productData = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      tags: product.tags || [],
      category: product.category,
      popularity: product.popularity,
      rating: product.rating,
      numReviews: product.numReviews,
      why: product.why || "No description available",
    };
    
    console.log('ProductDisplay - Constructed product data:', productData);
    
    try {
      // Navigate to virtual try-on page with product info and ID in URL
      console.log('ProductDisplay - Attempting navigation to:', `/virtual-try-on/${product.id}`);
      navigate(`/virtual-try-on/${product.id}`, { 
        state: { product: productData } 
      });
      
      // Show notification
      toast.success(`Starting virtual try-on for ${product.name}`, {
        description: "Getting your camera ready...",
        duration: 3000,
      });
    } catch (error) {
      console.error('ProductDisplay - Navigation error:', error);
      toast.error("Failed to start virtual try-on");
    }
  };

  if (!categoryName) return null

  return (
    <div
      id="product-section"
      className="mb-16 animate-fadeIn"
      style={{ animationDuration: "0.5s", animationFillMode: "both" }}
    >
      {/* Product section header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-zinc-900/50 backdrop-blur-sm p-4 rounded-xl border border-zinc-800">
        <div>
          <h3 className="text-xl font-bold mb-2 md:mb-0">
            <span className="relative inline-block">
              <span className="relative z-10">{categoryName}</span>
              <span className="absolute bottom-0 left-0 w-full h-1/3 bg-purple-600/50 rounded-md"></span>
            </span>
          </h3>
          <p className="text-sm text-zinc-400">{filteredProducts.length} products found</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {/* Filter tags */}
          <motion.button
            onClick={() => toggleFilter("trending")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition-colors ${
              activeFilters.includes("trending")
                ? "bg-purple-600/30 text-purple-200 border border-purple-500"
                : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            <AnimatePresence mode="wait">
              {activeFilters.includes("trending") ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              ) : null}
            </AnimatePresence>
            Trending
          </motion.button>

          <motion.button
            onClick={() => toggleFilter("new")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition-colors ${
              activeFilters.includes("new")
                ? "bg-blue-600/30 text-blue-200 border border-blue-500"
                : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            <AnimatePresence mode="wait">
              {activeFilters.includes("new") ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              ) : null}
            </AnimatePresence>
            New
          </motion.button>

          <motion.button
            onClick={() => toggleFilter("eco")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition-colors ${
              activeFilters.includes("eco")
                ? "bg-green-600/30 text-green-200 border border-green-500"
                : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            <AnimatePresence mode="wait">
              {activeFilters.includes("eco") ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              ) : null}
            </AnimatePresence>
            Eco-friendly
          </motion.button>
          
          {/* Rating filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition-colors ${
                  ratingFilter !== null
                    ? "bg-yellow-600/30 text-yellow-200 border border-yellow-500"
                    : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
                }`}
              >
                <Star className="h-3 w-3" fill={ratingFilter !== null ? "currentColor" : "none"} />
                <span>{ratingFilter !== null ? `${ratingFilter}+ Stars` : "Rating"}</span>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg shadow-xl">
              <DropdownMenuItem
                className={`text-xs cursor-pointer hover:bg-zinc-700 ${ratingFilter === null ? "bg-zinc-700" : ""}`}
                onClick={() => setRatingFilter(null)}
              >
                <div className="flex items-center">
                  <span className="mr-2">All Ratings</span>
                  {ratingFilter === null && <Check className="h-3 w-3" />}
                </div>
              </DropdownMenuItem>
              {[5, 4, 3, 2, 1].map((stars) => (
                <DropdownMenuItem
                  key={stars}
                  className={`text-xs cursor-pointer hover:bg-zinc-700 ${ratingFilter === stars ? "bg-zinc-700" : ""}`}
                  onClick={() => setRatingFilter(stars)}
                >
                  <div className="flex items-center">
                    <div className="flex mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-3 w-3 ${
                            star <= stars 
                              ? "text-yellow-400 fill-yellow-400" 
                              : "text-zinc-600"
                          }`} 
                        />
                      ))}
                    </div>
                    <span>& Up</span>
                    {ratingFilter === stars && <Check className="h-3 w-3 ml-2" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort dropdown (functional) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs text-zinc-300 flex items-center gap-1 transition-colors border border-zinc-700"
              >
                <ArrowUpDown className="h-3 w-3" />
                <span>{getSortDisplayName(sortOption)}</span>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg shadow-xl">
              <DropdownMenuItem
                className={`text-xs cursor-pointer hover:bg-zinc-700 ${sortOption === "featured" ? "bg-zinc-700" : ""}`}
                onClick={() => setSortOption("featured")}
              >
                Featured
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-xs cursor-pointer hover:bg-zinc-700 ${sortOption === "price-low-high" ? "bg-zinc-700" : ""}`}
                onClick={() => setSortOption("price-low-high")}
              >
                Price: Low to High
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-xs cursor-pointer hover:bg-zinc-700 ${sortOption === "price-high-low" ? "bg-zinc-700" : ""}`}
                onClick={() => setSortOption("price-high-low")}
              >
                Price: High to Low
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-xs cursor-pointer hover:bg-zinc-700 ${sortOption === "newest" ? "bg-zinc-700" : ""}`}
                onClick={() => setSortOption("newest")}
              >
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-xs cursor-pointer hover:bg-zinc-700 ${sortOption === "popularity" ? "bg-zinc-700" : ""}`}
                onClick={() => setSortOption("popularity")}
              >
                Most Popular
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-xs cursor-pointer hover:bg-zinc-700 ${sortOption === "rating-high-low" ? "bg-zinc-700" : ""}`}
                onClick={() => setSortOption("rating-high-low")}
              >
                Rating: High to Low
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`text-xs cursor-pointer hover:bg-zinc-700 ${sortOption === "rating-low-high" ? "bg-zinc-700" : ""}`}
                onClick={() => setSortOption("rating-low-high")}
              >
                Rating: Low to High
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More filters button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs text-zinc-300 flex items-center gap-1 transition-colors border border-zinc-700"
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Filters</span>
          </motion.button>
        </div>
      </div>

      {/* Product grid with staggered animation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredProducts.slice(0, visibleCount).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                type: "spring",
                stiffness: 100,
              }}
              whileHover={{
                y: -5,
                transition: { duration: 0.2 },
              }}
              className="group relative bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
            >
              {/* Glow effect on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300 -z-10"></div>

              {/* Product tags */}
              <div className="absolute top-2 left-2 z-20 flex gap-1">
                {product.tags.includes("trending") && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: index * 0.1 + 0.2 }}
                    className="px-2 py-0.5 bg-purple-600/80 text-white text-xs rounded-full flex items-center"
                  >
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
                      className="w-1.5 h-1.5 rounded-full bg-white mr-1"
                    ></motion.span>
                    Trending
                  </motion.span>
                )}
                {product.tags.includes("new") && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: index * 0.1 + 0.3 }}
                    className="px-2 py-0.5 bg-blue-600/80 text-white text-xs rounded-full"
                  >
                    New
                  </motion.span>
                )}
                {product.tags.includes("eco") && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: index * 0.1 + 0.4 }}
                    className="px-2 py-0.5 bg-green-600/80 text-white text-xs rounded-full"
                  >
                    Eco
                  </motion.span>
                )}
              </div>

              {/* Quick action buttons */}
              <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-full text-zinc-300 hover:text-white transition-colors"
                >
                  <Heart className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-zinc-800/80 hover:bg-zinc-700/80 rounded-full text-zinc-300 hover:text-white transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Product image */}
              <div className="relative h-66 overflow-hidden">
                {/* Try-On button in corner */}
                <div className="absolute bottom-3 right-3 z-20">
                  <motion.div
                    className="relative bg-gradient-to-br from-pink-600 to-purple-600 h-auto rounded-full flex items-center justify-center shadow-lg cursor-pointer overflow-hidden px-3 py-1.5"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleVirtualTryOn(product, e)}
                    animate={{
                      boxShadow: ["0 0 0px rgba(236, 72, 153, 0.3)", "0 0 20px rgba(236, 72, 153, 0.7)", "0 0 0px rgba(139, 92, 246, 0.3)"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop",
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-white mr-1.5" />
                    <span className="text-white text-xs font-bold mr-0.5">Try On</span>
                    <Camera className="h-3.5 w-3.5 text-white ml-1" />
                    <motion.div 
                      className="absolute top-0 left-0 right-0 h-full w-6 bg-white/20 skew-x-[45deg]"
                      animate={{ x: ['-150%', '250%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <motion.div
                      className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-pink-400/40 to-purple-500/40 blur-sm"
                      animate={{
                        opacity: [0.4, 0.7, 0.4]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "mirror"
                      }}
                    />
                  </motion.div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500 z-10"></div>
                <motion.img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.15 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 translate-x-full group-hover:translate-x-[-250%] bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-[-20deg] transition-transform duration-1500"></div>
                </div>
              </div>

              {/* Product info */}
              <div className="p-4">
                <h4 className="font-medium mb-2 group-hover:text-white transition-colors truncate">{product.name}</h4>
                
                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap items-center gap-2 max-w-[70%]">
                    <motion.span className="text-purple-400 font-medium" whileHover={{ scale: 1.05 }}>
                      {product.price}
                    </motion.span>
                    
                    {/* Star Rating */}
                    {product.rating !== undefined && (
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-3 w-3 ${
                                star <= Math.round(product.rating || 0) 
                                  ? "text-yellow-400 fill-yellow-400" 
                                  : "text-zinc-600"
                              }`} 
                            />
                          ))}
                        </div>
                        {product.numReviews !== undefined && (
                          <span className="text-xs text-zinc-400 ml-1">({product.numReviews})</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <motion.button
                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      addToCart(product)
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Enhanced "Why this result?" section - conditionally rendered */}
              {showWhySection && (
                <div className="px-4 pb-4">
                  <div className="flex justify-center">
                    <motion.button
                      className={`flex items-center justify-center text-sm font-medium rounded-lg py-2 px-4 w-full transition-all duration-300 ${
                        expandedWhyId === product.id 
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20" 
                          : "bg-zinc-800/70 hover:bg-zinc-700/70 text-purple-300 hover:text-white border border-zinc-700 hover:border-purple-500/50"
                      } group relative overflow-hidden`}
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        console.log('Clicked product ID:', product.id);
                        setExpandedWhyId(curr => curr === product.id ? null : product.id);
                        
                        // Generate mock reviews for this product if they don't exist yet
                        if (!product.reviews && product.numReviews && product.rating) {
                          product.reviews = generateMockReviews(product.id, product.numReviews, product.rating);
                        }
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-all duration-300"></div>
                      {expandedWhyId === product.id ? (
                        <motion.div 
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="mr-2"
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <HelpCircle className="h-4 w-4 mr-2" />
                      )}
                      <span className="relative z-10">
                        {expandedWhyId === product.id ? "Why we recommend this" : "Why this result?"}
                      </span>
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {expandedWhyId === product.id && (
                      <motion.div
                        className="mt-3 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50 relative overflow-hidden"
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                      >
                        {/* Decorative elements */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5"></div>
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-blue-500/0"></div>
                        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-purple-500/0"></div>
                        
                        <motion.div 
                          className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        
                        <motion.div 
                          className="absolute -bottom-10 -left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"
                          animate={{ scale: [1.2, 1, 1.2] }}
                          transition={{ duration: 4, repeat: Infinity }}
                        />
                        
                        <div className="relative z-10">
                          {/* Structured sections for the recommendation */}
                          <div className="space-y-6">
                            {/* Match Section */}
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="border-b border-zinc-700/30 pb-4"
                            >
                              <div className="flex items-start mb-3">
                                <Sparkles className="h-4 w-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                                <h4 className="text-sm font-medium text-purple-300">
                                  Perfect Match
                                </h4>
                              </div>
                              <div className="text-sm text-zinc-300 leading-relaxed">
                                {product.why.split('\n\n')[0]}
                              </div>
                            </motion.div>
                            
                            {/* Product Features Section */}
                            {product.why.split('\n\n')[1] && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="border-b border-zinc-700/30 pb-4"
                              >
                                <div className="flex items-start mb-3">
                                  <Star className="h-4 w-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                                  <h4 className="text-sm font-medium text-yellow-300">
                                    Product Features
                                  </h4>
                                </div>
                                <div className="text-sm text-zinc-300 leading-relaxed">
                                  {product.why.split('\n\n')[1]}
                                </div>
                              </motion.div>
                            )}
                            
                            {/* Ratings & Reviews Summary Section */}
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="border-b border-zinc-700/30 pb-4"
                            >
                              <div className="flex items-start mb-3">
                                <MessageCircle className="h-4 w-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                                <h4 className="text-sm font-medium text-blue-300">
                                  Ratings & Reviews Summary
                                </h4>
                              </div>
                              
                              {product.rating && product.numReviews ? (
                                <div>
                                  {/* Rating visualization */}
                                  <div className="flex items-center mb-3">
                                    <div className="flex mr-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                          key={star} 
                                          className={`h-4 w-4 ${
                                            star <= Math.round(product.rating || 0) 
                                              ? "text-yellow-400 fill-yellow-400" 
                                              : "text-zinc-600"
                                          }`} 
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-200">
                                      {product.rating?.toFixed(1) || "0.0"} 
                                      <span className="text-xs text-zinc-400 ml-1">
                                        out of 5
                                      </span>
                                    </span>
                                  </div>
                                  
                                  {/* Review distribution bars */}
                                  <div className="space-y-1.5 mb-3">
                                    {[5, 4, 3, 2, 1].map((num) => {
                                      const percent = product.rating ? 
                                        Math.round(100 * (product.rating >= num ? 0.9 : 
                                          (product.rating >= num-1 ? (product.rating - (num-1)) : 0))) : 0;
                                      
                                      return (
                                        <div key={num} className="flex items-center text-xs">
                                          <span className="w-10 text-zinc-400">{num} stars</span>
                                          <div className="ml-2 flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                            <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${percent}%` }}
                                              transition={{ duration: 0.8, delay: 0.3 + (5-num)*0.1 }}
                                              className={`h-full ${
                                                num >= 4 ? "bg-green-500" : 
                                                num >= 3 ? "bg-yellow-500" : "bg-red-500"
                                              }`}
                                            />
                                          </div>
                                          <span className="ml-2 w-10 text-right text-zinc-400">{percent}%</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* Review highlights */}
                                  {product.reviews && product.reviews.length > 0 && (
                                    <div className="mb-1">
                                      <p className="text-xs text-zinc-400 mb-2">Highlights from {product.numReviews} reviews:</p>
                                      <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30">
                                        <div className="flex items-center mb-1">
                                          <Avatar className="h-6 w-6 mr-2">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-600/30 to-indigo-600/30 text-xs">
                                              {product.reviews[0].userName.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex items-center">
                                            <span className="text-xs font-medium text-zinc-300 truncate max-w-[100px]">
                                              {product.reviews[0].userName}
                                            </span>
                                            <div className="flex ml-2">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <Star 
                                                  key={star} 
                                                  className={`h-2 w-2 ${
                                                    star <= product.reviews![0].rating
                                                      ? "text-yellow-400 fill-yellow-400" 
                                                      : "text-zinc-600"
                                                  }`} 
                                                />
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                        <p className="text-xs text-zinc-300 italic">"{product.reviews[0].comment}"</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-zinc-400">
                                  This product doesn't have any reviews yet.
                                </p>
                              )}
                            </motion.div>
                            
                            {/* Search Relevance Section */}
                            {product.why.split('\n\n')[2] && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                              >
                                <div className="flex items-start mb-3">
                                  <HelpCircle className="h-4 w-4 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                                  <h4 className="text-sm font-medium text-purple-300">
                                    Search Relevance
                                  </h4>
                                </div>
                                <div className="text-sm text-zinc-300 leading-relaxed">
                                  {product.why.split('\n\n')[2]}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Customer Reviews Section */}
              <div className="px-4 pb-4">
                <div className="flex justify-center">
                  <motion.button
                    className={`flex items-center justify-center text-sm font-medium rounded-lg py-2 px-4 w-full transition-all duration-300 ${
                      expandedReviewsId === product.id 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20" 
                        : "bg-zinc-800/70 hover:bg-zinc-700/70 text-blue-300 hover:text-white border border-zinc-700 hover:border-blue-500/50"
                    } group relative overflow-hidden`}
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      
                      // Generate mock reviews for this product if they don't exist yet
                      if (!product.reviews && product.numReviews && product.rating) {
                        product.reviews = generateMockReviews(product.id, product.numReviews, product.rating);
                      }
                      
                      setExpandedReviewsId(curr => curr === product.id ? null : product.id);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/10 group-hover:to-indigo-600/10 transition-all duration-300"></div>
                    {expandedReviewsId === product.id ? (
                      <motion.div 
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="mr-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    <span className="relative z-10">
                      {expandedReviewsId === product.id ? "Hide Reviews" : `Customer Reviews (${product.numReviews || 0})`}
                    </span>
                  </motion.button>
                </div>
                
                <AnimatePresence>
                  {expandedReviewsId === product.id && (
                    <motion.div
                      className="mt-3 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50 relative overflow-hidden"
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                    >
                      {/* Decorative elements */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5"></div>
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-indigo-500/0"></div>
                      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-blue-500/0"></div>
                      
                      <motion.div 
                        className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      
                      <motion.div 
                        className="absolute -bottom-10 -left-10 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"
                        animate={{ scale: [1.2, 1, 1.2] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      />
                      
                      <div className="relative z-10">
                        {/* Reviews header & summary */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="flex mr-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-4 w-4 ${
                                    star <= Math.round(product.rating || 0) 
                                      ? "text-yellow-400 fill-yellow-400" 
                                      : "text-zinc-600"
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-zinc-200">
                              {product.rating?.toFixed(1) || "0.0"} 
                              <span className="text-xs text-zinc-400 ml-1">
                                ({product.numReviews || 0} reviews)
                              </span>
                            </span>
                          </div>
                        </div>
                        
                        {/* Reviews List */}
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {product.reviews && product.reviews.length > 0 ? (
                            product.reviews.map((review) => (
                              <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-2 border border-zinc-700">
                                      <AvatarFallback className="bg-gradient-to-br from-blue-600/30 to-indigo-600/30 text-xs">
                                        {review.userName.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm text-zinc-200">{review.userName}</div>
                                      <div className="flex mt-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star 
                                            key={star} 
                                            className={`h-3 w-3 ${
                                              star <= review.rating
                                                ? "text-yellow-400 fill-yellow-400" 
                                                : "text-zinc-600"
                                            }`} 
                                          />
                                        ))}
                                        <span className="text-xs text-zinc-500 ml-2">
                                          {new Date(review.date).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300 mt-2">{review.comment}</p>
                                <div className="flex items-center mt-2 text-xs text-zinc-500">
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs flex items-center gap-1 text-zinc-400 hover:text-blue-400">
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>Helpful ({review.helpful})</span>
                                  </Button>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-zinc-500 text-sm">
                              No reviews yet for this product.
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show more/less buttons */}
      <div className="flex justify-center mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex gap-4"
        >
          {visibleCount < filteredProducts.length && (
            <Button
              variant="outline"
              className="
                border-2 border-purple-500/50
                bg-transparent
                text-white font-medium px-6 py-2 shadow-lg
                hover:bg-gradient-to-r hover:from-purple-600/40 hover:to-blue-600/40
                relative overflow-hidden group
              "
              onClick={handleShowMore}
            >
              <span className="relative z-10">
                Show more {categoryName}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/20 group-hover:to-blue-600/20 transition-all duration-300"></div>
            </Button>
          )}
          
          {visibleCount > 8 && (
            <Button
              variant="outline"
              className="
                border-2 border-purple-500/50
                bg-transparent
                text-white font-medium px-6 py-2 shadow-lg
                hover:bg-gradient-to-r hover:from-purple-600/40 hover:to-blue-600/40
                relative overflow-hidden group
              "
              onClick={handleShowLess}
            >
              <span className="relative z-10">
                Show less {categoryName}
              </span>
              <ChevronUp className="ml-2 h-4 w-4 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/20 group-hover:to-blue-600/20 transition-all duration-300"></div>
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
