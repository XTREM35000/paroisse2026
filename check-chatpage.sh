#!/bin/bash

#  ============================================
#  CHATPAGE REFONDÉE - SCRIPT DE VÉRIFICATION
#  ============================================
#
#  Ce script vérifie que tous les fichiers et
#  configurations sont correctement en place
#

echo "🔍 VÉRIFICATION DE LA REFONTE CHATPAGE"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
CHECKS_PASSED=0
CHECKS_FAILED=0

# Fonction pour vérifier un fichier
check_file() {
    local filepath=$1
    local description=$2
    
    if [ -f "$filepath" ]; then
        echo -e "${GREEN}✅${NC} $description"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌${NC} $description"
        echo "   Fichier manquant: $filepath"
        ((CHECKS_FAILED++))
    fi
}

# Fonction pour vérifier un répertoire
check_dir() {
    local dirpath=$1
    local description=$2
    
    if [ -d "$dirpath" ]; then
        echo -e "${GREEN}✅${NC} $description"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌${NC} $description"
        echo "   Répertoire manquant: $dirpath"
        ((CHECKS_FAILED++))
    fi
}

# ============================================
# 1. VÉRIFICATION DES COMPOSANTS
# ============================================
echo "📁 Vérification des composants chat..."
check_dir "src/components/chat" "Répertoire chat existe"
check_file "src/components/chat/ChatHeader.tsx" "ChatHeader.tsx"
check_file "src/components/chat/ConversationItem.tsx" "ConversationItem.tsx"
check_file "src/components/chat/ConversationList.tsx" "ConversationList.tsx"
check_file "src/components/chat/MessageBubble.tsx" "MessageBubble.tsx"
check_file "src/components/chat/MessageInput.tsx" "MessageInput.tsx"
check_file "src/components/chat/index.ts" "Index des exports"
echo ""

# ============================================
# 2. VÉRIFICATION DE LA PAGE
# ============================================
echo "📄 Vérification de la page ChatPage..."
check_file "src/pages/ChatPage.tsx" "ChatPage.tsx (refondée)"
echo ""

# ============================================
# 3. VÉRIFICATION DE LA DOCUMENTATION
# ============================================
echo "📚 Vérification de la documentation..."
check_file "CHATPAGE_DOCUMENTATION.md" "Documentation complète"
check_file "CHATPAGE_INTEGRATION_GUIDE.md" "Guide d'intégration"
check_file "CHATPAGE_SUMMARY.md" "Résumé technique"
check_file "CHATPAGE_QUICKSTART.js" "Quick start guide"
check_file "CHATPAGE_ROUTER_EXAMPLES.tsx" "Exemples de router"
check_file "CHATPAGE_EXTENSIONS.md" "Extensions futures"
echo ""

# ============================================
# 4. VÉRIFICATION DES DÉPENDANCES
# ============================================
echo "📦 Vérification des dépendances..."

# Vérifier package.json
if grep -q "framer-motion" package.json; then
    echo -e "${GREEN}✅${NC} framer-motion installé"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} framer-motion manquant"
    echo "   Installer: npm install framer-motion"
    ((CHECKS_FAILED++))
fi

if grep -q "lucide-react" package.json; then
    echo -e "${GREEN}✅${NC} lucide-react installé"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} lucide-react manquant"
    echo "   Installer: npm install lucide-react"
    ((CHECKS_FAILED++))
fi

if grep -q "react-router-dom" package.json; then
    echo -e "${GREEN}✅${NC} react-router-dom installé"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} react-router-dom manquant"
    echo "   Installer: npm install react-router-dom"
    ((CHECKS_FAILED++))
fi

echo ""

# ============================================
# 5. VÉRIFICATION DES COMPOSANTS SHADCN/UI
# ============================================
echo "🎨 Vérification des composants shadcn/ui..."
check_file "src/components/ui/avatar.tsx" "Avatar component"
check_file "src/components/ui/badge.tsx" "Badge component"
check_file "src/components/ui/button.tsx" "Button component"
check_file "src/components/ui/input.tsx" "Input component"
check_file "src/components/ui/scroll-area.tsx" "ScrollArea component"
check_file "src/components/ui/textarea.tsx" "Textarea component"
echo ""

# ============================================
# 6. VÉRIFICATION DES TYPES
# ============================================
echo "🔤 Vérification des types TypeScript..."
if grep -q "interface ChatRoom" src/types/database.ts; then
    echo -e "${GREEN}✅${NC} Type ChatRoom défini"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} Type ChatRoom manquant"
    ((CHECKS_FAILED++))
fi

if grep -q "interface ChatMessage" src/types/database.ts; then
    echo -e "${GREEN}✅${NC} Type ChatMessage défini"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} Type ChatMessage manquant"
    ((CHECKS_FAILED++))
fi

if grep -q "interface Profile" src/types/database.ts; then
    echo -e "${GREEN}✅${NC} Type Profile défini"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} Type Profile manquant"
    ((CHECKS_FAILED++))
fi

echo ""

# ============================================
# 7. VÉRIFICATION DES HOOKS
# ============================================
echo "🪝 Vérification des hooks..."
check_file "src/hooks/useAuth.tsx" "useAuth hook"
check_file "src/hooks/useUser.tsx" "useUser hook"
check_file "src/hooks/useUnreadMessages.ts" "useUnreadMessages hook"
check_file "src/components/ui/notification-system.ts" "Notification system"
echo ""

# ============================================
# 8. VÉRIFICATION TAILWIND
# ============================================
echo "🎨 Vérification de Tailwind CSS..."
if grep -q "tailwindcss" package.json; then
    echo -e "${GREEN}✅${NC} Tailwind CSS installé"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} Tailwind CSS manquant"
    ((CHECKS_FAILED++))
fi

if [ -f "tailwind.config.ts" ] || [ -f "tailwind.config.js" ]; then
    echo -e "${GREEN}✅${NC} Config Tailwind trouvée"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} Config Tailwind manquante"
    ((CHECKS_FAILED++))
fi

echo ""

# ============================================
# 9. VÉRIFICATION SUPABASE
# ============================================
echo "🗄️ Vérification de Supabase..."
check_file "src/integrations/supabase/client.ts" "Client Supabase"
check_file "src/integrations/supabase/types.ts" "Types Supabase"

if grep -q "chat_rooms" src/lib/supabase/chatQueries.ts 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Queries chat disponibles"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️${NC} Vérifier les queries chat dans lib/supabase"
fi

echo ""

# ============================================
# 10. RÉSUMÉ
# ============================================
echo "======================================"
echo "📊 RÉSUMÉ DES VÉRIFICATIONS"
echo "======================================"
echo -e "${GREEN}✅ Checks réussis: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Checks échoués: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUT EST EN ORDRE!${NC}"
    echo ""
    echo "Vous pouvez maintenant:"
    echo "  1. npm run build"
    echo "  2. npm run dev"
    echo "  3. Naviguer à http://localhost:5173/chat"
    exit 0
else
    echo -e "${RED}⚠️ PROBLÈMES DÉTECTÉS${NC}"
    echo ""
    echo "Actions requises:"
    echo "  1. Installer les dépendances manquantes"
    echo "  2. Vérifier les fichiers manquants"
    echo "  3. Consulter CHATPAGE_INTEGRATION_GUIDE.md"
    exit 1
fi
