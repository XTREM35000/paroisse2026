import { Resend } from "https://esm.sh/resend"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

export async function sendReceipt(email:string,amount:number){

await resend.emails.send({

from:"don@paroisse.org",

to:email,

subject:"Reçu de donation",

html:`
<h1>Merci pour votre don</h1>

<p>Montant : ${amount} €</p>

`

})

}