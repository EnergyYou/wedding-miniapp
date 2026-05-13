import { get, post, put, del } from './request'

export interface Budget {
  id: number
  coupleId: number
  category: string
  plannedAmount: string
  actualAmount: string
  remark: string | null
  createTime: string
}

export interface BudgetSummary {
  totalPlanned: string
  totalActual: string
  remaining: string
  percentage: string
}

export function getBudgetList(): Promise<Budget[]> {
  return get<Budget[]>('/wx/budget/list')
}

export function getBudgetSummary(): Promise<BudgetSummary> {
  return get<BudgetSummary>('/wx/budget/summary')
}

export function getBudgetById(id: number): Promise<Budget> {
  return get<Budget>(`/wx/budget/${id}`)
}

export function createBudget(data: {
  category: string
  plannedAmount: string
  actualAmount?: string
  remark?: string
}): Promise<void> {
  return post('/wx/budget', data)
}

export function updateBudget(data: {
  id: number
  category?: string
  plannedAmount?: string
  actualAmount?: string
  remark?: string
}): Promise<void> {
  return put('/wx/budget', data)
}

export function deleteBudget(id: number): Promise<void> {
  return del(`/wx/budget/${id}`)
}
