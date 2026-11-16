// DOM Web Financeiro: dados.
// - Modo DEMONSTRAÇÃO (sem Supabase em config.js): tudo no navegador, com vendas de exemplo.
// - Modo PRODUÇÃO: lê/grava no Supabase (mesmo projeto da hamburgueria). As vendas da
//   hamburgueria são só LIDAS das tabelas pedidos e registros (mesas).

const CFG = window.FIN_CONFIG || {};
export const modoDemo = !(CFG.supabaseUrl && CFG.supabaseAnonKey);
const K_SESSAO = 'domfin:sessao';

const lerLS = (k, p) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch { return p; } };
const gravarLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ---------- Supabase ----------

async function sessaoValida() {
  const s = lerLS(K_SESSAO, null);
  if (!s) return null;
  if (s.expires_at * 1000 > Date.now() + 60_000) return s;
  try {
    const r = await fetch(`${CFG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: CFG.supabaseAnonKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    if (!r.ok) throw new Error();
    const nova = await r.json();
    gravarLS(K_SESSAO, nova);
    return nova;
  } catch {
    localStorage.removeItem(K_SESSAO);
    return null;
  }
}

async function sb(caminho, { metodo = 'GET', corpo, headers = {} } = {}) {
  const s = await sessaoValida();
  if (!s) throw new Error('Sessão expirada. Entre novamente.');
  const r = await fetch(`${CFG.supabaseUrl}${caminho}`, {
    method: metodo,
    headers: { apikey: CFG.supabaseAnonKey, Authorization: `Bearer ${s.access_token}`, 'Content-Type': 'application/json', ...headers },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const t = await r.text();
  const j = t ? JSON.parse(t) : null;
  if (!r.ok) throw new Error(j?.message || j?.msg || `Erro ${r.status}`);
  return j;
}

export async function entrar(email, senha) {
  if (modoDemo) { localStorage.setItem(K_SESSAO, '"demo"'); return { email: 'demo' }; }
  let r; let j = {};
  try {
    r = await fetch(`${CFG.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: CFG.supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim().toLowerCase(), password: senha }),
    });
    j = await r.json().catch(() => ({}));
  } catch {
    throw new Error('Não foi possível falar com o banco. Confira a variável SUPABASE_URL na Netlify.');
  }
  if (!r.ok) {
    const t = `${j.error_code || ''} ${j.msg || j.message || ''}`.toLowerCase();
    if (t.includes('invalid_credentials') || t.includes('invalid login')) throw new Error('E-mail ou senha incorretos. Use o mesmo login de dono do painel da hamburgueria.');
    if (t.includes('email_provider_disabled')) throw new Error('O login por e-mail está desligado no Supabase (Authentication › Sign In / Providers › Email).');
    if (r.status === 404) throw new Error('Endereço do Supabase errado. No Netlify, a variável SUPABASE_URL deve ser assim: https://SEU-PROJETO.supabase.co. Corrija e faça um novo deploy.');
    if (r.status === 401 || t.includes('api key')) throw new Error('Chave do Supabase errada. Confira SUPABASE_ANON_KEY na Netlify.');
    throw new Error(`O banco recusou o login (${r.status}). ${j.msg || j.message || ''}`);
  }
  if (j.user?.app_metadata?.cargo && j.user.app_metadata.cargo !== 'dono') throw new Error('O financeiro é exclusivo do dono. Este login é da equipe.');
  gravarLS(K_SESSAO, j);
  return j.user;
}

export async function usuarioAtual() {
  if (modoDemo) return localStorage.getItem(K_SESSAO) ? { email: 'demo', demo: true } : null;
  const s = await sessaoValida();
  return s?.user || null;
}

export function sair() { localStorage.removeItem(K_SESSAO); }

// ---------- Registros do financeiro ----------

const kCol = (c) => `domfin:col:${c}`;

