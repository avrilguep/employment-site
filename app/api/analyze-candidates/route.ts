import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { cvFiles, requirements, profile } = await req.json()

    const cvsText = cvFiles.map((cv: { name: string; text: string }, i: number) =>
      `--- CV ${i + 1}: ${cv.name} ---\n${cv.text}`
    ).join("\n\n")

    const prompt = `Eres un experto en reclutamiento y selección de personal.
${profile ? `La empresa que busca es: ${profile.company_name}, industria: ${profile.industry}.` : ""}

Los requerimientos del puesto son:
${requirements}

A continuación están los CVs de los candidatos:

${cvsText}

Analiza cada candidato y proporciona:
1. Un ranking de los candidatos del mejor al menos adecuado
2. Para cada candidato: fortalezas, debilidades y compatibilidad con el puesto (porcentaje)
3. Tu recomendación final de a quién contratar y por qué

Sé específico y basa tu análisis en la información de los CVs.`

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })

    const analysis = response.content[0].type === "text" ? response.content[0].text : ""
    return NextResponse.json({ analysis })

  } catch (error: any) {
    console.error("Analyze API error:", error)
    return NextResponse.json(
      { analysis: "Hubo un error al analizar los candidatos. Intenta de nuevo." },
      { status: 500 }
    )
  }
}