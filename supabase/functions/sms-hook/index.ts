// supabase/functions/sms-hook/index.ts
// Hook SMS pour Supabase Auth - Intégration API Orange SMS Côte d'Ivoire 2.0
// Remplace Twilio sans modifier le frontend ni la config Auth existante

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Interface pour le payload du webhook Supabase Auth
interface SupabaseSMSWebhookPayload {
  type: "sms.send";
  event: {
    user?: {
      phone?: string;
      email?: string;
      id?: string;
    };
    sms?: {
      otp?: string;
      token_hash?: string;
      phone?: string;
    };
    phone?: string;
    otp?: string;
  };
  created_at: string;
}

// Interface pour la réponse OAuth Orange
interface OrangeTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

// Interface pour la réponse SMS Orange
interface OrangeSMSResponse {
  outboundSMSMessageRequest: {
    resourceURL: string;
    requestError?: {
      policyException?: {
        messageId: string;
        text: string;
      };
    };
  };
}

// Cache en mémoire pour le token Orange (valide 50-55 minutes)
let tokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

/**
 * Obtient un token d'accès Orange via OAuth 2.0 Client Credentials
 */
async function getOrangeAccessToken(): Promise<string> {
  // Vérifier le cache
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    console.log("Utilisation du token Orange depuis le cache");
    return tokenCache.token;
  }

  const clientId = Deno.env.get("ORANGE_CLIENT_ID");
  const clientSecret = Deno.env.get("ORANGE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Identifiants Orange manquants dans les variables d'environnement");
  }

  // Encoder les credentials pour l'authentification Basic
  const credentials = btoa(`${clientId}:${clientSecret}`);
  
  const tokenUrl = "https://api.orange.com/oauth/v3/token";
  
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Échec d'obtention du token Orange: ${response.status} - ${errorText}`);
    throw new Error(`Orange OAuth Error: ${response.status}`);
  }

  const data: OrangeTokenResponse = await response.json();
  
  // Mettre en cache avec une marge de sécurité (50 minutes au lieu de 55)
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // -5 minutes de marge
  };

  console.log("Nouveau token Orange obtenu et mis en cache");
  return data.access_token;
}

/**
 * Envoie un SMS via l'API Orange
 */
async function sendOrangeSMS(
  phoneNumber: string,
  otpCode: string,
  accessToken: string
): Promise<boolean> {
  const senderAddress = Deno.env.get("ORANGE_SENDER_ADDRESS") || "tel:+2250000";
  const senderName = Deno.env.get("ORANGE_SENDER_NAME") || "PAROISSE";
  
  // Formater le numéro de téléphone (s'assurer qu'il commence par +)
  const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
  
  // URL encoder l'adresse de l'expéditeur
  const encodedSenderAddress = encodeURIComponent(senderAddress);
  
  const smsUrl = `https://api.orange.com/smsmessaging/v1/outbound/${encodedSenderAddress}/requests`;
  
  const message = `Votre code ${senderName} est : ${otpCode}`;
  
  const payload = {
    outboundSMSMessageRequest: {
      address: `tel:${formattedPhone}`,
      senderAddress: senderAddress,
      outboundSMSTextMessage: {
        message: message
      },
      senderName: senderName
    }
  };

  console.log(`Envoi SMS Orange à: ${formattedPhone}, OTP: ${otpCode}`);
  
  const response = await fetch(smsUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 201) {
    const data: OrangeSMSResponse = await response.json();
    console.log(`SMS Orange envoyé avec succès: ${data.outboundSMSMessageRequest.resourceURL}`);
    return true;
  } else {
    const errorText = await response.text();
    console.error(`Échec envoi SMS Orange: ${response.status} - ${errorText}`);
    return false;
  }
}

/**
 * Formate le numéro de téléphone pour l'API Orange
 */
