import { get } from './request'

export interface Guide {
  id: number
  category: string
  title: string
  content: string
  coverImage: string | null
  sortOrder: number
  status: number
  createTime: string
}

export function getGuideList(category?: string): Promise<Guide[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return get<Guide[]>(`/wx/guide/list${query}`)
}

export function getGuideById(id: number): Promise<Guide> {
  return get<Guide>(`/wx/guide/${id}`)
}

export function getGuideCategories(): Promise<string[]> {
  return get<string[]>('/wx/guide/categories')
}
