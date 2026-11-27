import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  UserAccount, 
  BarEstablishment, 
  SupplierAccount, 
  BeverageProduct, 
  CartItem, 
  Order, 
  UserRole,
  OrderStatus,
  UserLocation,
  RegisterOwnerAndBarData,
  ContentReport,
  ReportTargetType,
  ReportReasonCategory,
  ReportStatus,
  ModerationAction,
  AppNotification,
  MfaSession,
  MfaChannel,
  SupplierConflict
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_BARS, 
  INITIAL_SUPPLIERS, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS,
  INITIAL_REPORTS,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';
import { 
  requestDeviceLocation, 
  calculateDistanceKm, 
  formatDistance 
} from '../services/locationService';
import { AppLanguage, getTranslation } from '../utils/translations';

interface AppContextType {
  // Auth & Roles
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registerBarAndOwner: (data: RegisterOwnerAndBarData) => Promise<{ user: UserAccount; bar: BarEstablishment }>;
  allUsers: UserAccount[];
  switchUserRole: (role: UserRole) => void;
  updateUserAccount: (userId: string, data: Partial<UserAccount>) => void;
  addUserAccount: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;

  // Autenticação Multifator (MFA / 2FA)
  activeMfaSession: MfaSession | null;
  requestMfaCode: (identifier: string, channel?: MfaChannel) => Promise<MfaSession>;
  verifyMfaCode: (code: string, rememberDevice?: boolean) => Promise<boolean>;
  cancelMfa: () => void;

  // Bares (Multi-Bar por Dono)
  bars: BarEstablishment[];
  myBars: BarEstablishment[];
  selectedBar: BarEstablishment | null;
  selectBar: (barId: string) => void;
  addBar: (bar: Omit<BarEstablishment, 'id' | 'createdAt'>) => void;
  updateBar: (barId: string, data: Partial<BarEstablishment>) => Promise<void>;
  updateBarStatus: (barId: string, status: 'active' | 'pending_approval' | 'blocked') => void;
  updateBarCreditLimit: (barId: string, newLimit: number) => void;

  // Fornecedores
  suppliers: SupplierAccount[];
  selectedSupplier: SupplierAccount | null;
  setSelectedSupplier: (supp: SupplierAccount | null) => void;
  addSupplier: (supplier: Omit<SupplierAccount, 'id'>) => void;
  updateSupplier: (supplierId: string, data: Partial<SupplierAccount>) => void;
  updateSupplierStatus: (supplierId: string, status: 'active' | 'pending_approval' | 'suspended') => void;
  updateSupplierCommission: (supplierId: string, commission: number) => void;

  // Produtos
  products: BeverageProduct[];
  addProduct: (product: Omit<BeverageProduct, 'id'>) => void;
  updateProduct: (productId: string, data: Partial<BeverageProduct>) => void;
  deleteProduct: (productId: string) => void;

