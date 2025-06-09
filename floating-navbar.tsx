"use client";

import React, { useState } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
  useScroll,
} from "framer-motion";
import SafeLink from "@/components/SafeLink";
import {
  Home,
  ShoppingBag,
  Brain,
  MessageCircle,
  ShoppingCart,
  Menu,
  X,
  Trash2,
  Minus,
  Plus,
  Tag,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

/* ────────────────────────────────────────────────────────── types ── */
export type NavbarProps = {
  onScrollToSection: (section: string) => void;
  onContactClick: () => void;
  onCartToggle: () => void;
  cartOpen: boolean;    // ← new
};

/* ────────────────────────────────────────────────── main component ─ */
export function FloatingNavbar({
  onScrollToSection,
  onContactClick,
  onCartToggle,
  cartOpen,             // ← new
}: NavbarProps) {
  const [active, setActive]         = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY }                 = useScroll();

  /* shrink / fade */
  const s       = useSpring(scrollY, { stiffness: 300, damping: 30 });
  const scale   = useTransform(s, [0, 100], [1, 0.9]);
  const opacity = useTransform(s, [0, 100], [1, 0.95]);
  const y       = useTransform(s, [0, 100], [24, 12]);

  const navItems = [
    { id: "home",       label: "Home",         icon: <Home        className="h-5 w-5" /> },
    { id: "categories", label: "Shop",         icon: <ShoppingBag className="h-5 w-5" /> },
    { id: "search",     label: "Smart Search", icon: <Brain       className="h-5 w-5" /> },
  ];

  const handleSelect = (id: string) => {
    setActive(id);
    setMobileOpen(false);
    onScrollToSection(id);
  };

  return (
    <>
      <motion.nav
        style={{ y, opacity, scale }}
        className="fixed inset-x-0 z-50 flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto w-max md:max-w-3xl px-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full blur-md bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20" />
            <div className="relative flex items-center justify-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-full bg-zinc-900/60 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,.2)]">
              {/* logo */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <SafeLink
                  href="/"
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default to use our custom navigation
                    setActive("home");
                    setMobileOpen(false);
                    onScrollToSection("home"); // Will be handled in parent component to navigate
                  }}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 opacity-80" />
                    <span className="relative text-white text-xl font-bold">G</span>
                  </div>
                  <span className="hidden md:block font-bold text-white">Glamora</span>
                </SafeLink>
              </motion.div>

              {/* desktop links */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((it) => (
                  <DesktopBtn
                    key={it.id}
                    {...it}
                    active={active === it.id}
                    onClick={() => handleSelect(it.id)}
                  />
                ))}
                <DesktopBtn
                  id="contact"
                  label="Contact"
                  icon={<MessageCircle className="h-5 w-5" />}
                  active={active === "contact"}
                  onClick={onContactClick}            // ← use prop
                />
              </div>

              {/* mobile icons */}
              <div className="flex md:hidden items-center gap-1">
                {navItems.map((it) => (
                  <MobileIcon
                    key={it.id}
                    {...it}
                    active={active === it.id}
                    onClick={() => handleSelect(it.id)}
                  />
                ))}
                <MobileIcon
                  id="contact"
                  icon={<MessageCircle className="h-5 w-5" />}
                  active={active === "contact"}
                  onClick={onContactClick}           // ← use prop
                />
              </div>

              {/* cart */}
              <CartBtn
                open={cartOpen}                     // ← controlled
                toggle={onCartToggle}               // ← controlled
              />

              {/* hamburger */}
              <motion.button
                className="md:hidden p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* slide-in menu */}
      <SlideMenu
        open={mobileOpen}
        items={navItems}
        onSelect={handleSelect}
        onContact={onContactClick}              // ← use prop
      />
    </>
  );
}

/* ──────────────────────────────────────────────────── export ── */
export default React.memo(FloatingNavbar);

/* ───── sub-components ──────────────────────────────── */

function DesktopBtn({ id, label, icon, active, onClick }: {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, boxShadow: "0 0 12px rgba(127,90,240,.5)" }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex items-center gap-1.5 px-4 py-2 rounded-full transition-colors",
        active
          ? "bg-zinc-800/80 text-white"
          : "text-zinc-300 hover:text-white hover:bg-zinc-800/50"
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {active && (
        <motion.div
          layoutId="indicator"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
        />
      )}
    </motion.button>
  );
}

function MobileIcon({ id, icon, active, onClick }: {
  id: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative w-10 h-10 flex items-center justify-center rounded-full transition-colors",
        active
          ? "bg-zinc-800/80 text-white"
          : "text-zinc-300 hover:text-white hover:bg-zinc-800/50"
      )}
    >
      {icon}
      {active && (
        <motion.div
          layoutId="mobileInd"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
        />
      )}
    </motion.button>
  );
}

function CartBtn({ open, toggle }: { open: boolean; toggle: () => void }) {
  const { items, itemCount, subtotal, discount, total, appliedCoupon, updateQuantity, removeFromCart, clearCart, removeCoupon } = useCart();
  
  return (
    <div className="relative ml-1 md:ml-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
      >
        <ShoppingCart className="h-5 w-5" />
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 mt-2 w-80 z-50 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl shadow-xl overflow-hidden"
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
            
            {items.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="p-4 border-b border-zinc-800/50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="truncate max-w-[140px]">{item.name}</span>
                          <span className="text-purple-400 text-sm">{item.price}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-400 hover:text-zinc-200 p-1 rounded-full hover:bg-zinc-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
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
            
            {/* Coupon section if applied */}
            {items.length > 0 && appliedCoupon && (
              <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-800/30">
                <div className="flex justify-between items-center">
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
                className="w-full py-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:hover:from-purple-600 disabled:hover:to-blue-600"
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

function SlideMenu({
  open,
  items,
  onSelect,
  onContact,
}: {
  open: boolean;
  items: { id: string; label: string; icon: React.ReactNode }[];
  onSelect: (id: string) => void;
  onContact: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 md:hidden bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full flex flex-col pt-24 px-6"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {items.map(it => (
              <motion.button
                key={it.id}
                onClick={() => onSelect(it.id)}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-left mb-3"
              >
                <div className="p-2 bg-zinc-700 rounded-lg">{it.icon}</div>
                <span className="font-medium">{it.label}</span>
              </motion.button>
            ))}
            <motion.button
              onClick={onContact}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-left"
            >
              <div className="p-2 bg-zinc-700 rounded-lg">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="font-medium">Contact</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold mb-4">Contact Us</h2>
            <p className="text-zinc-400 mb-6">This is a demo modal — put your real contact form here.</p>  
            <button
              onClick={onClose}
              className="w-full py-2 rounded-md bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


