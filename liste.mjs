import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const rootDir = '.';
const exclusions = ['node_modules', 'dist', 'public', 'nhost', '.vscode', '.nuxt', '.output', '.git', '.bolt', '.next'];
let outputFile = 'project_structure.txt';

// Fichiers à exclure à la racine
const rootFileExclusions = ['.md', '.txt', '.sql'];
const excludedFolders = ['docs'];

// =====================================================
// 1. SUPPRIMER TOUS LES FICHIERS project_structure*
// =====================================================
const oldStructureFiles = glob.sync('project_structure*.txt', { cwd: rootDir });
if (oldStructureFiles.length > 0) {
    console.log(`🧹 Suppression de ${oldStructureFiles.length} ancien(s) fichier(s) de structure...`);
    oldStructureFiles.forEach(file => {
        fs.unlinkSync(path.join(rootDir, file));
        console.log(`   ✅ Supprimé: ${file}`);
    });
}

// Vérifier si le fichier existe déjà et l'incrémenter (au cas où)
let counter = 1;
while (fs.existsSync(outputFile)) {
    outputFile = `project_structure_${counter++}.txt`;
}

// Fonction pour vérifier si on doit exclure un fichier à la racine
function shouldExcludeRootFile(fileName, currentPath) {
    const isRoot = path.dirname(currentPath) === rootDir || path.dirname(currentPath) === '.';
    if (isRoot) {
        const ext = path.extname(fileName).toLowerCase();
        return rootFileExclusions.includes(ext);
    }
    return false;
}

// Fonction récursive pour lister la structure
function listDir(dir, indent = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const isDirectory = fs.statSync(fullPath).isDirectory();

        if (isDirectory && excludedFolders.includes(item)) continue;
        if (exclusions.includes(item)) continue;
        if (!isDirectory && shouldExcludeRootFile(item, fullPath)) continue;

        fs.appendFileSync(outputFile, `${indent}${isDirectory ? '📁' : '📄'} ${item}\n`);

        if (isDirectory) {
            listDir(fullPath, indent + '  ');
        }
    }
}

// Exécuter
fs.writeFileSync(outputFile, `Structure du projet (exclusions : ${exclusions.join(', ')})\n========================================\n\n`);
listDir(rootDir);
console.log(`✅ Structure du projet enregistrée dans "${outputFile}"`);