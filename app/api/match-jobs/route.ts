import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { cvText, profile, filters } = await req.json()

    let query = supabase
      .from("job_postings")
      .select("*")
      .eq("active", true)

    if (filters?.modality) query = query.eq("modality", filters.modality)
    if (filters?.location) query = query.ilike("location", `%${filters.location}%`)

    const { data: jobs } = await query

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ jobs: [] })
    }

    const companyIds = [...new Set(jobs.map((j: any) => j.company_id))]
    const { data: companies } = await supabase
      .from("company_profiles")
      .select("id, company_name, industry, phone, email")
      .in("id", companyIds)

    const companyMap = (companies || []).reduce((acc: any, c: any) => {
      acc[c.id] = c
      return acc
    }, {})

    const prompt = `Eres un experto en reclutamiento. Analiza qué vacantes son compatibles con este candidato y asigna un score del 1 al 100.

Candidato:
- Puesto deseado: ${profile?.desired_position || "No especificado"}
- Área: ${profile?.desired_area || "No especificado"}
- Modalidad: ${profile?.work_modality || "No especificado"}
- Ubicación: ${profile?.location || "No especificado"}
- Habilidades: ${profile?.skills?.join(", ") || "No especificado"}
${cvText ? `\nCV: ${cvText.slice(0, 800)}` : ""}

Vacantes:
${jobs.map((j: any, i: number) => `[${i}] ${j.title} | ${companyMap[j.company_id]?.company_name || "Empresa"} | ${j.modality} | ${j.location} | Skills: ${j.required_skills?.join(", ")}`).join("\n")}

IMPORTANTE: Responde SOLO con este JSON, sin explicaciones ni markdown:
{"matches":[{"index":0,"match_score":85}]}`

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    })

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "{}"

    let parsed: any = { matches: [] }
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim())
    } catch (e) {
      console.error("JSON parse error:", e, "Raw text:", text)
    }

    const result = (parsed.matches || [])
      .filter((m: any) => m.match_score >= 20)
      .map((m: any) => {
        const job = jobs[m.index]
        const company = companyMap[job.company_id] || {}
        return {
          ...job,
          company_name: company.company_name || "Empresa",
          industry: company.industry || "",
          phone: company.phone || null,
          email: company.email || null,
          match_score: m.match_score
        }
      })

    return NextResponse.json({ jobs: result })

  } catch (error: any) {
    console.error("Match jobs error:", error)
    return NextResponse.json({ jobs: [], error: error.message }, { status: 500 })
  }
}