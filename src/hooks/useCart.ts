import { useCartStore, CartItem } from '@/store/cart'
import { Product } from '@/lib/woocommerce'

export function useCart() {
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
  } = useCartStore()

  const addToCart = (product: Product, quantity = 1, variation?: CartItem['variation']) => {
    addItem(product, quantity, variation)
  }

  const removeFromCart = (productId: number, variationId?: number) => {
    removeItem(productId, variationId)
  }

  const updateItemQuantity = (productId: number, quantity: number, variationId?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variationId)
    } else {
      updateQuantity(productId, quantity, variationId)
    }
  }

  return {
    cart: items,
    addToCart,
    removeFromCart,
    updateQuantity: updateItemQuantity,
    clearCart,
    total: getTotal(),
    itemCount: getItemCount(),
  }
} 