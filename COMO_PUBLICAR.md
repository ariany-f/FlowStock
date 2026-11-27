# 🚀 Guia de Compilação e Publicação do FlowStock

O repositório já conta com **duas GitHub Actions separadas** para compilar e publicar de forma independente:
- 📱 **Publicar Android (Google Play & APK)**
- 🍎 **Publicar Apple (iOS & TestFlight)**

---

## 📋 Passo 1: Obter o `EXPO_TOKEN` (Gratuito)

O EAS é o serviço em nuvem que compila os aplicativos Android e iOS sem você precisar de um Mac ou Android Studio instalado localmente.

1. Acesse **[expo.dev/signup](https://expo.dev/signup)** e crie uma conta gratuita (ou faça login se já tiver).
2. Vá em **[expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)**.
3. Clique em **"Create Token"** (dê o nome de `github-actions`).
4. Copie o token gerado.

---

## 🔑 Passo 2: Adicionar o Token no seu GitHub

1. Acesse o seu repositório no GitHub:
   👉 **[https://github.com/ariany-f/FlowStock/settings/secrets/actions](https://github.com/ariany-f/FlowStock/settings/secrets/actions)**
2. Clique no botão verde **"New repository secret"**.
3. Preencha:
   - **Name:** `EXPO_TOKEN`
   - **Secret:** *(Cole o token copiado no Passo 1)*
4. Clique em **"Add secret"**.

---

## 📱 Passo 3A: Como Publicar no Android (Google Play / APK)

1. Acesse a aba **Actions** no seu GitHub:
   👉 **[https://github.com/ariany-f/FlowStock/actions](https://github.com/ariany-f/FlowStock/actions)**
2. Na lateral esquerda, clique em **"📱 Publicar Android (Google Play & APK)"**.
3. Clique em **"Run workflow"**:
   - **Tipo de Pacote:**
     - `production`: Gera o arquivo **.aab** oficial para publicar na **Google Play Store**.
     - `preview`: Gera o arquivo **.apk** direto para instalar e testar imediatamente no celular Android.
   - **Enviar automaticamente para o Google Play Console:** Marque `true` se já configurou as credenciais do Play Console no EAS, ou deixe `false` para baixar o `.aab` e subir manualmente no painel web.
4. Clique em **"Run workflow"**.

---

## 🍎 Passo 3B: Como Publicar na Apple (iOS / TestFlight)

1. Na mesma aba **Actions**:
   👉 **[https://github.com/ariany-f/FlowStock/actions](https://github.com/ariany-f/FlowStock/actions)**
2. Na lateral esquerda, clique em **"🍎 Publicar Apple (iOS & TestFlight)"**.
3. Clique em **"Run workflow"**:
   - **Perfil de Compilação:** `production` (gera o `.ipa` assinado para o TestFlight).
   - **Enviar automaticamente para a Apple:** Marque `true` se já conectou sua conta Apple no EAS, ou `false` para apenas compilar.
4. Clique em **"Run workflow"**.

---

## ⚙️ Identificadores dos Aplicativos

- **Android Package:** `com.ariany.flowstock` (Configurado em `app.json`)
- **iOS Bundle Identifier:** `com.ariany.flowstock` (Configurado em `app.json`)
- **Versão:** `1.0.0`

---

## 🌐 Publicar os Painéis Web na Vercel

Todos os painéis (App do Bar, Portal do Distribuidor, App do Entregador, Painel Master e Login) saem do **mesmo build web** do Expo. O `vercel.json` na raiz já define tudo:

- **Build:** `npx expo export -p web`
- **Saída:** `dist`

1. Acesse **[vercel.com/new](https://vercel.com/new)** e importe o repositório `ariany-f/FlowStock`.
2. Deixe **Framework Preset** como `Other` (as configurações vêm do `vercel.json`) e clique em **Deploy**.
3. Cada push na `main` publica automaticamente; PRs ganham uma URL de pré-visualização.

Depois do deploy, os painéis ficam em (troque `SEU-DOMINIO` pela URL da Vercel):

| Painel | URL |
| :--- | :--- |
| 🍺 App do Bar | `https://SEU-DOMINIO/` |
| 🏢 Portal do Distribuidor | `https://SEU-DOMINIO/?app=supplier` |
| 🚚 App do Entregador | `https://SEU-DOMINIO/?app=driver` |
| 🛡️ Painel Master Admin | `https://SEU-DOMINIO/?app=admin` |
| 🔐 Login & Cadastro | `https://SEU-DOMINIO/?app=login` |
