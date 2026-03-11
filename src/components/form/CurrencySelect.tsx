import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props = {
value:string
onChange:(v:string)=>void
}

export default function CurrencySelect({value,onChange}:Props){

return(

<Select value={value} onValueChange={onChange}>

<SelectTrigger>

<SelectValue placeholder="Choisir une devise" />

</SelectTrigger>

<SelectContent>

<SelectItem value="XOF">Franc CFA (XOF)</SelectItem>

<SelectItem value="EUR">Euro (EUR)</SelectItem>

<SelectItem value="USD">Dollar Américain</SelectItem>

<SelectItem value="CAD">Dollar Canadien</SelectItem>

<SelectItem value="GBP">Livre Sterling</SelectItem>

<SelectItem value="CNY">Yuan</SelectItem>

</SelectContent>

</Select>

)

}