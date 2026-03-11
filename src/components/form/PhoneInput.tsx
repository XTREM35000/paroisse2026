import { Input } from "@/components/ui/input"

export default function PhoneInput({value,onChange}:{value:string,onChange:(v:string)=>void}){

return(

<Input
type="tel"
placeholder="+225 07 00 00 00 00"
value={value}
onChange={(e)=>onChange(e.target.value)}
/>

)

}