# facebook-oauth-validation.ps1
# Script de validation de l'intégration Facebook OAuth (Windows)

Write-Host "🔍 Validation de l'intégration Facebook OAuth" -ForegroundColor Cyan
Write-Host "=" -NoNewline; foreach ($i in 1..42) { Write-Host "=" -NoNewline }; Write-Host ""
Write-Host ""

$errors = 0
$warnings = 0
$success = 0

# Fonction pour tester la présence d'une chaine dans un fichier
function Check-FileContains {
    param(
        [string]$file,
        [string]$search,
        [string]$description,
        [string]$level = "error"
    )

    if (-not (Test-Path $file)) {
        Write-Host "❌ Fichier non trouvé: $file" -ForegroundColor Red
        $script:errors++
        return
    }

    $content = Get-Content $file -Raw
    if ($content -like "*$search*") {
        Write-Host "✅ $description" -ForegroundColor Green
        $script:success++
    } else {
        if ($level -eq "warning") {
            Write-Host "⚠️  $description (manquant)" -ForegroundColor Yellow
            $script:warnings++
        } else {
            Write-Host "❌ $description (manquant)" -ForegroundColor Red
            $script:errors++
        }
    }
}

# 1. Vérifier index.html
Write-Host "📄 Vérification des fichiers..." -ForegroundColor Cyan
Write-Host ""

Check-FileContains "index.html" "facebook-jssdk" "SDK Facebook chargé dans index.html"
Check-FileContains "index.html" "3041743659361307" "App ID Facebook dans index.html"
Check-FileContains "index.html" "v24.0" "Version API Facebook dans index.html"

Write-Host ""

# 2. Vérifier LoginForm.tsx
Check-FileContains "src/components/LoginForm.tsx" "handleFacebookLogin" "Fonction handleFacebookLogin présente"
Check-FileContains "src/components/LoginForm.tsx" "facebookLoading" "État facebookLoading présent"
Check-FileContains "src/components/LoginForm.tsx" "signInWithProvider" "Appel Supabase OAuth présent"
Check-FileContains "src/components/LoginForm.tsx" "ensureProfileExists" "Création automatique du profil"

Write-Host ""

# 3. Vérifier useAuth.tsx
Check-FileContains "src/hooks/useAuth.tsx" "signInWithProvider" "Support OAuth dans useAuth" "warning"
Check-FileContains "src/hooks/useAuth.tsx" "facebook" "Support provider Facebook dans useAuth" "warning"

Write-Host ""

# 4. Vérifier les fichiers de documentation
Write-Host "📚 Vérification des fichiers de documentation..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "FACEBOOK_OAUTH_SETUP.md") {
    Write-Host "✅ Fichier FACEBOOK_OAUTH_SETUP.md présent" -ForegroundColor Green
    $success++
} else {
    Write-Host "❌ Fichier FACEBOOK_OAUTH_SETUP.md manquant" -ForegroundColor Red
    $errors++
}

if (Test-Path "FACEBOOK_OAUTH_INTEGRATION_CHECKLIST.md") {
    Write-Host "✅ Fichier FACEBOOK_OAUTH_INTEGRATION_CHECKLIST.md présent" -ForegroundColor Green
    $success++
} else {
    Write-Host "❌ Fichier FACEBOOK_OAUTH_INTEGRATION_CHECKLIST.md manquant" -ForegroundColor Red
    $errors++
}

if (Test-Path "src/lib/facebook-oauth-examples.ts") {
    Write-Host "✅ Fichier facebook-oauth-examples.ts présent" -ForegroundColor Green
    $success++
} else {
    Write-Host "❌ Fichier facebook-oauth-examples.ts manquant" -ForegroundColor Red
    $errors++
}

Write-Host ""
Write-Host "=" -NoNewline; foreach ($i in 1..42) { Write-Host "=" -NoNewline }; Write-Host ""
Write-Host "📊 Résumé" -ForegroundColor Cyan
Write-Host "=" -NoNewline; foreach ($i in 1..42) { Write-Host "=" -NoNewline }; Write-Host ""

Write-Host "✅ Succès: $success" -ForegroundColor Green
Write-Host "⚠️  Avertissements: $warnings" -ForegroundColor Yellow
Write-Host "❌ Erreurs: $errors" -ForegroundColor Red
Write-Host ""

if ($errors -eq 0) {
    Write-Host "🎉 Intégration Facebook OAuth valide !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "1. Aller dans Supabase Dashboard"
    Write-Host "2. Authentication → Providers → Facebook"
    Write-Host "3. Activer et configurer avec les credentials"
    Write-Host "4. Ajouter l'URL de redirection dans Facebook Developers"
    Write-Host "5. Tester la connexion"
    exit 0
} else {
    Write-Host "Veuillez corriger les erreurs ci-dessus" -ForegroundColor Red
    exit 1
}
