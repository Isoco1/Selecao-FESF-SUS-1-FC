'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, Filter, Wifi, WifiOff } from 'lucide-react'
import { listarPlantoes, listarUsuarios, listarSetores } from '@/lib/api'
import { obterToken } from '@/lib/auth'
import { useAuth } from '@/lib/useAuth'
import type { Plantao, Usuario, Setor } from '@/lib/types'
import PlantaoModal from './PlantaoModal'
import DayPopup from './DayPopup'
import clsx from 'clsx'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Ano fixo do sistema — toda a escala de 2026 */
const ANO_SISTEMA = 2026

function gerarDiasCalendario(ano: number, mes: number) {
  const primeiroDia = new Date(ano, mes - 1, 1).getDay()
  const totalDias  = new Date(ano, mes, 0).getDate()
  const dias: (number | null)[] = Array(primeiroDia).fill(null)
  for (let i = 1; i <= totalDias; i++) dias.push(i)
  while (dias.length % 7 !== 0) dias.push(null)
  return dias
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function Calendar() {
  const { isAdmin } = useAuth()   // ← seguro: lê localStorage pós-hidratação
  const admin = isAdmin
  const hoje  = new Date()

  // ── Mês navegável — ano fixo em 2026 ──────────────────────────────────────
  const [mes, setMes] = useState(1)          // Inicia em Janeiro
  const ano = ANO_SISTEMA                    // 2026 sempre
  const dias = gerarDiasCalendario(ano, mes)

  // ── Dados ──────────────────────────────────────────────────────────────────
  /** Todos os plantões do mês (sem filtro) — usado pelo DayPopup */
  const [plantoesMes, setPlantoesMes]     = useState<Plantao[]>([])
  /** Subconjunto filtrado — usado pela grade do calendário */
  const [plantoes, setPlantoes]           = useState<Plantao[]>([])
  const [profissionais, setProfissionais] = useState<Usuario[]>([])
  const [setores, setSetores]             = useState<Setor[]>([])
  const [carregando, setCarregando]       = useState(true)
  const [erroFetch, setErroFetch]         = useState<string | null>(null)

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [filtroProfissional, setFiltroProfissional] = useState<number | null>(null)
  const [filtroSetor, setFiltroSetor]               = useState<number | null>(null)
  const [mostrarFiltros, setMostrarFiltros]         = useState(false)

  // ── Modal de plantão (criar / editar) ─────────────────────────────────────
  const [modalAberto, setModalAberto]               = useState(false)
  const [plantaoSelecionado, setPlantaoSelecionado] = useState<Plantao | null>(null)

  // ── Popup de dia ───────────────────────────────────────────────────────────
  const [diaSelecionado, setDiaSelecionado]   = useState<number | null>(null)
  const [dayPopupAberto, setDayPopupAberto]   = useState(false)

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const [wsConectado, setWsConectado] = useState(false)
  const carregarRef = useRef<() => void>(() => {})

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    setCarregando(true)
    setErroFetch(null)
    try {
      const dados = await listarPlantoes({ mes, ano })

      // Fix 2: guardar dados brutos para DayPopup mostrar TODOS os plantões do dia
      setPlantoesMes(dados)

      // Subconjunto filtrado — apenas para a grade visual
      let filtrados = dados
      if (filtroProfissional) filtrados = filtrados.filter(p => p.profissional_id === filtroProfissional)
      if (filtroSetor)        filtrados = filtrados.filter(p => p.setor_id        === filtroSetor)
      setPlantoes(filtrados)
    } catch (e) {
      // Fix 4: expor erro ao usuário em vez de engolir silenciosamente
      console.error(e)
      setErroFetch('Não foi possível carregar os plantões. Verifique sua conexão.')
    } finally {
      setCarregando(false)
    }
  }, [filtroProfissional, filtroSetor, mes, ano])

  // Mantém ref sempre atualizada (evita reconexão WS a cada troca de mês)
  useEffect(() => { carregarRef.current = carregar }, [carregar])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    listarUsuarios('profissional').then(setProfissionais).catch(() => {})
    listarSetores().then(setSetores).catch(() => {})
  }, [])

  // WebSocket — conecta uma única vez
  useEffect(() => {
    const token = obterToken()
    if (!token) return
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws'
    const ws = new WebSocket(wsUrl)
    ws.onopen  = () => setWsConectado(true)
    ws.onclose = () => setWsConectado(false)
    ws.onerror = () => setWsConectado(false)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (['plantao_criado', 'plantao_atualizado', 'plantao_deletado'].includes(msg.evento)) {
          carregarRef.current()
        }
      } catch { /* ignora mensagens malformadas */ }
    }
    return () => ws.close()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navegação — limitada a Jan–Dez 2026 ───────────────────────────────────
  const podePrevio  = mes > 1
  const podeProximo = mes < 12

  function navAnterior() { if (podePrevio)  setMes(m => m - 1) }
  function navProximo()  { if (podeProximo) setMes(m => m + 1) }

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Usada pela GRADE: retorna plantões filtrados do dia (para os chips visuais) */
  function plantoesFiltradosDoDia(dia: number): Plantao[] {
    const dataStr = `${ano}-${pad(mes)}-${pad(dia)}`
    return plantoes.filter(p => p.data === dataStr)
  }

  /** Usada pelo DAYPOPUP: retorna TODOS os plantões do dia, sem filtro ativo */
  function todosPlantoesDoDia(dia: number): Plantao[] {
    const dataStr = `${ano}-${pad(mes)}-${pad(dia)}`
    return plantoesMes.filter(p => p.data === dataStr)
  }

  const ehHoje = (dia: number) =>
    hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes && hoje.getDate() === dia

  // ── Ações ──────────────────────────────────────────────────────────────────
  /** Clique num dia: abre apenas o popup de visualização */
  function abrirPopupDia(dia: number) {
    setDiaSelecionado(dia)
    setDayPopupAberto(true)
  }

  /** Único ponto de criação: botão "Novo Plantão" */
  function abrirCriacao() {
    setPlantaoSelecionado(null)
    setModalAberto(true)
  }

  /** Edição vinda do DayPopup */
  function editarPlantao(p: Plantao) {
    setDayPopupAberto(false)
    setDiaSelecionado(null)
    setPlantaoSelecionado(p)
    setModalAberto(true)
  }

  // Data pré-preenchida no modal de criação = 1º do mês visualizado
  const dataInicialModal = `${ano}-${pad(mes)}-01`

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">

        <div className="flex items-center gap-3">
          {/* Navegação de meses — Jan a Dez 2026 */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5">
            <button
              onClick={navAnterior}
              disabled={!podePrevio}
              aria-label="Mês anterior"
              className="p-1.5 rounded-lg transition text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 text-sm font-semibold text-gray-800 w-44 text-center select-none">
              {MESES[mes - 1]} {ano}
            </span>
            <button
              onClick={navProximo}
              disabled={!podeProximo}
              aria-label="Próximo mês"
              className="p-1.5 rounded-lg transition text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Indicador WebSocket */}
          <div className={clsx(
            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
            wsConectado ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          )}>
            {wsConectado
              ? <><Wifi size={11} /><span className="hidden sm:inline">Tempo real</span></>
              : <><WifiOff size={11} /><span className="hidden sm:inline">Offline</span></>
            }
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtros */}
          <div className="relative">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition',
                (filtroProfissional || filtroSetor)
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
            >
              <Filter size={14} />
              Filtrar
              {(filtroProfissional || filtroSetor) && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {(filtroProfissional ? 1 : 0) + (filtroSetor ? 1 : 0)}
                </span>
              )}
            </button>

            {mostrarFiltros && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-20 fade-in">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filtros</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Profissional</label>
                    <select
                      value={filtroProfissional ?? ''}
                      onChange={e => setFiltroProfissional(e.target.value ? Number(e.target.value) : null)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      {profissionais.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Setor</label>
                    <select
                      value={filtroSetor ?? ''}
                      onChange={e => setFiltroSetor(e.target.value ? Number(e.target.value) : null)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      {setores.map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  </div>
                  {(filtroProfissional || filtroSetor) && (
                    <button
                      onClick={() => { setFiltroProfissional(null); setFiltroSetor(null) }}
                      className="w-full text-xs text-red-600 hover:text-red-700 font-medium py-1"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── ÚNICO ponto de criação de plantão ─── */}
          {admin && (
            <button
              onClick={abrirCriacao}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
            >
              <Plus size={14} />
              Novo Plantão
            </button>
          )}
        </div>
      </div>

      {/* ── Legenda de setores ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4">
        {setores.map(s => (
          <button
            key={s.id}
            onClick={() => setFiltroSetor(filtroSetor === s.id ? null : s.id)}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition',
              filtroSetor === s.id ? 'ring-2 ring-offset-1' : 'opacity-75 hover:opacity-100'
            )}
            style={{
              borderColor: s.cor,
              color: s.cor,
              backgroundColor: `${s.cor}18`,
            } as React.CSSProperties}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.cor }} />
            {s.nome}
          </button>
        ))}
      </div>

      {/* ── Grade do calendário ─────────────────────────────────────────────── */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Cabeçalho: dias da semana */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/60">
          {DIAS_SEMANA.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {carregando ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : erroFetch ? (
          /* Fix 4: mensagem de erro visível em vez de calendário vazio misterioso */
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
            <svg className="w-8 h-8 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm font-medium text-red-600">{erroFetch}</p>
            <button
              onClick={carregar}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {dias.map((dia, idx) => {
              if (!dia) return (
                <div key={`vazio-${idx}`} className="min-h-28 bg-gray-50/40" />
              )

              const plantoesDia = plantoesFiltradosDoDia(dia)
              const isHoje      = ehHoje(dia)
              const MAX_ITEMS   = 3

              return (
                <div
                  key={dia}
                  onClick={() => abrirPopupDia(dia)}
                  className="min-h-28 p-1.5 cursor-pointer hover:bg-blue-50/40 transition group"
                >
                  {/* Número do dia */}
                  <div className="flex items-start justify-between mb-1">
                    <span className={clsx(
                      'w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full transition',
                      isHoje
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                    )}>
                      {dia}
                    </span>

                    {plantoesDia.length > 0 && (
                      <span className="text-xs text-gray-400 font-medium leading-none mt-1">
                        {plantoesDia.length}
                      </span>
                    )}
                  </div>

                  {/* Plantões do dia (preview) */}
                  <div className="space-y-0.5">
                    {plantoesDia.slice(0, MAX_ITEMS).map(p => (
                      <div
                        key={p.id}
                        className="w-full text-left rounded px-1.5 py-0.5 text-xs truncate leading-tight"
                        style={{
                          backgroundColor: `${p.setor?.cor ?? '#3B82F6'}1A`,
                          borderLeft: `2.5px solid ${p.setor?.cor ?? '#3B82F6'}`,
                          color: p.setor?.cor ?? '#3B82F6',
                        }}
                        title={`${p.hora_inicio}–${p.hora_fim} | ${p.setor?.nome} | ${p.profissional?.nome ?? 'Disponível'}`}
                      >
                        <span className="font-semibold">{p.hora_inicio}</span>
                        {' '}
                        <span className="opacity-80">
                          {p.profissional?.nome?.split(' ')[0] ?? '—'}
                        </span>
                      </div>
                    ))}

                    {plantoesDia.length > MAX_ITEMS && (
                      <p className="text-xs text-gray-400 pl-1 pt-0.5">
                        +{plantoesDia.length - MAX_ITEMS} mais
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Popup de dia ────────────────────────────────────────────────────── */}
      {dayPopupAberto && diaSelecionado !== null && (
        <DayPopup
          dia={diaSelecionado}
          mes={mes}
          ano={ano}
          plantoes={todosPlantoesDoDia(diaSelecionado)}
          onClose={() => { setDayPopupAberto(false); setDiaSelecionado(null) }}
          onEditar={editarPlantao}
        />
      )}

      {/* ── Modal de plantão ────────────────────────────────────────────────── */}
      {/* Fix 8: passa listas já carregadas — sem chamadas duplicadas no modal */}
      {modalAberto && (
        <PlantaoModal
          plantao={plantaoSelecionado}
          dataInicial={plantaoSelecionado ? undefined : dataInicialModal}
          onClose={() => { setModalAberto(false); setPlantaoSelecionado(null) }}
          onSalvo={carregar}
          profissionais={profissionais}
          setores={setores}
        />
      )}
    </div>
  )
}
