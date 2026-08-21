import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Variant } from '@/types/backend';

export interface CartItem {
  variant: Variant;
  quantity: number;
}

interface CartTotals {
  subtotal: number;
  taxes: number;
  grandTotal: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (variant: Variant, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getCartTotals: () => CartTotals;
  isLoading: boolean;
}

const STORAGE_KEY = '@cart_items';
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from AsyncStorage on initial render
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever cartItems change
  const saveCart = async (items: CartItem[]) => {
    try {
      setCartItems(items);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  };

  const addToCart = (variant: Variant, quantityToAdd: number = 1): { success: boolean; message: string } => {
    if (!variant || !variant._id) {
      return { success: false, message: 'Invalid product details' };
    }

    if (variant.stock <= 0) {
      return { success: false, message: 'Product is out of stock' };
    }

    const existingIndex = cartItems.findIndex((item) => item.variant._id === variant._id);
    let updatedItems = [...cartItems];

    if (existingIndex > -1) {
      const currentQty = updatedItems[existingIndex].quantity;
      const newQty = currentQty + quantityToAdd;

      if (newQty > variant.stock) {
        return {
          success: false,
          message: `Cannot add more. Stock limit of ${variant.stock} reached.`,
        };
      }

      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: newQty,
      };
    } else {
      if (quantityToAdd > variant.stock) {
        return {
          success: false,
          message: `Cannot add ${quantityToAdd} items. Stock limit is ${variant.stock}.`,
        };
      }

      updatedItems.push({
        variant,
        quantity: quantityToAdd,
      });
    }

    saveCart(updatedItems);
    return { success: true, message: 'Added to cart successfully' };
  };

  const updateQuantity = (variantId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    const updatedItems = cartItems.map((item) => {
      if (item.variant._id === variantId) {
        const clampedQuantity = Math.min(newQuantity, item.variant.stock || 1);
        return { ...item, quantity: clampedQuantity };
      }
      return item;
    });

    saveCart(updatedItems);
  };

  const removeFromCart = (variantId: string) => {
    const updatedItems = cartItems.filter((item) => item.variant._id !== variantId);
    saveCart(updatedItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotals = (): CartTotals => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.variant.discountPrice || item.variant.price || 0;
      return sum + price * item.quantity;
    }, 0);

    const taxes = subtotal * 0.18; // 18% GST
    const grandTotal = subtotal + taxes;

    return {
      subtotal,
      taxes,
      grandTotal,
    };
  };

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getItemCount,
      getCartTotals,
      isLoading,
    }),
    [cartItems, isLoading],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
