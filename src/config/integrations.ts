import { IntegrationServiceConfig } from '../types';

/**
 * Mapeamento e Configuração de Integrações do FlowStock
 * Documenta claramente o que é gratuito, o que exige chaves
 * e o que se torna pago ao escalar.
 */

export const INTEGRATION_SERVICES: IntegrationServiceConfig[] = [
  {
    id: 'supabase',
    name: 'Supabase (Banco de Dados PostgreSQL & Auth)',
    category: 'database',
    isConfigured: false, // Detectado dinamicamente via env
    isFreeTierAvailable: true,
    freeTierDetails: '✅ 100% GRATUITO na camada Free: 500MB de banco PostgreSQL, 50.000 usuários ativos/mês, 1GB de Storage para fotos de bebidas e Realtime incluído.',
    paidRequirements: 'Apenas se ultrapassar 50 mil usuários ativos ou 500MB de dados ($25/mês no plano Pro).',
    documentationUrl: 'https://supabase.com/docs',
    envKeys: ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    statusMessage: 'Operando em modo Mock Local (armazenamento offline persistente). Adicione as chaves no .env para nuvem.',
  },
  {
    id: 'google_auth',
    name: 'Google Sign-In / OAuth 2.0',
    category: 'auth',
    isConfigured: false,
    isFreeTierAvailable: true,
    freeTierDetails: '✅ 100% GRATUITO E ILIMITADO no Google Cloud Console para autenticação social.',
    paidRequirements: 'Gratuito para sempre. Exige apenas criação de Client ID no Google Cloud Console e vincular ao Supabase.',
    documentationUrl: 'https://console.cloud.google.com/apis/credentials',
    envKeys: ['EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID', 'EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS'],
    statusMessage: 'Simulação de login com Google ativa com 1 toque no app.',
  },
  {
    id: 'google_maps',
    name: 'Google Maps & Places API (Geolocalização dos Bares)',
    category: 'maps',
    isConfigured: false,
    isFreeTierAvailable: true,
    freeTierDetails: '✅ $200 USD de crédito gratuito MENSAL recorrente fornecido pelo Google Cloud (permite até ~28.000 buscas e geocodificações gratuitas todo mês).',
    paidRequirements: '⚠️ Requer cadastrar cartão de crédito no Google Cloud para ativar a API Key. Não cobra nada dentro dos $200/mês grátis. Cobrança de ~$0.005 por busca extra além da cota.',
    documentationUrl: 'https://developers.google.com/maps/gmp-get-started',
    envKeys: ['EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'],
    statusMessage: 'Usando coordenadas e endereços locais validados com CEP brasileiro.',
  },
  {
    id: 'pix_payment',
    name: 'Pagamento Pix Automático (Mercado Pago / Banco Central)',
    category: 'payment',
    isConfigured: false,
    isFreeTierAvailable: true,
    freeTierDetails: '✅ Modo Sandbox/Testes 100% GRATUITO sem nenhuma cobrança. Não há mensalidade fixa.',
    paidRequirements: '⚠️ Em PRODUÇÃO: Mercado Pago cobra apenas uma taxa de ~0.99% por Pix recebido com sucesso (se você não vender nada, o custo é R$ 0,00).',
    documentationUrl: 'https://www.mercadopago.com.br/developers/pt/docs',
    envKeys: ['EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'MERCADO_PAGO_ACCESS_TOKEN'],
    statusMessage: 'Modo Sandbox de Pix Instantâneo ativo com QR Code Copia-e-Cola e confirmação em 3 segundos.',
  },
  {
    id: 'boleto_faturado',
    name: 'Boleto B2B Faturado (15/30 Dias)',
    category: 'payment',
    isConfigured: true,
    isFreeTierAvailable: true,
    freeTierDetails: '✅ 100% GRATUITO no sistema nativo: Permite faturamento direto entre Distribuidor e Bar com checagem de limite de crédito.',
    paidRequirements: 'Sem custos. Se quiser emissão automática de boletos bancários registrados via Asaas ou Mercado Pago, há custo de ~R$ 1,99 por boleto pago.',
    documentationUrl: 'https://www.asaas.com/precos',
    envKeys: ['EXPO_PUBLIC_BOLETO_PROVIDER'],
    statusMessage: 'Ativo nativamente no sistema com gestão de crédito por bar.',
  },
];

export const APP_ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  MERCADO_PAGO_PUBLIC_KEY: process.env.EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '',
  IS_DEMO_MODE: true,
};
