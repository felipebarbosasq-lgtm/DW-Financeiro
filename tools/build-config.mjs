// Gera public/js/config.js com as chaves PÚBLICAS do Supabase (roda no build do Netlify).
// Sem SUPABASE_URL/SUPABASE_ANON_KEY o app abre em modo demonstração.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const limpar = (v) => String(v || '').trim().replace(/^["']|["']$/g, '');
// Aceita também o link do painel (supabase.com/dashboard/project/REF) e converte para https://REF.supabase.co
let url = limpar(process.env.SUPABASE_URL);
const ref = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i)?.[1];
if (ref) url = `https://${ref}.supabase.co`;
url = url.replace(/\/(rest|auth|storage)\/v1.*$/, '').replace(/\/+$/, '');
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
  console.error(`ERRO: SUPABASE_URL parece errada (${url}). Ela deve ser assim: https://SEU-PROJETO.supabase.co (Supabase › Project Settings › Data API › Project URL).`);
  process.exit(1);
}
const cfg = {
  supabaseUrl: url,
  supabaseAnonKey: limpar(process.env.SUPABASE_ANON_KEY),
};
if (/service_role/.test(Buffer.from((cfg.supabaseAnonKey.split('.')[1] || ''), 'base64').toString())) {
  console.error('ERRO: SUPABASE_ANON_KEY está com a chave service_role (secreta). Use a chave anon/public.');
  process.exit(1);
}
await fs.writeFile(path.join(raiz, 'public/js/config.js'), `// Gerado por tools/build-config.mjs a partir das variáveis do Netlify.\n// Vazio = modo demonstração (dados salvos só no navegador).\nwindow.FIN_CONFIG = ${JSON.stringify(cfg)};\n`);
console.log(`config.js gerado (${cfg.supabaseUrl ? 'Supabase' : 'modo demonstração'})`);
