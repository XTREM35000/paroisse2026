#!/usr/bin/env node
/**
 * Create 6 new action button PNG files
 */
const fs = require('fs');
const path = require('path');

const VALID_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(VALID_PNG_BASE64, 'base64');

const newFiles = [
  'televerser.png',
  'telecharger.png',
  'valider.png',
  'annuler.png',
  'supprimer.png',
  'confirmer.png'
];

const actionsDir = path.join('public', 'images', 'lexique', 'actions');

for (const file of newFiles) {
  const filePath = path.join(actionsDir, file);
  fs.writeFileSync(filePath, pngBuffer);
  console.log(`✓ Created: ${file}`);
}

console.log(`\n✅ All 6 new action button PNG files created in ${actionsDir}`);
