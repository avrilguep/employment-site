import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { cvText, profile } = await req.json()

    const prompt = `Eres un experto en búsqueda de empleo.
Analiza el siguiente CV y el perfil del candidato, luego genera 3 búsquedas específicas para encontrar trabajos compatibles.

Perfil: ${profile?.desired_position} en ${profile?.desired_area}, modalidad ${profile?.work_modality}, ubicación ${profile?.location}
Habilidades: ${profile?.skills?.join(", ")}

${cvText ? `CV del candidato:\n${cvText.slice(0, 2000)}` : ""}

Responde ÚNICAMENTE con un JSON con este formato exacto, sin texto adicional:
{
  "searches": [
    { "query": "término de búsqueda 1", "location": "ciudad" },
    { "query": "término de búsqueda 2", "location": "ciudad" },
    { "query": "término de búsqueda 3", "location": "ciudad" }
  ],
  "summary": "Breve análisis del perfil y qué tipo de trabajos le convienen"
}`

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }]
    })

    const text = response.content[0].type === "text" ? response.content[0].text : "{}"
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim())

    const allJobs: any[] = []

    for (const search of parsed.searches || []) {
      try {
        const res = await fetch(
          `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(search.query + " " + search.location)}&num_pages=1&date_posted=month`,
          {
            headers: {
              "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
              "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
            }
          }
        )
        const data = await res.json()
        const jobs = (data.data || []).slice(0, 4).map((job: any) => ({
          title: job.job_title,
          company: job.employer_name,
          location: `${job.job_city || ""} ${job.job_country || ""}`.trim(),
          description: job.job_description?.slice(0, 200) + "...",
          salary: job.job_min_salary
            ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary?.toLocaleString()}`
            : null,
          url: job.job_apply_link,
          source: job.job_publisher || "JSearch"
        }))
        allJobs.push(...jobs)
      } catch (e) {
        console.error("JSearch error:", e)
      }
    }

    const uniqueJobs = allJobs.filter(
      (job, index, self) => index === self.findIndex(j => j.title === job.title && j.company === job.company)
    )

    return NextResponse.json({
      jobs: uniqueJobs,
      summary: parsed.summary || ""
    })

  } catch (error: any) {
    console.error("Jobs API error:", error)
    return NextResponse.json({ jobs: [], summary: "Error al buscar trabajos." }, { status: 500 })
  }
}