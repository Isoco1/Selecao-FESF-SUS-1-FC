export type TipoUsuario = 'administrador' | 'profissional'
export type StatusPlantao = 'disponivel' | 'alocado' | 'cancelado'

export interface Especialidade {
  id: number
  nome: string
  descricao: string | null
}

export interface Setor {
  id: number
  nome: string
  descricao: string | null
  cor: string
}

export interface Usuario {
  id: number
  nome: string
  email: string
  tipo: TipoUsuario
  especialidade_id: number | null
  ativo: boolean
  criado_em: string
  especialidade: Especialidade | null
}

export interface Plantao {
  id: number
  data: string
  hora_inicio: string
  hora_fim: string
  setor_id: number
  profissional_id: number | null
  status: StatusPlantao
  observacoes: string | null
  criado_em: string
  atualizado_em: string
  setor: Setor | null
  profissional: Usuario | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  usuario: Usuario
}

export interface PlantaoCreate {
  data: string
  hora_inicio: string
  hora_fim: string
  setor_id: number
  profissional_id?: number | null
  observacoes?: string
}

export interface PlantaoUpdate {
  data?: string
  hora_inicio?: string
  hora_fim?: string
  setor_id?: number
  profissional_id?: number | null
  status?: StatusPlantao
  observacoes?: string
}
