import UnifiedFormModal from "@/components/ui/unified-form-modal"
import { Button } from "@/components/ui/button"

export default function CashDonationModal({open,onClose}:{open:boolean,onClose:()=>void}){

return(

<UnifiedFormModal open={open} onClose={onClose} title="Paiement au guichet">

<div className="text-center space-y-4">

<div className="flex justify-center mb-4">
<img src="/svg/espece.png" className="h-16 w-auto"/>
</div>

<p className="text-lg">
Vous pouvez faire votre don directement au guichet de la paroisse.
</p>

<p className="text-sm text-gray-500">
Un reçu officiel vous sera remis.
</p>

<Button onClick={onClose}>
Fermer
</Button>

</div>

</UnifiedFormModal>

)
}