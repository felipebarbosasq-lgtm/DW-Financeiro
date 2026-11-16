// Testes das contas (sem navegador): node tests/calculos.mjs
import assert from 'node:assert/strict';
import { resultado, contasAPagar, ocorrencias, saldos, vendasHamburgueria, completarConfig, projecao, situacaoConta } from '../public/js/fin.js';

const cfg = completarConfig({});
const pedidos = [
  { id: 'a', criado_em: '2026-03-10T21:00:00', status: 'concluido', total: 100, pagamento: 'Pix' },
  { id: 'b', criado_em: '2026-03-11T21:00:00', status: 'concluido', total: 200, pagamento: 'Cartão de crédito' },
  { id: 'c', criado_em: '2026-03-11T21:00:00', status: 'cancelado', total: 999, pagamento: 'Pix' },
  { id: 'd', criado_em: '2026-03-11T21:00:00', status: 'novo', total: 999, pagamento: 'Pix' },
  { id: 'e', criado_em: '2026-03-12T21:00:00', status: 'concluido', total: 50, comanda_id: 'm1', pagamento: 'Pix' },
];
const comandas = [{ id: 'm1', status: 'fechada', fechada_em: '2026-03-12T22:00:00', total: 80, pagamentos: [{ forma: 'Dinheiro', valor: 80 }] }, { id: 'm2', status: 'aberta', total: 10 }];
const vendas = vendasHamburgueria(pedidos, comandas);
assert.equal(vendas.length, 3, 'ignora cancelado, novo, pedido de mesa e mesa aberta');
assert.equal(vendas.reduce((s, v) => s + v.total, 0), 380);

const lanc = [
  { tipo: 'despesa', categoria_id: 'cmv_carnes', valor: 100, data: '2026-03-05', status: 'pago', carteira_id: 'cart_banco' },
  { tipo: 'despesa', categoria_id: 'fix_aluguel', valor: 50, data: '2026-03-06', status: 'pago', carteira_id: 'cart_banco', recorrente_id: 'r1', competencia: '2026-03' },
  { tipo: 'despesa', categoria_id: 'ret_prolabore', valor: 30, data: '2026-03-07', status: 'pago', carteira_id: 'cart_caixa' },
  { tipo: 'despesa', categoria_id: 'var_outros', valor: 999, data: '2026-03-08', vencimento: '2026-03-20', status: 'pendente', carteira_id: 'cart_banco' },
  { tipo: 'receita', categoria_id: 'rec_outras', valor: 20, data: '2026-03-09', status: 'pago', carteira_id: 'cart_caixa' },
];
const r = resultado(cfg, vendas, lanc, '2026-03-01', '2026-03-31');
assert.equal(r.bruto, 400);
assert.equal(r.taxas, 7); // 3,5% de 200 no crédito
assert.equal(r.cmv, 100);
assert.equal(r.lucro, 400 - 7 - 100 - 50);
assert.equal(r.sobra, r.lucro - 30);

const rec = [{ id: 'r1', descricao: 'Aluguel', valor: 50, dia: 31, frequencia: 'mensal', inicio: '2026-01-01', categoria_id: 'fix_aluguel' }];
const oc = ocorrencias(rec, '2026-02-01', '2026-04-30');
assert.deepEqual(oc.map((o) => o.venc), ['2026-02-28', '2026-03-31', '2026-04-30'], 'dia 31 vira último dia do mês');
const contas = contasAPagar(rec, lanc, '2026-03-01', '2026-03-31');
assert.equal(contas.length, 2);
assert.ok(contas.find((c) => c.origem === 'fixa').paga, 'aluguel de março foi pago');
assert.equal(situacaoConta({ paga: false, vencimento: '2026-03-20' }, '2026-03-22').id, 'atrasada');

const cart = [{ id: 'cart_caixa', saldo_inicial: 10, data_inicial: '2026-03-01', recebe: ['dinheiro'] }, { id: 'cart_banco', saldo_inicial: 0, data_inicial: '2026-03-01', recebe: ['pix', 'credito', 'debito', 'outro'] }];
const s = saldos(cfg, cart, vendas, [...lanc, { tipo: 'transferencia', valor: 5, data: '2026-03-10', carteira_id: 'cart_caixa', destino_id: 'cart_banco', status: 'pago' }], '2026-03-31');
assert.equal(s[0].saldo, 10 + 80 - 30 + 20 - 5);
assert.equal(s[1].saldo, 100 + 200 - 7 - 100 - 50 + 5);

const p = projecao(cfg, 1000, [], rec, [], 10, '2026-03-25');
assert.equal(p.serie.length, 11);
assert.equal(p.serie.at(-1).saldo, 1000 - 50 * 3, 'aluguel de jan, fev (atrasados) e março');
console.log('✓ cálculos ok');
