import { get, post, put, del } from './request'

export interface Timeline {
  id: number
  coupleId: number
  stage: string
  title: string
  sortOrder: number
  createTime: string
}

export function getTimelineList(): Promise<Timeline[]> {
  return get<Timeline[]>('/wx/timeline/list')
}

export function getTimelineById(id: number): Promise<Timeline> {
  return get<Timeline>(`/wx/timeline/${id}`)
}

export function createTimeline(data: { stage: string; title: string; sortOrder?: number }): Promise<void> {
  return post('/wx/timeline', data)
}

export function updateTimeline(data: { id: number; stage?: string; title?: string; sortOrder?: number }): Promise<void> {
  return put('/wx/timeline', data)
}

export function deleteTimeline(id: number): Promise<void> {
  return del(`/wx/timeline/${id}`)
}
