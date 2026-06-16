"use client"
import Link from "next/link"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function AuthForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const role = searchParams.get("role") || "candidate"

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const roleLabel = role === "candidate" ? "candidato" : "empresa"
  const roleColor = role === "candidate" ? "teal" : "purple"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(role === "candidate" ? "/dashboard/candidate" : "/dashboard/company")
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({ id: data.user.id, role, full_name: fullName })
          if (profileError) throw profileError
        }

        router.push(role === "candidate" ? "/onboarding/candidate" : "/onboarding/company")
      }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Ocurrió un error")
      }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 w-full max-w-md">

        {/* Header */}
        <div className="mb-6 text-center">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            role === "candidate"
              ? "bg-teal-50 text-teal-700"
              : "bg-purple-50 text-purple-700"
          }`}>
            Acceso como {roleLabel}
          </span>
          <h1 className="text-2xl font-bold text-slate-800 mt-3">
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </h1>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-sm text-slate-600 mb-1 block">Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity ${
              loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
            } ${role === "candidate" ? "bg-teal-600" : "bg-purple-600"}`}
          >
            {loading ? "Cargando..." : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        {/* Toggle login/registro */}
        <p className="text-center text-sm text-slate-500 mt-6">
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError("") }}
            className={`font-medium ${role === "candidate" ? "text-teal-600" : "text-purple-600"}`}
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>

        {/* Volver */}
        <p className="text-center text-sm text-slate-400 mt-2">
          <Link href="/" className="hover:text-slate-600">
            ← Volver al inicio
          </Link>
        </p>

      </div>
    </main>
  )
}