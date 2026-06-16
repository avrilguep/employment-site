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
}

export type Message = {
  role: string
  content: string
}

export type Job = {
  title: string
  company_name: string
  modality: string
  location: string
  salary_range: string
  industry: string
  match_score?: number
}