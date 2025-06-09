"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Copy, Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/CartContext"
import { toast } from "sonner"

type CouponProps = {
  percentage: string
  minAmount: string
  code: string
  color: string
}

const coupons: CouponProps[] = [
  {
    percentage: "15%",
    minAmount: "450",
    code: "15WW",
    color: "from-purple-600 to-blue-600",
  },
  {
    percentage: "12%",
    minAmount: "300",
    code: "12WW",
    color: "from-blue-600 to-cyan-600",
  },
  {
    percentage: "5%",
    minAmount: "150",
    code: "5WW",
    color: "from-pink-600 to-purple-600",
  },
]

export function DiscountCoupons() {
  return (
    <div className="mb-16">
      <div className="text-center mb-8">
       <h2 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="relative inline-block">
            <span className="relative z-10">Exclusive Offers</span>
            <span className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-r from-purple-600/80 to-blue-600/80 rounded-md"></span>
          </span>
        </h2>
        <p className="text-lg md:text-xl text-zinc-300">Use these codes at checkout to save on your purchase</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-center">
        {coupons.map((coupon) => (
          <CouponCard key={coupon.code} {...coupon} />
        ))}
      </div>
    </div>
  )
}

function CouponCard({ percentage, minAmount, code, color }: CouponProps) {
  const [copied, setCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { applyCoupon, appliedCoupon } = useCart()

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    
    // Also apply the coupon to the cart
    const applied = applyCoupon(code)
    if (applied) {
      toast.success(`Coupon ${code} applied to your cart!`)
    }
    
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Animated particles on hover */}
      {isHovered && (
        <>
          <motion.div
            className="absolute -top-2 -right-2 text-yellow-400"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -left-2 text-purple-400"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
        </>
      )}

      {/* Glow effect on hover */}
      <div
        className={cn(
          "absolute -inset-0.5 bg-gradient-to-r rounded-xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300",
          color,
        )}
      ></div>

      <div className="relative flex overflow-hidden rounded-xl">
        {/* Left side - Discount info */}
        <div className="bg-zinc-100 dark:bg-zinc-800/80 backdrop-blur-sm py-4 px-5 flex flex-col justify-center items-center">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-zinc-900 dark:text-white">+{percentage}</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-white ml-1">OFF</span>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">*on AED {minAmount}+</div>
        </div>

        {/* Right side - Code */}
        <motion.button
          onClick={handleCopy}
          className={`bg-black text-white py-4 px-5 flex flex-col justify-center items-center relative overflow-hidden ${
            appliedCoupon?.code === code ? "bg-gradient-to-r from-green-900/60 to-green-800/60" : ""
          }`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-xs uppercase mb-1">CODE:</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-wider">{code}</span>
            {copied ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                <Check className="h-4 w-4 text-green-400" />
              </motion.div>
            ) : appliedCoupon?.code === code ? (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Check className="h-4 w-4 text-green-400" />
              </motion.div>
            ) : (
              <Copy className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
            )}
          </div>

          {/* Copy tooltip */}
          <div
            className={`absolute -bottom-8 left-0 right-0 text-xs bg-zinc-800 text-white py-1 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {copied 
              ? "Copied!" 
              : appliedCoupon?.code === code 
                ? "Applied" 
                : "Click to copy & apply"
            }
          </div>

          {/* Shine effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
            <div className="absolute inset-0 translate-x-full group-hover:translate-x-[-250%] bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-[-20deg] transition-transform duration-1000"></div>
          </div>
        </motion.button>

        {/* Dotted line separator */}
        <div className="absolute top-0 bottom-0 left-[calc(50%-0.5px)] border-l border-dashed border-zinc-300 dark:border-zinc-600"></div>
      </div>
    </motion.div>
  )
}
