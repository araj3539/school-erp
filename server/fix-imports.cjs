const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const dirsWithIndex = ['config', 'controllers', 'middleware', 'routes', 'services', 'models', 'utils', 'validators'];

function walk(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(fullPath));
    } else if (entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixImports(content, filePath) {
  let newContent = content;
  const relDir = path.relative(srcDir, path.dirname(filePath));
  
  // Fix directory imports (e.g., "./config" -> "./config/index.js", "../models" -> "../models/index.js")
  for (const dir of dirsWithIndex) {
    // ./config
    const regex1 = new RegExp(`from ["']\\.\\/${dir}["']`, 'g');
    newContent = newContent.replace(regex1, `from "./${dir}/index.js"`);
    
    // ../config
    const regex2 = new RegExp(`from ["']\\.\\.\\/${dir}["']`, 'g');
    newContent = newContent.replace(regex2, `from "../${dir}/index.js"`);
    
    // ../../config (for deeper nesting)
    const regex3 = new RegExp(`from ["']\\.\\.\\/\\.\\.\\/${dir}["']`, 'g');
    newContent = newContent.replace(regex3, `from "../../${dir}/index.js"`);
  }
  
  // Fix file imports (e.g., "./file" -> "./file.js", "../file" -> "../file.js")
  // but not if already has .js or if it's a directory import we already handled
  newContent = newContent.replace(
    /from\s+["'](\.(?:\/|\.\/)[a-zA-Z][^"']*)["']/g,
    (match, importPath) => {
      if (importPath.endsWith('.js')) return match;
      // Check if it's a directory we already handled
      for (const dir of dirsWithIndex) {
        if (importPath === `./${dir}` || importPath === `../${dir}` || importPath === `../../${dir}`) {
          return match; // Already handled
        }
      }
      return `from "${importPath}.js"`;
    }
  );
  
  return newContent;
}

const files = walk(srcDir);
let updated = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = fixImports(content, file);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated: ${path.relative(__dirname, file)}`);
    updated++;
  }
}

console.log(`\nTotal files updated: ${updated}`);