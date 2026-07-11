import { apiFetch } from './api'

export function getTarget() {
  return apiFetch<{ targetAt: string | null; targetSetAt: string | null }>('/api/target')
}

export function setTarget(days: number) {
  return apiFetch<{ targetAt: string }>('/api/target', {
    method: 'POST',
    body: { days },
  })
}

export function deleteTarget() {
  return apiFetch<void>('/api/target', { method: 'DELETE' })
}