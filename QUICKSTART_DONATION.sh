#!/bin/bash
# QUICK START - Refonte Module Dons
# Exécutez ce script pour démarrer rapidement

set -e

echo "🎁 REFONTE MODULE DONS - QUICK START"
echo "===================================="
echo ""

# 1. VÉRIFIER LES PRÉREQUIS
echo "1️⃣  Vérification des prérequis..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trouvé. Installez Node.js d'abord."
    exit 1
fi
echo "✅ Node.js: $(node --version)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm non trouvé. Installez npm d'abord."
    exit 1
fi
echo "✅ npm: $(npm --version)"

echo ""

# 2. AFFICHER LA STRUCTURE
echo "2️⃣  Fichiers créés:"
echo "  ├── supabase/migrations/add_payment_methods.sql"
echo "  ├── src/hooks/"
echo "  │   ├── useDonationMethods.ts"
echo "  │   ├── useCreateDonation.ts"
echo "  │   ├── useConfirmDonation.ts"
echo "  │   └── useGenerateReceipt.ts"
echo "  ├── src/components/donations/"
echo "  │   ├── DonationHero.tsx"
echo "  │   ├── PaymentMethodSelector.tsx"
echo "  │   ├── DonationModal.tsx"
echo "  │   ├── DonationSummary.tsx"
echo "  │   └── index.ts"
echo "  ├── src/pages/"
echo "  │   ├── Donate.tsx (refactorisée)"
echo "  │   └── DonationSuccess.tsx"
echo "  ├── src/lib/supabase/"
echo "  │   └── donationPaymentsQueries.ts"
echo "  └── Documentation (6 fichiers)"
echo ""

# 3. INSTRUCTIONS
echo "3️⃣  Prochaines étapes:"
echo ""
echo "   a) Appliquer la migration SQL:"
echo "      $ supabase db push"
echo ""
echo "   b) Intégrer les routes dans App.tsx:"
echo "      import Donate from '@/pages/Donate';"
echo "      import DonationSuccess from '@/pages/DonationSuccess';"
echo "      <Route path=\"/donate\" element={<Donate />} />"
echo "      <Route path=\"/donation/success/:donationId\" element={<DonationSuccess />} />"
echo ""
echo "   c) Tester local:"
echo "      $ npm run dev"
echo "      → http://localhost:5173/donate"
echo ""
echo "   d) Configurer Stripe (prochain):"
echo "      VITE_STRIPE_PUBLIC_KEY=pk_..."
echo "      STRIPE_SECRET_KEY=sk_..."
echo ""

# 4. DOCUMENTATION
echo "4️⃣  Documentation:"
echo ""
echo "   📖 Pour démarrer:"
echo "      → DONATION_INDEX.md"
echo ""
echo "   👨‍💼 Pour managers:"
echo "      → DONATION_TEAM_SUMMARY.md"
echo ""
echo "   👨‍💻 Pour devs:"
echo "      → README_DONATION_REFACTOR.md"
echo ""
echo "   📋 Pour checklist:"
echo "      → CHECKLIST_DONATION_IMPLEMENTATION.md"
echo ""

echo ""
echo "✅ Prêt à démarrer!"
echo ""
echo "====================================="
echo "Questions? Consulter DONATION_INDEX.md"
echo "====================================="
