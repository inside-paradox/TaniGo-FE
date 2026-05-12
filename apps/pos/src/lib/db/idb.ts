import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Produk } from '@tanigo/types'
import type { CreateTransaksiDto } from '@/types/pos'

export interface OfflineQueueItem {
  id?: number
  payload: CreateTransaksiDto
  createdAt: string
  retries: number
}

interface TaniGoPOSDB extends DBSchema {
  products: {
    key: string
    value: Produk
    indexes: {
      'by-nama': string
      'by-sku': string
    }
  }
  offline_queue: {
    key: number
    value: OfflineQueueItem
    autoIncrement: true
  }
}

let dbInstance: IDBPDatabase<TaniGoPOSDB> | null = null

export async function getDB(): Promise<IDBPDatabase<TaniGoPOSDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<TaniGoPOSDB>('tanigo-pos', 1, {
    upgrade(db) {
      const productStore = db.createObjectStore('products', { keyPath: 'id' })
      productStore.createIndex('by-nama', 'nama')
      productStore.createIndex('by-sku', 'sku')

      db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true })
    },
  })

  return dbInstance
}

export async function cacheProducts(products: Produk[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('products', 'readwrite')
  await Promise.all(products.map((p) => tx.store.put(p)))
  await tx.done
}

export async function getCachedProducts(search = ''): Promise<Produk[]> {
  const db = await getDB()
  const all = await db.getAll('products')
  if (!search.trim()) return all

  const q = search.toLowerCase()
  return all.filter(
    (p) =>
      p.nama.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.kategori.toLowerCase().includes(q)
  )
}

export async function enqueueTransaction(payload: CreateTransaksiDto): Promise<number> {
  const db = await getDB()
  const id = await db.add('offline_queue', {
    payload,
    createdAt: new Date().toISOString(),
    retries: 0,
  })
  return id as number
}

export async function getQueue(): Promise<OfflineQueueItem[]> {
  const db = await getDB()
  return db.getAll('offline_queue')
}

export async function removeFromQueue(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('offline_queue', id)
}

export async function incrementRetry(id: number): Promise<void> {
  const db = await getDB()
  const item = await db.get('offline_queue', id)
  if (item) {
    await db.put('offline_queue', { ...item, retries: item.retries + 1 })
  }
}

export async function getQueueCount(): Promise<number> {
  const db = await getDB()
  return db.count('offline_queue')
}
