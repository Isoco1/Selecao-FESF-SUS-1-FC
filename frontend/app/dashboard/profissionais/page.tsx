'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obterToken } from '@/lib/auth'
import { useAuth } from '@/lib/useAuth'
import { listarUsuarios, criarUsuario, atualizarUsuario, desativarUsuario, listarEspecialidades } from '@/lib/api'
import Header from '@/components/Header'
import type { Usuario, Especialidade } from '@/lib/types'
import {
  Plus, Search, Edit2, Trash2, X, Loader2, Shield, User,
  Stethoscope, Mail, AlertTriangle, CheckCircle
} from 'lucide-react'
import clsx from 'clsx'

const TIPO_LABELS = {
  administrador: 'Administrador',
  profissional: 'Profissional',
}

interface DadosProfissional {
  nome: string
  email: string
  senha: string
  tipo: 'profissional' | 'administrador'
  especialidade_id: number | null
}

const FORM_VAZIO: DadosProfissional = {
  nome: '', email: '', senha: '', tipo: 'profissional', especialidade_id: null
}

export default function ProfissionaisPage() {
  const router = useRouter()
  const { isAdmin } = useAuth()   // ← seguro: lê localStorage pós-hidratação
  const admin = isAdmin

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState<DadosProfissional>(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [confirmarId, setConfirmarId] = useState<number | null>(null)

  useEffect(() => {
    if (!obterToken()) { router.replace('/login'); return }
    carregar()
  }, [router])

  async function carregar() {
    setCarregando(true)
    try {
      const [u, e] = await Promise.all([listarUsuarios(), listarEspecialidades()])
      setUsuarios(u)
      setEspecialidades(e)
    } catch (e) {
      console.error(e)
    } finally {
      setCarregando(false)
    }
  }

  function abrirCriar() {
    setEditando(null)
    setForm({ ...FORM_VAZIO })
    setErro('')
    setModalAberto(true)
  }

  function abrirEditar(u: Usuario) {
    setEditando(u)
    setForm({
      nome: u.nome,
      email: u.email,
      senha: '',
      tipo: u.tipo,
      especialidade_id: u.especialidade_id,
    })
    setErro('')
    setModalAberto(true)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      if (editando) {
        await atualizarUsuario(editando.id, {
          nome: form.nome,
          email: form.email,
          tipo: form.tipo,
          especialidade_id: form.especialidade_id,
        })
        setSucesso('Profissional atualizado com sucesso!')
      } else {
        await criarUsuario({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          tipo: form.tipo,
          especialidade_id: form.especialidade_id,
        })
        setSucesso('Profissional cadastrado com sucesso!')
      }
      await carregar()
      setModalAberto(false)
      setTimeout(() => setSucesso(''), 4000)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleDesativar(id: number) {
    try {
      await desativarUsuario(id)
      setConfirmarId(null)
      await carregar()
      setSucesso('Profissional removido.')
      setTimeout(() => setSucesso(''), 3000)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao remover')
    }
  }

  const filtrados = usuarios.filter(u =>
    u.nome.toLowerCase().includes(busca.toLowerCase()) ||
    u.email.toLowerCase().includes(busca.toLowerCase()) ||
    u.especialidade?.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Título */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Profissionais</h1>
            <p className="text-sm text-gray-500 mt-0.5">{usuarios.length} usuários cadastrados</p>
          </div>
          {admin && (
            <button
              onClick={abrirCriar}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
            >
              <Plus size={15} />
              Novo profissional
            </button>
          )}
        </div>

        {/* Sucesso */}
        {sucesso && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm fade-in">
            <CheckCircle size={15} />
            {sucesso}
          </div>
        )}

        {/* Busca */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou especialidade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {carregando ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <User size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Nenhum profissional encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Nome</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">E-mail</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Especialidade</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Perfil</th>
                  {admin && <th className="px-5 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                          u.tipo === 'administrador' ? 'bg-purple-500' : 'bg-blue-500'
                        )}>
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Mail size={13} className="text-gray-400" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {u.especialidade ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Stethoscope size={13} className="text-gray-400" />
                          {u.especialidade.nome}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={clsx(
                        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
                        u.tipo === 'administrador'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      )}>
                        {u.tipo === 'administrador' ? <Shield size={10} /> : <User size={10} />}
                        {TIPO_LABELS[u.tipo]}
                      </span>
                    </td>
                    {admin && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => abrirEditar(u)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          {confirmarId === u.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDesativar(u.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition text-xs font-medium"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmarId(null)}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition text-xs"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmarId(u.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal criar/editar */}
      {modalAberto && admin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {editando ? 'Editar profissional' : 'Novo profissional'}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  required
                  placeholder="Dr. Nome Sobrenome"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="profissional@hospital.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {!editando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input
                    type="password"
                    value={form.senha}
                    onChange={e => setForm({ ...form, senha: e.target.value })}
                    required
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm({ ...form, tipo: e.target.value as 'profissional' | 'administrador' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="profissional">Profissional</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
                  <select
                    value={form.especialidade_id ?? ''}
                    onChange={e => setForm({ ...form, especialidade_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Nenhuma</option>
                    {especialidades.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {erro && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
                  <AlertTriangle size={14} />
                  {erro}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                >
                  {salvando && <Loader2 size={14} className="animate-spin" />}
                  {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
