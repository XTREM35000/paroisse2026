import { supabase } from '@/integrations/supabase/client'

export function useStripePayment(){

const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`

const makePaymentRequest = async(token: string, donationId: string) => {
  console.log('useStripePayment: Making payment request with token length:', token.length)
  console.log('useStripePayment: Request URL:', functionsUrl)
  console.log('useStripePayment: Request body:', JSON.stringify({
    donationId,
    method:"stripe"
  }))
  
  const res = await fetch(
    functionsUrl,
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization": `Bearer ${token}`
      },
      body:JSON.stringify({
        donationId,
        method:"stripe"
      })
    }
  )

  console.log('useStripePayment: Fetch response status:', res.status)
  console.log('useStripePayment: Fetch response headers:', Object.fromEntries(res.headers.entries()))

  const data = await res.json()
  console.log('useStripePayment: Response data:', data)

  return data
}

const pay = async(donationId:string)=>{

console.log('useStripePayment: Starting payment for donation:', donationId)
console.log('useStripePayment: Functions URL:', functionsUrl)

// Récupérer le token d'authentification (comme dans useAuth.tsx)
const { data: { user }, error: userError } = await supabase.auth.getUser()

console.log('useStripePayment: User data:', user)
console.log('useStripePayment: User error:', userError)

if (userError || !user) {
  throw new Error(`Erreur d'authentification: ${userError?.message || 'Utilisateur non trouvé'}`)
}

// Récupérer la session pour le token
const { data: { session }, error: sessionError } = await supabase.auth.getSession()

console.log('useStripePayment: Session data:', session)
console.log('useStripePayment: Session error:', sessionError)

if (sessionError) {
  throw new Error(`Erreur de session: ${sessionError.message}`)
}

const token = session?.access_token

console.log('useStripePayment: Token exists:', !!token)
console.log('useStripePayment: Token length:', token?.length)

if (!token) {
  throw new Error('Utilisateur non authentifié - pas de token')
}

// Vérifier si le token est expiré et le rafraîchir si nécessaire
const now = Math.floor(Date.now() / 1000)
if (session.expires_at && session.expires_at < now) {
  console.log('useStripePayment: Token expired, refreshing...')
  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
  
  if (refreshError) {
    throw new Error(`Erreur de rafraîchissement du token: ${refreshError.message}`)
  }
  
  const newToken = refreshData.session?.access_token
  if (!newToken) {
    throw new Error('Impossible de rafraîchir le token')
  }
  
  console.log('useStripePayment: Token refreshed successfully')
  // Utiliser le nouveau token
  return await makePaymentRequest(newToken, donationId)
}

return await makePaymentRequest(token, donationId)
}

return {pay}

}