# Script PowerShell pour créer des images PNG réelles (200x150) comme placeholders
# Chaque image contient le nom du fichier et un gradient de couleur basique

# Importer System.Drawing
Add-Type -AssemblyName System.Drawing

# Dossiers à traiter
$baseDir = "C:\axe\faith-flix\public\images\lexique"

# Créer une image pour chaque fichier existant
Get-ChildItem -Recurse $baseDir -Filter "*.png" | ForEach-Object {
  $fullPath = $_.FullName
  $category = $_.Directory.Name
  $fileName = $_.BaseName
    
  # Déterminer la couleur en fonction de la catégorie
  $color = $categoryColors[$category]
  if (-not $color) { $color = [System.Drawing.Color]::Gray }
    
  # Créer une nouvelle image 200x150
  $bitmap = New-Object System.Drawing.Bitmap(200, 150)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
  # Remplir avec gradient
  $brush = New-Object System.Drawing.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(200, 150)),
    $color,
    [System.Drawing.Color]::White
  )
  $graphics.FillRectangle($brush, 0, 0, 200, 150)
    
  # Ajouter du texte
  $font = New-Object System.Drawing.Font("Arial", 11, [System.Drawing.FontStyle]::Bold)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
  $text = "$category`n$fileName"
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    
  $rect = New-Object System.Drawing.RectangleF(5, 5, 190, 140)
  $graphics.DrawString($text, $font, $textBrush, $rect, $format)
    
  # Sauvegarder
  $bitmap.Save($fullPath)
  $graphics.Dispose()
  $bitmap.Dispose()
    
  Write-Host "✓ Créé: $($_.Name) (200x150)"
}

Write-Host "✅ Toutes les images placeholder ont été créées!"
