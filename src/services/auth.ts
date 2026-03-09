import { supabase } from '../lib/supabase'

export async function loginWithAccessKey(accessKey: string) {
  const fakeEmail = `${accessKey}@kegel-app.com`
  const { data, error } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password: accessKey,
  })

  if (error) throw new Error('Invalid access key')
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error('Logout failed')
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw new Error('Could not fetch profile')
  return data
}