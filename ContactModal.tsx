/* ------------------------------------------------------------------ */
/* ContactModal.tsx                                                   */
/* ------------------------------------------------------------------ */
"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type Props = { open: boolean; onClose: () => void };

export default function ContactModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}               // click backdrop to close
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1,   y: 0 }}
            exit={{   scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
          >
            <div className="p-6">
              {/* header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Contact Us</h2>
                <button
                  className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* simple form */}
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Message sent! We'll get back to you soon.");
                  onClose();
                }}
              >
                <input
                  required
                  placeholder="Your name"
                  className="w-full p-2 rounded-md bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  required
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full p-2 rounded-md bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <textarea
                  required
                  placeholder="How can we help you?"
                  className="w-full h-32 resize-none p-2 rounded-md bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="w-full py-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  Send Message
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
