import { get, post, put, del } from './request'

export interface Vendor {
  id: number
  coupleId: number
  category: string
  name: string
  contact: string | null
  priceQuote: string | null
  score: number | null
  status: number // 0-备选 1-已签约 2-已排除
  remark: string | null
  createTime: string
}

export function getVendorList(category?: string): Promise<Vendor[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return get<Vendor[]>(`/wx/vendor/list${query}`)
}

export function getVendorById(id: number): Promise<Vendor> {
  return get<Vendor>(`/wx/vendor/${id}`)
}

export function getVendorCategories(): Promise<string[]> {
  return get<string[]>('/wx/vendor/categories')
}

export function createVendor(data: {
  category: string
  name: string
  contact?: string
  priceQuote?: string
  score?: number
  status?: number
  remark?: string
}): Promise<void> {
  return post('/wx/vendor', data)
}

export function updateVendor(data: {
  id: number
  category?: string
  name?: string
  contact?: string
  priceQuote?: string
  score?: number
  status?: number
  remark?: string
}): Promise<void> {
  return put('/wx/vendor', data)
}

export function deleteVendor(id: number): Promise<void> {
  return del(`/wx/vendor/${id}`)
}
