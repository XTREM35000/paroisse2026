#!/bin/bash

# =====================================================
# NETTOYAGE DU PROJET – FICHIERS INUTILES
# =====================================================

echo "🧹 Nettoyage des fichiers inutiles..."

# 1. Supprimer les fichiers de test
echo "   → Suppression des fichiers de test..."
rm -f sms.json signup.json data.json test-payment.json test.json

# 2. Supprimer les scripts de nettoyage Cursor
echo "   → Suppression des scripts Cursor..."
rm -f clean-cursor.sh reset-cursor.js reset-cursor.mjs reset-cursor1.mjs

# 3. Supprimer les scripts de vérification
echo "   → Suppression des scripts de vérification..."
rm -f check-chatpage.sh deploy-email-fix.sh VERIFICATION_VIDEOS.sh

# 4. Supprimer les scripts OAuth (si plus utilisés)
echo "   → Suppression des scripts OAuth..."
rm -f facebook-oauth-validation.ps1 facebook-oauth-validation.sh

# 5. Supprimer les fichiers timestamp Vite
echo "   → Suppression des fichiers timestamp Vite..."
rm -f vite.config.ts.timestamp-*.mjs

# 6. Supprimer les migrations en double
echo "   → Suppression des migrations en double..."
cd supabase/migrations
rm -f 20260323_fix_signup_profile_trigger_rls.sql
rm -f 20260324_init_system_rpc.sql
rm -f 20260325_init_system_force_replace.sql
cd ../..

# 7. Supprimer les fichiers project_structure* (si présents)
echo "   → Suppression des anciennes structures de projet..."
rm -f project_structure*.txt

echo ""
echo "✅ Nettoyage terminé !"
echo ""
echo "📊 Résumé des suppressions :"
echo "   • Fichiers de test : 5"
echo "   • Scripts Cursor : 4"
echo "   • Scripts vérification : 3"
echo "   • Scripts OAuth : 2"
echo "   • Fichiers timestamp Vite : plusieurs"
echo "   • Migrations en double : 3"
echo "   • Structures projet : toutes"