import { api } from '../lib/api'
import type { Withdrawal } from '../types'

interface WithdrawalPayload {
  date: string
  user_id: number
  amount: number
  note?: string
  complete?: boolean
  archive?: boolean
}

export const withdrawalService = {
  getList: () => api.get<Withdrawal[]>('/withdrawals.json'),
  getAll: () => api.get<Withdrawal[]>('/withdrawals/all.json'),
  getArchive: () => api.get<Withdrawal[]>('/withdrawals/archive.json'),
  get: (id: number | string) => api.get<Withdrawal>(`/withdrawals/${id}.json`),
  post: (w: WithdrawalPayload) => api.post<Withdrawal>('/withdrawals.json', { withdrawal: w }),
  put: (id: number | string, w: WithdrawalPayload) =>
    api.patch<Withdrawal>(`/withdrawals/${id}.json`, { withdrawal: w }),
  destroy: (id: number | string) => api.delete<void>(`/withdrawals/${id}.json`),
}
