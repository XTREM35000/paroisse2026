import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"

import CurrencySelect from "@/components/forms/CurrencySelect"
import PhoneInput from "@/components/forms/PhoneInput"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function StripeDonationModal({open,onClose}:{open:boolean,onClose:()=>void}){

const [amount,setAmount]=useState("10")
const [email,setEmail]=useState("")
const [phone,setPhone]=useState("")
const [currency,setCurrency]=useState("XOF")

const submit=async(e:any)=>{

e.preventDefault()

const {data:{user}}=await supabase.auth.getUser()

if(!user){

alert("Veuillez vous connecter")

return

}

const {data:donation,error}=await supabase

.from("donations")

.insert({

user_id:user.id,

amount:Number(amount),

currency,

payer_email:email,

payer_phone:phone,

payment_method:"stripe"

})

.select()

.single()

if(error){

console.error(error)

return

}

const {data}=await supabase.functions.invoke("create-payment",{

body:{donationId:donation.id}

})

window.location.href=data.url

}

if(!open) return null

return(

<div className="fixed inset-0 flex items-center justify-center bg-black/40">

<div className="bg-white p-8 rounded-xl w-full max-w-md space-y-4">

<h2 className="text-xl font-bold">

Don par carte bancaire

</h2>

<form onSubmit={submit} className="space-y-4">

<Input

placeholder="Montant"

value={amount}

onChange={(e)=>setAmount(e.target.value)}

/>

<CurrencySelect value={currency} onChange={setCurrency} />

<Input

type="email"

placeholder="Email"

value={email}

onChange={(e)=>setEmail(e.target.value)}

/>

<PhoneInput value={phone} onChange={setPhone} />

<Button type="submit" className="w-full bg-green-600">

Payer

</Button>

</form>

<Button variant="outline" onClick={onClose} className="w-full">

Annuler

</Button>

</div>

</div>

)

}