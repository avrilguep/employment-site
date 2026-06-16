"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"
import PrivacyModal from "./PrivacyModal"

export default function EnterPage() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setShowPrivacy(true)
      setLoading(false)
    } else {
      setError("Contraseña incorrecta")
      setLoading(false)
    }
  }

  function handleAccept() {
    setShowPrivacy(false)
    setPrivacyAccepted(true)
    router.push("/")
    router.refresh()
  }

  function handleReject() {
    setShowPrivacy(false)
    setPrivacyAccepted(false)
  }

  return (
    <main className={styles.main}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "url('/fondo-employment.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
        }}
      />

      {/* Texto superior centrado */}
      <p className={styles.subtitle}>
        Plataforma inteligente de reclutamiento con IA
      </p>

      <div className={styles.layout}>
        <div className={styles.leftCol}>

          {/* Bienvenido fuera del card */}
          <h2 className={styles.welcome}>¡BIENVENIDO!</h2>

          {/* Card */}
          <div className={styles.card}>

            {/* Mensaje si rechazó políticas */}
            {privacyAccepted === false && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "16px"
              }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#b91c1c", marginBottom: "4px" }}>
                  Acceso no disponible
                </p>
                <p style={{ fontSize: "12px", color: "#ef4444" }}>
                  Para usar Employment Site es necesario aceptar las políticas de privacidad.
                </p>
                <button
                  onClick={() => setPrivacyAccepted(null)}
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#6b7280",
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Revisar políticas de privacidad
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <label className={styles.label}>
                Ingresa la contraseña de acceso
              </label>

              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoFocus
                  disabled={privacyAccepted === false}
                  className={styles.input}
                  style={privacyAccepted === false ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className={styles.eyeBtn}
                  tabIndex={-1}
                  disabled={privacyAccepted === false}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.05-3.378M6.228 6.228A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.05 10.05 0 01-4.132 5.411M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button
                type="submit"
                disabled={loading || privacyAccepted === false}
                className={styles.submitBtn}
                style={privacyAccepted === false ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
                {loading ? "Verificando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showPrivacy && (
        <PrivacyModal onAccept={handleAccept} onReject={handleReject} />
      )}
    </main>
  )
}