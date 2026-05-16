import { get } from './request'

export interface CollaborationStats {
  groomTotal: number
  groomCompleted: number
  brideTotal: number
  brideCompleted: number
  bothTotal: number
  bothCompleted: number
  recentCompletions: Array<{
    id: number
    title: string
    assignee: number
    completeTime: string
  }>
}

export function getCollaborationStats(): Promise<CollaborationStats> {
  return get<CollaborationStats>('/wx/task/collaboration')
}
