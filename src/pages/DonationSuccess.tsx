import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

export default function DonationSuccess() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id')

      if (!sessionId) {
        setStatus('error')
        setMessage('Session de paiement manquante')
        return
      }

      try {
        // Vérifier le statut de la donation en base via API REST
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/donations?stripe_session_id=eq.${sessionId}&select=id,amount,currency,payment_status`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch donation')
        }

        const donations = await response.json()

        if (!donations || donations.length === 0) {
          console.error('Donation not found')
          setStatus('error')
          setMessage('Donation introuvable')
          return
        }

        const donation = donations[0]

        // Pour l'instant, on considère que si on arrive ici, c'est que Stripe a redirigé
        // En production, il faudrait vérifier le webhook de Stripe
        if (donation.payment_status === 'pending') {
          // Mettre à jour le statut
          const updateResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/donations?id=eq.${donation.id}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({ payment_status: 'completed' })
            }
          )

          if (!updateResponse.ok) {
            console.error('Failed to update donation status')
          }
        }

        setStatus('success')
        setMessage(`Merci pour votre don de ${donation.amount} ${donation.currency} !`)

      } catch (error) {
        console.error('Error verifying payment:', error)
        setStatus('error')
        setMessage('Erreur lors de la vérification du paiement')
      }
    }

    verifyPayment()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg">Vérification du paiement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'success' ? (
          <>
            <h1 className="text-4xl font-bold text-green-600 mb-4">
              Paiement réussi ! 🎉
            </h1>
            <p className="text-lg mb-6">{message}</p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-red-600 mb-4">
              Erreur de paiement
            </h1>
            <p className="text-lg mb-6">{message}</p>
          </>
        )}

        <a
          href="/"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  )
}