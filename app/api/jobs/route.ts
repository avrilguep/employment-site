import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""
  const location = searchParams.get("location") || "mexico"

  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  const url = `https://api.adzuna.com/v1/api/jobs/mx/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=10&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}`

  const res = await fetch(url)
  const data = await res.json()

  const jobs = (data.results || []).map((job: any) => ({
    title: job.title,
    company: job.company?.display_name || "Empresa confidencial",
    location: job.location?.display_name || "",
    description: job.description,
    salary: job.salary_min ? `$${Math.round(job.salary_min).toLocaleString()} - $${Math.round(job.salary_max).toLocaleString()}` : null,
    url: job.redirect_url,
    source: "Adzuna"
  }))

  return NextResponse.json({ jobs })
}