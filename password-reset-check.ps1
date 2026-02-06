# Script de Diagnostic - Réinitialisation Mot de Passe
# Usage: powershell -ExecutionPolicy Bypass -File password-reset-check.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🔍 DIAGNOSTIC - RESET PASSWORD" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Vérifier les variables d'environnement
Write-Host "📋 Configuration Environnement" -ForegroundColor Yellow

$env_file = ".env"
$env_local_file = ".env.local"

if (Test-Path $env_file) {
  Write-Host "✓ .env trouvé" -ForegroundColor Green
  $env_content = Get-Content $env_file
    
  if ($env_content -match "VITE_SUPABASE_PROJECT_ID") {
    $project_id = $env_content | Select-String "VITE_SUPABASE_PROJECT_ID" | Select-Object -First 1
    Write-Host "  Project ID: $project_id" -ForegroundColor Gray
  }
    
  if ($env_content -match "VITE_SUPABASE_URL") {
    $supabase_url = $env_content | Select-String "VITE_SUPABASE_URL" | Select-Object -First 1
    Write-Host "  Supabase URL: $supabase_url" -ForegroundColor Gray
  }
}
else {
  Write-Host "✗ .env NOT trouvé" -ForegroundColor Red
}

if (Test-Path $env_local_file) {
  Write-Host "✓ .env.local trouvé" -ForegroundColor Green
}
else {
  Write-Host "! .env.local NOT trouvé (optionnel)" -ForegroundColor Yellow
}

# Vérifier les fichiers source
Write-Host "`n📁 Fichiers Source" -ForegroundColor Yellow

$files_to_check = @(
  "src/components/ForgotPasswordModal.tsx",
  "src/components/ForgotPasswordForm.tsx",
  "src/hooks/useAuth.tsx",
  "src/pages/ResetPasswordPage.tsx",
  "src/pages/PasswordResetTestPage.tsx",
  "src/components/SupabaseEmailDiagnostics.tsx"
)

foreach ($file in $files_to_check) {
  if (Test-Path $file) {
    Write-Host "✓ $file" -ForegroundColor Green
  }
  else {
    Write-Host "✗ $file NOT trouvé" -ForegroundColor Red
  }
}

# Vérifier les routes dans App.tsx
Write-Host "`n🛣️  Routes Configuration" -ForegroundColor Yellow

$app_file = "src/App.tsx"
if (Test-Path $app_file) {
  $app_content = Get-Content $app_file -Raw
    
  if ($app_content -match "/reset-password") {
    Write-Host "✓ Route /reset-password trouvée" -ForegroundColor Green
  }
  else {
    Write-Host "✗ Route /reset-password NOT trouvée" -ForegroundColor Red
  }
    
  if ($app_content -match "/dev/test-password-reset") {
    Write-Host "✓ Route /dev/test-password-reset trouvée" -ForegroundColor Green
  }
  else {
    Write-Host "✗ Route /dev/test-password-reset NOT trouvée" -ForegroundColor Red
  }
}

# Résumé des étapes à suivre
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📋 CHECKLIST CONFIGURATION" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$checklist = @(
  @{ title = "Email Provider dans Supabase"; url = "https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/email"; done = $false },
  @{ title = "URL Configuration dans Supabase"; url = "https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/url-configuration"; done = $false },
  @{ title = "Email Templates dans Supabase"; url = "https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/templates"; done = $false },
  @{ title = "Tester à http://localhost:5173/dev/test-password-reset"; url = $null; done = $false }
)

$count = 1
foreach ($item in $checklist) {
  Write-Host "[ ] $count. $($item.title)" -ForegroundColor Yellow
  if ($item.url) {
    Write-Host "    URL: $($item.url)" -ForegroundColor Gray
  }
  $count++
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "🚀 PROCHAINES ÉTAPES" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "1️⃣  Configurer Supabase Email Provider" -ForegroundColor Cyan
Write-Host "    Options: SMTP, SendGrid, ou Mailgun" -ForegroundColor Gray
Write-Host "    URL: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/email`n" -ForegroundColor Gray

Write-Host "2️⃣  Ajouter URLs autorisées" -ForegroundColor Cyan
Write-Host "    - http://localhost:5173/reset-password" -ForegroundColor Gray
Write-Host "    - https://faith-flix.vercel.app/reset-password" -ForegroundColor Gray
Write-Host "    URL: https://app.supabase.com/project/cghwsbkxcjsutqwzdbwe/auth/url-configuration`n" -ForegroundColor Gray

Write-Host "3️⃣  Tester la réinitialisation" -ForegroundColor Cyan
Write-Host "    - npm run dev" -ForegroundColor Gray
Write-Host "    - Aller à: http://localhost:5173/dev/test-password-reset" -ForegroundColor Gray
Write-Host "    - Ou tester via /auth → Mot de passe oublié`n" -ForegroundColor Gray

Write-Host "4️⃣  Vérifier les logs" -ForegroundColor Cyan
Write-Host "    - Ouvrir DevTools (F12)" -ForegroundColor Gray
Write-Host "    - Chercher les logs: '🔍 DIAGNOSTIC - MOT DE PASSE OUBLIÉ'" -ForegroundColor Gray
Write-Host "    - Dashboard Supabase → Logs`n" -ForegroundColor Gray

Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Diagnostic terminé!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green
