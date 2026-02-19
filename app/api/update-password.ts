// pages/api/update-password.ts
import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // This bypasses RLS
    )

    const { userId, password } = req.body

    if (!userId || !password) {
      return res.status(400).json({ error: 'Missing userId or password' })
    }

    // Update ONLY the password field in users table
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password: password })
      .eq('id', userId)

    if (error) throw error

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Error updating password:', error)
    return res.status(500).json({ error: error.message })
  }
}