export async function listar(colecao) {
  if (modoDemo) { await garantirDemo(); return lerLS(kCol(colecao), []); }
  const l = await sb(`/rest/v1/fin_registros?colecao=eq.${colecao}&select=id,criado_em,dados&order=criado_em.desc&limit=10000`);
  return l.map((x) => ({ ...x.dados, id: x.id, criado_em: x.criado_em }));
}

export async function salvar(colecao, obj) {
  const reg = { ...obj, id: obj.id || crypto.randomUUID(), criado_em: obj.criado_em || new Date().toISOString() };
  if (modoDemo) {
    const l = lerLS(kCol(colecao), []);
    const i = l.findIndex((x) => x.id === reg.id);
    if (i >= 0) l[i] = reg; else l.push(reg);
    gravarLS(kCol(colecao), l);
    return reg;
  }
  const { id, criado_em, ...dados } = reg;
  await sb('/rest/v1/fin_registros', { metodo: 'POST', corpo: { id, colecao, criado_em, dados }, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } });
  return reg;
}

export async function remover(colecao, id) {
  if (modoDemo) { gravarLS(kCol(colecao), lerLS(kCol(colecao), []).filter((x) => x.id !== id)); return; }
  await sb(`/rest/v1/fin_registros?id=eq.${encodeURIComponent(id)}&colecao=eq.${colecao}`, { metodo: 'DELETE' });
}

// Apaga de uma vez todos os registros de uma coleção do financeiro (nunca toca nas vendas da hamburgueria)
export async function removerColecao(colecao) {
  if (modoDemo) { gravarLS(kCol(colecao), []); return; }
  await sb(`/rest/v1/fin_registros?colecao=eq.${encodeURIComponent(colecao)}`, { metodo: 'DELETE' });
}

// ---------- Vendas da hamburgueria (somente leitura) ----------

export async function lerVendasHamburgueria(desdeISO) {
  if (modoDemo) { await garantirDemo(); return { pedidos: lerLS('domfin:demo:pedidos', []), comandas: [] }; }
  try {
    const [pedidos, comandas] = await Promise.all([
      sb(`/rest/v1/pedidos?select=id,numero,criado_em,status,tipo,mesa,cliente,endereco,itens,subtotal,taxa_entrega,desconto,cupom,total,pagamento,pagamentos,comanda_id&criado_em=gte.${encodeURIComponent(desdeISO)}&order=criado_em.desc&limit=20000`),
      sb(`/rest/v1/registros?colecao=eq.comandas&select=id,criado_em,dados&criado_em=gte.${encodeURIComponent(desdeISO)}&limit=5000`).then((l) => l.map((x) => ({ ...x.dados, id: x.id }))).catch(() => []),
    ]);
    return { pedidos: pedidos.map((p) => ({ ...p, subtotal: +p.subtotal, total: +p.total, taxa_entrega: +p.taxa_entrega || 0, desconto: +p.desconto || 0 })), comandas, ok: true };
  } catch (e) {
    return { pedidos: [], comandas: [], erro: e.message };
  }
}

// ---------- Comprovantes ----------

export async function reduzirImagem(arquivo, limite = 1000) {
  const url = URL.createObjectURL(arquivo);
  const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url; });
  const esc = Math.min(1, limite / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL('image/jpeg', 0.7);
}

// ---------- Demonstração ----------

export function resetarDemo() { Object.keys(localStorage).filter((k) => k.startsWith('domfin:')).forEach((k) => localStorage.removeItem(k)); }

async function garantirDemo() {
  if (localStorage.getItem('domfin:demo:pronto')) return;
  const { gerarDemo } = await import('./demo.js');
  const d = gerarDemo();
  for (const [col, lista] of Object.entries(d.colecoes)) gravarLS(kCol(col), lista);
  gravarLS('domfin:demo:pedidos', d.pedidos);
  localStorage.setItem('domfin:demo:pronto', '1');
}
