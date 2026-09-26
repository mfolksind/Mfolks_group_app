import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Variant } from '@/types/backend';
import { useAuth } from './AuthContext';

export interface CartItem {
  variant: Variant;
  quantity: number;
  unit: string;
}

interface CartTotals {
  subtotal: number;
  taxes: number;
  grandTotal: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (variant: Variant, quantity?: number, unit?: string) => { success: boolean; message: string };
  updateQuantity: (variantId: string, unit: string, quantity: number) => void;
  removeFromCart: (variantId: string, unit?: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getCartTotals: () => CartTotals;
  isLoading: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || user?._id;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from AsyncStorage whenever userId changes
  useEffect(() => {
    const loadCart = async () => {
      try {
        setIsLoading(true);
        if (!userId) {
          setCartItems([]);
          return;
        }
        const key = `@cart_items_${userId}`;
        const storedCart = await AsyncStorage.getItem(key);
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          if (Array.isArray(parsed)) {
            // Ensure each item has a fallback unit
            const itemsWithUnit = parsed.map((item: any) => ({
              ...item,
              unit: item.unit || item.variant?.unit || 'piece',
            }));
            setCartItems(itemsWithUnit);
          } else {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, [userId]);

  // Save cart to AsyncStorage whenever cartItems change
  const saveCart = async (items: CartItem[]) => {
    try {
      setCartItems(items);
      if (userId) {
        const key = `@cart_items_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(items));
      }
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  };

  const addToCart = (
    variant: Variant,
    quantityToAdd: number = 1,
    unit?: string
  ): { success: boolean; message: string } => {
    if (!variant || !variant._id) {
      return { success: false, message: 'Invalid product details' };
    }

    if (variant.stock <= 0) {
      return { success: false, message: 'Product is out of stock' };
    }

    const selectedUnit = unit || variant.unit || 'piece';
    const existingIndex = cartItems.findIndex(
      (item) => item.variant._id === variant._id && (item.unit || item.variant.unit || 'piece') === selectedUnit
    );

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
        unit: selectedUnit,
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
        unit: selectedUnit,
      });
    }

    saveCart(updatedItems);
    return { success: true, message: `Added ${quantityToAdd} ${selectedUnit} to cart successfully` };
  };

  const updateQuantity = (variantId: string, unit: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(variantId, unit);
      return;
    }

    const updatedItems = cartItems.map((item) => {
      const itemUnit = item.unit || item.variant.unit || 'piece';
      if (item.variant._id === variantId && itemUnit === unit) {
        const clampedQuantity = Math.min(newQuantity, item.variant.stock || 1);
        return { ...item, quantity: clampedQuantity };
      }
      return item;
    });

    saveCart(updatedItems);
  };

  const removeFromCart = (variantId: string, unit?: string) => {
    const updatedItems = cartItems.filter((item) => {
      if (item.variant._id !== variantId) return true;
      if (unit && (item.unit || item.variant.unit || 'piece') !== unit) return true;
      return false;
    });
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
      const selectedUnit = item.unit || item.variant.unit || 'piece';
      const matchedUnitPriceObj = item.variant.unitPrices?.find((p) => p.unit === selectedUnit);
      const unitPrice = matchedUnitPriceObj
        ? (matchedUnitPriceObj.discountPrice ?? matchedUnitPriceObj.price)
        : (item.variant.discountPrice ?? item.variant.price ?? 0);

      return sum + unitPrice * item.quantity;
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
