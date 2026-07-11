// client/src/lib/auth.ts
import { apiFetch } from './api'

export interface User {
  id: string
  username: string
  email: string
  createdAt: string
}

export function signup(data: { username: string; email: string; password: string }) {
  return apiFetch<{ user: User }>('/api/auth/signup', {
    method: 'POST',
    body: data,
  })
}

export function signin(data: { identifier: string; password: string }) {
  return apiFetch<{ user: User }>('/api/auth/signin', {
    method: 'POST',
    body: data,
  })
}

export function getMe() {
  return apiFetch<{ user: User }>('/api/auth/me')
}

export function signout() {
  return apiFetch<void>('/api/auth/signout', { method: 'POST' })
}

export function signoutAll() {
  return apiFetch<void>('/api/auth/signout-all', { method: 'POST' })
}