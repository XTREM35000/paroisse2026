import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function DonationSuccess(){

const navigate=useNavigate()

useEffect(()=>{

setTimeout(()=>{

navigate("/donate")

},4000)

},[])

return(

<div className="min-h-screen flex items-center justify-center">

<div className="bg-white p-10 rounded-xl text-center">

<h1 className="text-3xl text-green-600">

Paiement réussi ❤️

</h1>

<p className="mt-4">

Merci pour votre don !

</p>

<p className="text-sm text-gray-500">

Retour automatique...

</p>

</div>

</div>

)

}