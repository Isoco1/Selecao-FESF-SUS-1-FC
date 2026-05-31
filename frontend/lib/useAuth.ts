'use client'
import { useState, useEffect } from 'react'
import { obterUsuario, obterToken } from './auth'
import type { Usuario } from './types'

interface AuthState {
  usuario: Usuario | null
  isAdmin: boolean
  token: string | null
}

/**
 * Hook seguro para ler dados de autenticação do localStorage.
 *
 * Problema: `localStorage` não existe no servidor (SSR).
 * Solução: estado inicial `null` em ambos os lados; atualização apenas
 * no `useEffect` (roda só no cliente, pós-mount) → sem hydration mismatch.
 *
 * Fix 9: `mounted` removido — redundante com `usuario !== null`.
 * Resultado: apenas 1 re-render no mount (era 2).
 */
export function useAuth(): AuthState {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    setUsuario(obterUsuario())
  }, [])

  return {
    usuario,
    isAdmin: usuario?.tipo === 'administrador',
    // token exposto somente após hidratação (quando usuario já foi lido)
    token: usuario !== null ? obterToken() : null,
  }
}
