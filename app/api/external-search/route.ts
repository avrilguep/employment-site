import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Profile {
  desired_position?: string
  desired_area?: string
  work_modality?: string
  location?: string
  skills?: string[]
}

interface ContentBlock {
  type: string
  text?: string
}

export async function POST(req: NextRequest) {
  try {
    const { messages, cvText, profile }: {
      messages: Message[]
      cvText: string
      profile: Profile
    } = await req.json()

    const systemPrompt = `Eres un asistente experto en búsqueda de empleo. Tu trabajo es buscar vacantes reales en internet para el candidato.

${profile ? `Perfil del candidato:
- Puesto deseado: ${profile.desired_position}
- Área: ${profile.desired_area}
- Modalidad: ${profile.work_modality}
- Ubicación: ${profile.location}
- Habilidades: ${profile.skills?.join(", ")}` : ""}

${cvText ? `CV del candidato:\n${cvText.slice(0, 1500)}` : ""}

Cuando el candidato te diga qué busca:
1. Usa la herramienta de búsqueda web para encontrar vacantes reales y actuales
2. Presenta cada resultado con este formato exacto:

**[Puesto]** — [Empresa]
📍 [Ubicación] · [Modalidad si se sabe]
🔗 [Link directo](url)
_Breve descripción del vacante_

3. Muestra máximo 6 resultados
4. Nunca uses tablas ni pipes (|)
5. Al final agrega una sección "💡 También puedes buscar en:" con 3 plataformas relevantes como links
6. Responde siempre en español
7. Si no encuentras vacantes específicas, busca plataformas de empleo relevantes
8. Incluye links clickeables a las vacantes encontradas`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      tools: [{ 
        type: "web_search_20250305", 
        name: "web_search" }] as Parameters<typeof anthropic.messages.create>[0]["tools"]
        ,
        messages: messages.map((m: Message) => ({
        role: m.role,
        content: m.content
      }))
    })

    const reply = response.content
      .filter((block: ContentBlock) => block.type === "text")
      .map((block: ContentBlock) => block.text ?? "")
      .join("\n")

    return NextResponse.json({ reply })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    console.error("External search error:", message)
    return NextResponse.json(
      { reply: "Hubo un error al buscar vacantes. Intenta de nuevo." },
      { status: 500 }
    )
  }
}