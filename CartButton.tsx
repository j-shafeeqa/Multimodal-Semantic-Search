/* ------------------------------------------------------------------ */
/* CartButton.tsx                                                     */
/* ------------------------------------------------------------------ */
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Plus, Minus, Trash2, Tag, CheckCircle, XCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

type Props = { open: boolean; toggle: () => void };

export default function CartButton({ open, toggle }: Props) {
  const { items, itemCount, subtotal, discount, total, appliedCoupon, updateQuantity, removeFromCart, clearCart, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");

  const handleApplyCoupon = () => {
    if (couponCode.trim()) {
      applyCoupon(couponCode.trim());
      setCouponCode("");
    }
  };

  return (
    <div className="relative">
      {/* round cart icon */}
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300 hover:text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
      >
        <ShoppingCart className="h-5 w-5" />
        {/* Dynamic badge with actual cart count */}
        {itemCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs rounded-full text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-md shadow-purple-500/20"
          >
            {itemCount}
          </motion.span>
        )}
      </motion.button>

      {/* dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 mt-2 w-80 z-50 bg-zinc-900/95 border border-zinc-800 rounded-xl shadow-xl overflow-hidden backdrop-blur-md"
          >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-medium">Your Cart ({itemCount} items)</h3>
              {items.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearCart}
                  className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear</span>
                </motion.button>
              )}
            </div>

            {/* list of items - now dynamic from cart context */}
            {items.length > 0 ? (
              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/50">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[140px]">{item.name}</span>
                          <span className="text-purple-400 text-sm">{item.price}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-zinc-400 hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex justify-end items-center">
                      <div className="flex items-center border border-zinc-700 rounded-md">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-zinc-400 hover:text-white"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-zinc-400 hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400">
                Your cart is empty
              </div>
            )}
            
            {/* Coupon section */}
            {items.length > 0 && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-800/30">
                {appliedCoupon ? (
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {appliedCoupon.code} ({appliedCoupon.percentage}% off)
                        </span>
                        <span className="text-xs text-zinc-400">Min. purchase: {appliedCoupon.minAmount} AED</span>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim()}
                      className="px-2 py-1 bg-purple-600/60 hover:bg-purple-600/80 rounded text-xs text-white disabled:opacity-50 disabled:hover:bg-purple-600/60"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 border-t border-zinc-800 bg-zinc-800/50">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-400">Subtotal</span>
                  <span>{subtotal}</span>
                </div>
                
                {parseFloat(discount.split(' ')[0]) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-green-400">Discount</span>
                    <span className="text-green-400">-{discount}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-medium pt-2 border-t border-zinc-700">
                  <span>Total</span>
                  <span>{total}</span>
                </div>
              </div>
              
              <button 
                className="w-full py-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 text-white disabled:opacity-50"
                disabled={items.length === 0}
              >
                Checkout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
