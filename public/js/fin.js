// DOM Web Financeiro: regras e cálculos (sem depender da tela).

export const DIA = 86400000;
export const arred = (v) => Math.round((Number(v) || 0) * 100) / 100;
export const reais = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const reaisCurto = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1000) return `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return reais(n);
};
export const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const MESES_C = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Datas como texto "AAAA-MM-DD" (sem fuso)
export const hojeTxt = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const txt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const deTxt = (t) => { const [a, m, d] = String(t).slice(0, 10).split('-').map(Number); return new Date(a, m - 1, d); };
export const dataBR = (t) => { if (!t) return ''; const d = deTxt(t); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
export const competencia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const diasEntre = (a, b) => Math.round((deTxt(b) - deTxt(a)) / DIA);

export function limitesMes(comp) {
  const [a, m] = comp.split('-').map(Number);
  return { ini: new Date(a, m - 1, 1), fim: new Date(a, m, 0), dias: new Date(a, m, 0).getDate() };
}
export function somarMes(comp, n) {
  const [a, m] = comp.split('-').map(Number);
  return competencia(new Date(a, m - 1 + n, 1));
}
export const nomeMes = (comp) => { const [a, m] = comp.split('-').map(Number); return `${MESES[m - 1]} de ${a}`; };

// ---------- Configuração padrão ----------

export const GRUPOS = {
  cmv: { nome: 'Custo dos produtos (CMV)', cor: '#e9a200' },
  pessoal: { nome: 'Pessoal', cor: '#2d6cdf' },
  fixa: { nome: 'Despesas fixas', cor: '#7a5af5' },
  variavel: { nome: 'Despesas variáveis', cor: '#0ea5a4' },
  imposto: { nome: 'Impostos e taxas', cor: '#e0393e' },
  retirada: { nome: 'Retirada do dono', cor: '#4b4b48' },
  receita: { nome: 'Receitas', cor: '#1f9d55' },
};

export const CONFIG_PADRAO = {
  id: 'config',
  vendas_automaticas: true,
  categorias: [
    { id: 'rec_vendas', nome: 'Vendas da hamburgueria', tipo: 'receita', grupo: 'receita', emoji: '🍔', auto: true },
    { id: 'rec_outras', nome: 'Outras receitas', tipo: 'receita', grupo: 'receita', emoji: '💵' },
    { id: 'rec_aporte', nome: 'Aporte / empréstimo', tipo: 'receita', grupo: 'receita', emoji: '🏦' },
    { id: 'cmv_carnes', nome: 'Carnes e frios', tipo: 'despesa', grupo: 'cmv', emoji: '🥩' },
    { id: 'cmv_paes', nome: 'Pães', tipo: 'despesa', grupo: 'cmv', emoji: '🍞' },
    { id: 'cmv_horti', nome: 'Hortifrúti', tipo: 'despesa', grupo: 'cmv', emoji: '🥬' },
    { id: 'cmv_mercearia', nome: 'Mercearia e molhos', tipo: 'despesa', grupo: 'cmv', emoji: '🧂' },
    { id: 'cmv_bebidas', nome: 'Bebidas para revenda', tipo: 'despesa', grupo: 'cmv', emoji: '🥤' },
    { id: 'cmv_embalagens', nome: 'Embalagens', tipo: 'despesa', grupo: 'cmv', emoji: '📦' },
    { id: 'cmv_gas', nome: 'Gás', tipo: 'despesa', grupo: 'cmv', emoji: '🔥' },
    { id: 'pes_salarios', nome: 'Salários', tipo: 'despesa', grupo: 'pessoal', emoji: '👥' },
    { id: 'pes_diarias', nome: 'Diárias e freelas', tipo: 'despesa', grupo: 'pessoal', emoji: '🧑‍🍳' },
    { id: 'pes_entregas', nome: 'Entregadores', tipo: 'despesa', grupo: 'pessoal', emoji: '🛵' },
    { id: 'fix_aluguel', nome: 'Aluguel', tipo: 'despesa', grupo: 'fixa', emoji: '🏠' },
    { id: 'fix_energia', nome: 'Energia', tipo: 'despesa', grupo: 'fixa', emoji: '⚡' },
    { id: 'fix_agua', nome: 'Água', tipo: 'despesa', grupo: 'fixa', emoji: '💧' },
    { id: 'fix_internet', nome: 'Internet e telefone', tipo: 'despesa', grupo: 'fixa', emoji: '📶' },
    { id: 'fix_sistemas', nome: 'Sistemas e assinaturas', tipo: 'despesa', grupo: 'fixa', emoji: '💻' },
    { id: 'fix_contador', nome: 'Contador', tipo: 'despesa', grupo: 'fixa', emoji: '📑' },
    { id: 'var_marketing', nome: 'Marketing', tipo: 'despesa', grupo: 'variavel', emoji: '📣' },
    { id: 'var_manutencao', nome: 'Manutenção', tipo: 'despesa', grupo: 'variavel', emoji: '🔧' },
    { id: 'var_limpeza', nome: 'Limpeza', tipo: 'despesa', grupo: 'variavel', emoji: '🧽' },
    { id: 'var_outros', nome: 'Outras despesas', tipo: 'despesa', grupo: 'variavel', emoji: '🧾' },
    { id: 'imp_das', nome: 'Impostos (DAS/Simples)', tipo: 'despesa', grupo: 'imposto', emoji: '🏛️' },
    { id: 'imp_taxas', nome: 'Tarifas bancárias', tipo: 'despesa', grupo: 'imposto', emoji: '💳' },
    { id: 'ret_prolabore', nome: 'Retirada do dono', tipo: 'despesa', grupo: 'retirada', emoji: '👑' },
  ],
  // Taxa da maquininha/app por forma de pagamento (%), descontada das vendas no resultado
  taxas: { dinheiro: 0, pix: 0, debito: 1.6, credito: 3.5, outro: 0 },
};

export const CARTEIRAS_PADRAO = [
  { id: 'cart_caixa', nome: 'Caixa (dinheiro)', tipo: 'dinheiro', saldo_inicial: 0, data_inicial: hojeTxt(), recebe: ['dinheiro'] },
  // Pix e cartões caem na conta do banco (a maquininha repassa para lá)
  { id: 'cart_banco', nome: 'Conta bancária', tipo: 'banco', saldo_inicial: 0, data_inicial: hojeTxt(), recebe: ['pix', 'debito', 'credito', 'outro'] },
];

export function completarConfig(c) {
  const cfg = { ...structuredClone(CONFIG_PADRAO), ...(c || {}) };
  cfg.taxas = { ...CONFIG_PADRAO.taxas, ...(c?.taxas || {}) };
  if (!cfg.categorias?.length) cfg.categorias = structuredClone(CONFIG_PADRAO.categorias);
  return cfg;
}

export const categoria = (cfg, id) => cfg.categorias.find((c) => c.id === id) || { id, nome: 'Sem categoria', emoji: '🏷️', grupo: 'variavel', tipo: 'despesa' };

// Tipo da forma de pagamento pelo nome (Pix, Cartão de crédito…)
export function tipoForma(nome = '') {
  const n = nome.toLowerCase();
  if (n.includes('dinheiro')) return 'dinheiro';
  if (n.includes('pix')) return 'pix';
  if (n.includes('créd') || n.includes('cred')) return 'credito';
  if (n.includes('déb') || n.includes('deb')) return 'debito';
  return 'outro';
}

// ---------- Vendas da hamburgueria ----------

// Uma venda por pedido avulso e uma por conta de mesa fechada (mesma regra do painel DOM Web)
export function vendasHamburgueria(pedidos, comandas = []) {
  const v = [];
  for (const p of pedidos) {
    if (p.comanda_id || p.status === 'cancelado' || p.status === 'novo') continue;
    const pags = p.pagamentos?.length ? p.pagamentos : [{ forma: p.pagamento || 'Outro', valor: p.total }];
    v.push({ id: p.id, data: txt(new Date(p.criado_em)), em: p.criado_em, numero: p.numero, tipo: p.tipo, total: +p.total || 0, taxa_entrega: +p.taxa_entrega || 0, pagamentos: pags.map((x) => ({ forma: x.forma, valor: +x.valor || 0 })) });
  }
  for (const c of comandas) {
    if (c.status !== 'fechada') continue;
    v.push({ id: c.id, data: txt(new Date(c.fechada_em || c.aberta_em)), em: c.fechada_em, numero: c.numero, tipo: 'mesa', total: +c.total || 0, taxa_entrega: 0, pagamentos: (c.pagamentos || []).map((x) => ({ forma: x.forma, valor: +x.valor || 0 })) });
  }
  return v;
}

export function taxaVenda(cfg, venda) {
  return venda.pagamentos.reduce((s, p) => s + (p.valor * (cfg.taxas[tipoForma(p.forma)] || 0)) / 100, 0);
}

// Resumo de vendas por dia entre duas datas (texto)
export function vendasPorDia(vendas, ini, fim) {
  const m = new Map();
  for (const v of vendas) {
    if (v.data < ini || v.data > fim) continue;
    const a = m.get(v.data) || { data: v.data, total: 0, pedidos: 0, formas: {} };
    a.total += v.total; a.pedidos++;
    for (const p of v.pagamentos) a.formas[p.forma] = (a.formas[p.forma] || 0) + p.valor;
    m.set(v.data, a);
  }
  return [...m.values()].sort((a, b) => (a.data < b.data ? -1 : 1));
}

// ---------- Contas recorrentes ----------

// Ocorrências de cada conta fixa entre duas datas. recorrente: { dia, frequencia: mensal|semanal|anual, inicio, fim?, mes_anual? }
export function ocorrencias(recorrentes, ini, fim) {
  const lista = [];
  const dIni = deTxt(ini); const dFim = deTxt(fim);
  for (const r of recorrentes) {
    if (r.ativo === false) continue;
    const comeco = r.inicio ? deTxt(r.inicio) : new Date(2000, 0, 1);
    const termino = r.fim ? deTxt(r.fim) : new Date(2100, 0, 1);
    if (r.frequencia === 'semanal') {
      const d = new Date(dIni);
      while (d.getDay() !== Number(r.dia_semana ?? 1)) d.setDate(d.getDate() + 1);
      for (; d <= dFim; d.setDate(d.getDate() + 7)) if (d >= comeco && d <= termino) lista.push({ r, venc: txt(d), comp: txt(d) });
      continue;
    }
    for (let a = dIni.getFullYear(), m = dIni.getMonth(); new Date(a, m, 1) <= dFim; m++) {
      if (m > 11) { m = 0; a++; }
      if (r.frequencia === 'anual' && m !== Number(r.mes_anual ?? 0)) continue;
      const ult = new Date(a, m + 1, 0).getDate();
      const d = new Date(a, m, Math.min(Number(r.dia) || 1, ult));
      if (d < dIni || d > dFim || d < comeco || d > termino) continue;
      lista.push({ r, venc: txt(d), comp: r.frequencia === 'anual' ? String(a) : competencia(d) });
    }
  }
  return lista.sort((x, y) => (x.venc < y.venc ? -1 : 1));
}

// Contas a pagar no período: ocorrências das fixas + despesas lançadas como pendentes
export function contasAPagar(recorrentes, lancamentos, ini, fim) {
  const pagas = new Set(lancamentos.filter((l) => l.recorrente_id).map((l) => `${l.recorrente_id}|${l.competencia}`));
  const itens = ocorrencias(recorrentes, ini, fim).map((o) => ({
    chave: `${o.r.id}|${o.comp}`, origem: 'fixa', recorrente: o.r, descricao: o.r.descricao, categoria_id: o.r.categoria_id,
    valor: arred(o.r.valor), vencimento: o.venc, competencia: o.comp, paga: pagas.has(`${o.r.id}|${o.comp}`),
    lancamento: lancamentos.find((l) => l.recorrente_id === o.r.id && l.competencia === o.comp),
  }));
  for (const l of lancamentos) {
    if (l.tipo !== 'despesa' || l.recorrente_id) continue;
    const venc = l.vencimento || l.data;
    if (venc < ini || venc > fim) continue;
    if (l.status === 'pendente' || (l.vencimento && l.status === 'pago')) {
      itens.push({ chave: l.id, origem: 'avulsa', descricao: l.descricao, categoria_id: l.categoria_id, valor: arred(l.valor), vencimento: venc, paga: l.status === 'pago', lancamento: l });
    }
  }
  return itens.sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1));
}

export function situacaoConta(c, hoje = hojeTxt()) {
  if (c.paga) return { id: 'paga', nome: 'Paga', cor: 'verde' };
  const d = diasEntre(hoje, c.vencimento);
  if (d < 0) return { id: 'atrasada', nome: `Atrasada ${-d} dia${d === -1 ? '' : 's'}`, cor: 'vermelho' };
  if (d === 0) return { id: 'hoje', nome: 'Vence hoje', cor: 'laranja' };
  if (d <= 3) return { id: 'breve', nome: `Vence em ${d} dia${d === 1 ? '' : 's'}`, cor: 'amarelo' };
  return { id: 'futura', nome: `Vence em ${d} dias`, cor: 'cinza' };
}

// ---------- Resultado do mês (DRE simplificada) ----------

export function resultado(cfg, vendas, lancamentos, ini, fim) {
  const vs = vendas.filter((v) => v.data >= ini && v.data <= fim);
  const ls = lancamentos.filter((l) => (l.data || '') >= ini && (l.data || '') <= fim && l.status !== 'pendente');
  const vendasTotal = cfg.vendas_automaticas ? vs.reduce((s, v) => s + v.total, 0) : 0;
  const taxas = cfg.vendas_automaticas ? vs.reduce((s, v) => s + taxaVenda(cfg, v), 0) : 0;
  const porGrupo = {};
  const porCategoria = {};
  for (const l of ls) {
    const c = categoria(cfg, l.categoria_id);
    const chave = l.tipo === 'receita' ? 'receita' : c.grupo;
    porGrupo[chave] = (porGrupo[chave] || 0) + (+l.valor || 0);
    porCategoria[c.id] = (porCategoria[c.id] || 0) + (+l.valor || 0);
  }
  const outrasReceitas = porGrupo.receita || 0;
  const bruto = vendasTotal + outrasReceitas;
  const cmv = porGrupo.cmv || 0;
  const margem = bruto - taxas - cmv;
  const operacionais = (porGrupo.pessoal || 0) + (porGrupo.fixa || 0) + (porGrupo.variavel || 0) + (porGrupo.imposto || 0);
  const lucro = margem - operacionais;
  const retirada = porGrupo.retirada || 0;
  const despesas = cmv + operacionais + retirada;
  return {
    vendas: arred(vendasTotal), pedidos: vs.length, outrasReceitas: arred(outrasReceitas), bruto: arred(bruto), taxas: arred(taxas),
    cmv: arred(cmv), margem: arred(margem), pessoal: arred(porGrupo.pessoal || 0), fixa: arred(porGrupo.fixa || 0),
    variavel: arred(porGrupo.variavel || 0), imposto: arred(porGrupo.imposto || 0), operacionais: arred(operacionais),
    lucro: arred(lucro), retirada: arred(retirada), sobra: arred(lucro - retirada), despesas: arred(despesas),
    entrou: arred(bruto - taxas), saiu: arred(despesas), porCategoria,
    margemPct: bruto ? (lucro / bruto) * 100 : 0, cmvPct: bruto ? (cmv / bruto) * 100 : 0,
  };
}

// ---------- Saldos das contas (carteiras) ----------

export function saldos(cfg, carteiras, vendas, lancamentos, ate = hojeTxt()) {
  return carteiras.map((c) => {
    let s = +c.saldo_inicial || 0;
    const desde = c.data_inicial || '2000-01-01';
    for (const l of lancamentos) {
      if (l.status === 'pendente' || (l.data || '') < desde || (l.data || '') > ate) continue;
      if (l.carteira_id === c.id) s += l.tipo === 'receita' ? +l.valor : -l.valor;
      if (l.tipo === 'transferencia' && l.destino_id === c.id) s += +l.valor;
    }
    if (cfg.vendas_automaticas) {
      for (const v of vendas) {
        if (v.data < desde || v.data > ate) continue;
        for (const p of v.pagamentos) {
          const t = tipoForma(p.forma);
          if ((c.recebe || []).includes(t)) s += p.valor - (p.valor * (cfg.taxas[t] || 0)) / 100;
        }
      }
    }
    return { ...c, saldo: arred(s) };
  });
}

// ---------- Projeção de caixa ----------

// Média de vendas por dia da semana nas últimas 4 semanas (líquida de taxas)
export function mediaVendasSemana(cfg, vendas, hoje = hojeTxt()) {
  const ini = txt(new Date(deTxt(hoje).getTime() - 28 * DIA));
  const soma = Array(7).fill(0);
  for (const v of vendas) if (v.data >= ini && v.data < hoje) soma[deTxt(v.data).getDay()] += v.total - taxaVenda(cfg, v);
  return soma.map((s) => s / 4);
}

export function projecao(cfg, saldoHoje, vendas, recorrentes, lancamentos, dias = 30, hoje = hojeTxt()) {
  const media = cfg.vendas_automaticas ? mediaVendasSemana(cfg, vendas, hoje) : Array(7).fill(0);
  const fim = txt(new Date(deTxt(hoje).getTime() + dias * DIA));
  const contas = contasAPagar(recorrentes, lancamentos, txt(new Date(deTxt(hoje).getTime() - 60 * DIA)), fim).filter((c) => !c.paga);
  const receber = lancamentos.filter((l) => l.tipo === 'receita' && l.status === 'pendente' && (l.vencimento || l.data) <= fim);
  const serie = [];
  let saldo = saldoHoje;
  for (let i = 0; i <= dias; i++) {
    const d = txt(new Date(deTxt(hoje).getTime() + i * DIA));
    const entra = (i === 0 ? 0 : media[deTxt(d).getDay()]) + receber.filter((l) => (i === 0 ? (l.vencimento || l.data) <= d : (l.vencimento || l.data) === d)).reduce((s, l) => s + +l.valor, 0);
    const sai = contas.filter((c) => (i === 0 ? c.vencimento <= d : c.vencimento === d)).reduce((s, c) => s + c.valor, 0);
    saldo += entra - sai;
    serie.push({ data: d, entra: arred(entra), sai: arred(sai), saldo: arred(saldo) });
  }
  return { serie, contas, media };
}
