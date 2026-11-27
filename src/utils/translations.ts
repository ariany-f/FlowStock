export type AppLanguage = 'pt' | 'en' | 'es';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  badge: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'pt',
    name: 'Português (Brasil)',
    nativeName: 'Português (Brasil)',
    flag: '🇧🇷',
    badge: 'PT-BR',
  },
  {
    code: 'en',
    name: 'Inglês (Estados Unidos)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    badge: 'EN-US',
  },
  {
    code: 'es',
    name: 'Espanhol',
    nativeName: 'Español',
    flag: '🇪🇸',
    badge: 'ES',
  },
];

export const translations: Record<AppLanguage, Record<string, string>> = {
  pt: {
    language: 'Idioma',
    selectLanguage: 'Selecionar Idioma',
    myAddress: 'Meu Endereço',
    darkMode: 'Modo Escuro',
    promotionalActivity: 'Atividades Promocionais',
    coupon: 'Cupons',
    myOrders: 'Meus Pedidos',
    helpCenter: 'Central de Ajuda',
    privacyPolicy: 'Política de Privacidade',
    logout: 'Sair da Conta',
    activeBars: 'Estabelecimentos Ativos',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    languageChangedTitle: 'Idioma Atualizado',
    languageChangedMsg: 'O idioma do aplicativo foi alterado com sucesso.',
  },
  en: {
    language: 'Language',
    selectLanguage: 'Select Language',
    myAddress: 'My Address',
    darkMode: 'Dark Mode',
    promotionalActivity: 'Promotional Activity',
    coupon: 'Coupons',
    myOrders: 'My Orders',
    helpCenter: 'Help Center',
    privacyPolicy: 'Privacy Policy',
    logout: 'Log Out',
    activeBars: 'Active Establishments',
    cancel: 'Cancel',
    confirm: 'Confirm',
    languageChangedTitle: 'Language Updated',
    languageChangedMsg: 'Application language has been successfully updated.',
  },
  es: {
    language: 'Idioma',
    selectLanguage: 'Seleccionar Idioma',
    myAddress: 'Mi Dirección',
    darkMode: 'Modo Oscuro',
    promotionalActivity: 'Actividad Promocional',
    coupon: 'Cupones',
    myOrders: 'Mis Pedidos',
    helpCenter: 'Centro de Ayuda',
    privacyPolicy: 'Política de Privacidad',
    logout: 'Cerrar Sesión',
    activeBars: 'Establecimientos Activos',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    languageChangedTitle: 'Idioma Actualizado',
    languageChangedMsg: 'El idioma de la aplicación se ha actualizado con éxito.',
  },
};

export const getTranslation = (lang: AppLanguage, key: string, fallback?: string): string => {
  return translations[lang]?.[key] || fallback || key;
};
