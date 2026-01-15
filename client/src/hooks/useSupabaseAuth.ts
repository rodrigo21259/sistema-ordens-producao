// client/src/hooks/useSupabaseAuth.ts
import { useEffect, useState } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extrair nome do email
  const extractNameFromEmail = (email: string): string => {
    const namePart = email.split('@')[0]
    const names = namePart.split('.')
    return names
      .map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
      .join(' ')
  }

  // Buscar ou criar perfil
  const fetchOrCreateProfile = async (userId: string, email: string) => {
    try {
      let { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // Perfil não existe, criar novo
        const name = extractNameFromEmail(email)
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ id: userId, name, role: 'user' }])
          .select()
          .single()

        if (createError) throw createError
        return newProfile as Profile
      }

      if (fetchError) throw fetchError
      return data as Profile
    } catch (err) {
      console.error('Erro ao buscar/criar perfil:', err)
      return null
    }
  }

  // Inicializar autenticação
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const prof = await fetchOrCreateProfile(session.user.id, session.user.email || '')
        setUser(session.user)
        setProfile(prof)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const prof = await fetchOrCreateProfile(session.user.id, session.user.email || '')
          setUser(session.user)
          setProfile(prof)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      if (!email.endsWith('@investsmart.com.br')) {
        throw new Error('Use um email @investsmart.com.br')
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar'
      setError(message)
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login'
      setError(message)
      throw err
    }
  }

  const signOut = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer logout'
      setError(message)
      throw err
    }
  }

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    signUp,
    signIn,
    signOut,
  }
}