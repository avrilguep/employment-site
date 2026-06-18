"use client"



import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import styles from "./auth.module.css"

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
  const isCandidate = role === "candidate"
  const roleLabel = isCandidate ? "candidato" : "empresa"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(isCandidate ? "/dashboard/candidate" : "/dashboard/company")
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({ id: data.user.id, role, full_name: fullName })
          if (profileError) throw profileError
        }
        router.push(isCandidate ? "/onboarding/candidate" : "/onboarding/company")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <span className={`${styles.badge} ${isCandidate ? styles.badgeCandidate : styles.badgeCompany}`}>
            Acceso como {roleLabel}
          </span>
          <h1 className={styles.title}>
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </h1>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className={styles.field}>
              <label className={styles.label}>Nombre completo</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Tu nombre"
                required
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className={styles.input}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`${styles.btn} ${isCandidate ? styles.btnCandidate : styles.btnCompany}`}
          >
            {loading ? "Cargando..." : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p>
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError("") }}
              className={`${styles.toggleBtn} ${isCandidate ? styles.toggleCandidate : styles.toggleCompany}`}
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
          <Link href="/" className={styles.backLink}>
            ← Volver al inicio
          </Link>
        </div>

      </div>
    </main>
  )
}