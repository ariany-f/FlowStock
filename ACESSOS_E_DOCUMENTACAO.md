# 🍻 FlowStock - App Nativo de Entrega de Bebidas para Bares (B2B)
> **Identidade Visual:** Inspirada na paleta premium do **App Bebidas** (Azul Escuro Nobre `#1A2B3C` e Dourado Cervejeiro `#FFD700`) harmonizada com os elementos de conversão e velocidade do **iFood** (Vermelho `#EA1D2C`, tags, botões ágeis e carrinho dinâmico).

---

## 🚀 Como Rodar o App

### 1. No Navegador Web (Instantâneo)
```bash
npm run web
```
Ou abra: `http://localhost:8081`

### 2. No Celular (Android e iOS Nativo sem precisar de Mac)
1. Instale o app **Expo Go** na Google Play Store ou Apple App Store.
2. No terminal do computador, execute:
   ```bash
   npx expo start
   ```
3. Aponte a câmera do seu celular para o QR Code gerado no terminal. O app abrirá nativo no seu iPhone ou Android!

---

## 🌐 URLs Diretas de Cada Aplicação (Acesso Exclusivo via URL)

Conforme a arquitetura do projeto, **não existe painel seletor inicial**: a URL principal é diretamente o aplicativo do Dono do Bar. Cada um dos outros módulos e painéis é acessado exclusivamente por sua URL direta:

| Aplicação / Módulo | URL de Acesso Direto | Descrição |
| :--- | :--- | :--- |
| 🍺 **App Dono do Bar** *(Padrão)* | `http://localhost:8081/` | Catálogo B2B, Carrinho, Checkout 3 Passos, Favoritos, Pedidos e Perfil 100% Figma |
| 🚚 **Portal do Distribuidor** | `http://localhost:8081/?app=supplier` | Painel de gestão de pedidos, expedição de cargas e catálogo do fornecedor |
| 🚛 **App do Entregador** | `http://localhost:8081/?app=driver` | Interface mobile do motorista/caminhoneiro com rotas e confirmação de entrega |
| 👑 **Painel Master Admin** | `http://localhost:8081/?app=admin` | Gestão de bares, fornecedores credenciados, taxas e comissões |
| 🔐 **Tela de Login Figma** | `http://localhost:8081/?app=login` | Tela de autenticação nativa fiel ao design do Figma |

> **Nota:** Todos os links suportam compartilhamento direto, histórico do navegador (botão voltar/avançar) e reload sem perda de contexto.

---

### 1. 🍺 Dono de Bar (Cliente B2B Multi-Estabelecimento)
* **Perfil:** Carlos Alberto Mendes
* **E-mail:** `carlos.mendes@botecodochico.com.br`
* **Telefone:** `(11) 98765-4321`
* **Estabelecimentos Vinculados à Conta:**
  1. **Boteco do Carlos - Vila Madalena** (CNPJ: `24.123.456/0001-90` | Limite Faturado: R$ 15.000,00)
  2. **Espetaria & Chopp - Itaim Bibi (Filial 2)** (CNPJ: `24.123.456/0002-71` | Limite Faturado: R$ 20.000,00)
  3. **Rooftop Lounge 360 - Jardins (Filial 3)** (CNPJ: `24.123.456/0003-52` | Limite Faturado: R$ 10.000,00)
* **Funcionalidades:**
  * Seletor de Bar de Entrega no topo com 1 toque.
  * Catálogo de Fornecedores de Bebidas (Ambev, Heineken, Mega Destilados).
  * Carrinho com cálculo de pedido mínimo do distribuidor.
  * Checkouts com Pix Instantâneo (com QR Code simulado e aprovação rápida), Boleto B2B Faturado para 30 dias e Cartão PJ.
  * Rastreamento da entrega do caminhão em tempo real.
  * Botão "+ Cadastrar Novo Bar / Filial".

---

### 2. 🚚 Fornecedor / Distribuidor de Bebidas
* **Perfil:** Distribuidora Ambev & Malte Express
* **E-mail:** `comercial@ambevcentral.com.br`
* **CNPJ:** `02.808.708/0001-07`
* **Funcionalidades:**
  * Painel de Pedidos Recebidos dos bares.
  * Gestão de status de entrega passo a passo:
    * *Confirmar Pagamento Pix* ➔ *Colocar em Separação no Galpão* ➔ *Despachar Caminhão (Em Rota)* ➔ *Confirmar Entrega no Bar*.
  * Gestão de Estoque e Catálogo (Engradados, Barris 50L de Chopp, destilados, garrafas retornáveis).
  * Adicionar novos produtos de bebida com preço de atacado B2B.

---

### 3. 👑 Painel Master Administrativo (Super Admin)
* **Perfil:** Administrador Master BarSupply
* **E-mail:** `admin@barsupply.com.br`
* **Módulos do Painel:**
  1. **Bares Cadastrados:** Aprovar bares em análise, bloquear estabelecimentos inadimplentes e ajustar limites de crédito faturado.
  2. **Contas de Donos de Bares:** Visualizar donos, e-mails, telefones e bares sob a gestão de cada cliente.
  3. **Fornecedores de Bebidas:** Credenciar novos distribuidores, ajustar taxa de comissão da plataforma (%) e configurar Chaves Pix para repasse.
  4. **Custos & Chaves (Nuvem):** Mapeamento detalhado de gratuidade (Supabase Free Tier, Google OAuth, Google Maps e Mercado Pago Pix Sandbox), com script SQL pronto para o PostgreSQL.

---

## 💰 Mapeamento de Custos: Gratuito vs Pago

| Serviço | Camada Gratuita | Quando se torna Pago? |
| :--- | :--- | :--- |
| **Supabase (PostgreSQL & Auth)** | ✅ **100% Gratuito** (até 50.000 usuários ativos/mês e 500MB de banco) | Apenas se ultrapassar 50 mil usuários ($25/mês no plano Pro) |
| **Google Sign-In / OAuth** | ✅ **100% Gratuito** e ilimitado no Google Cloud Console | Nunca cobra nada para autenticação social |
| **Google Maps & Places** | ✅ **$200 USD gratuitos todo mês** (~28.000 buscas grátis/mês) | Exige cadastrar cartão no Google Cloud para obter a chave; só cobra se passar dos $200 grátis |
| **Mercado Pago (Pix & Cartão)** | ✅ **Modo Sandbox 100% Gratuito** para testes sem cobrança | Em produção: taxa de ~0.99% por Pix recebido (se não vender nada, custo é R$ 0,00) |
| **Boleto B2B Faturado** | ✅ **Nativo Gratuito** (gestão de crédito interna entre distribuidor e bar) | Apenas se quiser registro bancário automático via Asaas (~R$ 1,99 por boleto pago) |
