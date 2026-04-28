import { api } from '../lib/api'
import type { User } from '../types'

export const userService = {
  getList: () => api.get<User[]>('/users.json'),
  get: (id: number | string) => api.get<User>(`/users/${id}.json`),
  post: (user: Partial<User> & { password?: string; password_confirmation?: string }) =>
    api.post<User>('/users.json', { user }),
  put: (id: number | string, user: Partial<User> & { password?: string; password_confirmation?: string }) =>
    api.patch<User>(`/users/${id}.json`, { user }),
}
