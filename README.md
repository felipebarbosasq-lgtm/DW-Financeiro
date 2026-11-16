# Dom Web Financeiro

Financeiro da hamburgueria, separado do sistema de pedidos, mas **ligado às vendas** do DOM Web.

- **Visão geral:** saldo de hoje e previsto, entrou × saiu, lucro do mês, renda comprometida, alertas de contas
- **Vendas:** faturamento, ticket médio, formas de pagamento e dia a dia, lidos do DOM Web (somente leitura)
- **Receitas e despesas:** com categoria, carteira, foto do comprovante, busca e CSV
- **Contas a pagar e contas fixas:** aluguel, energia, salários… aparecem sozinhas todo mês, com aviso de vencimento
- **Carteiras:** caixa e banco, com transferências; as vendas caem na carteira de cada forma de pagamento (já sem a taxa da maquininha)
- **Orçamentos e metas**
- **Projeção de caixa** para 15, 30 ou 60 dias
- **Resultado do mês (DRE):** faturamento − taxas − CMV − despesas = lucro real
- App instalável (PWA) e acesso **só do dono**

## Como colocar no ar

1. **Supabase** (o mesmo projeto da hamburgueria): SQL Editor › New query › cole `supabase/financeiro.sql` › Run.
2. **Netlify:** Add new site › Import from GitHub › escolha este repositório. Ele já lê o `netlify.toml` (não precisa mudar nada no build).
3. Em *Site configuration › Environment variables*, crie as **mesmas** variáveis do site da hamburgueria:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (a chave **anon/public**; nunca a service_role)
4. *Deploys › Trigger deploy*. Entre com o mesmo e-mail e senha de dono do painel DOM Web.

Sem as variáveis, o app abre em **modo demonstração**, com 3 meses de dados de exemplo salvos só no navegador.

## Segurança

- Tabela própria `fin_registros`: só o login de **dono** lê e grava (regra no banco). Logins da equipe são bloqueados.
- O financeiro **só lê** `pedidos` e `registros` (mesas) do DOM Web. Ele não altera nada no sistema da hamburgueria.

## Desenvolvimento

```bash
npm run preview   # http://localhost:8789 (demonstração)
npm test          # testes dos cálculos + teste no navegador
```
