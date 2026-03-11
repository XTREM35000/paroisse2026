import { useState } from "react"

import UnifiedFormModal from "@/components/ui/unified-form-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { useCreateDonation } from "@/hooks/useCreateDonation"
import { useMobilePayment } from "@/hooks/useMobilePayment"

export default function MobileMoneyDonationModal({open,onClose}:{open:boolean,onClose:()=>void}){

const {createDonation} = useCreateDonation()
const {pay} = useMobilePayment()

const [amount,setAmount] = useState("")
const [phone,setPhone] = useState("")

const submit = async(e: React.FormEvent<HTMLFormElement>)=>{
e.preventDefault()

const donation = await createDonation({
amount:Number(amount),
currency:"XOF",
payment_method:"cinetpay",
payer_name:"Donateur",
payer_email:"don@example.com",
payer_phone:phone
})

if(!donation) return

const res = await pay(donation.id)

window.location.href = res.paymentUrl
}

return(

<UnifiedFormModal open={open} onClose={onClose} title="Mobile Money">

<div className="flex gap-3 justify-center mb-4">

<img src="/svg/MTN.svg" className="h-8"/>
<img src="/svg/ORANGE.svg" className="h-8"/>
<img src="/svg/MOOV.svg" className="h-8"/>
<img src="/svg/WAVE.svg" className="h-8"/>

</div>

<form onSubmit={submit} className="space-y-4">

<div>
<Label>Montant</Label>
<Input value={amount} onChange={e=>setAmount(e.target.value)} />
</div>

<div>
<Label>Téléphone</Label>
<Input value={phone} onChange={e=>setPhone(e.target.value)} />
</div>

<Button className="w-full bg-orange-600 hover:bg-orange-700">
Payer avec Mobile Money
</Button>

</form>

</UnifiedFormModal>

)
}