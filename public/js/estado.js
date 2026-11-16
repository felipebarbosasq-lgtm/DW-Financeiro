// Estado compartilhado entre as telas.
import { listar, salvar, remover, removerColecao, lerVendasHamburgueria } from './dados.js';
import { completarConfig, vendasHamburgueria, competencia, hojeTxt, txt, DIA, deTxt } from './fin.js';

export const S = {
  cfg: completarConfig(null),
  carteiras: [], recorrentes: [], lancamentos: [], metas: [], orcamentos: [],
  pedidos: [], comandas: [], vendas: [], erroVendas: '',
  mes: competencia(new Date()),
};

const COLS = ['carteiras', 'recorrentes', 'lancamentos', 'metas', 'orcamentos'];

export async function carregarTudo() {
  const desde = new Date(deTxt(hojeTxt()).getTime() - 400 * DIA).toISOString();
  const [cfgL, ...resto] = await Promise.all([listar('config'), ...COLS.map((c) => listar(c)), lerVendasHamburgueria(desde)]);
  S.cfg = completarConfig(cfgL.find((c) => c.id === 'config'));
  COLS.forEach((c, i) => { S[c] = resto[i]; });
  const v = resto[COLS.length];
  S.pedidos = v.pedidos; S.comandas = v.comandas; S.erroVendas = v.erro || '';
  S.vendas = vendasHamburgueria(S.pedidos, S.comandas);
  if (!S.carteiras.length) {
    const { CARTEIRAS_PADRAO } = await import('./fin.js');
    for (const c of CARTEIRAS_PADRAO) S.carteiras.push(await salvar('carteiras', { ...c, data_inicial: txt(new Date()) }));
  }
}

export async function gravar(col, obj) {
  const reg = await salvar(col, obj);
  if (col === 'config') { S.cfg = completarConfig(reg); return reg; }
  const l = S[col]; const i = l.findIndex((x) => x.id === reg.id);
  if (i >= 0) l[i] = reg; else l.unshift(reg);
  return reg;
}

export async function apagar(col, id) {
  await remover(col, id);
  S[col] = S[col].filter((x) => x.id !== id);
}

// Recomeçar do zero: apaga o que foi cadastrado à mão. As vendas da hamburgueria continuam.
export async function apagarColecoes(cols) {
  for (const c of cols) {
    await removerColecao(c);
    if (c === 'config') S.cfg = completarConfig(null);
    else S[c] = [];
  }
  if (cols.includes('carteiras')) {
    const { CARTEIRAS_PADRAO } = await import('./fin.js');
    for (const c of CARTEIRAS_PADRAO) S.carteiras.push(await salvar('carteiras', { ...c, data_inicial: txt(new Date()) }));
  }
}
