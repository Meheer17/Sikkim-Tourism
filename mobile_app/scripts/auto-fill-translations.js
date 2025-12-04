const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, '..', 'constants', 'translations.ts');
const text = fs.readFileSync(translationsPath, 'utf8');

// Extract English translation object (manually parse)
const enMatch = text.match(/en:\s*\{([\s\S]*?)\n  \},?\n  (hi|ta|te|sik)/);
if (!enMatch) {
  console.error('Could not find English block');
  process.exit(1);
}

const enBlock = enMatch[1];
const enKeys = {};
const keyValueRe = /^\s{4,}([A-Za-z0-9_]+):\s*'([^']*)'|"([^"]*)"/gm;
let m;
while ((m = keyValueRe.exec(enBlock)) !== null) {
  const key = m[1];
  const val = m[2] || m[3];
  enKeys[key] = val;
}

console.log(`Extracted ${Object.keys(enKeys).length} English keys`);

// Find language blocks
const langBlockRe = /  ([a-z]{2,4}):\s*\{([\s\S]*?)\n  \},?\n/g;
const replacements = [];

let langMatch;
while ((langMatch = langBlockRe.exec(text)) !== null) {
  const langCode = langMatch[1];
  if (langCode === 'en') continue; // Skip English

  const blockContent = langMatch[2];
  const langKeys = {};
  const keyValueRe2 = /^\s{4,}([A-Za-z0-9_]+):\s*'([^']*)'|"([^"]*)"/gm;
  let m2;
  while ((m2 = keyValueRe2.exec(blockContent)) !== null) {
    const key = m2[1];
    const val = m2[2] || m2[3];
    langKeys[key] = val;
  }

  const missingKeys = Object.keys(enKeys).filter(k => !(k in langKeys));
  
  if (missingKeys.length > 0) {
    console.log(`${langCode}: ${missingKeys.length} missing keys`);
    
    // Build replacement: insert missing keys right before closing brace
    const newLines = missingKeys.map(k => `    ${k}: '${enKeys[k]}',`).join('\n');
    const oldBlock = langMatch[0];
    const newBlock = oldBlock.replace(/\n  \},?\n$/, `${newLines}\n  },\n`);
    
    replacements.push({
      oldString: oldBlock,
      newString: newBlock,
      langCode,
    });
  }
}

console.log(`\nWill auto-fill ${replacements.length} language blocks`);

// Apply replacements
let updatedText = text;
for (const r of replacements) {
  if (updatedText.includes(r.oldString)) {
    updatedText = updatedText.replace(r.oldString, r.newString);
    console.log(`✓ Applied auto-fill for ${r.langCode}`);
  } else {
    console.warn(`⚠ Could not apply auto-fill for ${r.langCode} (block not found exactly)`);
  }
}

fs.writeFileSync(translationsPath, updatedText);
console.log('\n✓ Auto-fill complete. File updated.');
