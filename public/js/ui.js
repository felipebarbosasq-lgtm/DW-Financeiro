// DOM Web Financeiro: utilidades de tela (ícones, janelas, avisos e gráficos).
import { reais, reaisCurto } from './fin.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Ícones de traço fino (estilo minimalista)
const P = {
  resumo: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  vendas: '<path d="M4 7h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  receita: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
  despesa: '<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
  contas: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M8 15h3"/>',
  carteira: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14.5" r="1.2"/>',
  orcamento: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  metas: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  projecao: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  dre: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/><path d="M10 12h6M10 16h6"/>',
  config: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z"/>',
  sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  alerta: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  esq: '<path d="M15 18l-6-6 6-6"/>',
  dir: '<path d="M9 18l6-6-6-6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  baixar: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  repetir: '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  foto: '<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/>',
};
export const icone = (n, t = 18) => `<svg class="ic" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

// ---------- Avisos ----------
let tToast;
export function toast(msg, erro = false) {
  let el = $('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.toggle('erro', erro);
  el.classList.add('ver');
  clearTimeout(tToast);
  tToast = setTimeout(() => el.classList.remove('ver'), erro ? Math.max(4500, msg.length * 60) : 2600);
}

// ---------- Janela ----------
export function abrirModal(titulo, corpo, pe = '', largo = false) {
  const f = $('#modalFundo'); const m = $('#modal');
  m.className = `modal ${largo ? 'largo' : ''}`;
  m.innerHTML = `<div class="modal-cab"><h2>${titulo}</h2><button class="fechar" type="button" aria-label="Fechar">×</button></div><div class="modal-corpo">${corpo}</div>${pe ? `<div class="modal-pe">${pe}</div>` : ''}`;
  $('.fechar', m).onclick = fecharModal;
  f.classList.remove('oculto');
  requestAnimationFrame(() => f.classList.add('ver'));
  setTimeout(() => $('input:not([type=checkbox]):not([type=radio]):not([type=file]), select', m)?.focus(), 60);
  return m;
}
export function fecharModal() { const f = $('#modalFundo'); f.classList.remove('ver'); f.classList.add('oculto'); }
export function confirmar(titulo, texto, ok = 'Confirmar', perigo = false) {
  return new Promise((res) => {
    const m = abrirModal(titulo, `<p>${texto}</p>`, `<button class="btn btn-borda" data-n type="button">Voltar</button><button class="btn ${perigo ? 'btn-perigo' : 'btn-amarelo'}" data-s type="button">${ok}</button>`);
    $('[data-n]', m).onclick = () => { fecharModal(); res(false); };
    $('[data-s]', m).onclick = () => { fecharModal(); res(true); };
  });
}

// ---------- Gráficos (SVG) ----------

// Linhas: entrou x saiu por mês (com área sob "entrou")
export function graficoLinhas(pontos, { altura = 220 } = {}) {
  const L = 640; const A = altura; const m = { e: 46, d: 10, t: 14, b: 26 };
  const max = Math.max(1, ...pontos.flatMap((p) => [p.entrou, p.saiu])) * 1.12;
  const x = (i) => m.e + (i * (L - m.e - m.d)) / Math.max(1, pontos.length - 1);
  const y = (v) => m.t + (A - m.t - m.b) * (1 - v / max);
  const linha = (k) => pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join('');
  const area = `${linha('entrou')}L${x(pontos.length - 1)},${A - m.b}L${x(0)},${A - m.b}Z`;
  const grade = [0, 0.5, 1].map((f) => `<line x1="${m.e}" x2="${L - m.d}" y1="${y(max * f / 1.12)}" y2="${y(max * f / 1.12)}" class="g-grade"/><text x="${m.e - 6}" y="${y(max * f / 1.12) + 4}" class="g-eixo" text-anchor="end">${reaisCurto(max * f / 1.12).replace('R$ ', '')}</text>`).join('');
  return `<svg viewBox="0 0 ${L} ${A}" class="grafico-svg" role="img" aria-label="Evolução de entradas e saídas">
    <defs><linearGradient id="gEntrou" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f9d55" stop-opacity=".22"/><stop offset="1" stop-color="#1f9d55" stop-opacity="0"/></linearGradient></defs>
    ${grade}<path d="${area}" fill="url(#gEntrou)"/><path d="${linha('entrou')}" class="g-l-entrou"/><path d="${linha('saiu')}" class="g-l-saiu"/>
    ${pontos.map((p, i) => `<g class="g-ponto"><circle cx="${x(i)}" cy="${y(p.entrou)}" r="4" class="g-p-entrou"/><circle cx="${x(i)}" cy="${y(p.saiu)}" r="4" class="g-p-saiu"/>
      <text x="${x(i)}" y="${A - 6}" class="g-eixo" text-anchor="middle">${esc(p.rot)}</text>
      <title>${esc(p.rot)} · Entrou ${reais(p.entrou)} · Saiu ${reais(p.saiu)}</title></g>`).join('')}
  </svg>`;
}

// Barras verticais por categoria, coloridas pelo uso do orçamento
export function graficoCategorias(itens, { altura = 230 } = {}) {
  if (!itens.length) return '<p class="vazio">Nenhuma despesa no período</p>';
  const max = Math.max(1, ...itens.map((i) => i.v));
  const total = itens.reduce((s, i) => s + i.v, 0) || 1;
  return `<div class="barras-cat" style="height:${altura}px">${itens.map((i) => `<div class="bc" title="${esc(i.rot)}: ${reais(i.v)}${i.limite ? ` de ${reais(i.limite)}` : ''}">
      <span class="bc-val">${reaisCurto(i.v).replace('R$ ', '')}<small>${Math.round((i.v / total) * 100)}%</small></span>
      <div class="bc-barra ${i.limite ? (i.v / i.limite >= 0.9 ? 'estourou' : i.v / i.limite >= 0.5 ? 'atencao' : 'ok') : 'sem'}" style="height:${(i.v / max) * 100}%"></div>
      <span class="bc-rot">${i.emoji || ''} ${esc(i.rot)}</span></div>`).join('')}</div>`;
}

// Projeção do saldo dia a dia
export function graficoSaldo(serie, { altura = 220 } = {}) {
  const L = 640; const A = altura; const m = { e: 50, d: 10, t: 14, b: 26 };
  const vals = serie.map((s) => s.saldo);
  const max = Math.max(0, ...vals); const min = Math.min(0, ...vals);
  const span = (max - min) || 1;
  const x = (i) => m.e + (i * (L - m.e - m.d)) / Math.max(1, serie.length - 1);
  const y = (v) => m.t + (A - m.t - m.b) * (1 - (v - min) / span);
  const d = serie.map((s, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(s.saldo).toFixed(1)}`).join('');
  const passo = Math.ceil(serie.length / 8);
  return `<svg viewBox="0 0 ${L} ${A}" class="grafico-svg" role="img" aria-label="Projeção do saldo">
    <line x1="${m.e}" x2="${L - m.d}" y1="${y(0)}" y2="${y(0)}" class="g-zero"/>
    <text x="${m.e - 6}" y="${y(max) + 4}" class="g-eixo" text-anchor="end">${reaisCurto(max).replace('R$ ', '')}</text>
    <text x="${m.e - 6}" y="${y(0) + 4}" class="g-eixo" text-anchor="end">0</text>
    ${min < 0 ? `<text x="${m.e - 6}" y="${y(min) + 4}" class="g-eixo" text-anchor="end">${reaisCurto(min).replace('R$ ', '')}</text>` : ''}
    <path d="${d}" class="g-l-saldo"/>
    ${serie.map((s, i) => `<g class="g-ponto"><circle cx="${x(i)}" cy="${y(s.saldo)}" r="${s.sai ? 3.5 : 2}" class="${s.saldo < 0 ? 'g-p-saiu' : 'g-p-saldo'}"/><title>${s.data.split('-').reverse().slice(0, 2).join('/')} · saldo ${reais(s.saldo)}${s.sai ? ` · contas ${reais(s.sai)}` : ''}</title>${i % passo === 0 ? `<text x="${x(i)}" y="${A - 6}" class="g-eixo" text-anchor="middle">${s.data.slice(8, 10)}/${s.data.slice(5, 7)}</text>` : ''}</g>`).join('')}
  </svg>`;
}

export function barra(pct, cls = '') {
  const p = Math.max(0, Math.min(100, pct));
  return `<div class="progresso ${cls}"><div style="width:${p}%"></div><span class="ponta" style="left:${p}%"></span></div>`;
}

export function baixarCSV(nome, linhas) {
  const csv = '﻿' + linhas.map((l) => l.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = nome;
  a.click();
}
export const moedaCSV = (v) => (Number(v) || 0).toFixed(2).replace('.', ',');
