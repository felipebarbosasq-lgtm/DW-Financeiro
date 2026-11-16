// Dados de exemplo para o modo demonstração (3 meses de uma hamburgueria).
import { CONFIG_PADRAO, CARTEIRAS_PADRAO, txt, competencia, DIA, arred } from './fin.js';

export function gerarDemo() {
  let semente = 7;
  const rnd = () => { semente = (semente * 9301 + 49297) % 233280; return semente / 233280; };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(hoje.getTime() - 95 * DIA);
  const formas = [['Pix', 0.45], ['Cartão de crédito', 0.22], ['Cartão de débito', 0.18], ['Dinheiro', 0.15]];

  // Vendas: mais movimento de sexta a domingo
  const pedidos = [];
  let n = 1000;
  for (let d = new Date(inicio); d <= hoje; d = new Date(d.getTime() + DIA)) {
    const dia = d.getDay();
    const qtd = Math.round((dia === 5 || dia === 6 ? 27 : dia === 0 ? 24 : dia === 1 ? 0 : 13) * (0.8 + rnd() * 0.4));
    for (let i = 0; i < qtd; i++) {
      const total = arred(28 + rnd() * 70);
      let r = rnd(); let forma = 'Pix';
      for (const [f, p] of formas) { if (r < p) { forma = f; break; } r -= p; }
      const em = new Date(d.getTime() + (18.5 + rnd() * 4.5) * 3600000);
      if (em > new Date()) continue;
      pedidos.push({ id: `dp${n}`, numero: ++n, criado_em: em.toISOString(), status: 'concluido', tipo: rnd() < 0.6 ? 'entrega' : 'retirada', total, subtotal: total, taxa_entrega: 0, desconto: 0, pagamento: forma });
    }
  }

  const carteiras = CARTEIRAS_PADRAO.map((c) => ({ ...c, data_inicial: txt(inicio), saldo_inicial: c.tipo === 'banco' ? 3200 : c.tipo === 'dinheiro' ? 300 : 0 }));
  const ini = txt(inicio);
  const recorrentes = [
    { id: 'rc1', descricao: 'Aluguel do ponto', categoria_id: 'fix_aluguel', valor: 1800, dia: 5, frequencia: 'mensal', inicio: ini, carteira_id: 'cart_banco' },
    { id: 'rc2', descricao: 'Salários da equipe', categoria_id: 'pes_salarios', valor: 4200, dia: 5, frequencia: 'mensal', inicio: ini, carteira_id: 'cart_banco' },
    { id: 'rc3', descricao: 'Conta de energia', categoria_id: 'fix_energia', valor: 780, dia: 12, frequencia: 'mensal', inicio: ini, carteira_id: 'cart_banco' },
    { id: 'rc4', descricao: 'Conta de água', categoria_id: 'fix_agua', valor: 140, dia: 15, frequencia: 'mensal', inicio: ini, carteira_id: 'cart_banco' },
    { id: 'rc5', descricao: 'Internet', categoria_id: 'fix_internet', valor: 119.9, dia: 18, frequencia: 'mensal', inicio: ini, carteira_id: 'cart_banco' },
    { id: 'rc6', descricao: 'Contador', categoria_id: 'fix_contador', valor: 380, dia: 20, frequencia: 'mensal', inicio: ini, carteira_id: 'cart_banco' },
    { id: 'rc7', descricao: 'DAS - Simples Nacional', categoria_id: 'imp_das', valor: 950, dia: 20, frequencia: 'mensal', inicio: ini, carteira_id: 'cart_banco' },
    { id: 'rc8', descricao: 'Fornecedor de carnes', categoria_id: 'cmv_carnes', valor: 1650, dia_semana: 2, frequencia: 'semanal', inicio: ini, carteira_id: 'cart_banco' },
    { id: 'rc9', descricao: 'Padaria (pães)', categoria_id: 'cmv_paes', valor: 420, dia_semana: 4, frequencia: 'semanal', inicio: ini, carteira_id: 'cart_banco' },
  ];

  // Lançamentos: contas fixas pagas no passado + compras variáveis
  const lancamentos = [];
  let id = 1;
  const add = (o) => lancamentos.push({ id: `dl${id++}`, criado_em: new Date().toISOString(), status: 'pago', ...o });
  for (let d = new Date(inicio); d < hoje; d = new Date(d.getTime() + DIA)) {
    const t = txt(d);
    for (const r of recorrentes) {
      const venceHoje = r.frequencia === 'semanal' ? d.getDay() === r.dia_semana : d.getDate() === r.dia;
      if (venceHoje && hoje.getTime() - d.getTime() > 2 * DIA) {
        add({ tipo: 'despesa', descricao: r.descricao, categoria_id: r.categoria_id, valor: arred(r.valor * (0.95 + rnd() * 0.1)), data: t, vencimento: t, carteira_id: r.carteira_id, recorrente_id: r.id, competencia: r.frequencia === 'semanal' ? t : competencia(d) });
      }
    }
    if (d.getDay() === 3) add({ tipo: 'despesa', descricao: 'Hortifrúti da semana', categoria_id: 'cmv_horti', valor: arred(260 + rnd() * 120), data: t, carteira_id: 'cart_caixa' });
    if (d.getDay() === 1) add({ tipo: 'despesa', descricao: 'Bebidas para revenda', categoria_id: 'cmv_bebidas', valor: arred(500 + rnd() * 250), data: t, carteira_id: 'cart_banco' });
    if (d.getDate() === 8) add({ tipo: 'despesa', descricao: 'Embalagens (caixas e sacos)', categoria_id: 'cmv_embalagens', valor: arred(650 + rnd() * 200), data: t, carteira_id: 'cart_banco' });
    if (d.getDate() === 2 || d.getDate() === 17) add({ tipo: 'despesa', descricao: 'Botijão de gás', categoria_id: 'cmv_gas', valor: 125, data: t, carteira_id: 'cart_caixa' });
    if (d.getDay() === 0) add({ tipo: 'despesa', descricao: 'Diárias de fim de semana', categoria_id: 'pes_diarias', valor: arred(300 + rnd() * 100), data: t, carteira_id: 'cart_banco' });
    if (d.getDate() === 25) add({ tipo: 'despesa', descricao: 'Anúncio no Instagram', categoria_id: 'var_marketing', valor: 250, data: t, carteira_id: 'cart_banco' });
    if (d.getDate() === 28) add({ tipo: 'despesa', descricao: 'Retirada do dono', categoria_id: 'ret_prolabore', valor: 3000, data: t, carteira_id: 'cart_banco' });
  }
  const daqui = (n) => txt(new Date(hoje.getTime() + n * DIA));
  add({ tipo: 'despesa', descricao: 'Conserto da chapa', categoria_id: 'var_manutencao', valor: 480, data: daqui(4), vencimento: daqui(4), status: 'pendente', carteira_id: 'cart_banco' });
  add({ tipo: 'receita', descricao: 'Evento: festa de aniversário (sinal)', categoria_id: 'rec_outras', valor: 600, data: daqui(-6), carteira_id: 'cart_banco' });

  const metas = [
    { id: 'mt1', nome: 'Reserva de emergência', icone: '🛟', alvo: 20000, prazo: daqui(300), aportes: [{ valor: 6500, data: daqui(-60) }, { valor: 2500, data: daqui(-20) }] },
    { id: 'mt2', nome: 'Chapa e fritadeira novas', icone: '🍳', alvo: 9000, prazo: daqui(150), aportes: [{ valor: 3800, data: daqui(-30) }] },
    { id: 'mt3', nome: 'Reforma do salão', icone: '🛠️', alvo: 25000, prazo: daqui(420), aportes: [{ valor: 4200, data: daqui(-45) }] },
  ];
  const orcamentos = [
    { id: 'or1', categoria_id: 'cmv_carnes', limite: 7000 }, { id: 'or2', categoria_id: 'cmv_embalagens', limite: 800 },
    { id: 'or3', categoria_id: 'var_marketing', limite: 400 }, { id: 'or4', categoria_id: 'pes_diarias', limite: 1500 },
    { id: 'or5', categoria_id: 'cmv_bebidas', limite: 2600 },
  ];
  return {
    pedidos,
    colecoes: { config: [{ ...structuredClone(CONFIG_PADRAO) }], carteiras, recorrentes, lancamentos, metas, orcamentos },
  };
}
