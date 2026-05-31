'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Hospital, Calendar, Users, LogOut, ChevronDown, Shield, User } from 'lucide-react'
import { encerrarSessao } from '@/lib/auth'
import { useAuth } from '@/lib/useAuth'
import clsx from 'clsx'

export default function Header() {
  const router   = useRouter()
  const pathname = usePathname()
  const { usuario } = useAuth()   // ← lê localStorage apenas após hidratação
  const [menuAberto, setMenuAberto] = useState(false)

  function sair() {
    encerrarSessao()
    router.push('/login')
  }

  const nav = [
    { href: '/dashboard',                label: 'Calendário',   icon: Calendar },
    { href: '/dashboard/profissionais',  label: 'Profissionais', icon: Users   },
  ]

  const inicial = usuario?.nome?.charAt(0).toUpperCase() ?? '?'
  const isAdmin = usuario?.tipo === 'administrador'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Hospital className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm hidden sm:block">
            Cronograma Hospitalar
          </span>
        </div>

        {/* Navegação */}
        <nav className="flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition',
                pathname === href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Menu do usuário */}
        <div className="relative">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition text-sm"
          >
            {/* Avatar — renderiza '?' no servidor; letra real após hidratação */}
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold',
              isAdmin ? 'bg-purple-500' : 'bg-blue-500'
            )}>
              {inicial}
            </div>
            <span className="font-medium text-gray-700 hidden sm:block max-w-32 truncate">
              {usuario?.nome?.split(' ')[0]}
            </span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {menuAberto && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 fade-in">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{usuario?.nome}</p>
                <p className="text-xs text-gray-500 truncate">{usuario?.email}</p>
                <span className={clsx(
                  'inline-flex items-center gap-1 mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
                  isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                )}>
                  {isAdmin ? <Shield size={10} /> : <User size={10} />}
                  {isAdmin ? 'Administrador' : 'Profissional'}
                </span>
              </div>
              <button
                onClick={sair}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
