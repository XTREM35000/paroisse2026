#!/bin/bash
# facebook-oauth-validation.sh
# Script de validation de l'intégration Facebook OAuth

echo "🔍 Validation de l'intégration Facebook OAuth"
echo "=============================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0
SUCCESS=0

# Fonction pour tester la présence d'une chaine dans un fichier
check_file_contains() {
  local file=$1
  local search=$2
  local description=$3
  local warning=$4

  if [ ! -f "$file" ]; then
    echo -e "${RED}❌ Fichier non trouvé: $file${NC}"
    ((ERRORS++))
    return
  fi

  if grep -q "$search" "$file"; then
    echo -e "${GREEN}✅ $description${NC}"
    ((SUCCESS++))
  else
    if [ "$warning" = "warning" ]; then
      echo -e "${YELLOW}⚠️  $description (manquant)${NC}"
      ((WARNINGS++))
    else
      echo -e "${RED}❌ $description (manquant)${NC}"
      ((ERRORS++))
    fi
  fi
}

# 1. Vérifier index.html
echo "📄 Vérification des fichiers..."
echo ""

check_file_contains "index.html" "facebook-jssdk" "SDK Facebook chargé dans index.html"
check_file_contains "index.html" "3041743659361307" "App ID Facebook dans index.html"
check_file_contains "index.html" "v24.0" "Version API Facebook dans index.html"

echo ""

# 2. Vérifier LoginForm.tsx
check_file_contains "src/components/LoginForm.tsx" "handleFacebookLogin" "Fonction handleFacebookLogin présente"
check_file_contains "src/components/LoginForm.tsx" "facebookLoading" "État facebookLoading présent"
check_file_contains "src/components/LoginForm.tsx" "signInWithProvider" "Appel Supabase OAuth présent"
check_file_contains "src/components/LoginForm.tsx" "ensureProfileExists" "Création automatique du profil"

echo ""

# 3. Vérifier useAuth.tsx
check_file_contains "src/hooks/useAuth.tsx" "signInWithProvider" "Support OAuth dans useAuth" "warning"
check_file_contains "src/hooks/useAuth.tsx" "facebook" "Support provider Facebook dans useAuth" "warning"
check_file_contains "src/hooks/useAuth.tsx" "scopes: 'email,public_profile'" "Demande explicite des scopes Facebook (email,public_profile)" "warning"

echo ""

# 4. Vérifier les fichiers de documentation
echo "📚 Vérification des fichiers de documentation..."
echo ""

if [ -f "FACEBOOK_OAUTH_SETUP.md" ]; then
  echo -e "${GREEN}✅ Fichier FACEBOOK_OAUTH_SETUP.md présent${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ Fichier FACEBOOK_OAUTH_SETUP.md manquant${NC}"
  ((ERRORS++))
fi

if [ -f "FACEBOOK_OAUTH_INTEGRATION_CHECKLIST.md" ]; then
  echo -e "${GREEN}✅ Fichier FACEBOOK_OAUTH_INTEGRATION_CHECKLIST.md présent${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ Fichier FACEBOOK_OAUTH_INTEGRATION_CHECKLIST.md manquant${NC}"
  ((ERRORS++))
fi

if [ -f "src/lib/facebook-oauth-examples.ts" ]; then
  echo -e "${GREEN}✅ Fichier facebook-oauth-examples.ts présent${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ Fichier facebook-oauth-examples.ts manquant${NC}"
  ((ERRORS++))
fi

echo ""
echo "=============================================="
echo "📊 Résumé"
echo "=============================================="
echo -e "${GREEN}✅ Succès: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNINGS${NC}"
echo -e "${RED}❌ Erreurs: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}🎉 Intégration Facebook OAuth valide !${NC}"
  echo ""
  echo "Prochaines étapes :"
  echo "1. Aller dans Supabase Dashboard"
  echo "2. Authentication → Providers → Facebook"
  echo "3. Activer et configurer avec les credentials"
  echo "4. Ajouter l'URL de redirection dans Facebook Developers"
  echo "5. Tester la connexion"
  exit 0
else
  echo -e "${RED}Veuillez corriger les erreurs ci-dessus${NC}"
  exit 1
fi
