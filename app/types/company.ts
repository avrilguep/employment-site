export type CompanyProfile = {
  id: string
  company_name: string
  industry: string
  location: string
  full_name?: string
  phone?: string
  email?: string
}

export type Posting = {
  id: string
  title: string
  description: string
  required_skills: string[]
  modality: string
  location: string
  salary_range: string
  active: boolean
  created_at: string
  company_id: string
}

export type Candidate = {
  full_name: string
  desired_position: string
  desired_area: string
  work_modality: string
  location: string
  skills: string[]
  cv_text: string
  match_score?: number
}

export type CVFile = {
  name: string
  text: string
}