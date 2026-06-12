"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function EnterPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    })

    if (res.ok) {
      router.push("/")
      router.refresh()
    } else {
      setError("Contraseña incorrecta")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">

        {/* Logo e info */}
        <div className="mb-10">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Employment Site</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Plataforma inteligente de reclutamiento con IA
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-400">
            <span>Candidatos</span>
            <span>·</span>
            <span>Empresas</span>
            <span>·</span>
            <span>IA</span>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          <p className="text-sm text-slate-600 mb-5">
            Ingresa la contraseña de acceso para continuar
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña de acceso"
              required
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-teal-400 text-center tracking-widest"
            />
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-medium text-white bg-teal-600 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Entrar"}
            </button>
          </form>
        </div>

      </div>
    </main>
  )
}