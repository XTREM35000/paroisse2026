export function useMobilePayment(){

const pay = async(donationId:string)=>{

const res = await fetch(
`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/create-payment`,
{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
donationId,
method:"cinetpay"
})
})

return res.json()
}

return {pay}

}