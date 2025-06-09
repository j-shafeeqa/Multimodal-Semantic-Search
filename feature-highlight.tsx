"use client"

import { type ReactNode, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface FeatureHighlightProps {
  icon: ReactNode
  title: string
  description: string
}

export function FeatureHighlight({ icon, title, description }: FeatureHighlightProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={cn(
        "relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm transition-all duration-300",
        isHovered ? "shadow-lg shadow-purple-500/20" : "",
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl"
          layoutId="highlight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <div className="relative z-10">
        <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg w-fit">{icon}</div>

        <h3 className="text-lg font-medium mb-2">
          {/* Highlighted title */}
          <span className="relative inline-block">
            <span className="relative z-10">{title}</span>
            {isHovered && (
              <motion.span
                className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-r from-purple-600/80 to-blue-600/80 rounded-md"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.3 }}
              />
            )}
          </span>
        </h3>
        <p className="text-zinc-400">{description}</p>
      </div>
    </motion.div>
  )
}

