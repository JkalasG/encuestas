/**
 * Genera el token de Gmail (OAuth2) para enviar los correos de las encuestas.
 * Ejecutar UNA SOLA VEZ:  npm run gmail:token
 *
 * Variables (en backend/.env): GMAIL_CLIENT_ID (o GOOGLE_CLIENT_ID), GMAIL_CLIENT_SECRET (o GOOGLE_CLIENT_SECRET)
 * y GMAIL_REDIRECT_URI (o GOOGLE_REDIRECT_URI). La URI debe estar autorizada en Google Cloud Console.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { OAuth2Client } = require('google-auth-library');

// lector minimo de .env (sin dependencias extra)
try {
  for (const l of fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* sin .env: se usan las variables del entorno */ }

const TOKEN_PATH = path.join(__dirname, 'credentials', 'token.json');
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify',
];

const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  console.error('Faltan variables en backend/.env: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI');
  process.exit(1);
}

const cliente = new OAuth2Client(clientId, clientSecret, redirectUri);
const url = cliente.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });

console.log('\nAbre esta URL en tu navegador y autoriza con la cuenta de Gmail que enviará los correos:\n');
console.log(url);
console.log(`\nAl terminar te redirigirá a ${redirectUri}?code=XXXX. Copia la URL completa (o solo el valor de "code").\n`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Pega aquí el código o la URL: ', async (entrada) => {
  rl.close();
  try {
    let code = entrada.trim();
    const enUrl = code.match(/[?&]code=([^&\s]+)/);
    if (enUrl) code = enUrl[1];
    code = decodeURIComponent(code);
    if (!code) throw new Error('No se recibió ningún código');

    const { tokens } = await cliente.getToken(code);
    if (!tokens.refresh_token) throw new Error('Google no devolvió refresh_token. Revoca el acceso de la app en tu cuenta Google y repite.');

    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log(`\nToken guardado en: ${TOKEN_PATH}`);
    console.log('Para usarlo, agrega en backend/.env:');
    console.log(`  GMAIL_TOKEN_FILE=${TOKEN_PATH}`);
    console.log('o bien copia el valor de "refresh_token" de ese archivo a GMAIL_REFRESH_TOKEN (necesario en Docker).\n');
  } catch (e) {
    console.error('Error obteniendo el token:', e instanceof Error ? e.message : e);
  }
});
