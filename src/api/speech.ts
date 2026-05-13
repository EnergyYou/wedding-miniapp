import { get, post, put, del } from './request'

export interface Speech {
  id: number
  coupleId: number
  category: string
  title: string
  content: string | null
  isTemplate: number // 0-自定义 1-系统模板
  createTime: string
}

export function getSpeechList(category?: string): Promise<Speech[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return get<Speech[]>(`/wx/speech/list${query}`)
}

export function getSpeechById(id: number): Promise<Speech> {
  return get<Speech>(`/wx/speech/${id}`)
}

export function getSpeechCategories(): Promise<string[]> {
  return get<string[]>('/wx/speech/categories')
}

export function getSpeechTemplates(): Promise<Speech[]> {
  return get<Speech[]>('/wx/speech/templates')
}

export function createSpeech(data: {
  category: string
  title: string
  content?: string
}): Promise<void> {
  return post('/wx/speech', data)
}

export function updateSpeech(data: {
  id: number
  category?: string
  title?: string
  content?: string
}): Promise<void> {
  return put('/wx/speech', data)
}

export function deleteSpeech(id: number): Promise<void> {
  return del(`/wx/speech/${id}`)
}
