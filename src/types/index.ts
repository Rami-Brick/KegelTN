export interface Profile {
  id: string
  full_name: string
  access_key: string
  program: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
}

export interface AuthState {
  profile: Profile | null
  loading: boolean
}