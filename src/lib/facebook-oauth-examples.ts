// FACEBOOK_OAUTH_ADVANCED_EXAMPLES.ts
// Exemples de code avancé pour Facebook OAuth si vous sortez de Supabase

/**
 * ⚠️ ATTENTION : Ces exemples sont OPTIONNELS
 * Supabase gère déjà tout nativement. Ne les utiliser que si vous devez :
 * - Personnaliser la vérification des tokens
 * - Récupérer des données Facebook additionnelles
 * - Implémenter une logique métier spéciale
 */

// ============================================
// 1️⃣ VÉRIFICATION PERSONNALISÉE DE TOKEN (Backend Node.js/Express)
// ============================================

import axios from 'axios';

/**
 * Vérifier un token Facebook directement (SANS Supabase)
 * NE PAS EXPOSER LA CLÉ SECRÈTE EN FRONTEND
 * 
 * À utiliser uniquement si :
 * - Vous avez un serveur backend privé
 * - Vous voulez une couche de sécurité supplémentaire
 */
async function verifyFacebookToken(accessToken: string): Promise<{
  isValid: boolean;
  userId: string | null;
  email?: string;
  name?: string;
}> {
  const APP_ID = '3041743659361307';
  const APP_SECRET = '7c52e7ad39f5e959853729127775b730'; // 🔒 JAMAIS en frontend
  const API_VERSION = 'v24.0';

  try {
    // Étape 1 : Vérifier le token auprès de Facebook
    const debugTokenUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${APP_ID}|${APP_SECRET}`;
    
    const debugResponse = await axios.get(debugTokenUrl);
    const tokenData = debugResponse.data.data;

    if (!tokenData.is_valid || tokenData.app_id !== APP_ID) {
      console.error('Token invalide ou mauvais App ID');
      return { isValid: false, userId: null };
    }

    // Étape 2 : Récupérer les infos utilisateur
    const userUrl = `https://graph.facebook.com/${API_VERSION}/me?fields=id,name,email,picture&access_token=${accessToken}`;
    const userResponse = await axios.get(userUrl);
    const userData = userResponse.data;

    console.log('✅ Token Facebook valide pour', userData.id);

    return {
      isValid: true,
      userId: userData.id,
      email: userData.email,
      name: userData.name,
    };
  } catch (error) {
    console.error('❌ Erreur vérification token Facebook:', error);
    return { isValid: false, userId: null };
  }
}

// ============================================
// 2️⃣ ROUTE BACKEND EXPRESS (EXEMPLE)
// ============================================

/**
 * Route backend qui reçoit le token du frontend et le vérifie
 * 
 * EXEMPLE SEULEMENT - Vous n'en avez pas besoin avec Supabase !
 */
// import express from 'express';
// const router = express.Router();

// router.post('/auth/facebook-verify', async (req, res) => {
//   const { accessToken } = req.body;

//   if (!accessToken) {
//     return res.status(400).json({ success: false, message: 'Token manquant' });
//   }

//   try {
//     const verification = await verifyFacebookToken(accessToken);

//     if (!verification.isValid) {
//       return res.status(401).json({ success: false, message: 'Token invalide' });
//     }

//     // Créer la session utilisateur
//     req.session.userId = verification.userId;
//     req.session.userEmail = verification.email;

//     return res.json({
//       success: true,
//       message: 'Authentification réussie',
//       user: {
//         facebookId: verification.userId,
//         email: verification.email,
//         name: verification.name,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Erreur serveur lors de l\'authentification Facebook' 
//     });
//   }
// });

// ============================================
// 3️⃣ APPEL FRONTEND PERSONNALISÉ (SANS SUPABASE)
// ============================================

/**
 * Fonction frontend si vous utilisez Facebook SDK classique au lieu de Supabase
 * 
 * ATTENTION : N'utilisez PAS si Supabase gère déjà l'OAuth !
 */
// function handleFacebookLoginCustom() {
//   // @ts-ignore - FB est chargé via le SDK script dans index.html
//   if (!window.FB) {
//     alert('SDK Facebook non chargé');
//     return;
//   }

//   // @ts-ignore
//   window.FB.login(async (response: any) => {
//     if (response.authResponse) {
//       const accessToken = response.authResponse.accessToken;
//       console.log('Token Facebook reçu:', accessToken);

