import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CurrencySelect from "@/components/form/CurrencySelect";
import PhoneInput from "@/components/form/PhoneInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import UnifiedFormModal from "@/components/ui/unified-form-modal";
import { PaymentLogosCardsOnly } from "@/components/donations/PaymentLogosSection";

export default function StripeDonationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	const getMinAmount = (currency: string) => {
		switch (currency) {
			case "XOF": return 5000;
			case "EUR": return 8;
			case "USD": return 8;
			case "CAD": return 10;
			case "GBP": return 7;
			case "CNY": return 60;
			default: return 5000;
		}
	};
	
	const [amount, setAmount] = useState(getMinAmount("XOF").toString());
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [currency, setCurrency] = useState("XOF");
	const [emailError, setEmailError] = useState("");

	// Fonction de validation d'email
	const validateEmail = (email: string): boolean => {
		if (!email) {
			setEmailError("L'email est requis");
			return false;
		}
		
		// Regex pour validation d'email complète
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		const isValid = emailRegex.test(email);
		
		if (!isValid) {
			setEmailError("Format d'email invalide (exemple: nom@domaine.com)");
		} else {
			setEmailError("");
		}
		
		return isValid;
	};

	const submit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		
		// Validation du montant
		const min = getMinAmount(currency);
		const amt = Number(amount);
		if (isNaN(amt) || amt < min) {
			alert(`Le montant minimum est ${min} ${currency}`);
			return;
		}
		
		// Validation de l'email
		if (!validateEmail(email)) {
			alert(emailError || "Veuillez saisir un email valide");
			return;
		}
		
		// Vérification de l'utilisateur connecté
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			alert("Veuillez vous connecter");
			return;
		}

		// Création du don
		const { data: donation, error } = await supabase
			.from("donations")
			.insert({
				user_id: user.id,
				amount: amt,
				currency,
				payer_email: email, // ✅ Email complet sauvegardé
				payer_phone: phone,
				payment_method: "stripe",
				payment_status: "pending",
				is_anonymous: false,
				is_active: true
			})
			.select()
			.single();

		if (error) {
			console.error("Erreur lors de la création du don:", error);
			alert("Erreur lors de la création du don. Veuillez réessayer.");
			return;
		}

		try {
			const { data, error: invokeError } = await supabase.functions.invoke("create-payment", {
				body: { donationId: donation.id },
			});

			if (invokeError) {
				console.error("Erreur lors de l'appel à create-payment:", invokeError);
				alert("Erreur lors de la création du paiement. Veuillez réessayer.");
				return;
			}

			if (data?.url) {
				window.location.href = data.url;
			} else {
				console.error("Pas d'URL de redirection:", data);
				alert("Erreur: Pas d'URL de redirection reçue.");
			}
		} catch (err) {
			console.error("Exception lors de l'appel à create-payment:", err);
			alert("Erreur lors de la communication avec le serveur.");
		}
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
				{/* Champ montant */}
				<div>
					<Input
						placeholder={`Montant (min ${getMinAmount(currency)} ${currency})`}
						value={amount}
						type="number"
						min={getMinAmount(currency)}
						step="1"
						pattern="[0-9]*"
						inputMode="numeric"
						onChange={(e) => {
							const val = e.target.value.replace(/[^0-9]/g, "");
							setAmount(val);
						}}
					/>
				</div>

				{/* Sélecteur de devise */}
				<CurrencySelect value={currency} onChange={setCurrency} />

				{/* Champ email - SAISIE LIBRE avec validation */}
				<div>
					<Input
						type="email"
						placeholder="Votre email (ex: nom@domaine.com)"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							validateEmail(e.target.value);
						}}
						className={emailError ? "border-red-500" : ""}
						required
					/>
					{emailError && (
						<p className="text-sm text-red-500 mt-1">{emailError}</p>
					)}
				</div>

				{/* Champ téléphone */}
				<PhoneInput value={phone} onChange={setPhone} />

				{/* Bouton de paiement */}
				<Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
					Payer avec Stripe
				</Button>
			</form>

			{/* Bouton annuler */}
			<Button variant="outline" onClick={onClose} className="w-full mt-2">
				Annuler
			</Button>
		</UnifiedFormModal>
	);
}