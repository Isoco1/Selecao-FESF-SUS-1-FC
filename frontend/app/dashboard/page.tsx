'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { obterToken } from '@/lib/auth'
import Header from '@/components/Header'
import Calendar from '@/components/Calendar'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    if (!obterToken()) router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Escala de Plantões</h1>
          <p className="text-sm text-gray-500 mt-0.5">2026 — Navegue entre Janeiro e Dezembro</p>
        </div>
        <Calendar />
      </main>
    </div>
  )
}
