"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Loader2,
  ArrowLeft,
  Star,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Heart,
  Eye,
  HelpCircle,
  Sparkles,
  ArrowUpDown,
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
import FloatingNavbar from "@/components/floating-navbar";
import { ProductDisplay, Product } from "@/components/product-display";
import { CartProvider, useCart } from "@/context/CartContext";
import { InteractiveFooter } from "@/components/interactive-footer";
import ContactModal from "@/components/ContactModal";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ParticleBackground } from "@/components/particle-background";
import CartButton from "@/components/CartButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hits, setHits] = useState<Hit[]>([]);
  const [patchPreview, setPatchPreview] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(8); // Initial number of items to show
  const { addToCart } = useCart();
  const visibleImageRef = useRef<string | null>(null);
  const [expandedWhyId, setExpandedWhyId] = useState<number|null>(null);
  const [sortOption, setSortOption] = useState<string>("default"); // Add sort option state

  const [previewURL, setPreviewURL]       = useState<string | null>(null);

  // 👉 NEW – get everything from location.state
  const { state } = useLocation() as {
    state?: { query?: string; file?: File | null };
  };
  const query     = state?.query     ?? "";
  const imageFile = state?.file      ?? undefined;
  

useEffect(() => {
  if (imageFile) {
    const url = URL.createObjectURL(imageFile);
    setPreviewURL(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreviewURL(null);
    };
  }
}, [imageFile]);
  
 
  
  // Extract tags from the `why` field to match ProductDisplay
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
  
  // Utility function to enhance product explanations
  const enhanceProductExplanation = (product: Product): string => {
    const baseWhy = product.why || "";
    const productName = product.name.toLowerCase();
    const originalTags = product.tags || [];
    
    // Extract product-specific details
    const productWords = productName.split(' ');
    const productType = productWords[productWords.length - 1] || "item";
    const colorMatch = productName.match(/(black|white|blue|red|green|yellow|purple|pink|gray|grey|brown|navy|beige|ivory|golden|silver)/i);
    const color = colorMatch ? colorMatch[0] : "";
    const materialMatch = productName.match(/(leather|cotton|wool|nylon|polyester|silk|denim|canvas|suede|linen|velvet)/i);
    const material = materialMatch ? materialMatch[0] : "";
    const patternMatch = productName.match(/(striped|floral|plaid|checkered|dotted|printed|patterned|geometric)/i);
    const pattern = patternMatch ? patternMatch[0] : "";
    const styleMatch = productName.match(/(casual|formal|sport|elegant|classic|vintage|modern|minimalist|slim|oversized|fitted|relaxed)/i);
    const style = styleMatch ? styleMatch[0] : "";
    
    // Identify key attributes from the product
    const hasTrendingTag = originalTags.includes("trending");
    const hasNewTag = originalTags.includes("new");
    const hasEcoTag = originalTags.includes("eco");
    const rating = product.rating || 0;
    const highRating = rating >= 4.0;
    const numReviews = product.numReviews || 0;

    // Extract key terms from the original explanation
    const matchTerms: string[] = [];
    const matchRegex = /Matched:?\s*\*\*([^*]+)\*\*/i;
    const matchResult = baseWhy.match(matchRegex);
    
    if (matchResult && matchResult[1]) {
      matchTerms.push(...matchResult[1].split(' ').filter(t => t.length > 2));
    }
    
    // Helper for random selection from arrays
    const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    
    // Variety of opening phrases
    const openingPhrases = [
      `This ${style ? style + " " : ""}${color ? color + " " : ""}${material ? material + " " : ""}${productType} stands out because`,
      `We selected this ${pattern ? pattern + " " : ""}${color ? color + " " : ""}${productType} specifically because`,
      `This exceptional ${material ? material + " " : ""}${productType} was matched to your search because`,
      `Among our top recommendations, this ${style ? style + " " : ""}${productType} is particularly relevant because`,
      `This ${color ? color + " " : ""}${pattern ? pattern + " " : ""}${productType} caught our attention because`
    ];
    
    // Product-specific attributes to highlight
    let specificAttributes = [];
    if (color) specificAttributes.push(`its ${color} color`);
    if (material) specificAttributes.push(`${material} construction`);
    if (pattern) specificAttributes.push(`${pattern} design`);
    if (style) specificAttributes.push(`${style} style`);
    
    // Build an enhanced, multi-paragraph explanation
    let enhancedWhy = "";
    
    // First paragraph - product-specific match explanation
    if (matchTerms.length > 0) {
      // Use search-specific terms
      enhancedWhy += `${pickRandom(openingPhrases)} it perfectly matches your search for ${matchTerms.join(' ')}. `;
    } else {
      // Use product attributes when no specific search terms
      enhancedWhy += `${pickRandom(openingPhrases)} of its unique characteristics. `;
    }
    
    // Add product-specific attributes
    if (specificAttributes.length > 0) {
      enhancedWhy += `The ${specificAttributes.slice(0, 2).join(' and ')} ${specificAttributes.length > 1 ? 'make' : 'makes'} it a standout choice. `;
    }
    
    // Add information about visual similarities if image search was used
    if (imageFile) {
      const visualPhrases = [
        `The visual elements in this ${productType} align perfectly with the image you uploaded.`,
        `Its design features closely resemble the reference image you provided.`,
        `Our image analysis detected strong similarities between this ${productType} and your uploaded photo.`,
        `The aesthetic qualities of your reference image are well-represented in this product.`
      ];
      enhancedWhy += pickRandom(visualPhrases) + " ";
    }
    
    // Second paragraph - product-specific qualities
    enhancedWhy += `\n\n`;
    
    const qualityPhrases = [];
    
    if (hasTrendingTag) {
      const trendingOptions = [
        `This ${productType} is currently trending among fashion enthusiasts.`,
        `It's one of our most popular items this season.`,
        `Fashion-forward customers have been particularly drawn to this piece recently.`,
        `This design has gained significant popularity in recent weeks.`
      ];
      qualityPhrases.push(pickRandom(trendingOptions));
    }
    
    if (hasNewTag) {
      const newOptions = [
        `As a new arrival, it represents the latest in ${style || "contemporary"} design.`,
        `This ${productType} just arrived in our collection, offering you the freshest styles.`,
        `Being newly added to our inventory, you'll be among the first to showcase this design.`,
        `Fresh from our latest collection drop, this piece represents current fashion trends.`
      ];
      qualityPhrases.push(pickRandom(newOptions));
    }
    
    if (hasEcoTag) {
      const ecoOptions = [
        `Crafted with eco-friendly ${material || "materials"}, it's a sustainable choice.`,
        `The production process prioritizes environmental responsibility.`,
        `This product meets our highest standards for sustainable manufacturing.`,
        `Eco-conscious design principles make this an environmentally responsible purchase.`
      ];
      qualityPhrases.push(pickRandom(ecoOptions));
    }
    
    if (highRating && numReviews > 0) {
      const ratingOptions = [
        `With ${rating.toFixed(1)} stars from ${numReviews} reviews, customers consistently praise its quality.`,
        `It's earned an impressive ${rating.toFixed(1)}-star rating across ${numReviews} customer evaluations.`,
        `${numReviews} customers have given this ${productType} an average of ${rating.toFixed(1)} stars, highlighting its exceptional value.`,
        `Customer satisfaction is evident in its outstanding ${rating.toFixed(1)}-star rating from ${numReviews} reviews.`
      ];
      qualityPhrases.push(pickRandom(ratingOptions));
    }
    
    // Add the quality phrases
    if (qualityPhrases.length > 0) {
      enhancedWhy += qualityPhrases.join(' ');
    } else {
      // Generic quality statement as fallback
      enhancedWhy += `This ${productType} exemplifies quality craftsmanship and attention to detail that aligns with your preferences.`;
    }
    
    // Third paragraph - relevance to query
    enhancedWhy += `\n\n`;
    if (query) {
      const queryPhrases = [
        `Your search for "${query}" led us to this ${productType} because of its unique combination of features and attributes that match your criteria.`,
        `When you searched for "${query}", this stood out as an exceptional match due to its specific characteristics.`,
        `We particularly recommend this for your "${query}" search because it embodies the essence of what you're looking for.`,
        `Among the results for "${query}", this ${productType} offers a distinctive blend of quality and style that meets your search intent.`
      ];
      enhancedWhy += pickRandom(queryPhrases);
    } else {
      const visualPhrases = [
        `Based on the visual elements in your image search, we've identified this as an ideal match that captures the essence of your preferences.`,
        `The visual qualities in your reference image are what guided us to recommend this particular ${productType}.`,
        `Our image analysis detected key features in your uploaded photo that this ${productType} exemplifies beautifully.`,
        `The aesthetic qualities you're looking for, as shown in your uploaded image, are well-represented in this product.`
      ];
      enhancedWhy += pickRandom(visualPhrases);
    }
    
    return enhancedWhy;
  };
  
  // Function to analyze review quality in search query
  const analyzeReviewQuality = (searchQuery: string): { hasRatingFilter: boolean, wantsGoodRatings: boolean, minRating?: number, maxRating?: number } => {
    const queryLower = searchQuery.toLowerCase();
    
    // Check for good ratings indicators
    const goodRatingPatterns = [
      /good\s+reviews?/i,
      /well\s+rated/i,
      /high\s+ratings?/i,
      /top\s+rated/i,
      /best\s+reviewed/i,
      /high\s+quality/i,
      /(\d(?:\.\d)?)\+\s*stars?/i,  // "4+ stars", "3.5+ stars"
    ];
    
    // Check for bad ratings indicators
    const badRatingPatterns = [
      /bad\s+reviews?/i,
      /poor\s+ratings?/i,
      /low\s+ratings?/i,
      /negative\s+reviews?/i,
      /worst\s+ratings?/i,
      /poorly\s+reviewed/i,
      /low\s+quality/i,
      /under\s+(\d(?:\.\d)?)\s*stars?/i,  // "under 3 stars"
      /less\s+than\s+(\d(?:\.\d)?)\s*stars?/i,  // "less than 3 stars"
      /(\d(?:\.\d)?)\s*stars?\s+or\s+less/i,  // "3 stars or less"
      /below\s+(\d(?:\.\d)?)\s*stars?/i,  // "below 3 stars"
    ];
    
    // Check for good ratings
    const wantsGoodRatings = goodRatingPatterns.some(pattern => pattern.test(queryLower));
    
    // Check for bad ratings
    const wantsBadRatings = badRatingPatterns.some(pattern => pattern.test(queryLower));
    
    // Determine if we have any rating filter
    const hasRatingFilter = wantsGoodRatings || wantsBadRatings;
    
    let minRating: number | undefined;
    let maxRating: number | undefined;
    
    // Set rating thresholds
    if (wantsGoodRatings) {
      // Default minimum for "good reviews"
      minRating = 4.0;
      
      // Check for specific star ratings with "+"
      const starMatch = queryLower.match(/(\d(?:\.\d)?)\+\s*stars?/i);
      if (starMatch && starMatch[1]) {
        minRating = parseFloat(starMatch[1]);
      }
    }
    
    if (wantsBadRatings) {
      // Default maximum for "bad reviews"
      maxRating = 3.0;
      
      // Check for specific star ratings with "under", "less than", etc.
      const underMatch = queryLower.match(/under\s+(\d(?:\.\d)?)\s*stars?/i) ||
                         queryLower.match(/less\s+than\s+(\d(?:\.\d)?)\s*stars?/i) ||
                         queryLower.match(/below\s+(\d(?:\.\d)?)\s*stars?/i) ||
                         queryLower.match(/(\d(?:\.\d)?)\s*stars?\s+or\s+less/i);
      
      if (underMatch && underMatch[1]) {
        maxRating = parseFloat(underMatch[1]);
      }
    }
    
    return {
      hasRatingFilter,
      wantsGoodRatings: wantsGoodRatings && !wantsBadRatings, // Prioritize bad ratings if both are mentioned
      minRating,
      maxRating
    };
  };

  // Apply sorting to hits based on the selected sort option
  const sortHits = (hitsToSort: Hit[]): Hit[] => {
    const sorted = [...hitsToSort];
    
    switch (sortOption) {
      case "price-low-high":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high-low":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "rating-high-low":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "rating-low-high":
        return sorted.sort((a, b) => a.rating - b.rating);
      case "default":
      default:
        return sorted; // Keep the default order
    }
  };

  // Load search results when component mounts
  useEffect(() => {
    const fetchResults = async () => {
      // Redirect home if absolutely nothing was supplied
      if (!query && !imageFile) {
        navigate("/");
        return;
      }
  
      setLoading(true);
      console.log("search()", { query, hasFile: !!imageFile });
  
      try {
        // ← call your backend hook straight away
        const results = await search(query, imageFile, 100);
        
        // Apply rating filters if needed
        let filteredResults = [...results];
        const ratingFilter = analyzeReviewQuality(query);
        
        if (ratingFilter.hasRatingFilter) {
          // Apply appropriate filter based on rating quality desire
          if (ratingFilter.wantsGoodRatings && ratingFilter.minRating) {
            // Filter for good ratings (above minimum threshold)
            filteredResults = results.filter(product => 
              product.rating >= ratingFilter.minRating! && product.numReviews > 0
            );
            
            if (filteredResults.length < results.length) {
              // Sort by rating (highest first)
              filteredResults.sort((a, b) => b.rating - a.rating);
              toast.success(`Showing ${filteredResults.length} products with ${ratingFilter.minRating}+ star ratings`);
              setSortOption("rating-high-low"); // Set sort option for consistency
            }
          } else if (ratingFilter.maxRating) {
            // Filter for bad ratings (below maximum threshold)
            filteredResults = results.filter(product => 
              product.rating <= ratingFilter.maxRating! && product.numReviews > 0
            );
            
            if (filteredResults.length < results.length) {
              // Sort by rating (lowest first)
              filteredResults.sort((a, b) => a.rating - b.rating);
              toast.success(`Showing ${filteredResults.length} products with ratings below ${ratingFilter.maxRating} stars`);
              setSortOption("rating-low-high"); // Set sort option for consistency
            }
          }
        }
        
        setHits(filteredResults);
        setPatchPreview(filteredResults[0]?.patch ?? null);
      } catch (err) {
        console.error(err);
        toast.error("Search failed 😢");
      } finally {
        setLoading(false);
      }
    };
  
    fetchResults();
  }, [query, imageFile, navigate]);
  
  // Apply sorting when sort option changes
  useEffect(() => {
    if (hits.length > 0) {
      setHits(sortHits([...hits]));
    }
  }, [sortOption]);
  
  // Build products map for ProductDisplay component
  const productsMap: Record<string, Product[]> = {};
  if (hits.length > 0) {
    // Use query as the category name, or "Search Results" if no query
    const categoryName = query || "Search Results";
    console.log('SearchResultsPage - Hits before mapping:', hits);
    
    productsMap[categoryName] = hits.map((h) => {
      const product = {
        id: h.id,
        name: h.name,
        price: `${h.price?.toFixed(2) ?? "0.00"} AED`,
        image: h.image,
        tags: extractTags(h.why, h.rating),
        category: categoryName,
        popularity: h.rank,
        rating: h.rating,
        numReviews: h.numReviews,
        why: h.why,
      };
      console.log('SearchResultsPage - Mapped product:', product);
      return product;
    });

    // Apply the enhanced explanations after creating the map
    if (productsMap[categoryName]) {
      productsMap[categoryName] = productsMap[categoryName].map(product => {
        const enhancedProduct = {
          ...product,
          why: enhanceProductExplanation(product)
        };
        console.log('SearchResultsPage - Enhanced product:', enhancedProduct);
        return enhancedProduct;
      });
    }
  }
  
  console.log('SearchResultsPage - Final productsMap:', productsMap);
  
  // Go back to search page
  const handleBackToSearch = () => {
    navigate("/");
  };
  
  // Handle show more/less products
  const handleShowMore = () => {
    // Increase the display count by 8 more items
    setDisplayCount(Math.min(displayCount + 8, hits.length));
  };
  
  const handleShowLess = () => {
    // Reset to initial display count
    setDisplayCount(8);
  };
  
  // Log to debug
  useEffect(() => {
    console.log('SearchPage - Current expanded ID:', expandedWhyId);
  }, [expandedWhyId]);
  
  return (
    <CartProvider>
      <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white overflow-hidden relative">
        {/* Particle background */}
        <ParticleBackground />
        
        {/* Decorative blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        
        {/* Navbar */}
        <FloatingNavbar
          cartOpen={isCartOpen}
          onCartToggle={() => setIsCartOpen(o => !o)}
          onContactClick={() => setIsContactModalOpen(true)}
          onScrollToSection={(section) => {
            const el = document.getElementById(section);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
        
        {/* Content container */}
        <div className="container mx-auto px-4 py-28 relative z-10">
          {/* Back button */}
          <button 
            className="mb-6 flex items-center text-zinc-400 hover:text-purple-400 transition-colors bg-transparent border-none"
            onClick={handleBackToSearch}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </button>
          
          {/* Results heading */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">
              {query ? (
                <>
                  Results for{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10">"{query}"</span>
                    <span className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-r from-purple-600/80 to-blue-600/80 rounded-md"></span>
                  </span>
                </>
              ) : (
                "Image Search Results"
              )}
            </h1>
            
            {/* Sort options */}
            {hits.length > 0 && (
              <div className="flex items-center">
                
              </div>
            )}
          </div>
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="ml-3 text-lg">Searching for the perfect matches...</span>
            </div>
          )}
          
          {/* No results message */}
          {!loading && hits.length === 0 && (
            <div className="text-center py-20">
              <div className="text-xl">No results found</div>
              <p className="text-zinc-400 mt-2">Try a different search term or image</p>
              <Button 
                className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={handleBackToSearch}
              >
                Back to Search
              </Button>
            </div>
          )}

          
          
          {/* Patch preview if available - showing which part of the image was used for search */}
          {!loading && patchPreview && (
            <div className="mt-6 mb-10">
              <div className="max-w-md mx-auto">
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-5 border border-zinc-700 shadow-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.5 14L20.5 9M11 14C12.6569 14 14 12.6569 14 11C14 9.34315 12.6569 8 11 8C9.34315 8 8 9.34315 8 11C8 12.6569 9.34315 14 11 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 21L17.5 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 className="font-medium text-lg text-white">Image used for matching</h3>
                  </div>
                  
                  <p className="text-sm text-zinc-400 mb-4">
                   We use your photo together with any text you've entered to find the best matches. If you haven't added keywords, we match purely on the image.
                  </p>
                  
                  <div className="relative overflow-hidden rounded-lg border border-zinc-600 bg-black">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"></div>
                    <img
                      src={patchPreview}
                      alt="Image region used for matching"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                  
                  <div className="mt-3 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                    <p className="text-xs text-zinc-500">
                      Results are optimized based on the features in this image
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          
          
          {/* Product Display - with limited results */}
          {!loading && hits.length > 0 && (
            <div className="mt-6">
              {Object.entries(productsMap).map(([category, products]) => (
                <div key={category}>
                  
                  
                  {/* Explicitly showing the "Why this result?" section for search results */}
                  <ProductDisplay 
                    categoryName={category} 
                    products={{[category]: products}} 
                    showWhySection={true} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <InteractiveFooter />
        
        {/* Contact modal */}
        <ContactModal
          open={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      </main>
    </CartProvider>
  );
} 