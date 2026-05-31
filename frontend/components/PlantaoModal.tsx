'use client'
import { useState } from 'react'
import { X, Clock, MapPin, User, FileText, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { criarPlantao, atualizarPlantao, deletarPlantao } from '@/lib/api'
import { useAuth } from '@/lib/useAuth'
import type { Plantao, Usuario, Setor } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  plantao?: Plantao | null
  dataInicial?: string
  onClose: () => void
  onSalvo: () => void
  /** Fix 8: recebidos do Calendar (já carregados) → sem chamadas duplicadas */
  profissionais: Usuario[]
  setores: Setor[]
}

const TURNOS = [
  { label: 'Manhã', inicio: '07:00', fim: '13:00' },
  { label: 'Tarde', inicio: '13:00', fim: '19:00' },
  { label: 'Noite', inicio: '19:00', fim: '07:00' },
  { label: 'Personalizado', inicio: '', fim: '' },
]

export default function PlantaoModal({
  plantao, dataInicial, onClose, onSalvo, profissionais, setores,
}: Props) {
  const { isAdmin } = useAuth()   // ← seguro: lê localStorage pós-hidratação
  const admin = isAdmin
  const editando = !!plantao

  const [data, setData] = useState(plantao?.data ?? dataInicial ?? '')
  const [horaInicio, setHoraInicio] = useState(plantao?.hora_inicio ?? '07:00')
  const [horaFim, setHoraFim] = useState(plantao?.hora_fim ?? '13:00')
  const [setorId, setSetorId] = useState<number>(plantao?.setor_id ?? 0)
  const [profissionalId, setProfissionalId] = useState<number | null>(plantao?.profissional_id ?? null)
  const [observacoes, setObservacoes] = useState(plantao?.observacoes ?? '')
  const [turnoSelecionado, setTurnoSelecionado] = useState('')

  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const [erro, setErro] = useState('')
  const [confirmarDelete, setConfirmarDelete] = useState(false)

  function selecionarTurno(turno: typeof TURNOS[0]) {
    setTurnoSelecionado(turno.label)
    if (turno.inicio) {
      setHoraInicio(turno.inicio)
      setHoraFim(turno.fim)
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!setorId) { setErro('Selecione um setor'); return }
    setErro('')
    setSalvando(true)
    try {
      if (editando && plantao) {
        await atualizarPlantao(plantao.id, {
          data, hora_inicio: horaInicio, hora_fim: horaFim,
          setor_id: setorId, profissional_id: profissionalId,
          observacoes: observacoes || undefined,
        })
      } else {
        await criarPlantao({
          data, hora_inicio: horaInicio, hora_fim: horaFim,
          setor_id: setorId, profissional_id: profissionalId,
          observacoes: observacoes || undefined,
        })
      }
      onSalvo()
      onClose()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleDeletar() {
    if (!plantao) return
    setDeletando(true)
    try {
      await deletarPlantao(plantao.id)
      onSalvo()
      onClose()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao deletar')
      setDeletando(false)
    }
  }

  async function handleDesvincular() {
    if (!plantao) return
    setSalvando(true)
    try {
      await atualizarPlantao(plantao.id, { profissional_id: null })
      onSalvo()
      onClose()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao desvincular')
    } finally {
      setSalvando(false)
    }
  }

  const setorAtual = setores.find(s => s.id === setorId)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {setorAtual && (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: setorAtual.cor }} />
            )}
            <h2 className="font-semibold text-gray-900">
              {editando ? 'Editar Plantão' : 'Novo Plantão'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="p-6 space-y-5">
          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              required
              disabled={!admin}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Turno rápido */}
          {admin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Turno</label>
              <div className="grid grid-cols-4 gap-2">
                {TURNOS.map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => selecionarTurno(t)}
                    className={clsx(
                      'py-2 px-1 rounded-lg text-xs font-medium border transition',
                      turnoSelecionado === t.label
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <Clock size={13} /> Início
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
                required
                disabled={!admin}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <Clock size={13} /> Fim
              </label>
              <input
                type="time"
                value={horaFim}
                onChange={e => setHoraFim(e.target.value)}
                required
                disabled={!admin}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
              />
            </div>
          </div>

          {/* Setor */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <MapPin size={13} /> Setor
            </label>
            <select
              value={setorId}
              onChange={e => setSetorId(Number(e.target.value))}
              required
              disabled={!admin}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
            >
              <option value="">Selecione um setor</option>
              {setores.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* Profissional */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <User size={13} /> Profissional
            </label>
            <div className="flex gap-2">
              <select
                value={profissionalId ?? ''}
                onChange={e => setProfissionalId(e.target.value ? Number(e.target.value) : null)}
                disabled={!admin}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
              >
                <option value="">Plantão disponível</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.especialidade ? `— ${p.especialidade.nome}` : ''}
                  </option>
                ))}
              </select>
              {admin && editando && profissionalId && (
                <button
                  type="button"
                  onClick={handleDesvincular}
                  title="Desvincular profissional"
                  className="px-3 py-2 border border-orange-300 text-orange-600 rounded-lg text-xs hover:bg-orange-50 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
              <FileText size={13} /> Observações
            </label>
            <textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              disabled={!admin}
              rows={2}
              placeholder="Informações adicionais sobre o plantão..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:bg-gray-50"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
              <AlertTriangle size={14} />
              {erro}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            {admin && editando && !confirmarDelete && (
              <button
                type="button"
                onClick={() => setConfirmarDelete(true)}
                className="mr-auto flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            )}

            {confirmarDelete && (
              <div className="mr-auto flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Confirmar exclusão?</span>
                <button
                  type="button"
                  onClick={handleDeletar}
                  disabled={deletando}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition"
                >
                  {deletando ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmarDelete(false)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              {admin ? 'Cancelar' : 'Fechar'}
            </button>

            {admin && (
              <button
                type="submit"
                disabled={salvando}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
              >
                {salvando && <Loader2 size={14} className="animate-spin" />}
                {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar plantão'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
