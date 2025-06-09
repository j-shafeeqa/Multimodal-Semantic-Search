"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/components/product-display";

// Define the cart item type (extends Product with quantity)
export type CartItem = Product & {
  quantity: number;
};

// Define the cart context type
type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: string;
};

// Create the context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  subtotal: "0.00 AED",
});

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext);

// Cart provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);
  
  // Add product to cart
  const addToCart = (product: Product) => {
    setItems((prevItems) => {
      // Check if product already exists in cart
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        // Increment quantity if already in cart
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item with quantity 1
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };
  
  // Remove product from cart
  const removeFromCart = (productId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };
  
  // Update quantity of an item
  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((item) => item.id !== productId);
      }
      
      return prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };
  
  // Clear the entire cart
  const clearCart = () => {
    setItems([]);
  };
  
  // Calculate total item count
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  // Calculate subtotal
  const subtotalAmount = items.reduce((total, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
    return total + price * item.quantity;
  }, 0);
  
  const subtotal = `${subtotalAmount.toFixed(2)} AED`;
  
  // Context value
  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}