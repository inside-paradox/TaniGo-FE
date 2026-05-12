export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export interface SelectOption {
  value: string
  label: string
}

export type SortOrder = 'asc' | 'desc'

export interface TableParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: SortOrder
}
