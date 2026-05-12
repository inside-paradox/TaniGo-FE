'use client'

import { create } from 'zustand'
import type { ItemKeranjang, TransaksiTertahan } from '@/types/pos'

interface CartState {
  items: ItemKeranjang[]
  heldTransactions: TransaksiTertahan[]

  addItem: (item: Omit<ItemKeranjang, 'diskon' | 'subtotal'>) => void
  removeItem: (produkId: string) => void
  updateQty: (produkId: string, qty: number) => void
  updateDiskon: (produkId: string, diskon: number) => void
  clearCart: () => void

  subtotal: () => number
  totalDiskon: () => number
  total: () => number

  holdCart: (label?: string) => void
  resumeHeld: (id: string) => void
  deleteHeld: (id: string) => void
}

function calcSubtotal(item: ItemKeranjang): number {
  return item.hargaSatuan * item.qty - item.diskon
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  heldTransactions: [],

  addItem: (incoming) => {
    const { items } = get()
    const existing = items.find((i) => i.produkId === incoming.produkId)

    if (existing) {
      set({
        items: items.map((i) =>
          i.produkId === incoming.produkId
            ? { ...i, qty: i.qty + incoming.qty, subtotal: calcSubtotal({ ...i, qty: i.qty + incoming.qty }) }
            : i
        ),
      })
    } else {
      const newItem: ItemKeranjang = {
        ...incoming,
        diskon: 0,
        subtotal: incoming.hargaSatuan * incoming.qty,
      }
      set({ items: [...items, newItem] })
    }
  },

  removeItem: (produkId) => {
    set({ items: get().items.filter((i) => i.produkId !== produkId) })
  },

  updateQty: (produkId, qty) => {
    if (qty <= 0) {
      get().removeItem(produkId)
      return
    }
    set({
      items: get().items.map((i) =>
        i.produkId === produkId ? { ...i, qty, subtotal: calcSubtotal({ ...i, qty }) } : i
      ),
    })
  },

  updateDiskon: (produkId, diskon) => {
    set({
      items: get().items.map((i) =>
        i.produkId === produkId ? { ...i, diskon, subtotal: calcSubtotal({ ...i, diskon }) } : i
      ),
    })
  },

  clearCart: () => set({ items: [] }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.hargaSatuan * i.qty, 0),
  totalDiskon: () => get().items.reduce((sum, i) => sum + i.diskon, 0),
  total: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),

  holdCart: (label) => {
    const { items } = get()
    if (items.length === 0) return

    const held: TransaksiTertahan = {
      id: crypto.randomUUID(),
      label,
      items: [...items],
      createdAt: new Date().toISOString(),
    }

    set({ heldTransactions: [...get().heldTransactions, held], items: [] })
  },

  resumeHeld: (id) => {
    const { heldTransactions } = get()
    const held = heldTransactions.find((t) => t.id === id)
    if (!held) return

    set({
      items: held.items,
      heldTransactions: heldTransactions.filter((t) => t.id !== id),
    })
  },

  deleteHeld: (id) => {
    set({ heldTransactions: get().heldTransactions.filter((t) => t.id !== id) })
  },
}))
