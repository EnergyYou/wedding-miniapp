import { get, post, put, del } from './request'

export interface Task {
  id: number
  coupleId: number
  timelineId: number | null
  title: string
  description: string | null
  assignee: number // 0-共同 1-新郎 2-新娘
  status: number   // 0-待办 1-进行中 2-已完成
  priority: number // 1-高 2-中 3-低
  deadline: string | null
  remindTime: string | null
  completeTime: string | null
  createTime: string
}

export interface TaskStats {
  total: number
  completed: number
  inProgress: number
  pending: number
}

export function getTaskList(timelineId?: number): Promise<Task[]> {
  const query = timelineId ? `?timelineId=${timelineId}` : ''
  return get<Task[]>(`/wx/task/list${query}`)
}

export function getTaskById(id: number): Promise<Task> {
  return get<Task>(`/wx/task/${id}`)
}

export function getTaskStats(): Promise<TaskStats> {
  return get<TaskStats>('/wx/task/stats')
}

export function createTask(data: {
  timelineId?: number
  title: string
  description?: string
  assignee?: number
  priority?: number
  deadline?: string
}): Promise<void> {
  return post('/wx/task', data)
}

export function updateTask(data: {
  id: number
  title?: string
  description?: string
  assignee?: number
  priority?: number
  deadline?: string
}): Promise<void> {
  return put('/wx/task', data)
}

export function updateTaskStatus(id: number, status: number): Promise<void> {
  return put(`/wx/task/${id}/status`, { status })
}

export function deleteTask(id: number): Promise<void> {
  return del(`/wx/task/${id}`)
}
