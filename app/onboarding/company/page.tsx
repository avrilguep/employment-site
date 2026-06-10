"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No hay sesión activa")

      const { error } = await supabase
        .from("company_profiles")
        .upsert({
          id: user.id,
          company_name: companyName,
          industry,
          description,
        })

      if (error) throw error
      router.push("/dashboard/company")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 w-full max-w-lg">

        <div className="mb-6">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-50 text-purple-700">
            Perfil de empresa
          </span>
          <h1 className="text-2xl font-bold text-slate-800 mt-3">Cuéntanos sobre tu empresa</h1>
          <p className="text-sm text-slate-500 mt-1">Esta información ayuda a la IA a encontrar mejores candidatos</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Nombre de la empresa</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Ej: Empresa S.A. de C.V."
              required
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Industria</label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIAS.map(ind => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setIndustry(ind)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                    industry === ind
                      ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Descripción de la empresa</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="¿A qué se dedica tu empresa? ¿Qué tipo de talento busca normalmente?"
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-slate-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !industry}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-purple-600 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar y continuar"}
          </button>

        </form>
      </div>
    </main>
  )
}