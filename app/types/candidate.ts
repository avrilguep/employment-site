export type CandidateProfile = {
  id: string
  full_name: string
  desired_position: string
  desired_area: string
  work_modality: string
  location: string
  skills: string[]
  cv_text: string
  cv_public: boolean
  is_premium?: boolean
}

export type Message = {
  role: string
  content: string
}

export type Job = {
  title: string
  company_name: string
  match_score?: number
  location?: string
  salary_range?: string
  modality?: string
  industry?: string
  description?: string  
  url?: string
  source?: string
  phone?: string
  email?: string
}