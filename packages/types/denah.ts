// Floor-plan ("denah") types for the in-store layout. A denah belongs to one
// cabang (tipe 'toko') and is a free-position canvas of elements placed on a
// snap grid. The CRM edits it; the kiosk renders it read-only to guide
// customers to the rack where a product is stocked.

/** Kinds of element that can be placed on the floor plan. */
export type TipeElemen = 'rak' | 'pintu' | 'kasir' | 'dinding'

/** One element placed on the store floor plan. */
export interface ElemenDenah {
  id: string
  tipe: TipeElemen
  /** Short label drawn on the element, e.g. "A1", "Kasir", "Pintu Masuk". */
  kode: string
  /** Optional aisle grouping, informational only, e.g. "Lorong 1". */
  lorong?: string | null
  /** Grid position (in cells) of the top-left corner. */
  x: number
  y: number
  /** Size in grid cells. */
  w: number
  h: number
  /** Accent color key for racks (one of CATEGORY/elemen palette keys). */
  warna?: string | null
  /** Ids of products stocked on this element. Only meaningful for tipe 'rak'. */
  produkIds: string[]
}

/** The complete floor plan for one branch. */
export interface Denah {
  cabangId: string
  /** Grid size in cells. */
  kolom: number
  baris: number
  elemen: ElemenDenah[]
  updatedAt: string
}

/** Payload for replacing a branch's whole floor plan. */
export interface SaveDenahDto {
  kolom: number
  baris: number
  elemen: ElemenDenah[]
}
