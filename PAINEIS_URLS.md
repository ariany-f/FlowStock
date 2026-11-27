# FlowStock B2B — Guia Oficial de URLs, Painéis e Credenciais de Acesso

O FlowStock foi arquitetado para que a **URL principal limpa seja exclusivamente o App do Bar**, enquanto todos os outros ecossistemas da plataforma (Portal do Distribuidor, App do Entregador, Painel Master e Login) são acessados diretamente via URLs dedicadas com parâmetros de rota e logins pré-configurados.

---

## 📌 Tabela Resumo de Acessos & Credenciais

| Painel / Perfil | URL Local (Dev) | Usuário / E-mail / CNPJ | Senha Padrão | Perfil / Permissão |
| :--- | :--- | :--- | :--- | :--- |
| 🍺 **App do Bar (Principal)** | [`http://localhost:8081/`](http://localhost:8081/) | `carlos.mendes@botecodochico.com.br`<br>*(ou CNPJ: `24.123.456/0001-90`)* | `123456` | **Dono de Bar** (`bar_owner`)<br>*Boteco do Carlos (Crédito Serasa 15d)* |
| 🍺 **App do Bar (Filial 2)** | [`http://localhost:8081/?bar=bar_3`](http://localhost:8081/?bar=bar_3) | `mariana@tavernabar.com.br`<br>*(ou CNPJ: `45.678.901/0001-23`)* | `123456` | **Dono de Bar** (`bar_owner`)<br>*Taverna do Malte & Chopp* |
| 🏢 **Portal do Distribuidor** | [`http://localhost:8081/?app=supplier`](http://localhost:8081/?app=supplier) | `comercial@ambevcentral.com.br`<br>*(ou `Distribuidora Ambev`)* | `123456` | **Fornecedor B2B** (`supplier`)<br>*Ambev & Malte Central* |
| 🏢 **Portal do Distribuidor 2** | [`http://localhost:8081/?app=supplier`](http://localhost:8081/?app=supplier) | `pedidos@megadestilados.com.br`<br>*(ou `Mega Distribuidora`)* | `123456` | **Fornecedor B2B** (`supplier`)<br>*Mega Atacado Destilados* |
| 🚚 **App do Entregador** | [`http://localhost:8081/?app=driver`](http://localhost:8081/?app=driver) | `marcos.entregas@ambevcentral.com.br`<br>*(ou `Marcos Silva`)* | `123456` | **Motorista de Carga** (`driver`)<br>*Logística e Retornáveis* |
| 🛡️ **Painel Master Admin** | [`http://localhost:8081/?app=admin`](http://localhost:8081/?app=admin) | `admin@flowstock.com.br`<br>*(ou `Admin Master`)* | `admin123`<br>*(ou `123456`)* | **Super Administrador** (`admin`)<br>*Gestão Global & Moderação Apple* |
| 🔐 **Login & Cadastro B2B** | [`http://localhost:8081/?app=login`](http://localhost:8081/?app=login) | *Qualquer um dos e-mails acima ou novo cadastro de CNPJ* | `123456` | **Portal de Autenticação**<br>*3 etapas com Serasa* |

> 💡 **Dica de Desenvolvimento:** Qualquer usuário aceita qualquer senha numérica no ambiente de testes (ex: `123456`). O campo de login aceita tanto o **E-mail**, o **Nome**, quanto o **CNPJ** do estabelecimento.

---

## 🍺 1. App do Bar (Cliente B2B — URL Principal)

- **URL:** [`http://localhost:8081/`](http://localhost:8081/)
- **Credenciais Sugeridas:**
  - **Login:** `carlos.mendes@botecodochico.com.br` (ou nome `Carlos Alberto Mendes`, ou CNPJ `24.123.456/0001-90`)
  - **Senha:** `123456`
- **Estabelecimento Ativo:** *Boteco do Carlos - Vila Madalena (SP)*
- **Crédito Serasa:** Score 845 • **Aprovado** com R$ 15.000,00 de limite para pagar em até 15 dias no boleto.

### Abas Principais (Inferiores)
- **Home (Início):** [`http://localhost:8081/`](http://localhost:8081/) ou [`http://localhost:8081/?tab=home`](http://localhost:8081/?tab=home)
  - Busca inteligente com histórico persistente, filtros rápidos, cervejas, chopp 50L e distribuidores próximos via GPS.
- **Fornecedores Favoritos:** [`http://localhost:8081/?tab=favorites`](http://localhost:8081/?tab=favorites)
  - Cards dedicados dos distribuidores parceiros, reposição rápida em 1 toque e carrossel de destaques.
- **Meus Pedidos & Rastreamento:** [`http://localhost:8081/?tab=orders`](http://localhost:8081/?tab=orders)
  - Acompanhamento em tempo real do status da entrega (Aguardando Pix, Em Separação, Caminhão em Rota, Entregue).
- **Perfil & Configurações:** [`http://localhost:8081/?tab=menu`](http://localhost:8081/?tab=menu)
  - Dados cadastrais do estabelecimento, edição de endereço, seletor de idioma (PT-BR, EN-US, ES), Canal de Denúncias Apple Guideline 1.2, Dark Mode e central de suporte.

### Telas Internas e Parâmetros Específicos
- **Sacola / Checkout:** [`http://localhost:8081/?screen=checkout`](http://localhost:8081/?screen=checkout)
  - Finalização em 3 passos com faturamento a prazo (boleto 15 dias) ou Pix instantâneo com chave copia-e-cola.
- **Detalhes de um Produto:** [`http://localhost:8081/?screen=product&prod=prod_1`](http://localhost:8081/?screen=product&prod=prod_1)
- **Catálogo de um Distribuidor:** [`http://localhost:8081/?screen=supplier&supp=supp_1`](http://localhost:8081/?screen=supplier&supp=supp_1)
- **Seleção de Bar (Multi-Estabelecimento):** [`http://localhost:8081/?bar=bar_1`](http://localhost:8081/?bar=bar_1) ou [`http://localhost:8081/?bar=bar_3`](http://localhost:8081/?bar=bar_3)

---

## 🏢 2. Portal do Fornecedor / Distribuidor

- **URL:** [`http://localhost:8081/?app=supplier`](http://localhost:8081/?app=supplier)
- **Credenciais Sugeridas:**
  - **Login:** `comercial@ambevcentral.com.br` (ou nome `Distribuidora Ambev & Malte Central`)
  - **Senha:** `123456`
  - **Distribuidor 2:** `pedidos@megadestilados.com.br` / Senha: `123456`

### Recursos Disponíveis:
- **Gestão de Pedidos:** Separação no galpão, despacho para caminhões de entrega e confirmação de pagamento Pix.
- **Catálogo & Preços:** Cadastro de lotes, barris de chopp 50L, garrafas retornáveis e latas.
- **Controle de Cascos e Engradados:** Balanço de vasilhames retornáveis pendentes de troca com cada bar parceiro.
- **Conciliação Financeira:** Faturamento faturado líquido e taxas de intermediação B2B.

---

## 🚚 3. App do Entregador (Logística & Caminhão)

- **URL:** [`http://localhost:8081/?app=driver`](http://localhost:8081/?app=driver)
- **Credenciais Sugeridas:**
  - **Login:** `marcos.entregas@ambevcentral.com.br` (ou nome `Marcos Silva`)
  - **Senha:** `123456`

### Recursos Disponíveis:
- **Roteiro do Dia:** Lista de estabelecimentos ordenados por rota e janela de recebimento.
- **Conferência de Carga:** Verificação de caixas de garrafas 600ml e barris de chopp inox.
- **Logística Reversa:** Registro de cascos vazios recolhidos no estabelecimento.
- **Comprovante Digital:** Baixa instantânea da entrega com assinatura e fotos.

---

## 🛡️ 4. Painel Master B2B (Administração & Moderação Geral)

- **URL:** [`http://localhost:8081/?app=admin`](http://localhost:8081/?app=admin)
- **Credenciais Sugeridas:**
  - **Login:** `admin@flowstock.com.br` (ou nome `Admin Master FlowStock`)
  - **Senha:** `admin123` (ou `123456`)

### Recursos Disponíveis:
- **Central de Moderação & Denúncias (Apple Guideline 1.2):**
  - Monitoramento e tratamento em tempo real de denúncias de produtos falsificados, cobranças indevidas, condutas abusivas e fraudes.
  - Ações imediatas: *Suspender Fornecedor / Conta*, *Emitir Advertência*, *Colocar em Investigação Técnica*, *Resolver / Regularizar* e *Descartar*.
  - Indicadores de SLA de resposta obrigatória em 24h.
- **Rede de Bares:** Aprovação cadastral de estabelecimentos e liberação de limites de crédito faturado (R$ 15.000+).
- **Distribuidores Homologados:** Gestão de taxas de comissão e integração com galpões regionais.
- **Métricas Globais:** Volume transacionado (GMV), ticket médio B2B e extrato financeiro.

---

## 🔐 5. Tela de Login & Cadastro B2B

- **URL:** [`http://localhost:8081/?app=login`](http://localhost:8081/?app=login)
- **Login Rápido de Demonstração:**
  - Já vem pré-preenchido com `Carlos Alberto Mendes` e senha `123456` para entrada em 1 toque.
- **Cadastro em 3 Passos:**
  - **Passo 1:** Dados do Responsável (Nome, E-mail, Celular, Senha).
  - **Passo 2:** Dados Empresariais do Bar (CNPJ com preenchimento automático, Razão Social, Telefone).
  - **Passo 3:** Endereço de Descarga & Consulta de Crédito Serasa em tempo real com liberação de até 15 dias no boleto.
