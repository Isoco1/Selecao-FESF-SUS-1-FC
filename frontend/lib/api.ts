import { obterToken } from './auth'
import type {
  TokenResponse, Usuario, Especialidade, Setor,
  Plantao, PlantaoCreate, PlantaoUpdate,
} from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = obterToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }))
    throw new Error(err.detail || 'Erro na requisição')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = (email: string, senha: string) =>
  req<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })

export const meuPerfil = () => req<Usuario>('/auth/me')

// ── Usuários ──────────────────────────────────────────────────────────────────

export const listarUsuarios = (tipo?: string) =>
  req<Usuario[]>(`/usuarios${tipo ? `?tipo=${tipo}` : ''}`)

export const criarUsuario = (data: {
  nome: string; email: string; senha: string; tipo: string; especialidade_id?: number | null
}) => req<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(data) })

export const atualizarUsuario = (id: number, data: Partial<Usuario & { senha?: string }>) =>
  req<Usuario>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

export const desativarUsuario = (id: number) =>
  req<void>(`/usuarios/${id}`, { method: 'DELETE' })

// ── Especialidades ────────────────────────────────────────────────────────────

export const listarEspecialidades = () => req<Especialidade[]>('/especialidades')

export const criarEspecialidade = (data: { nome: string; descricao?: string }) =>
  req<Especialidade>('/especialidades', { method: 'POST', body: JSON.stringify(data) })

// ── Setores ───────────────────────────────────────────────────────────────────

export const listarSetores = () => req<Setor[]>('/setores')

// ── Plantões ──────────────────────────────────────────────────────────────────

export const listarPlantoes = (params: {
  data?: string; profissional_id?: number; setor_id?: number; mes?: number; ano?: number
} = {}) => {
  const qs = new URLSearchParams()
  if (params.data) qs.set('data', params.data)
  if (params.profissional_id) qs.set('profissional_id', String(params.profissional_id))
  if (params.setor_id) qs.set('setor_id', String(params.setor_id))
  if (params.mes) qs.set('mes', String(params.mes))
  if (params.ano) qs.set('ano', String(params.ano))
  const query = qs.toString()
  return req<Plantao[]>(`/plantoes${query ? `?${query}` : ''}`)
}

export const criarPlantao = (data: PlantaoCreate) =>
  req<Plantao>('/plantoes', { method: 'POST', body: JSON.stringify(data) })

export const atualizarPlantao = (id: number, data: PlantaoUpdate) =>
  req<Plantao>(`/plantoes/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

export const deletarPlantao = (id: number) =>
  req<void>(`/plantoes/${id}`, { method: 'DELETE' })

// ── SWR fetcher ───────────────────────────────────────────────────────────────

export const fetcher = (url: string) => req<unknown>(url)
