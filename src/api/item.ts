import { get, post, put, del } from './request'

export interface Item {
  id: number
  coupleId: number
  category: string
  name: string
  quantity: number
  purchaseStatus: number // 0-未采购 1-采购中 2-已采购
  price: string | null
  remark: string | null
  assignee: number // 0-共同 1-新郎 2-新娘
  createTime: string
}

export interface ItemStats {
  total: number
  purchased: number
  inProgress: number
  pending: number
}

export function getItemList(category?: string): Promise<Item[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return get<Item[]>(`/wx/item/list${query}`)
}

export function getItemStats(): Promise<ItemStats> {
  return get<ItemStats>('/wx/item/stats')
}

export function getItemCategories(): Promise<string[]> {
  return get<string[]>('/wx/item/categories')
}

export function getItemById(id: number): Promise<Item> {
  return get<Item>(`/wx/item/${id}`)
}

export function createItem(data: {
  category: string
  name: string
  quantity?: number
  price?: string
  remark?: string
  assignee?: number
}): Promise<void> {
  return post('/wx/item', data)
}

export function updateItem(data: {
  id: number
  category?: string
  name?: string
  quantity?: number
  purchaseStatus?: number
  price?: string
  remark?: string
  assignee?: number
}): Promise<void> {
  return put('/wx/item', data)
}

export function deleteItem(id: number): Promise<void> {
  return del(`/wx/item/${id}`)
}
