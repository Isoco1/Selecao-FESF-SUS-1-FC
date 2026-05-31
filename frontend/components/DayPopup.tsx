'use client'
import { X, Clock, MapPin, User, Edit2, Calendar, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import type { Plantao } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  dia: number
  mes: number
  ano: number
  plantoes: Plantao[]
  onClose: () => void
  onEditar: (p: Plantao) => void
}

const DIAS_SEMANA = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const MESES_EXT   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const STATUS_CFG = {
  alocado:    { label: 'Alocado',    bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  disponivel: { label: 'Disponível', bg: 'bg-gray-50',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
  cancelado:  { label: 'Cancelado',  bg: 'bg-red-50',    text: 'text-red-600',    dot: 'bg-red-400'    },
}

export default function DayPopup({ dia, mes, ano, plantoes, onClose, onEditar }: Props) {
  const { isAdmin } = useAuth()   // ← seguro: lê localStorage pós-hidratação
  const admin = isAdmin
  const diaSemana = DIAS_SEMANA[new Date(ano, mes - 1, dia).getDay()]
  const mesNome   = MESES_EXT[mes - 1]

  const alocados   = plantoes.filter(p => p.status === 'alocado').length
  const disponiveis = plantoes.filter(p => p.status === 'disponivel').length

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col fade-in">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Calendar size={15} className="text-blue-500" />
              <h2 className="font-semibold text-gray-900">{diaSemana}</h2>
            </div>
            <p className="text-sm text-gray-500">
              {dia} de {mesNome} de {ano}
            </p>

            {/* Resumo rápido */}
            {plantoes.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {alocados} alocado{alocados !== 1 ? 's' : ''}
                </span>
                {disponiveis > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    {disponiveis} disponível{disponiveis !== 1 ? 'eis' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* ── Lista de plantões ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {plantoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <AlertCircle size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum plantão neste dia</p>
              {admin && (
                <p className="text-xs mt-1 text-gray-400">
                  Use o botão <strong>Novo Plantão</strong> para criar um.
                </p>
              )}
            </div>
          ) : (
            plantoes
              .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
              .map(p => {
                const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.disponivel
                return (
                  <div
                    key={p.id}
                    className={clsx(
                      'rounded-xl border p-4 transition',
                      p.status === 'cancelado' ? 'opacity-60' : '',
                    )}
                    style={{ borderColor: `${p.setor?.cor ?? '#e5e7eb'}50` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">

                        {/* Horário */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-bold text-gray-800">
                            {p.hora_inicio} — {p.hora_fim}
                          </span>
                          {/* Indicador de virada de dia */}
                          {p.hora_fim < p.hora_inicio && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                              +1 dia
                            </span>
                          )}
                        </div>

                        {/* Setor */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <MapPin size={13} className="flex-shrink-0" style={{ color: p.setor?.cor ?? '#6b7280' }} />
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${p.setor?.cor ?? '#6b7280'}18`,
                              color: p.setor?.cor ?? '#6b7280',
                            }}
                          >
                            {p.setor?.nome ?? 'Setor desconhecido'}
                          </span>
                        </div>

                        {/* Profissional */}
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-gray-400 flex-shrink-0" />
                          {p.profissional ? (
                            <div>
                              <span className="text-sm text-gray-800 font-medium">{p.profissional.nome}</span>
                              {p.profissional.especialidade && (
                                <span className="text-xs text-gray-400 ml-1">
                                  — {p.profissional.especialidade.nome}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Plantão disponível</span>
                          )}
                        </div>

                        {/* Observações */}
                        {p.observacoes && (
                          <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            {p.observacoes}
                          </p>
                        )}
                      </div>

                      {/* Status + botão editar */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={clsx(
                          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                          cfg.bg, cfg.text
                        )}>
                          <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                          {cfg.label}
                        </span>

                        {admin && (
                          <button
                            onClick={() => onEditar(p)}
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition"
                          >
                            <Edit2 size={12} />
                            Editar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {plantoes.length} plantão{plantoes.length !== 1 ? 'ões' : ''} neste dia
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