//       try {
//         // Envoyer au BACKEND pour vérification (pas directement à Facebook)
//         const verifyResponse = await fetch('/api/auth/facebook-verify', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ accessToken }),
//           credentials: 'include', // Inclure les cookies de session
//         });

//         const data = await verifyResponse.json();

//         if (data.success) {
//           // Redirection réussie
//           window.location.href = '/dashboard';
//         } else {
//           alert('Erreur: ' + data.message);
//         }
//       } catch (error) {
//         console.error('Erreur lors de la vérification:', error);
//         alert('Impossible de contacter le serveur d\'authentification');
//       }
//     } else {
//       console.log('Connexion Facebook annulée par l\'utilisateur');
//     }
//   }, {
//     scope: 'public_profile,email',
//   });
// }

// ============================================
// 4️⃣ RÉCUPÉRER DES DONNÉES FACEBOOK ADDITIONNELLES
// ============================================

/**
 * Récupérer des infos avancées depuis Facebook Graph API
 * (e.g., photo de profil haute résolution, localisation, etc.)
 */
async function getFacebookUserData(accessToken: string, fields: string[] = []) {
  const API_VERSION = 'v24.0';
  const defaultFields = ['id', 'name', 'email', 'picture.type(large)'];
  const allFields = [...new Set([...defaultFields, ...fields])];

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/me?fields=${allFields.join(',')}&access_token=${accessToken}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Erreur récupération données Facebook:', error);
    throw error;
  }
}

// Exemples d'utilisation :
// const userData = await getFacebookUserData(token, ['birthday', 'location', 'gender']);
// console.log(userData.picture.data.url); // URL photo de profil

// ============================================
// 5️⃣ GÉRER LE LOGOUT FACEBOOK
// ============================================

/**
 * Se déconnecter de Facebook aussi (optionnel)
 */
async function facebookLogout() {
  // @ts-ignore
  if (window.FB) {
    // @ts-ignore
    window.FB.logout((response: any) => {
      console.log('Déconnecté de Facebook:', response);
    });
  }

  // Déconnecter aussi du côté Supabase
  const { supabase } = await import('@/integrations/supabase/client');
  await supabase.auth.signOut();
  
  window.location.href = '/';
}

// ============================================
// 6️⃣ EXEMPLE : STOCKER L'ID FACEBOOK DANS LE PROFIL
// ============================================

/**
 * Si vous voulez lier le Facebook ID au profil utilisateur Supabase
 */
async function saveFacebookIdToProfile(
  userId: string,
  facebookId: string,
  supabaseClient: any
) {
  try {
    const { error } = await supabaseClient
      .from('profiles')
      .update({ facebook_id: facebookId })
      .eq('id', userId);

    if (error) throw error;
    console.log('✅ Facebook ID sauvegardé au profil');
  } catch (error) {
    console.error('❌ Erreur sauvegarde Facebook ID:', error);
  }
}

// ============================================
// 7️⃣ TYPE TYPESCRIPT POUR DONNÉES FACEBOOK
// ============================================

export interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture?: {
    data: {
      height: number;
      width: number;
      url: string;
      is_silhouette: boolean;
    };
  };
}

export interface TokenVerificationResult {
  isValid: boolean;
  userId: string | null;
  email?: string;
  name?: string;
}

// ============================================
// ⚡ RÉSUMÉ : QUAND UTILISER QUOI
// ============================================

/**
 * ✅ UTILISEZ SUPABASE (déjà implémenté) SI :
 * - Vous voulez la solution la plus simple et sécurisée
 * - Vous ne voulez pas gérer d'authentification backend
 * - Vous faites confiance à l'infrastructure de Supabase
 * - Vous n'avez pas de logique métier spéciale
 *
 * ❌ UTILISEZ LES EXEMPLES PERSONNALISÉS SI :
 * - Vous avez BESOIN d'un serveur backend privé
 * - Vous avez des validations métier spéciales
 * - Vous devez intégrer Facebook à une infrastructure existante
 * - Vous avez des contraintes de conformité particulières
 */

export {
  verifyFacebookToken,
  getFacebookUserData,
  facebookLogout,
  saveFacebookIdToProfile,
};
