import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { supabaseConfigured } from '@/lib/supabase-config'

export default async function Home() {
  if (!supabaseConfigured()) {
    redirect('/onboarding/step-2')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/onboarding')
  }
}
