const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function resolveImport(importPath, filePath) {
  if (!importPath.startsWith('.')) return importPath;
  if (importPath.endsWith('.js')) return importPath;

  const absoluteBase = path.resolve(path.dirname(filePath), importPath);

  if (fs.existsSync(absoluteBase) && fs.statSync(absoluteBase).isDirectory()) {
    const indexTs = path.join(absoluteBase, 'index.ts');
    const indexTsx = path.join(absoluteBase, 'index.tsx');
    if (fs.existsSync(indexTs) || fs.existsSync(indexTsx)) {
      return `${importPath}/index.js`;
    }
  }

  if (
    fs.existsSync(`${absoluteBase}.ts`) ||
    fs.existsSync(`${absoluteBase}.tsx`) ||
    fs.existsSync(`${absoluteBase}.js`)
  ) {
    return `${importPath}.js`;
  }

  return importPath;
}

const files = walk(srcDir);
let updated = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = content.replace(
    /from\s+(["'])(\.\.?\/[^"']+)\1/g,
    (match, quote, importPath) => {
      const resolved = resolveImport(importPath, file);
      return resolved === importPath ? match : `from ${quote}${resolved}${quote}`;
    }
  );

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated: ${path.relative(__dirname, file)}`);
    updated++;
  }
}

console.log(`\nTotal files updated: ${updated}`);
