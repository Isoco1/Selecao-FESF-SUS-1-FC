import { Usuario } from './types'

const TOKEN_KEY = 'hospital_token'
const USER_KEY = 'hospital_user'

export function salvarSessao(token: string, usuario: Usuario) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(usuario))
}

export function obterToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function obterUsuario(): Usuario | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function encerrarSessao() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAdmin(): boolean {
  return obterUsuario()?.tipo === 'administrador'
}
