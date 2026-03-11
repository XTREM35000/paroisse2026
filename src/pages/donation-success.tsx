import { useEffect, useState } from "react"

export default function DonationSuccess() {

  const [status, setStatus] = useState("loading")
  const [amount, setAmount] = useState(null)

  useEffect(() => {

    const verify = async () => {

      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get("session_id")

      if (!sessionId) {
        setStatus("error")
        return
      }

      try {

        const res = await fetch(
          "https://cghwsbkxcjsutqwzdbwe.supabase.co/functions/v1/verify-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ sessionId })
          }
        )

        const data = await res.json()

        if (data.success) {
          setAmount(data.amount)
          setStatus("success")
        } else {
          setStatus("error")
        }

      } catch {
        setStatus("error")
      }

    }

    verify()

  }, [])

  if (status === "loading") {
    return <div>Paiement en vérification...</div>
  }

  if (status === "error") {
    return <div>Erreur de vérification du paiement.</div>
  }

  return (
    <div className="donation-success">

      <h1>Merci pour votre don 🙏</h1>

      <p>
        Votre paiement de <strong>{amount}</strong> a été confirmé.
      </p>

      <a href="/donate">
        Retour à la page de dons
      </a>

    </div>
  )

}
