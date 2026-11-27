# Publicação do FlowStock nas lojas

## Identificadores (definitivos depois do primeiro envio)
- iOS bundle ID: `br.com.flowstock`
- Android package: `br.com.flowstock`

## Metadados sugeridos

**Nome:** FlowStock - Bebidas B2B
**Subtítulo (iOS, 30 caracteres):** Abastecimento para seu bar
**Descrição curta (Play, 80 caracteres):** Compre bebidas e chopp direto dos distribuidores para o seu bar ou restaurante.

**Descrição completa:**
O FlowStock conecta bares e restaurantes aos distribuidores de bebidas da sua região.
Encontre fornecedores próximos, compare preços de atacado e faça pedidos de cervejas,
barris de chopp, destilados e muito mais em poucos toques.

- Catálogo de distribuidores perto do seu estabelecimento
- Gestão de vários bares e filiais na mesma conta
- Pagamento por Pix, boleto faturado ou cartão PJ
- Acompanhamento da entrega em tempo real
- Histórico de pedidos e favoritos

Uso exclusivo para estabelecimentos comerciais (CNPJ). Venda de bebidas alcoólicas apenas para maiores de 18 anos.

**Categoria:** Negócios (iOS) / Comer e beber ou Empresa (Play)
**Classificação etária:** 17+ (iOS) / 18+ (Play), por envolver venda de álcool
**Palavras-chave (iOS):** bebidas,chopp,distribuidor,bar,restaurante,atacado,cerveja,b2b,pedido,estoque

## O que cada loja exige e ainda falta
- URL da Política de Privacidade (obrigatória nas duas lojas; o app usa localização)
- URL de suporte (iOS)
- Screenshots: iPhone 6,9" (1320x2868) e Android telefone (mín. 2 imagens)
- Play: imagem de destaque 1024x500 e ícone 512x512
- Formulário de Segurança dos Dados (Play) e Privacidade do App (iOS): localização, e-mail, telefone
- Conta de teste para a revisão da Apple/Google
- Exclusão de conta dentro do app (exigida pelas duas lojas quando há cadastro)

## Comandos
```bash
npx eas-cli@latest login
npx eas-cli@latest init                       # cria o projeto no Expo e grava o projectId
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios --latest      # vai para o TestFlight
npx eas-cli@latest submit --platform android --latest  # vai para o teste interno (rascunho)
```
