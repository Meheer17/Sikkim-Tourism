const fs = require('fs');
const path = require('path');

const translationsPath = path.join(__dirname, '..', 'constants', 'translations.ts');
const outPath = path.join(__dirname, 'missing-translations-report.json');

const text = fs.readFileSync(translationsPath, 'utf8');

// Find language block starts (e.g., "  en: {" )
const langStartRe = /^\s{2}([a-z]{2,4}):\s*\{/mg;
const starts = [];
let m;
while ((m = langStartRe.exec(text)) !== null) {
  starts.push({ code: m[1], index: m.index });
}

// Push end marker
starts.sort((a,b)=>a.index-b.index);
for (let i=0;i<starts.length;i++){
  const start = starts[i];
  const end = (i+1<starts.length)? starts[i+1].index : text.length;
  start.block = text.slice(start.index, end);
}

function extractKeys(blockText) {
  const keyRe = /^\s{4,}([A-Za-z0-9_]+):/mg;
  const keys = [];
  let mm;
  while ((mm = keyRe.exec(blockText)) !== null) {
    keys.push(mm[1]);
  }
  return keys;
}

const map = {};
starts.forEach(s => {
  map[s.code] = extractKeys(s.block);
});

const enKeys = map['en'] || [];

const report = {};
for (const code of Object.keys(map)){
  const keys = map[code];
  const missing = enKeys.filter(k => !keys.includes(k));
  report[code] = {
    totalKeys: keys.length,
    missingCount: missing.length,
    missingKeys: missing,
  };
}

fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), enCount: enKeys.length, report }, null, 2));

// Print summary
console.log('Translations parity check:');
console.log('English keys count:', enKeys.length);
for (const code of Object.keys(report)){
  console.log(`- ${code}: ${report[code].totalKeys} keys, ${report[code].missingCount} missing`);
}
console.log('\nDetailed report saved to', outPath);
