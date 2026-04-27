import { api } from '../lib/api'
import type { Type } from '../types'

export const typeService = {
  getList: () => api.get<Type[]>('/types.json'),
  get: (id: number | string) => api.get<Type>(`/types/${id}.json`),
  post: (type: Partial<Type>) => api.post<Type>('/types.json', { type }),
  put: (id: number | string, type: Partial<Type>) => api.patch<Type>(`/types/${id}.json`, { type }),
  destroy: (id: number | string) => api.delete<void>(`/types/${id}.json`),
}
