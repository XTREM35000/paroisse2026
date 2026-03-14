const CINETPAY_BASE_URL =
  import.meta.env.VITE_CINETPAY_BASE_URL || 'https://api.cinetpay.com/v1';

export interface CinetPayAuthResponse {
  code: number;
  status: string;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function getCinetPayToken(): Promise<string> {
  const response = await fetch(`${CINETPAY_BASE_URL}/oauth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: import.meta.env.VITE_CINETPAY_API_KEY,
      api_password: import.meta.env.VITE_CINETPAY_API_PASSWORD,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message || 'Échec authentification CinetPay'
    );
  }

  const data: CinetPayAuthResponse = await response.json();
  return data.access_token;
}

export async function initCinetPayPayment(paymentData: Record<string, unknown>) {
  const token = await getCinetPayToken();

  const response = await fetch(`${CINETPAY_BASE_URL}/payment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  });

  return response.json();
}

/**
 * Vérifie la signature du webhook CinetPay (côté serveur).
 * À implémenter selon la doc CinetPay si une signature est fournie.
 */
export function verifyCinetPayWebhook(_payload: unknown): boolean {
  // TODO: implémenter la vérification de signature si CinetPay la fournit
  return true;
}
