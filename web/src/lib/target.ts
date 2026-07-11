import { apiFetch } from './api'

export function getTarget() {
  return apiFetch<{
    targetAt: string | null
    targetSetAt: string | null
    targetReason: string | null
  }>('/api/target')
}

export function setTarget(days: number, reason: string) {
  return apiFetch<{ targetAt: string; targetReason: string }>('/api/target', {
    method: 'POST',
    body: { days, reason: reason.trim() },
  })
}

export function deleteTarget() {
  return apiFetch<void>('/api/target', { method: 'DELETE' })
}