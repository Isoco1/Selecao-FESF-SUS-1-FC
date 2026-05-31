import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cronograma Hospitalar',
  description: 'Sistema de gestão de plantões hospitalares',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