function formatPhoneNumber(phone: string): string {
  // Nettoyer le numéro
  let cleaned = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
  
  // S'assurer que le numéro commence par +
  if (!cleaned.startsWith("+")) {
    // Si c'est un numéro français, ajouter +33
    if (cleaned.startsWith("0")) {
      cleaned = "+33" + cleaned.substring(1);
    } 
    // Si c'est un numéro ivoirien, ajouter +225
    else if (cleaned.startsWith("225")) {
      cleaned = "+" + cleaned;
    }
    // Sinon, ajouter simplement +
    else {
      cleaned = "+" + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Extrait le numéro de téléphone et l'OTP du payload du webhook
 */
function extractPhoneAndOTP(payload: SupabaseSMSWebhookPayload): { phone: string; otp: string } | null {
  // Essayer différentes structures de payload (selon la version de Supabase)
  
  // Structure 1: event.sms.otp et event.sms.phone
  if (payload.event.sms?.otp && payload.event.sms?.phone) {
    return {
      phone: payload.event.sms.phone,
      otp: payload.event.sms.otp
    };
  }
  
  // Structure 2: event.user.phone et event.sms.otp
  if (payload.event.user?.phone && payload.event.sms?.otp) {
    return {
      phone: payload.event.user.phone,
      otp: payload.event.sms.otp
    };
  }
  
  // Structure 3: event.phone et event.otp
  if (payload.event.phone && payload.event.otp) {
    return {
      phone: payload.event.phone,
      otp: payload.event.otp
    };
  }
  
  // Structure 4: event.sms.otp et event.phone
  if (payload.event.sms?.otp && payload.event.phone) {
    return {
      phone: payload.event.phone,
      otp: payload.event.sms.otp
    };
  }
  
  console.error("Impossible d'extraire le numéro et l'OTP du payload:", JSON.stringify(payload));
  return null;
}

/**
 * Vérifie la signature du webhook Supabase (Standard Webhooks format)
 * Format: "t=timestamp,v1=signature"
 */
async function verifyWebhookSignature(
  request: Request,
  secret: string
): Promise<boolean> {
  try {
    // Lire le body entier pour la vérification
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    // Récupérer l'en-tête de signature (fourni par Supabase)
    const signatureHeader = headers["svix-signature"];
    
    if (!signatureHeader) {
      console.error("Signature manquante dans les headers");
      return false;
    }

    // Parser le header de signature au format "t=timestamp,v1=signature"
    const parts = signatureHeader.split(',');
    let timestamp = '';
    let providedSignature = '';

    for (const part of parts) {
      if (part.startsWith('t=')) {
        timestamp = part.substring(2);
      } else if (part.startsWith('v1=')) {
        providedSignature = part.substring(3);
      }
    }

    if (!timestamp || !providedSignature) {
      console.error("Format de signature invalide");
      return false;
    }

    // Reconstruire le message à signer: "timestamp.body"
    const toSign = `${timestamp}.${body}`;

    // Déchiffrer le secret (sans le préfixe v1,whsec_ s'il existe)
    let secretToUse = secret;
    if (secret.startsWith("v1,whsec_")) {
      secretToUse = secret.substring(9);
    } else if (secret.startsWith("whsec_")) {
      secretToUse = secret.substring(6);
    }

    // Créer la signature HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretToUse);
    const messageData = encoder.encode(toSign);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    
    // Encoder la signature en base64
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Comparer les signatures (constant-time comparison pour éviter les timing attacks)
    const isValid = timingSafeCompare(computedSignature, providedSignature);
    
    if (!isValid) {
      console.error("Signature invalide");
    }

    return isValid;
    
  } catch (error) {
    console.error("Erreur lors de la vérification de la signature:", error);
    return false;
  }
}

/**
 * Comparaison de strings résistante aux timing attacks
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// Handler principal de la fonction Edge
Deno.serve(async (req: Request) => {
  console.log("Fonction sms-hook appelée");
  
  // Vérifier la méthode HTTP
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Méthode non autorisée" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Vérifier la signature du webhook
  const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
  
  if (!hookSecret) {
    console.error("SEND_SMS_HOOK_SECRET non configuré");
    return new Response(
      JSON.stringify({ error: "Configuration manquante" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const isValid = await verifyWebhookSignature(req, hookSecret);
  
  if (!isValid) {
    console.error("Signature du webhook invalide");
    return new Response(
      JSON.stringify({ error: "Signature invalide" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Parser le payload
    const payload: SupabaseSMSWebhookPayload = await req.json();
    console.log("Payload reçu:", JSON.stringify(payload, null, 2));
    
    // Vérifier le type d'événement
    if (payload.type !== "sms.send") {
      console.log(`Type d'événement ignoré: ${payload.type}`);
      return new Response(
        JSON.stringify({ message: "Événement ignoré" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Extraire le numéro et l'OTP
    const phoneAndOTP = extractPhoneAndOTP(payload);
    
    if (!phoneAndOTP) {
      console.error("Payload invalide - impossible d'extraire les données");
      return new Response(
        JSON.stringify({ error: "Payload invalide" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const { phone, otp } = phoneAndOTP;
    
    // Formater le numéro de téléphone
    const formattedPhone = formatPhoneNumber(phone);
    console.log(`Numéro formaté: ${formattedPhone}, OTP: ${otp}`);
    
    // Obtenir un token d'accès Orange
    let accessToken: string;
    try {
      accessToken = await getOrangeAccessToken();
    } catch (error) {
      console.error("Échec d'obtention du token Orange:", error);
      return new Response(
        JSON.stringify({ error: "Service SMS temporairement indisponible" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Envoyer le SMS via Orange
    const smsSent = await sendOrangeSMS(formattedPhone, otp, accessToken);
    
    if (smsSent) {
      console.log(`SMS OTP envoyé avec succès à ${formattedPhone}`);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "SMS envoyé via Orange",
          phone: formattedPhone
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      console.error(`Échec d'envoi du SMS à ${formattedPhone}`);
      
      // ICI: FALLBACK VERS TWILIO EXISTANT
      // Ne rien faire = Supabase utilisera automatiquement son provider Twilio par défaut
      // car cette fonction retourne une erreur
      
      return new Response(
        JSON.stringify({ 
          error: "Échec d'envoi SMS Orange, fallback vers Twilio",
          fallback: true
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
    
  } catch (error) {
    console.error("Erreur interne du serveur:", error);
    
    // En cas d'erreur inattendue, permettre le fallback vers Twilio
    return new Response(
      JSON.stringify({ 
        error: "Erreur interne du serveur",
        fallback: true
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
