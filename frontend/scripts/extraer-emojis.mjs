// Extrae solo los emoticonos usados desde @iconify-json/fluent-emoji (Microsoft Fluent Emoji, MIT)
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const set = JSON.parse(readFileSync(require.resolve('@iconify-json/fluent-emoji-flat/icons.json'), 'utf8'));
const usados = {
  llora: 'loudly-crying-face',
  triste: 'slightly-frowning-face',
  neutral: 'neutral-face',
  feliz: 'smiling-face-with-smiling-eyes',
  encantado: 'smiling-face-with-heart-eyes',
  fiesta: 'party-popper',
  corazon: 'red-heart',
  pulgarAbajo: 'thumbs-down',
};
const out = {};
for (const [k, n] of Object.entries(usados)) {
  const i = set.icons[n];
  if (!i) throw new Error('No existe ' + n);
  out[k] = { body: i.body, w: i.width ?? set.width ?? 32, h: i.height ?? set.height ?? 32 };
}
writeFileSync('src/emojis.ts', '// Generado por scripts/extraer-emojis.mjs (Fluent Emoji, MIT, Microsoft)\nexport const EMOJIS = ' + JSON.stringify(out, null, 1) + ' as const;\nexport type NombreEmoji = keyof typeof EMOJIS;\n');
console.log(Object.keys(out).length, 'emojis');
