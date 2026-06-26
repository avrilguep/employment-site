"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import styles from "../onboarding.module.css"

const INDUSTRIAS = [
  "Tecnología", "Manufactura", "Retail", "Salud",
  "Educación", "Finanzas", "Consultoría", "Logística", "Otro"
]

export default function CompanyOnboarding() {
  const router = useRouter()
  const supabase = createClient()

  const [companyName, setCompanyName] = useState("")
  const [industry, setIndustry] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay sesión activa")
      const { error } = await supabase.from("company_profiles").upsert({
        id: user.id, 
        company_name: companyName, 
        industry, 
        description,
        phone,
        email
      })
      if (error) throw error
      router.push("/dashboard/company")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={`${styles.badge} ${styles.badgeCompany}`}>Perfil de empresa</span>
          <h1 className={styles.title}>Cuéntanos sobre tu empresa</h1>
          <p className={styles.subtitle}>Esta información ayuda a la IA a encontrar mejores candidatos</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre de la empresa</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
              placeholder="Ej: Empresa S.A. de C.V." required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Industria</label>
            <div className={styles.chipsGroup}>
              {INDUSTRIAS.map(ind => (
                <button key={ind} type="button" onClick={() => setIndustry(ind)}
                  className={`${styles.chip} ${industry === ind ? styles.chipActiveCompany : ""}`}>
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción de la empresa</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="¿A qué se dedica tu empresa? ¿Qué tipo de talento busca normalmente?"
              rows={4} className={styles.textarea} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Teléfono de contacto</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="Ej: +52 55 1234 5678" className={styles.input} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Ej: info@empresa.com" className={styles.input} />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" disabled={loading || !industry}
            className={`${styles.btn} ${styles.btnCompany}`}>
            {loading ? "Guardando..." : "Guardar y continuar"}
          </button>
        </form>
      </div>
    </main>
  )
}