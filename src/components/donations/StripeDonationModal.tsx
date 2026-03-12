
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CurrencySelect from "@/components/form/CurrencySelect";
import PhoneInput from "@/components/form/PhoneInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import UnifiedFormModal from "@/components/ui/unified-form-modal";
import { PaymentLogosCardsOnly } from "@/components/donations/PaymentLogosSection";
import EmailInputWithSuffix from "@/components/EmailInputWithSuffix";

export default function StripeDonationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	// ...existing code...
	const [amount, setAmount] = useState(getMinAmount("XOF").toString());
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [currency, setCurrency] = useState("XOF");
	const [emailValid, setEmailValid] = useState(true);

	const getMinAmount = (currency: string) => {
		switch (currency) {
			case "XOF": return 5000;
			case "EUR": return 8; // ~5000 XOF
			case "USD": return 8;
			case "CAD": return 10;
			case "GBP": return 7;
			case "CNY": return 60;
			default: return 5000;
		}
	};

	const submit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const min = getMinAmount(currency);
		const amt = Number(amount);
		if (isNaN(amt) || amt < min) {
			alert(`Le montant minimum est ${min} ${currency}`);
			return;
		}
		if (!emailValid || !email) {
			alert("Veuillez saisir un email valide.");
			return;
		}
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			alert("Veuillez vous connecter");
			return;
		}
		const { data: donation, error } = await supabase
			.from("donations")
			.insert({
				user_id: user.id,
				amount: amt,
				currency,
				payer_email: email,
				payer_phone: phone,
				payment_method: "stripe",
			})
			.select()
			.single();
		if (error) {
			console.error(error);
			return;
		}
		const { data } = await supabase.functions.invoke("create-payment", {
			body: { donationId: donation.id },
		});
		window.location.href = data.url;
	};

	return (
		<UnifiedFormModal
			open={open}
			onClose={onClose}
			title="Don par carte bancaire"
			headerClassName="bg-amber-900"
			maxWidth="max-w-md"
		>
			<PaymentLogosCardsOnly />
			<form onSubmit={submit} className="space-y-4">
				<Input
					placeholder={`Montant (min ${getMinAmount(currency)} ${currency})`}
					value={amount}
					type="number"
					min={getMinAmount(currency)}
					step="1"
					pattern="[0-9]*"
					inputMode="numeric"
					onChange={(e) => {
						// Empêche la saisie non numérique
						const val = e.target.value.replace(/[^0-9]/g, "");
						setAmount(val);
					}}
				/>
				<CurrencySelect value={currency} onChange={setCurrency} />
				<EmailInputWithSuffix
					email={email}
					onEmailChange={setEmail}
					onValidationChange={setEmailValid}
				/>
				<PhoneInput value={phone} onChange={setPhone} />
				<Button type="submit" className="w-full bg-green-600">
					Payer
				</Button>
			</form>
			<Button variant="outline" onClick={onClose} className="w-full">
				Annuler
			</Button>
		</UnifiedFormModal>
	);
}