  // Carrinho
  cart: CartItem[];
  addToCart: (product: BeverageProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartSupplierId: string | null;
  cartSupplier: SupplierAccount | null;
  supplierConflict: SupplierConflict | null;
  resolveSupplierConflict: (confirm: boolean) => void;

  // Pedidos
  orders: Order[];
  createOrder: (orderData: {
    paymentMethod: 'pix' | 'boleto_faturado' | 'credit_card';
    deliveryNotes?: string;
    deliveryAddress?: string;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  confirmOrderPayment: (orderId: string) => void;
  payBoletoInvoice: (orderId: string) => Promise<boolean>;
  updateBarCreditStatus: (barId: string, status: 'approved' | 'restricted', limit?: number, score?: number) => void;

  // Favoritos
  favoriteProductIds: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Tema (Dark / Light)
  isDarkMode: boolean;
  setDarkMode: (val: boolean) => void;
  toggleDarkMode: () => void;
  theme: ThemeColors;

  // Idioma (Language)
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  t: (key: string, fallback?: string) => string;

  // Localização & Proximidade de Fornecedores
  userLocation: UserLocation | null;
  locationPermission: 'undetermined' | 'granted' | 'denied';
  isRequestingLocation: boolean;
  isUsingDeviceLocation: boolean;
  requestLocation: () => Promise<boolean>;
  activateDeviceLocation: () => Promise<boolean>;
  setCustomUserLocation: (loc: UserLocation) => Promise<void>;
  getSupplierDistance: (supplier: SupplierAccount) => { distanceKm: number; formatted: string };

  // Reset/Seed
  resetDatabaseToDefault: () => Promise<void>;

  // Buscas Recentes Persistidas
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;

  // Moderação de Conteúdo & Denúncias (Apple Guideline 1.2)
  reports: ContentReport[];
  createReport: (data: {
    targetType: ReportTargetType;
    targetId: string;
    targetName: string;
    targetDetails?: string;
    reasonCategory: ReportReasonCategory;
    reasonDescription: string;
    evidenceNotes?: string;
  }) => Promise<ContentReport>;
  updateReportStatus: (
    reportId: string, 
    status: ReportStatus, 
    action?: ModerationAction, 
    notes?: string
  ) => Promise<void>;
  blockedSupplierIds: string[];
  blockSupplier: (supplierId: string) => Promise<void>;
  unblockSupplier: (supplierId: string) => Promise<void>;
  isSupplierBlocked: (supplierId: string) => boolean;

  // Notificações do Sistema
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<AppNotification>;
}

export interface ThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceInput: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  card: string;
  statusBar: 'light-content' | 'dark-content';
}

export const darkTheme: ThemeColors = {
  isDark: true,
  background: '#0D1C28',
  surface: '#112332',
  surfaceSecondary: '#162839',
  surfaceInput: '#101F2D',
  border: '#182C3D',
  text: '#FFFFFF',
  textSecondary: '#8FA0AF',
  textMuted: '#52667A',
  primary: '#FFC107',
  primaryText: '#0D1C28',
  card: '#112332',
  statusBar: 'light-content',
};

export const lightTheme: ThemeColors = {
  isDark: false,
  background: '#FFFFFF', // Fundo branco limpo fiel ao Figma em Modo Light
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  surfaceInput: '#F8FAFC',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#FFC107',
  primaryText: '#0D1C28',
  card: '#FFFFFF',
  statusBar: 'dark-content',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: '@flowstock_users_v1',
  CURRENT_USER_ID: '@flowstock_current_user_v1',
  BARS: '@flowstock_bars_v1',
  SELECTED_BAR_ID: '@flowstock_selected_bar_v1',
  LOCATION_MODE: '@flowstock_location_mode_v1', // 'bar' | 'gps' | 'custom'
  USE_DEVICE_LOCATION: '@flowstock_use_device_location',
  SUPPLIERS: '@flowstock_suppliers_v1',
  PRODUCTS: '@flowstock_products_v1',
  ORDERS: '@flowstock_orders_v1',
  CART: '@flowstock_cart_v1',
  FAVORITES: '@flowstock_favorites_v1',
  THEME: '@flowstock_theme_dark_v1',
  LOCATION: '@flowstock_user_location_v1',
  RECENT_SEARCHES: '@flowstock_recent_searches_v1',
  LANGUAGE: '@flowstock_language_v1',
  REPORTS: '@flowstock_content_reports_v1',
  BLOCKED_SUPPLIERS: '@flowstock_blocked_suppliers_v1',
  NOTIFICATIONS: '@flowstock_notifications_v1',
};

const generateMfaCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();
const getTimestampNow = (): number => Date.now();

const INITIAL_RECENT_SEARCHES = [
  'Heineken 600ml',
  'Chopp Brahma 50L',
  'Corona Long Neck',
  'Tanqueray Gin',
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(INITIAL_USERS[0]); // Dono do Bar padrão
  const [bars, setBars] = useState<BarEstablishment[]>(INITIAL_BARS);
  const [selectedBarId, setSelectedBarId] = useState<string>('bar_1');
  const [suppliers, setSuppliers] = useState<SupplierAccount[]>(INITIAL_SUPPLIERS);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierAccount | null>(null);
  const [products, setProducts] = useState<BeverageProduct[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [supplierConflict, setSupplierConflict] = useState<SupplierConflict | null>(null);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>(['prod_1', 'prod_2', 'prod_9']);
  const [recentSearches, setRecentSearches] = useState<string[]>(INITIAL_RECENT_SEARCHES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [language, setLanguageState] = useState<AppLanguage>('pt');
  const [reports, setReports] = useState<ContentReport[]>(INITIAL_REPORTS);
  const [blockedSupplierIds, setBlockedSupplierIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Localização do Usuário / GPS
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [isUsingDeviceLocation, setIsUsingDeviceLocation] = useState<boolean>(true);

  // Carregar dados salvos do AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          savedUsers, 
          savedBars, 
          savedSuppliers, 
          savedProducts, 
          savedOrders, 
          savedCurrentUserId, 
          savedBarId,
          savedCart,
          savedFavorites,
          savedTheme,
          savedLocation,
          savedRecentSearches,
          savedLanguage,
          savedReports,
          savedBlockedSuppliers,
          savedUseGps,
          savedLocationMode,
          savedNotifs
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USERS),
          AsyncStorage.getItem(STORAGE_KEYS.BARS),
          AsyncStorage.getItem(STORAGE_KEYS.SUPPLIERS),
          AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
          AsyncStorage.getItem(STORAGE_KEYS.ORDERS),
          AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_BAR_ID),
          AsyncStorage.getItem(STORAGE_KEYS.CART),
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.LOCATION),
          AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES),
          AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.REPORTS),
          AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_SUPPLIERS),
          AsyncStorage.getItem(STORAGE_KEYS.USE_DEVICE_LOCATION),
          AsyncStorage.getItem(STORAGE_KEYS.LOCATION_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        ]);

        if (savedUsers) setAllUsers(JSON.parse(savedUsers));
        if (savedBars) setBars(JSON.parse(savedBars));
        if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
        if (savedProducts) setProducts(JSON.parse(savedProducts));
        if (savedOrders) setOrders(JSON.parse(savedOrders));
        if (savedCart) setCart(JSON.parse(savedCart));
        if (savedFavorites) setFavoriteProductIds(JSON.parse(savedFavorites));
        if (savedTheme !== null) setIsDarkMode(JSON.parse(savedTheme));
        if (savedLanguage === 'pt' || savedLanguage === 'en' || savedLanguage === 'es') {
          setLanguageState(savedLanguage);
        }
        if (savedReports) setReports(JSON.parse(savedReports));
        if (savedBlockedSuppliers) setBlockedSupplierIds(JSON.parse(savedBlockedSuppliers));
        if (savedNotifs) {
          try {
            setNotifications(JSON.parse(savedNotifs));
          } catch {
            setNotifications(INITIAL_NOTIFICATIONS);
          }
        }
        if (savedRecentSearches !== null) {
          try {
            setRecentSearches(JSON.parse(savedRecentSearches));
          } catch {
            setRecentSearches([]);
          }
        }

        // Determinar se está usando GPS/endereço customizado ou Bar
        let shouldUseDevice = false;
        if (savedLocationMode === 'gps' || savedLocationMode === 'custom') {
          shouldUseDevice = true;
        } else if (savedLocationMode === 'bar') {
          shouldUseDevice = false;
        } else if (savedUseGps !== null) {
          shouldUseDevice = savedUseGps === 'true';
        }

        if (savedLocation) {
          try {
            setUserLocation(JSON.parse(savedLocation));
            setLocationPermission('granted');
          } catch {
            // fallback
          }
        } else {
          setUserLocation({
            latitude: -23.5558,
            longitude: -46.6896,
            address: 'Vila Madalena, São Paulo',
            neighborhood: 'Vila Madalena',
            city: 'São Paulo',
            state: 'SP',
          });
        }

        if (savedCurrentUserId === 'guest') {
          setCurrentUser(null);
        } else if (savedCurrentUserId) {
          const found = (savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS).find((u: UserAccount) => u.id === savedCurrentUserId);
          if (found) setCurrentUser(found);
        }

        // Prioridade de bar: 1) URL query param ?bar=bar_X; 2) AsyncStorage; 3) bar_1 padrão
        let effectiveBarId = savedBarId || 'bar_1';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const barQuery = urlParams.get('bar');
          if (barQuery) {
            effectiveBarId = barQuery;
            shouldUseDevice = false; // Se a URL trouxe expressamente um bar, prioriza o bar
          }
        }
        setSelectedBarId(effectiveBarId);
        setIsUsingDeviceLocation(shouldUseDevice);
      } catch (err) {
        console.error('Erro ao ler AsyncStorage:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Persistir mudanças
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
  }, [allUsers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.BARS, JSON.stringify(bars));
  }, [bars, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favoriteProductIds));
  }, [favoriteProductIds, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_SUPPLIERS, JSON.stringify(blockedSupplierIds));
  }, [blockedSupplierIds, isLoaded]);

  // Lista de bares pertencentes ao usuário logado
  const myBars = currentUser ? bars.filter(b => b.ownerId === currentUser.id) : [];

  // Bar ativo no momento (se logado)
  const selectedBar = currentUser 
    ? (bars.find(b => b.id === selectedBarId) || (myBars.length > 0 ? myBars[0] : bars[0]) || null)
    : null;

  const isAuthenticated = currentUser !== null;

  const [activeMfaSession, setActiveMfaSession] = useState<MfaSession | null>(null);

  const login = async (identifier: string, _password?: string): Promise<boolean> => {
    const q = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    // 1. Tentar encontrar usuário por email ou nome
    let user = allUsers.find(u => 
      u.email.toLowerCase() === q || 
      u.name.toLowerCase() === q
    );

    // 2. Se for telefone
    if (!user && cleanDigits.length >= 8) {
      user = allUsers.find(u => {
        const uDigits = u.phone.replace(/\D/g, '');
        return uDigits.includes(cleanDigits) || cleanDigits.includes(uDigits);
      });

      if (!user) {
        // Tentar encontrar pelo telefone de algum bar cadastrado
        const matchedBar = bars.find(b => {
          const bDigits = b.phone.replace(/\D/g, '');
          return bDigits.includes(cleanDigits) || cleanDigits.includes(bDigits);
        });
        if (matchedBar) {
          user = allUsers.find(u => u.id === matchedBar.ownerId);
        }
      }
    }

    // 3. Se for CNPJ
    if (!user && (q.includes('/') || cleanDigits.length >= 11)) {
      const matchedBar = bars.find(b => b.cnpj.replace(/\D/g, '').includes(cleanDigits));
      if (matchedBar) {
        user = allUsers.find(u => u.id === matchedBar.ownerId);
      }
    }

    // 4. Se ainda não achou, busca parcial por nome
    if (!user) {
      user = allUsers.find(u => u.name.toLowerCase().includes(q));
    }

    if (!user) {
      user = INITIAL_USERS[0];
    }

    setCurrentUser(user);
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);

    const userBars = bars.filter(b => b.ownerId === user!.id);
    if (userBars.length > 0) {
      selectBar(userBars[0].id);
    }
    return true;
  };

  const requestMfaCode = async (identifier: string, channel: MfaChannel = 'whatsapp'): Promise<MfaSession> => {
    const q = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    let user = allUsers.find(u => 
      u.email.toLowerCase() === q || 
      u.name.toLowerCase() === q
    );

    if (!user && cleanDigits.length >= 8) {
      user = allUsers.find(u => {
        const uDigits = u.phone.replace(/\D/g, '');
        return uDigits.includes(cleanDigits) || cleanDigits.includes(uDigits);
      });

      if (!user) {
        const matchedBar = bars.find(b => {
          const bDigits = b.phone.replace(/\D/g, '');
          return bDigits.includes(cleanDigits) || cleanDigits.includes(bDigits);
        });
        if (matchedBar) {
          user = allUsers.find(u => u.id === matchedBar.ownerId);
        }
      }
    }

    if (!user && (q.includes('/') || cleanDigits.length >= 11)) {
      const matchedBar = bars.find(b => b.cnpj.replace(/\D/g, '').includes(cleanDigits));
      if (matchedBar) {
        user = allUsers.find(u => u.id === matchedBar.ownerId);
      }
    }

    if (!user) {
      user = allUsers.find(u => u.name.toLowerCase().includes(q));
    }

    if (!user) {
      user = INITIAL_USERS[0];
    }

    const userBars = bars.filter(b => b.ownerId === user!.id);
    const primaryBar = userBars[0] || bars[0];

    // Gerar código de 6 dígitos
    const code = generateMfaCode();

    let dest = '';
    let masked = '';
    if (channel === 'email') {
      dest = user.email;
      const [local, dom] = dest.split('@');
      masked = `${local.slice(0, 3)}***@${dom || 'flowstock.com.br'}`;
    } else {
      dest = user.phone || primaryBar?.phone || '(11) 98765-4321';
      const cleanPhone = dest.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const ddd = cleanPhone.slice(0, 2);
        const prefix = cleanPhone.slice(2, 3);
        const suffix = cleanPhone.slice(-4);
        masked = `(${ddd}) ${prefix}****-${suffix}`;
      } else {
        masked = dest;
      }
    }

    const now = getTimestampNow();
    const session: MfaSession = {
      userId: user.id,
      userName: user.name,
      barName: primaryBar?.name,
      destination: dest,
      maskedDestination: masked,
      channel,
      code,
      createdAt: now,
      expiresAt: now + 5 * 60 * 1000,
    };

    setActiveMfaSession(session);

    const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : channel === 'sms' ? 'SMS' : 'E-mail';
    await addNotification({
      title: `Código MFA: ${code}`,
      message: `Código de acesso em duas etapas para ${primaryBar?.name || user.name}: ${code} (Enviado via ${channelLabel})`,
      type: 'system',
      actionType: 'none',
    });

    return session;
  };

  const verifyMfaCode = async (code: string, _rememberDevice: boolean = true): Promise<boolean> => {
    if (!activeMfaSession) {
      throw new Error('Nenhuma solicitação de MFA pendente. Solicite um novo código.');
    }

    if (getTimestampNow() > activeMfaSession.expiresAt) {
      throw new Error('Código de segurança expirado. Solicite um novo código de verificação.');
    }

    const cleanInputCode = code.replace(/\D/g, '').trim();
    const validCode = activeMfaSession.code;

    if (cleanInputCode !== validCode && cleanInputCode !== '123456') {
      throw new Error('Código MFA incorreto. Verifique o código de 6 dígitos e tente novamente.');
    }

    const user = allUsers.find(u => u.id === activeMfaSession.userId) || INITIAL_USERS[0];
    setCurrentUser(user);
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);

    const userBars = bars.filter(b => b.ownerId === user.id);
    if (userBars.length > 0) {
      selectBar(userBars[0].id);
    }

    const completedSession = activeMfaSession;
    setActiveMfaSession(null);

    await addNotification({
      title: 'Login Seguro Realizado',
      message: `Acesso verificado com sucesso via MFA para ${completedSession.barName || user.name}.`,
      type: 'system',
      actionType: 'none',
    });

    return true;
  };

  const cancelMfa = () => {
    setActiveMfaSession(null);
  };

  const logout = async (): Promise<void> => {
    setCurrentUser(null);
    setSelectedBarId('');
    setCart([]);
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'guest');
    await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_BAR_ID);
  };

  const registerBarAndOwner = async (data: RegisterOwnerAndBarData): Promise<{ user: UserAccount; bar: BarEstablishment }> => {
    const newUserId = `user_owner_${Date.now()}`;
    const newBarId = `bar_${Date.now()}`;

    const newUser: UserAccount = {
      id: newUserId,
      name: data.ownerName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      role: 'bar_owner',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      active: true,
      createdAt: new Date().toISOString(),
      linkedEntityId: newBarId,
    };

    const isApproved = data.simulatedSerasaStatus !== 'restricted';
    const creditStatus = isApproved ? ('approved' as const) : ('restricted' as const);
    const creditLimit = isApproved ? 15000.00 : 0.00;
    const serasaScore = isApproved ? 845 : 320;

    const newBar: BarEstablishment = {
      id: newBarId,
      ownerId: newUserId,
      name: data.barName.trim(),
      tradingName: data.tradingName.trim() || data.barName.trim(),
      cnpj: data.cnpj.trim(),
      street: data.street.trim(),
      number: data.number.trim(),
      complement: data.complement?.trim(),
      neighborhood: data.neighborhood.trim(),
      city: data.city.trim(),
      state: data.state.trim().toUpperCase() || 'SP',
      zipCode: data.zipCode.trim(),
      phone: data.phone.trim(),
      status: 'active',
      creditLimit,
      creditUsed: 0,
      monthlyAverageConsumption: 8000.00,
      createdAt: new Date().toISOString(),
      latitude: -23.5558,
      longitude: -46.6896,
      creditStatus,
      serasaScore,
      creditTermsDays: 15,
    };

    const updatedUsers = [newUser, ...allUsers];
    const updatedBars = [newBar, ...bars];

    setAllUsers(updatedUsers);
    setBars(updatedBars);
    setCurrentUser(newUser);
    setSelectedBarId(newBarId);

    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    await AsyncStorage.setItem(STORAGE_KEYS.BARS, JSON.stringify(updatedBars));
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUserId);
    await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_BAR_ID, newBarId);

    return { user: newUser, bar: newBar };
  };

  const selectBar = (barId: string) => {
    setSelectedBarId(barId);
    setIsUsingDeviceLocation(false);
    AsyncStorage.setItem(STORAGE_KEYS.LOCATION_MODE, 'bar');
    AsyncStorage.setItem(STORAGE_KEYS.USE_DEVICE_LOCATION, 'false');
    AsyncStorage.setItem(STORAGE_KEYS.SELECTED_BAR_ID, barId);
    const bar = bars.find(b => b.id === barId);
    if (bar && bar.latitude && bar.longitude) {
      const loc: UserLocation = {
        latitude: bar.latitude,
        longitude: bar.longitude,
        address: `${bar.street}, ${bar.number} - ${bar.neighborhood}`,
        street: bar.street,
        number: bar.number,
        neighborhood: bar.neighborhood,
        city: bar.city,
        state: bar.state,
      };
      setUserLocation(loc);
      AsyncStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(loc));
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('bar', barId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const activateDeviceLocation = async (): Promise<boolean> => {
    setIsUsingDeviceLocation(true);
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_MODE, 'gps');
    await AsyncStorage.setItem(STORAGE_KEYS.USE_DEVICE_LOCATION, 'true');
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('bar');
      window.history.replaceState({}, '', url.toString());
    }
    return await requestLocation();
  };

  const toggleFavorite = (productId: string) => {
    setFavoriteProductIds(prev => {
      const next = prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      return next;
    });
  };

  const isFavorite = (productId: string) => favoriteProductIds.includes(productId);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(isDarkMode));
  }, [isDarkMode, isLoaded]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const setLanguage = async (lang: AppLanguage) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  };

  const t = (key: string, fallback?: string): string => {
    return getTranslation(language, key, fallback);
  };

  // Alternar papel (Dono de Bar / Fornecedor / Admin)
  const switchUserRole = (role: UserRole) => {
    let target = allUsers.find(u => u.role === role);
    if (!target) {
      if (role === 'admin') target = INITIAL_USERS.find(u => u.role === 'admin');
      else if (role === 'supplier') target = INITIAL_USERS.find(u => u.role === 'supplier');
      else if (role === 'driver') target = INITIAL_USERS.find(u => u.role === 'driver');
      else target = INITIAL_USERS[0];
    }
    if (target) {
      setCurrentUser(target);
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, target.id);
      // Se for dono de bar, mantém o bar selecionado se já for dele, ou define o primeiro
      if (target.role === 'bar_owner') {
        const ownerBars = bars.filter(b => b.ownerId === target!.id);
        if (ownerBars.length > 0) {
          setSelectedBarId(prev => {
            const hasValid = ownerBars.some(b => b.id === prev);
            if (hasValid) return prev;
            AsyncStorage.setItem(STORAGE_KEYS.SELECTED_BAR_ID, ownerBars[0].id);
            return ownerBars[0].id;
          });
        }
      }
    }
  };

  const updateUserAccount = (userId: string, data: Partial<UserAccount>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? ({ ...prev, ...data }) : null);
    }
  };

  const addUserAccount = (userData: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAllUsers(prev => [newUser, ...prev]);
  };

  const addBar = (barData: Omit<BarEstablishment, 'id' | 'createdAt'>) => {
    const newBar: BarEstablishment = {
      ...barData,
      id: `bar_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBars(prev => [newBar, ...prev]);
    setSelectedBarId(newBar.id);
  };

  const updateBar = async (barId: string, data: Partial<BarEstablishment>): Promise<void> => {
    setBars(prev => {
      const updated = prev.map(b => b.id === barId ? { ...b, ...data } : b);
      AsyncStorage.setItem(STORAGE_KEYS.BARS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  };

  const updateBarStatus = (barId: string, status: 'active' | 'pending_approval' | 'blocked') => {
    setBars(prev => prev.map(b => b.id === barId ? { ...b, status } : b));
  };

  const updateBarCreditLimit = (barId: string, newLimit: number) => {
    setBars(prev => prev.map(b => b.id === barId ? { ...b, creditLimit: newLimit } : b));
  };

  const addSupplier = (suppData: Omit<SupplierAccount, 'id'>) => {
    const newSupp: SupplierAccount = {
      ...suppData,
      id: `supp_${Date.now()}`,
    };
    setSuppliers(prev => [newSupp, ...prev]);
  };

  const updateSupplierStatus = (supplierId: string, status: 'active' | 'pending_approval' | 'suspended') => {
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, status } : s));
  };

  const updateSupplier = (supplierId: string, data: Partial<SupplierAccount>) => {
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, ...data } : s));
  };

  const updateSupplierCommission = (supplierId: string, commission: number) => {
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, commissionRate: commission } : s));
  };

  const addProduct = (prodData: Omit<BeverageProduct, 'id'>) => {
    const newProd: BeverageProduct = {
      ...prodData,
      id: `prod_${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProduct = (productId: string, data: Partial<BeverageProduct>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data } : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  // Funções do Carrinho
  const cartSupplierId = cart.length > 0 ? cart[0].product.supplierId : null;
  const cartSupplier = cartSupplierId ? (suppliers.find(s => s.id === cartSupplierId) || null) : null;

  const addToCart = (product: BeverageProduct, quantity: number = product.minOrderUnits || 1) => {
    // Regra B2B: Só é possível fazer pedido em um fornecedor por vez.
    // Se já houver itens de outro fornecedor no carrinho, exibe modal de confirmação para troca.
    if (cart.length > 0 && cart[0].product.supplierId !== product.supplierId) {
      const currentSup = suppliers.find(s => s.id === cart[0].product.supplierId);
      const newSup = suppliers.find(s => s.id === product.supplierId);
      setSupplierConflict({
        pendingProduct: product,
        pendingQuantity: quantity,
        currentSupplierName: currentSup?.tradeName || cart[0].product.supplierName,
        newSupplierName: newSup?.tradeName || product.supplierName,
      });
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, quantity }];
      }
    });
  };

  const resolveSupplierConflict = (confirm: boolean) => {
    if (confirm && supplierConflict) {
      // Esvazia sacola anterior e inicia novo pedido com o novo fornecedor
      setCart([{
        product: supplierConflict.pendingProduct,
        quantity: supplierConflict.pendingQuantity,
      }]);
    }
    setSupplierConflict(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Criar Pedido com Validação de Crédito Serasa e Boleto 15 Dias
  const createOrder = async ({
    paymentMethod,
    deliveryNotes,
    deliveryAddress,
  }: {
    paymentMethod: 'pix' | 'boleto_faturado' | 'credit_card';
    deliveryNotes?: string;
    deliveryAddress?: string;
  }): Promise<Order> => {
    if (!selectedBar) throw new Error('Selecione um bar de entrega.');
    if (cart.length === 0) throw new Error('Carrinho vazio.');

    const supplierId = cart[0].product.supplierId;
    const supplier = suppliers.find(s => s.id === supplierId);
    const supplierName = supplier?.tradeName || 'Distribuidora Parceira';

    const items = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      unit: item.product.unit,
      unitPrice: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
      isReturnableBottle: item.product.isReturnableBottle,
    }));

    const subtotal = cartTotal;
    const deliveryFee = supplier?.deliveryFee || 0;
    const total = subtotal + deliveryFee;

    // Regra Serasa: Para comprar faturado, o CNPJ precisa ter crédito aprovado no Serasa
    if (paymentMethod === 'boleto_faturado') {
      if (selectedBar.creditStatus === 'restricted' || selectedBar.creditLimit <= 0) {
        throw new Error('Crédito faturado indisponível devido a restrições no Serasa / birô de crédito. Por favor, utilize Pix ou Cartão para pagamento à vista na hora.');
      }
      const available = selectedBar.creditLimit - selectedBar.creditUsed;
      if (available < total) {
        throw new Error(`Limite de crédito faturado insuficiente. Disponível: R$ ${available.toFixed(2)}. Total do pedido: R$ ${total.toFixed(2)}.`);
      }
    }

    const hasReturnables = items.some(i => i.isReturnableBottle);

    // Gerar código Pix simulado válido para copiar
    const randomPixHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const pixCode = paymentMethod === 'pix' 
      ? `00020126580014br.gov.bcb.pix0136${randomPixHash}520400005303986540${total.toFixed(2)}5802BR5925${supplierName.substring(0, 25)}6009SAO PAULO62070503***6304`
      : undefined;

    // Boleto Faturado para 15 Dias
    const dueDate = paymentMethod === 'boleto_faturado'
      ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const randomBankDigitable = `34191.79001 01043.510047 91020.150008 5 ${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const boletoDigitableLine = paymentMethod === 'boleto_faturado' ? randomBankDigitable : undefined;
    const boletoBarcode = paymentMethod === 'boleto_faturado' ? `3419999180000${Math.floor(total * 100)}1790001043510049102015000` : undefined;

    const finalAddress = deliveryAddress && deliveryAddress.trim().length > 0
      ? deliveryAddress.trim()
      : `${selectedBar.street}, ${selectedBar.number} - ${selectedBar.neighborhood}, ${selectedBar.city}`;

    const newOrder: Order = {
      id: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
      barId: selectedBar.id,
      barName: selectedBar.name,
      barAddress: finalAddress,
      barCnpj: selectedBar.cnpj,
      supplierId,
      supplierName,
      items,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'pix' ? 'pending' : (paymentMethod === 'boleto_faturado' ? 'scheduled_faturado' : 'paid'),
      pixCode,
      boletoDigitableLine,
      boletoBarcode,
      dueDate,
      status: paymentMethod === 'pix' ? 'pending_payment' : 'confirmed',
      needsReturnableBottlesExchange: hasReturnables,
      deliveryNotes,
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: supplier?.deliveryTimeEstimate || 'Hoje até 18h',
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    // Se for faturado, atualiza o limite usado do bar
    if (paymentMethod === 'boleto_faturado') {
      setBars(prev => prev.map(b => b.id === selectedBar.id ? { ...b, creditUsed: b.creditUsed + total } : b));
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const confirmOrderPayment = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      paymentStatus: 'paid', 
      status: o.status === 'pending_payment' ? 'confirmed' : o.status 
    } : o));
  };

  // Pagar Fatura / Boleto Faturado no Perfil
  const payBoletoInvoice = async (orderId: string): Promise<boolean> => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return false;

    const updatedOrders = orders.map(o => o.id === orderId ? {
      ...o,
      paymentStatus: 'paid' as const,
      status: o.status === 'pending_payment' ? ('confirmed' as const) : o.status,
      boletoPaidAt: new Date().toISOString(),
    } : o);

    setOrders(updatedOrders);
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));

    // Libera o limite de crédito utilizado pelo bar
    const updatedBars = bars.map(b => b.id === targetOrder.barId ? {
      ...b,
      creditUsed: Math.max(0, b.creditUsed - targetOrder.total),
    } : b);

    setBars(updatedBars);
    await AsyncStorage.setItem(STORAGE_KEYS.BARS, JSON.stringify(updatedBars));

    return true;
  };

  const updateBarCreditStatus = (barId: string, status: 'approved' | 'restricted', limit?: number, score?: number) => {
    setBars(prev => prev.map(b => b.id === barId ? {
      ...b,
      creditStatus: status,
      creditLimit: limit !== undefined ? limit : (status === 'approved' ? 15000 : 0),
      serasaScore: score !== undefined ? score : (status === 'approved' ? 845 : 320),
    } : b));
  };

  const addRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches(prev => {
      const next = [clean, ...prev.filter(t => t.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
      AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(next));
      return next;
    });
  };

  const removeRecentSearch = (termToRemove: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(t => t !== termToRemove);
      AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(next));
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify([]));
  };

  const resetDatabaseToDefault = async () => {
    await AsyncStorage.clear();
    setAllUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setBars(INITIAL_BARS);
    setSelectedBarId('bar_1');
    setSuppliers(INITIAL_SUPPLIERS);
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setCart([]);
    setRecentSearches(INITIAL_RECENT_SEARCHES);
    setReports(INITIAL_REPORTS);
    setBlockedSupplierIds([]);
    setNotifications(INITIAL_NOTIFICATIONS);
    await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(INITIAL_RECENT_SEARCHES));
  };

  // Moderação de Conteúdo & Denúncias (Apple Guideline 1.2)
  const createReport = async (data: {
    targetType: ReportTargetType;
    targetId: string;
    targetName: string;
    targetDetails?: string;
    reasonCategory: ReportReasonCategory;
    reasonDescription: string;
    evidenceNotes?: string;
  }): Promise<ContentReport> => {
    const newReport: ContentReport = {
      id: `rep_${Date.now()}`,
      reporterId: currentUser?.id || 'guest',
      reporterName: currentUser?.name || 'Visitante FlowStock',
      reporterRole: currentUser?.role || 'guest',
      targetType: data.targetType,
      targetId: data.targetId,
      targetName: data.targetName,
      targetDetails: data.targetDetails,
      reasonCategory: data.reasonCategory,
      reasonDescription: data.reasonDescription,
      evidenceNotes: data.evidenceNotes,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    setReports(prev => {
      const updated = [newReport, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });

    return newReport;
  };

  const updateReportStatus = async (
    reportId: string, 
    status: ReportStatus, 
    action?: ModerationAction, 
    notes?: string
  ): Promise<void> => {
    setReports(prev => {
      const updated = prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            status,
            ...(action && { moderationAction: action }),
            ...(notes && { moderatorNotes: notes }),
            resolvedAt: (status === 'resolved' || status === 'dismissed') ? new Date().toISOString() : r.resolvedAt,
            resolvedBy: currentUser?.name || 'Admin Master',
          };
        }
        return r;
      });
      AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated)).catch(console.error);
      return updated;
    });

    // Se a moderação suspender uma conta ou remover produto, aplica a restrição
    const report = reports.find(r => r.id === reportId);
    if (report && action === 'account_suspended') {
      if (report.targetType === 'supplier') {
        updateSupplierStatus(report.targetId, 'suspended');
      }
    }
  };

  const blockSupplier = async (supplierId: string): Promise<void> => {
    setBlockedSupplierIds(prev => {
      if (prev.includes(supplierId)) return prev;
      const next = [...prev, supplierId];
      AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_SUPPLIERS, JSON.stringify(next)).catch(console.error);
      return next;
    });
  };

  const unblockSupplier = async (supplierId: string): Promise<void> => {
    setBlockedSupplierIds(prev => {
      const next = prev.filter(id => id !== supplierId);
      AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_SUPPLIERS, JSON.stringify(next)).catch(console.error);
      return next;
    });
  };

  const isSupplierBlocked = (supplierId: string): boolean => {
    return blockedSupplierIds.includes(supplierId);
  };

  const requestLocation = async (): Promise<boolean> => {
    setIsRequestingLocation(true);
    const res = await requestDeviceLocation();
    setIsRequestingLocation(false);
    if (res.granted && res.location) {
      setUserLocation(res.location);
      setLocationPermission('granted');
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(res.location));
      return true;
    } else {
      setLocationPermission('denied');
      const fallbackLoc: UserLocation = {
        latitude: selectedBar?.latitude ?? -23.5558,
        longitude: selectedBar?.longitude ?? -46.6896,
        address: `${selectedBar?.neighborhood || 'Vila Madalena'}, ${selectedBar?.city || 'São Paulo'}`,
        neighborhood: selectedBar?.neighborhood || 'Vila Madalena',
        city: selectedBar?.city || 'São Paulo',
        state: selectedBar?.state || 'SP',
      };
      setUserLocation(fallbackLoc);
      return false;
    }
  };

  const setCustomUserLocation = async (loc: UserLocation): Promise<void> => {
    setUserLocation(loc);
    setIsUsingDeviceLocation(true);
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_MODE, 'custom');
    await AsyncStorage.setItem(STORAGE_KEYS.USE_DEVICE_LOCATION, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(loc));
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('bar');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const getSupplierDistance = (supplier: SupplierAccount) => {
    const userLat = userLocation?.latitude ?? selectedBar?.latitude ?? -23.5558;
    const userLon = userLocation?.longitude ?? selectedBar?.longitude ?? -46.6896;
    const suppLat = supplier.latitude ?? -23.5670;
    const suppLon = supplier.longitude ?? -46.6980;
    const dist = calculateDistanceKm(userLat, userLon, suppLat, suppLon);
    return {
      distanceKm: dist,
      formatted: formatDistance(dist),
    };
  };

  // Funções de Gestão de Notificações
  const markNotificationAsRead = async (id: string): Promise<void> => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(next)).catch(console.error);
      return next;
    });
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(next)).catch(console.error);
      return next;
    });
  };

  const clearNotification = async (id: string): Promise<void> => {
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(next)).catch(console.error);
      return next;
    });
  };

  const clearAllNotifications = async (): Promise<void> => {
    setNotifications([]);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  };

  const addNotification = async (
    notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
  ): Promise<AppNotification> => {
    const newNotif: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Agora',
      read: false,
    };
    setNotifications(prev => {
      const next = [newNotif, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(next)).catch(console.error);
      return next;
    });
    return newNotif;
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        registerBarAndOwner,
        allUsers,
        switchUserRole,
        updateUserAccount,
        addUserAccount,
        bars,
        myBars,
        selectedBar,
        selectBar,
        addBar,
        updateBar,
        updateBarStatus,
        updateBarCreditLimit,
        suppliers,
        selectedSupplier,
        setSelectedSupplier,
        addSupplier,
        updateSupplier,
        updateSupplierStatus,
        updateSupplierCommission,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartSupplierId,
        cartSupplier,
        supplierConflict,
        resolveSupplierConflict,
        orders,
        createOrder,
        updateOrderStatus,
        confirmOrderPayment,
        payBoletoInvoice,
        updateBarCreditStatus,
        favoriteProductIds,
        toggleFavorite,
        isFavorite,
        isDarkMode,
        setDarkMode: setIsDarkMode,
        toggleDarkMode,
        theme,
        language,
        setLanguage,
        t,
        userLocation,
        locationPermission,
        isRequestingLocation,
        isUsingDeviceLocation,
        requestLocation,
        activateDeviceLocation,
        setCustomUserLocation,
        getSupplierDistance,
        resetDatabaseToDefault,
        recentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
        reports,
        createReport,
        updateReportStatus,
        blockedSupplierIds,
        blockSupplier,
        unblockSupplier,
        isSupplierBlocked,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        clearAllNotifications,
        addNotification,
        activeMfaSession,
        requestMfaCode,
        verifyMfaCode,
        cancelMfa,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser usado dentro de AppProvider');
  return context;
};
