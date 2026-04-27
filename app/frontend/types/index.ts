export interface OperationType {
  id: number
  name: string
  spending_roof?: number
  spending_limit?: Record<string, { year: number; month: number; amount: number }>
}

export interface OperationUser {
  id: number
  name: string
}

export interface Operation {
  id: number
  note: string
  sign: '+' | '-'
  amount: number
  type_id: number
  user_id: number
  date: string
  year: number
  month: number
  day: number
  type: OperationType
  user: OperationUser
  created_at: number
  updated_at: number
  url: string
}

export interface MaxEntry {
  year: number
  max: number
  id?: number
}

export interface CablePayload {
  method: 'create' | 'update' | 'destroy'
  message: Operation | Operation[]
  year: number
  max: number
}

export interface Type {
  id: number
  name: string
  description: string | null
  master_type_id: number | null
  spending_roof?: number
  spending_limit?: Record<string, { year: number; month: number; amount: number }>
  master_type: Type | null
  created_at: string
  updated_at: string
  url: string
}

export interface User {
  id: number
  name: string
  email: string
  blocked: boolean
  created_at: string
  updated_at: string
  url: string
}

export interface Withdrawal {
  id: number
  amount: number
  date: string
  note: string
  year: number
  month: number
  day: number
  user_id: number
  complete: boolean
  archive: boolean
  user: OperationUser
  created_at: string
  updated_at: string
  url: string
}
