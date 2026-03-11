import { useState } from "react"
import { motion } from "framer-motion"
import { Heart } from "lucide-react"

import { Button } from "@/components/ui/button"

import PaymentMethodSelector from "@/components/donations/PaymentMethodSelector"
import StripeDonationModal from "@/components/donations/StripeDonationModal"
import MobileMoneyDonationModal from "@/components/donations/MobileMoneyDonationModal"
import CashDonationModal from "@/components/donations/CashDonationModal"
import HeroBanner from "@/components/HeroBanner"
import { useLocation } from 'react-router-dom'
import usePageHero from '@/hooks/usePageHero'

export default function Donate() {

const [method,setMethod] = useState<string|null>(null)
const [open,setOpen] = useState(false)

const location = useLocation()
const { data: hero, save: saveHero } = usePageHero(location.pathname)

return (

<div className="min-h-screen bg-background flex flex-col">

<HeroBanner
  title="Faire un don"
  subtitle="Soutenez notre mission avec votre générosité"
  showBackButton={true}
  backgroundImage={hero?.image_url}
  onBgSave={saveHero}
/>

<div className="container mx-auto px-4 py-12">

{/* SECTION PAYMENT */}

<motion.section
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="mb-16"
>

<h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-green-700">
Choisissez votre méthode de paiement
</h2>

<p className="text-center text-gray-600 mb-12">
Sélectionnez une méthode pour continuer vers votre don
</p>

<PaymentMethodSelector
selectedMethod={method}
onSelect={(m)=>setMethod(m)}
methods={[
{
id: "stripe-1",
code:"stripe",
label:"Carte bancaire",
description:"Visa / Mastercard",
icon:"CreditCard",
is_active: true,
requires_validation: false
},
{
id: "cinetpay-1",
code:"cinetpay",
label:"Mobile Money",
description:"MTN / Orange / Moov / Wave",
icon:"Smartphone",
is_active: true,
requires_validation: false
},
{
id: "cash-1",
code:"cash",
label:"Guichet Paroisse",
description:"Paiement en espèces",
icon:"DollarSign",
is_active: true,
requires_validation: false
}
]}
/>

</motion.section>


{/* BOUTON CONTINUER */}

{method && (

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
transition={{delay:0.2}}
className="text-center mb-16"
>

<Button
onClick={()=>setOpen(true)}
className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
size="lg"
>

<Heart className="h-6 w-6 mr-3"/>

Continuer vers le don

</Button>

</motion.div>

)}


{/* MODALS */}

{method==="stripe" && (
<StripeDonationModal
open={open}
onClose={()=>{setOpen(false);setMethod(null)}}
/>
)}

{method==="cinetpay" && (
<MobileMoneyDonationModal
open={open}
onClose={()=>{setOpen(false);setMethod(null)}}
/>
)}

{method==="cash" && (
<CashDonationModal
open={open}
onClose={()=>{setOpen(false);setMethod(null)}}
/>
)}

</div>

</div>

)
}