import type { ReactNode } from 'react'

export function AppLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <main className="app-layout">
      <header className="app-layout__header">
        <p className="app-layout__eyebrow">Buscaminas Multijugador</p>
        <h1>{title}</h1>
        {subtitle ? <p className="app-layout__subtitle">{subtitle}</p> : null}
      </header>
      <section className="app-layout__content">{children}</section>
    </main>
  )
}
