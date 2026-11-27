import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  Alert,
  Image,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { INTEGRATION_SERVICES } from '../config/integrations';
import { SUPABASE_SCHEMA_SQL } from '../services/supabase';
import { BrandLogo } from '../components/BrandLogo';
import { FigmaSwitch } from '../components/FigmaSwitch';

// Tipos de Navegação do Painel Master inspirados no Admin App Bebidas
export type AdminMenuTab = 
  // 1. Dashboard
  | 'dashboard'
  // 2. Pedidos (Order Management)
  | 'orders_all'
  | 'orders_pending'
  | 'orders_accepted'
  | 'orders_processing'
  | 'orders_in_transit'
  | 'orders_delivered'
  | 'orders_canceled'
  | 'orders_refunds'
  | 'orders_dispatch'
  | 'orders_offline_payments'
  // 3. Estabelecimentos e Lojas (Restaurant / Store Management)
  | 'suppliers_list'
  | 'bars_list'
  | 'zones_setup'
  | 'bar_categories'
  // 4. Catálogo e Produtos (Food / Product Management)
  | 'products_list'
  | 'categories_setup'
  | 'addons_returnables'
  | 'product_reviews'
  // 5. Promoções e Marketing (Promotion Management)
  | 'campaigns'
  | 'app_banners'
  | 'coupons'
  | 'push_notifications'
  // 6. Entregadores e Frotas (Deliveryman Management)
  | 'deliverymen_list'
  | 'vehicle_categories'
  | 'delivery_shifts'
  // 7. Clientes e Bares Compradores (Customer Management)
  | 'customers_list'
  | 'customer_wallets'
  // 8. Financeiro e Repasses (Disbursement & Transactions)
  | 'supplier_disbursements'
  | 'driver_disbursements'
  | 'transactions_statement'
  // 9. Relatórios e Analytics (Reports)
  | 'report_sales'
  | 'report_commissions'
  | 'report_products'
  // 10. Equipe e Permissões (Employee Management)
  | 'employees_list'
  | 'custom_roles'
  // 11. Moderação & Denúncias (Apple Guideline 1.2)
  | 'moderation_reports'
  // 12. Configurações do Sistema (System Settings)
  | 'business_setup'
  | 'payment_gateways'
  | 'cloud_integrations';

interface ZoneItem {
  id: string;
  name: string;
  radiusKm: number;
  deliveryFee: number;
  activeOrders: number;
  status: 'active' | 'inactive';
}

interface CuisineCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  establishmentCount: number;
}

interface ReturnableAddon {
  id: string;
  name: string;
  type: string;
  depositFee: number;
  stock: number;
  mandatoryReturn: boolean;
}

interface CampaignItem {
  id: string;
  title: string;
  targetCategory: string;
  discountBadge: string;
  period: string;
  status: 'active' | 'scheduled' | 'ended';
}

interface CouponItem {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrder: number;
  validUntil: string;
  usageCount: number;
  status: 'active' | 'expired';
}

interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  plate: string;
  completedDeliveries: number;
  rating: number;
  status: 'available' | 'in_transit' | 'offline';
}

interface AdminEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'active' | 'suspended';
}

export const AdminMasterScreen: React.FC = () => {
  const { 
    bars, 
    allUsers, 
    suppliers, 
    orders, 
    products,
    updateBarStatus, 
    updateBarCreditLimit, 
    updateSupplierStatus, 
    updateSupplierCommission,
    addSupplier,
    addProduct,
    updateProduct,
    updateOrderStatus,
    reports,
    updateReportStatus,
    createReport,
    blockedSupplierIds,
    addNotification,
    isDarkMode,
    theme
  } = useApp();

  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Tab Selecionada com Persistência Bidirecional na URL
  const getInitialAdminTab = (): AdminMenuTab => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as AdminMenuTab;
      if (tabParam) {
        return tabParam;
      }
    }
    return 'dashboard';
  };

  const getSectionForTab = (tab: AdminMenuTab): string | null => {
    if (tab.startsWith('orders_')) return 'orders';
    if (tab === 'suppliers_list' || tab === 'bars_list' || tab === 'zones_setup' || tab === 'bar_categories') return 'stores';
    if (tab === 'products_list' || tab === 'categories_setup' || tab === 'addons_returnables' || tab === 'product_reviews') return 'catalog';
    if (tab === 'campaigns' || tab === 'app_banners' || tab === 'coupons' || tab === 'push_notifications') return 'promotions';
    if (tab === 'deliverymen_list' || tab === 'vehicle_categories' || tab === 'delivery_shifts') return 'delivery';
    if (tab === 'customers_list' || tab === 'customer_wallets') return 'customers';
    if (tab === 'supplier_disbursements' || tab === 'driver_disbursements' || tab === 'transactions_statement') return 'financial';
    if (tab.startsWith('report_')) return 'reports';
    if (tab === 'employees_list' || tab === 'custom_roles') return 'team';
    if (tab === 'business_setup' || tab === 'payment_gateways' || tab === 'cloud_integrations') return 'settings';
    return null;
  };

  const initialTab = getInitialAdminTab();
  const initialSec = getSectionForTab(initialTab);

  // Grupos da Sidebar Expandidos (Accordion)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => ({
    orders: true,
    stores: true,
    catalog: true,
    promotions: initialSec === 'promotions',
    delivery: initialSec === 'delivery',
    customers: initialSec === 'customers',
    financial: true,
    reports: initialSec === 'reports',
    team: initialSec === 'team',
    settings: initialSec === 'settings',
  }));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [activeTab, setActiveTabState] = useState<AdminMenuTab>(initialTab);

  const setActiveTab = (tab: AdminMenuTab) => {
    setActiveTabState(tab);
    const sec = getSectionForTab(tab);
    if (sec) {
      setExpandedSections(prev => ({ ...prev, [sec]: true }));
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('app', 'admin');
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('app') === 'admin') {
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    }
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as AdminMenuTab;
      if (tabParam) {
        setActiveTabState(tabParam);
        const s = getSectionForTab(tabParam);
        if (s) {
          setExpandedSections(prev => ({ ...prev, [s]: true }));
        }
      }
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [activeTab]);

  // Estados de Moderação & Denúncias (Apple Guideline 1.2)
  const [reportFilterStatus, setReportFilterStatus] = useState<'all' | 'pending' | 'in_review' | 'resolved' | 'dismissed'>('all');
  const [reportFilterTarget, setReportFilterTarget] = useState<'all' | 'supplier' | 'product' | 'user' | 'order'>('all');
  const [moderatorNotesInput, setModeratorNotesInput] = useState<Record<string, string>>({});

  // Filtros Globais da Topbar (idênticos ao App Bebidas)
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'overall' | 'today' | 'this_week' | 'this_month' | 'this_year'>('overall');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais de Criação Rápida
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSuppTradeName, setNewSuppTradeName] = useState('');
  const [newSuppCorpName, setNewSuppCorpName] = useState('');
  const [newSuppCnpj, setNewSuppCnpj] = useState('');
  const [newSuppMinOrder, setNewSuppMinOrder] = useState('400');
  const [newSuppCommission, setNewSuppCommission] = useState('5.0');
  const [newSuppPixKey, setNewSuppPixKey] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('(11) 3333-0000');

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'cervejas' | 'chopp_barris' | 'destilados' | 'vinhos' | 'refrigerantes' | 'aguas_gelo' | 'insumos_bar'>('cervejas');
  const [newProdPrice, setNewProdPrice] = useState('180');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdUnit, setNewProdUnit] = useState('Caixa com 24 latas');
  const [newProdReturnable, setNewProdReturnable] = useState(false);

  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponValue, setNewCouponValue] = useState('10');
  const [newCouponMin, setNewCouponMin] = useState('500');

  const [showPushModal, setShowPushModal] = useState(false);
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');

  // Estados Locais dos Módulos Especializados do App Bebidas
  const [zones] = useState<ZoneItem[]>([
    { id: 'zone_1', name: 'São Paulo - Centro Expandido', radiusKm: 15, deliveryFee: 0, activeOrders: 28, status: 'active' },
    { id: 'zone_2', name: 'São Paulo - Zona Sul & Berrini', radiusKm: 22, deliveryFee: 15, activeOrders: 19, status: 'active' },
    { id: 'zone_3', name: 'São Paulo - Zona Oeste & Pinheiros', radiusKm: 18, deliveryFee: 0, activeOrders: 34, status: 'active' },
    { id: 'zone_4', name: 'Grande ABC (Santo André / SBC / SCS)', radiusKm: 35, deliveryFee: 25, activeOrders: 12, status: 'active' },
    { id: 'zone_5', name: 'Campinas & Polo Cervejeiro Regional', radiusKm: 50, deliveryFee: 40, activeOrders: 8, status: 'active' },
  ]);

  const getSelectedZoneLabel = () => {
    if (selectedZone === 'all') return 'Todas as Zonas (SP)';
    const found = zones.find(z => z.id === selectedZone);
    return found ? found.name : 'Todas as Zonas (SP)';
  };

  const [cuisines] = useState<CuisineCategory[]>([
    { id: 'c1', name: 'Botecos Tradicionais & Petiscarias', icon: 'beer', establishmentCount: 16 },
    { id: 'c2', name: 'Pubs & Tap Houses Artesanais', icon: 'flame', establishmentCount: 9 },
    { id: 'c3', name: 'Rooftops & Lounges Premium', icon: 'wine', establishmentCount: 7 },
    { id: 'c4', name: 'Espetarias & Chopperias Express', icon: 'restaurant', establishmentCount: 12 },
    { id: 'c5', name: 'Casas Noturnas & Baladas', icon: 'musical-notes', establishmentCount: 5 },
  ]);

  const [addons] = useState<ReturnableAddon[]>([
    { id: 'add_1', name: 'Barril Inox 50L Retornável (Comodato B2B)', type: 'Casco Comodato', depositFee: 0, stock: 320, mandatoryReturn: true },
    { id: 'add_2', name: 'Engradado Plástico com 24 Garrafas 600ml', type: 'Vasilhame com Casco', depositFee: 30, stock: 1850, mandatoryReturn: true },
    { id: 'add_3', name: 'Cilindro de CO2 Alimentício 6kg para Chopeira', type: 'Insumo de Extração', depositFee: 120, stock: 45, mandatoryReturn: true },
    { id: 'add_4', name: 'Saco de Gelo Cristal em Cubos 10kg', type: 'Refrigeração Rápida', depositFee: 0, stock: 500, mandatoryReturn: false },
    { id: 'add_5', name: 'Copo Descartável Biodegradável 500ml (Pct 50)', type: 'Descartável', depositFee: 0, stock: 1200, mandatoryReturn: false },
  ]);

  const [campaigns] = useState<CampaignItem[]>([
    { id: 'camp_1', title: 'Festival do Chopp & Barris Artesanais', targetCategory: 'Chopp & Barris 50L', discountBadge: '8% OFF no Barril', period: '01/11 a 30/11', status: 'active' },
    { id: 'camp_2', title: 'Quinta do Faturado - Prazo Especial 45 Dias', targetCategory: 'Todos os Fornecedores', discountBadge: 'Boleto sem Juros', period: 'Semanal (Quintas)', status: 'active' },
    { id: 'camp_3', title: 'Mega Atacado de Gin & Vodka Nobre', targetCategory: 'Destilados', discountBadge: 'Compre 5 Lts Ganhe 1 Tônica', period: '15/11 a 15/12', status: 'active' },
  ]);

  const [coupons, setCoupons] = useState<CouponItem[]>([
    { id: 'cp_1', code: 'BEMVINDOB2B', discountType: 'percent', discountValue: 10, minOrder: 500, validUntil: '31/12/2026', usageCount: 48, status: 'active' },
    { id: 'cp_2', code: 'CHOPP100', discountType: 'fixed', discountValue: 100, minOrder: 1200, validUntil: '15/12/2026', usageCount: 22, status: 'active' },
    { id: 'cp_3', code: 'FRETELIMPO', discountType: 'percent', discountValue: 100, minOrder: 800, validUntil: '31/12/2026', usageCount: 89, status: 'active' },
  ]);

  const [drivers] = useState<DeliveryDriver[]>([
    { id: 'drv_1', name: 'Marcos Silveira', phone: '(11) 98765-1122', vehicleType: 'Caminhão Truck 8.000kg', plate: 'BRA-2024', completedDeliveries: 142, rating: 4.9, status: 'in_transit' },
    { id: 'drv_2', name: 'Roberto Fagundes', phone: '(11) 97654-3344', vehicleType: 'VUC Urbano 3.500kg', plate: 'FLW-9090', completedDeliveries: 98, rating: 5.0, status: 'available' },
    { id: 'drv_3', name: 'Lucas Nascimento', phone: '(11) 96543-7788', vehicleType: 'Fiorino Furgão 1.200kg', plate: 'SPK-4422', completedDeliveries: 215, rating: 4.8, status: 'available' },
    { id: 'drv_4', name: 'Anderson Souza', phone: '(11) 95432-9900', vehicleType: 'Moto Cargo Express', plate: 'B2B-1234', completedDeliveries: 310, rating: 4.9, status: 'offline' },
  ]);

  const [employees] = useState<AdminEmployee[]>([
    { id: 'emp_1', name: 'Carlos Henrique (Super Admin)', email: 'admin@flowstock.com.br', role: 'Super Administrador Master', lastLogin: 'Agora mesmo', status: 'active' },
    { id: 'emp_2', name: 'Juliana Paes (Despacho)', email: 'logistica@flowstock.com.br', role: 'Gerente de Frotas & Despacho', lastLogin: 'Hoje 08:30', status: 'active' },
    { id: 'emp_3', name: 'Renato Morais (Financeiro)', email: 'financeiro@flowstock.com.br', role: 'Analista de Repasses e Crédito B2B', lastLogin: 'Hoje 09:15', status: 'active' },
    { id: 'emp_4', name: 'Aline Castro (Suporte Bares)', email: 'suporte@flowstock.com.br', role: 'Atendimento & Ouvidoria B2B', lastLogin: 'Ontem 18:00', status: 'active' },
  ]);

  // Cálculos Financeiros e Operacionais Globais
  const totalGMV = orders.reduce((acc, o) => acc + o.total, 0);
  const totalPlatformCommissions = orders.reduce((acc, o) => {
    const supp = suppliers.find(s => s.id === o.supplierId);
    const rate = supp?.commissionRate || 5.5;
    return acc + (o.total * (rate / 100));
  }, 0);
  const totalSupplierPayout = totalGMV - totalPlatformCommissions;
  const totalCreditAllocated = bars.reduce((acc, b) => acc + b.creditLimit, 0);
  const totalCreditUsed = bars.reduce((acc, b) => acc + b.creditUsed, 0);

  // Contadores de Pedidos por Status do App Bebidas
  const countDelivered = orders.filter(o => o.status === 'delivered').length;
  const countInTransit = orders.filter(o => o.status === 'in_transit').length;
  const countPreparing = orders.filter(o => o.status === 'preparing').length;
  const countConfirmed = orders.filter(o => o.status === 'confirmed').length;
  const countPending = orders.filter(o => o.status === 'pending_payment').length;
  const countCanceled = orders.filter(o => o.status === 'cancelled').length;

  const barOwners = allUsers.filter(u => u.role === 'bar_owner');

  // Manipuladores de Ações
  const handleCreateSupplier = () => {
    if (!newSuppTradeName.trim() || !newSuppCnpj.trim()) {
      Alert.alert('Campos Obrigatórios', 'Nome fantasia e CNPJ são necessários.');
      return;
    }

    addSupplier({
      ownerId: 'user_supplier_new',
      tradeName: newSuppTradeName.trim(),
      corporateName: newSuppCorpName.trim() || newSuppTradeName.trim(),
      cnpj: newSuppCnpj.trim(),
      phone: newSuppPhone.trim(),
      email: 'comercial@distribuidora.com.br',
      status: 'active',
      commissionRate: parseFloat(newSuppCommission) || 5.0,
      minOrderValue: parseFloat(newSuppMinOrder) || 400.0,
      deliveryFee: 0.0,
      deliveryTimeEstimate: 'Hoje até 18h',
      categories: ['cervejas', 'chopp_barris'],
      logoUrl: 'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=200&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=800&q=80',
      rating: 5.0,
      reviewCount: 1,
      bankPixKey: newSuppPixKey.trim() || newSuppCnpj.trim(),
      address: 'São Paulo - SP',
      city: 'São Paulo',
      state: 'SP',
      acceptedPaymentMethods: ['pix', 'boleto_faturado', 'credit_card'],
    });

    Alert.alert('Sucesso', `Fornecedor "${newSuppTradeName}" credenciado e liberado com sucesso!`);
    setNewSuppTradeName('');
    setNewSuppCorpName('');
    setNewSuppCnpj('');
    setShowAddSupplierModal(false);
  };

  const handleCreateProduct = () => {
    if (!newProdName.trim() || !newProdBrand.trim()) {
      Alert.alert('Atenção', 'Informe o nome e a marca do produto.');
      return;
    }
    const targetSupplier = suppliers[0] || { id: 'supp_1', tradeName: 'Ambev & Malte Express' };

    addProduct({
      supplierId: targetSupplier.id,
      supplierName: targetSupplier.tradeName,
      name: newProdName.trim(),
      brand: newProdBrand.trim(),
      description: `${newProdName.trim()} para abastecimento de bares e estabelecimentos B2B.`,
      category: newProdCategory,
      unit: newProdUnit.trim(),
      packageDetails: newProdUnit.trim(),
      price: parseFloat(newProdPrice) || 150.0,
      stock: parseInt(newProdStock, 10) || 50,
      isReturnableBottle: newProdReturnable,
      imageUrl: 'https://images.unsplash.com/photo-1608270191722-1d167f4020a6?auto=format&fit=crop&w=500&q=80',
      minOrderUnits: 1,
      isPromoted: true,
    });

    Alert.alert('Produto Cadastrado', `A bebida "${newProdName}" foi adicionada ao catálogo B2B.`);
    setNewProdName('');
    setNewProdBrand('');
    setShowAddProductModal(false);
  };

  const handleCreateCoupon = () => {
    if (!newCouponCode.trim()) {
      Alert.alert('Atenção', 'Digite o código do cupom.');
      return;
    }
    const newCp: CouponItem = {
      id: `cp_${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountType: 'percent',
      discountValue: parseFloat(newCouponValue) || 10,
      minOrder: parseFloat(newCouponMin) || 500,
      validUntil: '31/12/2026',
      usageCount: 0,
      status: 'active'
    };
    setCoupons([newCp, ...coupons]);
    Alert.alert('Cupom Criado', `O cupom ${newCp.code} já está disponível para os bares.`);
    setNewCouponCode('');
    setShowAddCouponModal(false);
  };

  const handleSendPush = () => {
    if (!pushTitle.trim() || !pushBody.trim()) {
      Alert.alert('Atenção', 'Preencha título e corpo da notificação.');
      return;
    }
    addNotification({
      title: pushTitle.trim(),
      message: pushBody.trim(),
      type: 'promo',
      actionText: 'Ver Ofertas',
      actionType: 'open_coupon',
    }).catch(console.error);
    Alert.alert('Notificação Disparada!', `Push enviado com sucesso para todos os ${bars.length} bares cadastrados.`);
    setPushTitle('');
    setPushBody('');
    setShowPushModal(false);
  };

  const handleChangeCreditPrompt = (barId: string, currentLimit: number) => {
    const newLim = currentLimit + 5000;
    updateBarCreditLimit(barId, newLim);
    Alert.alert('Crédito Atualizado', `Limite faturado do bar ampliado para R$ ${newLim.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
  };

  const handleCopySql = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    }
    Alert.alert('Schema SQL Copiado', 'Script SQL oficial do Supabase copiado para a área de transferência.');
  };

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.desktopLayout}>
        {/* ========================================================= */}
        {/* SIDEBAR VERTICAL PROFISSIONAL - BASEADA NO APP BEBIDAS   */}
        {/* ========================================================= */}
        <View style={styles.sidebar}>
          {/* Logo e Badge Master */}
          <View style={styles.sidebarBrand}>
            <BrandLogo size="md" variant={isDarkMode ? 'dark' : 'light'} showPhrase={true} />
            <View style={styles.masterBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#0D1C28" />
              <Text style={styles.masterBadgeText}>ADMIN MASTER BEBIDAS</Text>
            </View>
          </View>

          {/* Menus e Seções em Scroll */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarScroll}>
            
            {/* 1. VISÃO GERAL */}
            <View style={styles.menuSectionHeader}>
              <Text style={styles.menuSectionSubtitle}>VISÃO GERAL</Text>
            </View>
            <TouchableOpacity 
              style={[styles.sidebarItem, activeTab === 'dashboard' && styles.sidebarItemActive]}
              onPress={() => setActiveTab('dashboard')}
              activeOpacity={0.8}
            >
              <Ionicons name="grid-outline" size={17} color={activeTab === 'dashboard' ? '#0D1C28' : theme.textSecondary} />
              <Text style={[styles.sidebarItemText, activeTab === 'dashboard' && styles.sidebarItemTextActive]}>
                Dashboard Principal
              </Text>
            </TouchableOpacity>

            {/* MODERAÇÃO DE DENÚNCIAS (APPLE GUIDELINE 1.2) */}
            <TouchableOpacity 
              style={[
                styles.sidebarItem, 
                activeTab === 'moderation_reports' && styles.sidebarItemActive,
                { marginTop: 4, borderColor: '#EF4444', borderWidth: 1 }
              ]}
              onPress={() => setActiveTab('moderation_reports')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="shield-checkmark" 
                size={17} 
                color={activeTab === 'moderation_reports' ? '#0D1C28' : '#EF4444'} 
              />
              <Text style={[
                styles.sidebarItemText, 
                activeTab === 'moderation_reports' && styles.sidebarItemTextActive,
                { color: activeTab === 'moderation_reports' ? '#0D1C28' : '#EF4444', fontWeight: 'bold' }
              ]}>
                Moderação de Denúncias
              </Text>
              {pendingReportsCount > 0 ? (
                <View style={{ backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>{pendingReportsCount}</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' }}>OK</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 2. GESTÃO DE PEDIDOS (ORDER MANAGEMENT) */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('orders')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>GESTÃO DE PEDIDOS</Text>
              <Ionicons name={expandedSections.orders ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.orders && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'orders_all' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('orders_all')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'orders_all' && styles.sidebarSubItemTextActive]}>
                    Todos os Pedidos
                  </Text>
                  <Text style={styles.miniBadgeCount}>{orders.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'orders_pending' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('orders_pending')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'orders_pending' && styles.sidebarSubItemTextActive]}>
                    Pendentes de Aprovação
                  </Text>
                  {countPending > 0 && <Text style={[styles.miniBadgeCount, { backgroundColor: '#EF4444' }]}>{countPending}</Text>}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'orders_accepted' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('orders_accepted')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'orders_accepted' && styles.sidebarSubItemTextActive]}>
                    Confirmados / Aceitos
                  </Text>
                  <Text style={styles.miniBadgeCount}>{countConfirmed}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'orders_processing' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('orders_processing')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'orders_processing' && styles.sidebarSubItemTextActive]}>
                    Em Separação no Galpão
                  </Text>
                  <Text style={styles.miniBadgeCount}>{countPreparing}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'orders_in_transit' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('orders_in_transit')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'orders_in_transit' && styles.sidebarSubItemTextActive]}>
                    Em Rota no Caminhão
                  </Text>
                  <Text style={[styles.miniBadgeCount, { backgroundColor: '#3B82F6' }]}>{countInTransit}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'orders_delivered' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('orders_delivered')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'orders_delivered' && styles.sidebarSubItemTextActive]}>
                    Entregues com Sucesso
                  </Text>
                  <Text style={[styles.miniBadgeCount, { backgroundColor: '#10B981' }]}>{countDelivered}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'orders_dispatch' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('orders_dispatch')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'orders_dispatch' && styles.sidebarSubItemTextActive]}>
                    Central de Despacho
                  </Text>
                  <Ionicons name="navigate-circle-outline" size={14} color="#FFC107" />
                </TouchableOpacity>
              </View>
            )}

            {/* 3. ESTABELECIMENTOS & LOJAS (STORES & SUPPLIERS) */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('stores')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>ESTABELECIMENTOS & LOJAS</Text>
              <Ionicons name={expandedSections.stores ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.stores && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'suppliers_list' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('suppliers_list')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'suppliers_list' && styles.sidebarSubItemTextActive]}>
                    Distribuidores Parceiros
                  </Text>
                  <Text style={styles.miniBadgeCount}>{suppliers.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'bars_list' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('bars_list')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'bars_list' && styles.sidebarSubItemTextActive]}>
                    Bares & Filiais Cadastradas
                  </Text>
                  <Text style={styles.miniBadgeCount}>{bars.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'zones_setup' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('zones_setup')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'zones_setup' && styles.sidebarSubItemTextActive]}>
                    Zonas & Regiões de Atendimento
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'bar_categories' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('bar_categories')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'bar_categories' && styles.sidebarSubItemTextActive]}>
                    Tipos de Bar (Cuisines)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 4. CATÁLOGO E PRODUTOS (BEVERAGES & PRODUCTS) */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('catalog')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>CATÁLOGO DE BEBIDAS</Text>
              <Ionicons name={expandedSections.catalog ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.catalog && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'products_list' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('products_list')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'products_list' && styles.sidebarSubItemTextActive]}>
                    Lista Completa de Produtos
                  </Text>
                  <Text style={styles.miniBadgeCount}>{products.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'categories_setup' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('categories_setup')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'categories_setup' && styles.sidebarSubItemTextActive]}>
                    Categorias & Subcategorias
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'addons_returnables' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('addons_returnables')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'addons_returnables' && styles.sidebarSubItemTextActive]}>
                    Vasilhames & Retornáveis (Addons)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 5. PROMOÇÕES E MARKETING */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('promotions')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>PROMOÇÕES & MARKETING</Text>
              <Ionicons name={expandedSections.promotions ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.promotions && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'campaigns' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('campaigns')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'campaigns' && styles.sidebarSubItemTextActive]}>
                    Campanhas Promocionais
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'coupons' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('coupons')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'coupons' && styles.sidebarSubItemTextActive]}>
                    Cupons de Desconto B2B
                  </Text>
                  <Text style={styles.miniBadgeCount}>{coupons.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'app_banners' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('app_banners')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'app_banners' && styles.sidebarSubItemTextActive]}>
                    Banners do Aplicativo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'push_notifications' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('push_notifications')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'push_notifications' && styles.sidebarSubItemTextActive]}>
                    Notificações Push em Massa
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 6. ENTREGADORES E FROTAS (DELIVERYMEN) */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('delivery')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>ENTREGADORES & FROTAS</Text>
              <Ionicons name={expandedSections.delivery ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.delivery && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'deliverymen_list' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('deliverymen_list')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'deliverymen_list' && styles.sidebarSubItemTextActive]}>
                    Motoristas & Caminhoneiros
                  </Text>
                  <Text style={styles.miniBadgeCount}>{drivers.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'vehicle_categories' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('vehicle_categories')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'vehicle_categories' && styles.sidebarSubItemTextActive]}>
                    Categorias de Veículos
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'delivery_shifts' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('delivery_shifts')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'delivery_shifts' && styles.sidebarSubItemTextActive]}>
                    Turnos de Entrega (Shifts)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 7. CLIENTES E DONOS DE BARES */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('customers')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>CLIENTES & BARES</Text>
              <Ionicons name={expandedSections.customers ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.customers && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'customers_list' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('customers_list')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'customers_list' && styles.sidebarSubItemTextActive]}>
                    Donos de Bares Cadastrados
                  </Text>
                  <Text style={styles.miniBadgeCount}>{barOwners.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'customer_wallets' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('customer_wallets')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'customer_wallets' && styles.sidebarSubItemTextActive]}>
                    Carteiras B2B & Crédito Faturado
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 8. FINANCEIRO E REPASSES (DISBURSEMENTS) */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('financial')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>FINANCEIRO & REPASSES</Text>
              <Ionicons name={expandedSections.financial ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.financial && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'supplier_disbursements' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('supplier_disbursements')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'supplier_disbursements' && styles.sidebarSubItemTextActive]}>
                    Repasses a Fornecedores
                  </Text>
                  <Ionicons name="cash-outline" size={14} color="#10B981" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'driver_disbursements' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('driver_disbursements')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'driver_disbursements' && styles.sidebarSubItemTextActive]}>
                    Repasses a Entregadores
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'transactions_statement' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('transactions_statement')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'transactions_statement' && styles.sidebarSubItemTextActive]}>
                    Extrato Geral de Transações
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 9. RELATÓRIOS E ANALYTICS */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('reports')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>RELATÓRIOS & ANALYTICS</Text>
              <Ionicons name={expandedSections.reports ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.reports && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'report_sales' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('report_sales')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'report_sales' && styles.sidebarSubItemTextActive]}>
                    Relatório de Vendas (GMV)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'report_commissions' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('report_commissions')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'report_commissions' && styles.sidebarSubItemTextActive]}>
                    Relatório de Comissões
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'report_products' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('report_products')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'report_products' && styles.sidebarSubItemTextActive]}>
                    Bebidas Mais Vendidas
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 10. EQUIPE E PERMISSÕES */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('team')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>EQUIPE & PERMISSÕES</Text>
              <Ionicons name={expandedSections.team ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.team && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'employees_list' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('employees_list')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'employees_list' && styles.sidebarSubItemTextActive]}>
                    Colaboradores do Painel
                  </Text>
                  <Text style={styles.miniBadgeCount}>{employees.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'custom_roles' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('custom_roles')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'custom_roles' && styles.sidebarSubItemTextActive]}>
                    Cargos & Níveis de Acesso
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 11. CONFIGURAÇÕES E INTEGRAÇÕES */}
            <TouchableOpacity 
              style={styles.menuSectionToggle}
              onPress={() => toggleSection('settings')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuSectionSubtitle}>SISTEMA & INTEGRAÇÕES</Text>
              <Ionicons name={expandedSections.settings ? "chevron-down" : "chevron-forward"} size={14} color={theme.textMuted} />
            </TouchableOpacity>

            {expandedSections.settings && (
              <View style={styles.subMenuGroup}>
                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'business_setup' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('business_setup')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'business_setup' && styles.sidebarSubItemTextActive]}>
                    Dados da Empresa & Regras
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'payment_gateways' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('payment_gateways')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'payment_gateways' && styles.sidebarSubItemTextActive]}>
                    Meios de Pagamento B2B
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sidebarSubItem, activeTab === 'cloud_integrations' && styles.sidebarSubItemActive]}
                  onPress={() => setActiveTab('cloud_integrations')}
                >
                  <Text style={[styles.sidebarSubItemText, activeTab === 'cloud_integrations' && styles.sidebarSubItemTextActive]}>
                    Nuvem, Supabase & Banco
                  </Text>
                  <Ionicons name="server-outline" size={14} color="#38BDF8" />
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>

          {/* Rodapé da Sidebar */}
          <View style={styles.sidebarFooter}>
            <View style={styles.adminUserCard}>
              <View style={styles.adminAvatar}>
                <Ionicons name="person" size={16} color="#0D1C28" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminUserName}>Carlos Mendes</Text>
                <Text style={styles.adminUserRole}>Super Administrador</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* ÁREA PRINCIPAL DE CONTEÚDO (CANVAS CENTRAL)               */}
        {/* ========================================================= */}
        <View style={styles.mainCanvas}>
          
          {/* TOPBAR SUPERIOR COM BUSCA E FILTRO DE ZONAS (APP BEBIDAS STYLE) */}
          <View style={styles.topBarDesktop}>
            {/* Título Dinâmico da Tela */}
            <View style={{ flex: 1 }}>
              <Text style={styles.pageHeadingTitle}>
                {activeTab === 'dashboard' && 'Dashboard Executivo & Estatísticas'}
                {activeTab.startsWith('orders') && 'Gestão de Pedidos B2B'}
                {activeTab === 'suppliers_list' && 'Distribuidores & Cervejarias Parceiras'}
                {activeTab === 'bars_list' && 'Bares, Restaurantes & Filiais'}
                {activeTab === 'zones_setup' && 'Zonas de Entrega & Cobertura'}
                {activeTab === 'bar_categories' && 'Tipos de Bar & Estabelecimento'}
                {activeTab === 'products_list' && 'Catálogo Geral de Bebidas B2B'}
                {activeTab === 'categories_setup' && 'Categorias & Famílias de Produtos'}
                {activeTab === 'addons_returnables' && 'Vasilhames Retornáveis & Comodatos'}
                {activeTab === 'campaigns' && 'Campanhas Promocionais & Festivais'}
                {activeTab === 'coupons' && 'Cupons de Desconto B2B'}
                {activeTab === 'app_banners' && 'Banners do Aplicativo Mobile'}
                {activeTab === 'push_notifications' && 'Disparo de Notificações Push'}
                {activeTab === 'deliverymen_list' && 'Motoristas & Frotas Cadastradas'}
                {activeTab === 'vehicle_categories' && 'Categorias de Veículos de Carga'}
                {activeTab === 'delivery_shifts' && 'Turnos de Entrega Logística'}
                {activeTab === 'customers_list' && 'Clientes Empresariais (Donos de Bar)'}
                {activeTab === 'customer_wallets' && 'Carteiras B2B & Limites de Crédito'}
                {activeTab === 'supplier_disbursements' && 'Repasses Financeiros para Fornecedores'}
                {activeTab === 'driver_disbursements' && 'Repasses de Frete para Motoristas'}
                {activeTab === 'transactions_statement' && 'Extrato Unificado de Transações'}
                {activeTab.startsWith('report') && 'Relatórios Gerenciais & Métricas'}
                {activeTab === 'employees_list' && 'Equipe Administrativa da Plataforma'}
                {activeTab === 'custom_roles' && 'Cargos e Permissões de Acesso'}
                {activeTab === 'moderation_reports' && 'Central de Moderação & Gestão de Denúncias (Apple Guideline 1.2)'}
                {activeTab === 'business_setup' && 'Configurações do Negócio & Taxas'}
                {activeTab === 'payment_gateways' && 'Gateways de Pagamento (Pix & Faturado)'}
                {activeTab === 'cloud_integrations' && 'Arquitetura de Nuvem, Supabase & Banco'}
              </Text>
              <Text style={styles.pageHeadingSub}>
                Centro de Operações FlowStock • Painel Administrativo Unificado
              </Text>
            </View>

            {/* Barra de Busca + Seletor de Zona */}
            <View style={styles.topBarControls}>
              {/* Input de Busca Rápida */}
              <View style={styles.searchBox}>
                <Ionicons name="search" size={15} color={theme.textMuted} />
                <TextInput 
                  placeholder="Pesquisar pedidos, bares, marcas..." 
                  placeholderTextColor={theme.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />
              </View>

              {/* Seletor de Zona / Região */}
              <View style={styles.zoneSelectorBox}>
                <Ionicons name="location-outline" size={15} color="#FFC107" />
                <Text style={styles.zoneSelectorLabel}>Zona:</Text>
                <TouchableOpacity 
                  style={styles.zoneSelectorBtn}
                  onPress={() => setShowZoneDropdown(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.zoneSelectorValue} numberOfLines={1}>
                    {getSelectedZoneLabel()}
                  </Text>
                  <Ionicons name="chevron-down" size={13} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Botões de Ação Rápida */}
              <TouchableOpacity 
                style={styles.actionIconBtn}
                onPress={() => setShowPushModal(true)}
              >
                <Ionicons name="notifications-outline" size={18} color={theme.text} />
                <View style={styles.notifBadge} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={() => {
                  if (activeTab === 'products_list') setShowAddProductModal(true);
                  else if (activeTab === 'coupons') setShowAddCouponModal(true);
                  else setShowAddSupplierModal(true);
                }}
              >
                <Ionicons name="add-circle" size={17} color="#0D1C28" />
                <Text style={styles.primaryActionButtonText}>
                  {activeTab === 'products_list' ? 'Novo Produto' : activeTab === 'coupons' ? 'Novo Cupom' : 'Novo Distribuidor'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CONTEÚDO SCROLLÁVEL */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.canvasScroll}>
            
            {/* ========================================================================= */}
            {/* SEÇÃO 1: DASHBOARD PRINCIPAL (CARDS E ESTATÍSTICAS DO APP BEBIDAS)        */}
            {/* ========================================================================= */}
            {activeTab === 'dashboard' && (
              <View style={{ gap: 20 }}>
                {/* Filtro de Período do App Bebidas */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#112332' : '#FFFFFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: isDarkMode ? '#1A2C3D' : '#E2E8F0' }}>
                  <Text style={styles.sectionTitle}>Estatísticas de Pedidos</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {(['overall', 'today', 'this_week', 'this_month', 'this_year'] as const).map(p => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.filterChip, selectedPeriod === p && styles.filterChipActive]}
                        onPress={() => setSelectedPeriod(p)}
                      >
                        <Text style={[styles.filterChipText, selectedPeriod === p && styles.filterChipTextActive]}>
                          {p === 'overall' && 'Geral'}
                          {p === 'today' && 'Hoje'}
                          {p === 'this_week' && 'Esta Semana'}
                          {p === 'this_month' && 'Este Mês'}
                          {p === 'this_year' && 'Este Ano'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 1.1 Quatro Cards Principais do Dashboard (Delivered, Canceled, Refunded, Failed) */}
                <View style={styles.statsCardGrid}>
                  <View style={[styles.statStatusCard, { backgroundColor: '#10B981' }]}>
                    <View style={styles.statStatusTop}>
                      <Text style={styles.statStatusValue}>{countDelivered}</Text>
                      <View style={styles.statStatusIconCircle}>
                        <Ionicons name="checkmark-done" size={20} color="#10B981" />
                      </View>
                    </View>
                    <Text style={styles.statStatusLabel}>Pedidos Entregues</Text>
                    <Text style={styles.statStatusHint}>Concluídos com sucesso</Text>
                  </View>

                  <View style={[styles.statStatusCard, { backgroundColor: '#EF4444' }]}>
                    <View style={styles.statStatusTop}>
                      <Text style={styles.statStatusValue}>{countCanceled}</Text>
                      <View style={styles.statStatusIconCircle}>
                        <Ionicons name="close" size={20} color="#EF4444" />
                      </View>
                    </View>
                    <Text style={styles.statStatusLabel}>Cancelados</Text>
                    <Text style={styles.statStatusHint}>Bares ou fornecedores</Text>
                  </View>

                  <View style={[styles.statStatusCard, { backgroundColor: '#8B5CF6' }]}>
                    <View style={styles.statStatusTop}>
                      <Text style={styles.statStatusValue}>0</Text>
                      <View style={styles.statStatusIconCircle}>
                        <Ionicons name="refresh" size={20} color="#8B5CF6" />
                      </View>
                    </View>
                    <Text style={styles.statStatusLabel}>Reembolsados</Text>
                    <Text style={styles.statStatusHint}>Disputas resolvidas</Text>
                  </View>

                  <View style={[styles.statStatusCard, { backgroundColor: '#F59E0B' }]}>
                    <View style={styles.statStatusTop}>
                      <Text style={styles.statStatusValue}>{countPending}</Text>
                      <View style={styles.statStatusIconCircle}>
                        <Ionicons name="card" size={20} color="#F59E0B" />
                      </View>
                    </View>
                    <Text style={styles.statStatusLabel}>Aguardando Pix / Faturado</Text>
                    <Text style={styles.statStatusHint}>Confirmação bancária</Text>
                  </View>
                </View>

                {/* 1.2 Quatro Cards de Operação em Andamento (Dispatch, Accepted, Packaging, On The Way) */}
                <View style={styles.operationalGrid}>
                  <View style={styles.opCard}>
                    <View style={styles.opCardIcon}>
                      <Ionicons name="search" size={20} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.opCardCount}>1</Text>
                      <Text style={styles.opCardTitle}>Buscando Entregador</Text>
                      <Text style={styles.opCardSub}>Aguardando caminhão</Text>
                    </View>
                  </View>

                  <View style={styles.opCard}>
                    <View style={[styles.opCardIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="hand-right" size={20} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.opCardCount}>{countConfirmed}</Text>
                      <Text style={styles.opCardTitle}>Aceito pelo Fornecedor</Text>
                      <Text style={styles.opCardSub}>Em fila de separação</Text>
                    </View>
                  </View>

                  <View style={styles.opCard}>
                    <View style={[styles.opCardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Ionicons name="cube" size={20} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.opCardCount}>{countPreparing}</Text>
                      <Text style={styles.opCardTitle}>Em Separação no Galpão</Text>
                      <Text style={styles.opCardSub}>Montando pallets/barris</Text>
                    </View>
                  </View>

                  <View style={styles.opCard}>
                    <View style={[styles.opCardIcon, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                      <Ionicons name="speedometer" size={20} color="#F97316" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.opCardCount}>{countInTransit}</Text>
                      <Text style={styles.opCardTitle}>Caminhão em Rota</Text>
                      <Text style={styles.opCardSub}>A caminho dos bares</Text>
                    </View>
                  </View>
                </View>

                {/* 1.3 Indicadores Financeiros da Plataforma */}
                <View style={styles.financialRow}>
                  <View style={styles.finCard}>
                    <Text style={styles.finLabel}>Volume Total (GMV)</Text>
                    <Text style={styles.finValue}>R$ {totalGMV.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                    <Text style={styles.finSub}>{orders.length} pedidos B2B transacionados</Text>
                  </View>

                  <View style={styles.finCard}>
                    <Text style={styles.finLabel}>Comissões FlowStock Retidas</Text>
                    <Text style={[styles.finValue, { color: '#10B981' }]}>
                      R$ {totalPlatformCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.finSub}>Média de 5.5% sobre o faturamento</Text>
                  </View>

                  <View style={styles.finCard}>
                    <Text style={styles.finLabel}>Repasses Líquidos a Distribuidores</Text>
                    <Text style={[styles.finValue, { color: '#38BDF8' }]}>
                      R$ {totalSupplierPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.finSub}>A transferir via Pix B2B</Text>
                  </View>

                  <View style={styles.finCard}>
                    <Text style={styles.finLabel}>Limite Faturado Alocado (30d)</Text>
                    <Text style={[styles.finValue, { color: '#FFC107' }]}>
                      R$ {totalCreditAllocated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.finSub}>Utilizado: R$ {totalCreditUsed.toFixed(2)}</Text>
                  </View>
                </View>

                {/* 1.4 Painéis Comparativos: Top Fornecedores e Bebidas Populares */}
                <View style={styles.twoColumnGrid}>
                  {/* Top Distribuidores */}
                  <View style={styles.panelBox}>
                    <View style={styles.panelHeader}>
                      <Ionicons name="storefront" size={18} color="#FFC107" />
                      <Text style={styles.panelTitle}>Top Fornecedores & Distribuidores</Text>
                    </View>
                    <View style={{ gap: 10, marginTop: 12 }}>
                      {suppliers.map((supp, index) => (
                        <View key={supp.id} style={styles.topItemRow}>
                          <Text style={styles.rankBadge}>#{index + 1}</Text>
                          <Image source={{ uri: supp.logoUrl }} style={styles.topItemImage} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.topItemTitle}>{supp.tradeName}</Text>
                            <Text style={styles.topItemSub}>Comissão: {supp.commissionRate}% • Pedido Mín: R$ {supp.minOrderValue}</Text>
                          </View>
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#FFC107" />
                            <Text style={styles.ratingText}>{supp.rating.toFixed(1)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Top Bebidas Mais Vendidas */}
                  <View style={styles.panelBox}>
                    <View style={styles.panelHeader}>
                      <Ionicons name="beer" size={18} color="#FFC107" />
                      <Text style={styles.panelTitle}>Bebidas Mais Vendidas (Volume)</Text>
                    </View>
                    <View style={{ gap: 10, marginTop: 12 }}>
                      {products.slice(0, 4).map((prod, index) => (
                        <View key={prod.id} style={styles.topItemRow}>
                          <Text style={styles.rankBadge}>#{index + 1}</Text>
                          <Image source={{ uri: prod.imageUrl }} style={styles.topItemImage} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.topItemTitle}>{prod.name}</Text>
                            <Text style={styles.topItemSub}>{prod.packageDetails} • Estoque: {prod.stock} un</Text>
                          </View>
                          <Text style={styles.prodPriceTag}>R$ {prod.price.toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ========================================================================= */}
            {/* SEÇÃO 2: GESTÃO DE PEDIDOS (ORDER MANAGEMENT)                             */}
            {/* ========================================================================= */}
            {activeTab.startsWith('orders') && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>
                      {activeTab === 'orders_dispatch' ? 'Central de Despacho & Atribuição de Motorista' : 'Fluxo de Pedidos em Tempo Real'}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Supervisão completa de pedidos B2B, status da carga e alteração em 1 toque
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                      style={[styles.filterChip, activeTab === 'orders_all' && styles.filterChipActive]}
                      onPress={() => setActiveTab('orders_all')}
                    >
                      <Text style={[styles.filterChipText, activeTab === 'orders_all' && styles.filterChipTextActive]}>
                        Todos ({orders.length})
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.filterChip, activeTab === 'orders_in_transit' && styles.filterChipActive]}
                      onPress={() => setActiveTab('orders_in_transit')}
                    >
                      <Text style={[styles.filterChipText, activeTab === 'orders_in_transit' && styles.filterChipTextActive]}>
                        Em Rota ({countInTransit})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Tabela de Pedidos */}
                <View style={{ marginTop: 16, gap: 12 }}>
                  {orders.map(order => {
                    const supp = suppliers.find(s => s.id === order.supplierId);
                    const commAmount = order.total * ((supp?.commissionRate || 5.5) / 100);

                    return (
                      <View key={order.id} style={styles.rowCardWide}>
                        <View style={{ flex: 1.8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.orderIdBadge}>{order.id}</Text>
                            <Text style={styles.orderTimeText}>{order.createdAt}</Text>
                          </View>
                          <Text style={styles.rowTitle}>{order.barName}</Text>
                          <Text style={styles.rowSub}>Fornecedor: {order.supplierName}</Text>
                          <Text style={styles.rowSub}>Endereço: {order.barAddress}</Text>
                        </View>

                        <View style={{ flex: 1.5 }}>
                          <Text style={styles.rowLabel}>Status da Carga:</Text>
                          <View style={styles.statusPill}>
                            <Text style={styles.statusPillText}>
                              {order.status === 'in_transit' && '🚛 Em Rota no Caminhão'}
                              {order.status === 'preparing' && '📦 Em Separação no Galpão'}
                              {order.status === 'confirmed' && '🕒 Confirmado'}
                              {order.status === 'delivered' && '✅ Entregue ao Bar'}
                              {order.status === 'pending_payment' && '⚠️ Aguardando Pix'}
                              {order.status === 'cancelled' && '❌ Cancelado'}
                            </Text>
                          </View>
                          <Text style={styles.paymentMethodSub}>
                            Pagamento: {order.paymentMethod === 'pix' ? 'Pix Instantâneo' : order.paymentMethod === 'boleto_faturado' ? 'Boleto Faturado 30d' : 'Cartão PJ'}
                          </Text>
                        </View>

                        <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                          <Text style={styles.rowLabel}>Valor do Pedido:</Text>
                          <Text style={styles.rowValue}>R$ {order.total.toFixed(2)}</Text>
                          <Text style={styles.rowComm}>Comissão FlowStock: R$ {commAmount.toFixed(2)}</Text>

                          {/* Ações Rápidas de Status */}
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                            {order.status === 'confirmed' && (
                              <TouchableOpacity 
                                style={styles.statusActionBtn}
                                onPress={() => updateOrderStatus(order.id, 'preparing')}
                              >
                                <Text style={styles.statusActionText}>Separar</Text>
                              </TouchableOpacity>
                            )}
                            {order.status === 'preparing' && (
                              <TouchableOpacity 
                                style={[styles.statusActionBtn, { backgroundColor: '#3B82F6' }]}
                                onPress={() => updateOrderStatus(order.id, 'in_transit')}
                              >
                                <Text style={styles.statusActionText}>Despachar Caminhão</Text>
                              </TouchableOpacity>
                            )}
                            {order.status === 'in_transit' && (
                              <TouchableOpacity 
                                style={[styles.statusActionBtn, { backgroundColor: '#10B981' }]}
                                onPress={() => updateOrderStatus(order.id, 'delivered')}
                              >
                                <Text style={styles.statusActionText}>Confirmar Entrega</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ========================================================================= */}
            {/* SEÇÃO 3: DISTRIBUIDORES E CERVEJARIAS (SUPPLIERS)                          */}
            {/* ========================================================================= */}
            {activeTab === 'suppliers_list' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Distribuidores e Cervejarias Credenciadas</Text>
                    <Text style={styles.sectionSubtitle}>
                      Gestão de comissões da plataforma, pedidos mínimos e Chaves Pix de repasse
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.primaryActionButton}
                    onPress={() => setShowAddSupplierModal(true)}
                  >
                    <Ionicons name="add-circle" size={17} color="#0D1C28" />
                    <Text style={styles.primaryActionButtonText}>Novo Fornecedor</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {suppliers.map(supp => (
                    <View key={supp.id} style={styles.rowCardWide}>
                      <Image source={{ uri: supp.logoUrl }} style={styles.suppLogoSquare} />
                      <View style={{ flex: 2 }}>
                        <Text style={styles.rowTitle}>{supp.tradeName}</Text>
                        <Text style={styles.rowSub}>Razão: {supp.corporateName} • CNPJ: {supp.cnpj}</Text>
                        <Text style={styles.rowSub}>Chave Pix: {supp.bankPixKey} • Tel: {supp.phone}</Text>
                        <Text style={styles.rowSub}>Prazo Médio: {supp.deliveryTimeEstimate} • Mínimo: R$ {supp.minOrderValue.toFixed(2)}</Text>
                      </View>

                      <View style={{ flex: 1.5, alignItems: 'center' }}>
                        <Text style={styles.rowLabel}>Taxa da Plataforma:</Text>
                        <Text style={styles.commissionRateText}>{supp.commissionRate.toFixed(1)}%</Text>
                        <TouchableOpacity 
                          style={styles.editBtnSmall}
                          onPress={() => {
                            const newRate = supp.commissionRate === 5.0 ? 6.5 : 5.0;
                            updateSupplierCommission(supp.id, newRate);
                            Alert.alert('Taxa Atualizada', `A taxa da ${supp.tradeName} foi ajustada para ${newRate}%.`);
                          }}
                        >
                          <Text style={styles.editBtnSmallText}>Alterar Taxa %</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <View style={[styles.pillActive, supp.status === 'active' ? styles.pillGreen : styles.pillYellow]}>
                          <Text style={styles.pillText}>{supp.status === 'active' ? 'ATIVO' : 'EM ANÁLISE'}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.toggleStatusBtn}
                          onPress={() => {
                            const newStatus = supp.status === 'active' ? 'suspended' : 'active';
                            updateSupplierStatus(supp.id, newStatus);
                          }}
                        >
                          <Text style={styles.toggleStatusBtnText}>
                            {supp.status === 'active' ? 'Pausar Operação' : 'Reativar'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

                        {/* ========================================================================= */}
            {/* SEÇÃO 4: BARES E FILIAIS CADASTRADAS (BARS LIST)                         */}
            {/* ========================================================================= */}
            {activeTab === 'bars_list' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Bares e Estabelecimentos Cadastrados</Text>
                    <Text style={styles.sectionSubtitle}>
                      Controle de CNPJs, limites de crédito faturado para 30 dias e pontos de entrega
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {bars.map(bar => {
                    const owner = allUsers.find(u => u.id === bar.ownerId);

                    return (
                      <View key={bar.id} style={styles.rowCardWide}>
                        <View style={{ flex: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.rowTitle}>{bar.name}</Text>
                            <View style={[styles.pillActive, bar.status === 'active' ? styles.pillGreen : styles.pillYellow]}>
                              <Text style={styles.pillText}>{bar.status === 'active' ? 'APROVADO' : 'EM ANÁLISE'}</Text>
                            </View>
                          </View>
                          <Text style={styles.rowSub}>CNPJ: {bar.cnpj} • Razão: {bar.tradingName}</Text>
                          <Text style={styles.rowSub}>Dono: {owner?.name || 'Cliente'} • Tel: {bar.phone}</Text>
                          <Text style={styles.rowSub}>Endereço: {bar.street}, {bar.number} - {bar.neighborhood}, {bar.city}/{bar.state}</Text>
                        </View>

                        <View style={{ flex: 1.5, alignItems: 'center' }}>
                          <Text style={styles.rowLabel}>Limite Faturado (30d):</Text>
                          <Text style={styles.creditValueLarge}>R$ {bar.creditLimit.toFixed(2)}</Text>
                          <Text style={styles.rowSub}>Utilizado: R$ {bar.creditUsed.toFixed(2)}</Text>
                          <TouchableOpacity 
                            style={styles.editBtnSmall}
                            onPress={() => handleChangeCreditPrompt(bar.id, bar.creditLimit)}
                          >
                            <Text style={styles.editBtnSmallText}>+ R$ 5.000 Crédito</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                          <TouchableOpacity 
                            style={styles.toggleStatusBtn}
                            onPress={() => {
                              const newSt = bar.status === 'active' ? 'blocked' : 'active';
                              updateBarStatus(bar.id, newSt);
                              Alert.alert('Status Alterado', `Estabelecimento ${bar.name} agora está ${newSt === 'active' ? 'Liberado' : 'Bloqueado'}.`);
                            }}
                          >
                            <Text style={styles.toggleStatusBtnText}>
                              {bar.status === 'active' ? 'Bloquear Bar' : 'Aprovar Bar'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ========================================================================= */}
            {/* SEÇÃO 5: ZONAS DE ATENDIMENTO E COBERTURA (ZONES SETUP)                   */}
            {/* ========================================================================= */}
            {activeTab === 'zones_setup' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Zonas & Regiões de Atendimento Logístico</Text>
                    <Text style={styles.sectionSubtitle}>
                      Configuração de cobertura geográfica, fretes base e raio de atuação dos caminhões
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {zones.map(zone => (
                    <View key={zone.id} style={styles.rowCardWide}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.rowTitle}>{zone.name}</Text>
                        <Text style={styles.rowSub}>Raio Máximo: {zone.radiusKm} km a partir do CD • Frete Base: R$ {zone.deliveryFee.toFixed(2)}</Text>
                        <Text style={styles.rowSub}>Pedidos Ativos nesta Região: {zone.activeOrders} entregas hoje</Text>
                      </View>

                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <View style={[styles.pillActive, styles.pillGreen]}>
                          <Text style={styles.pillText}>COBERTURA TOTAL</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <TouchableOpacity 
                          style={styles.editBtnSmall}
                          onPress={() => Alert.alert('Zona Configurada', `Parâmetros da ${zone.name} salvos.`)}
                        >
                          <Text style={styles.editBtnSmallText}>Editar Parâmetros</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

                        {/* ========================================================================= */}
            {/* SEÇÃO 5.1: TIPOS DE BAR & ESTABELECIMENTO (CUISINES)                     */}
            {/* ========================================================================= */}
            {activeTab === 'bar_categories' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Tipos de Bar & Estabelecimento (Cuisines)</Text>
                    <Text style={styles.sectionSubtitle}>
                      Classificação dos bares clientes para direcionamento de promoções e campanhas
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {cuisines.map(c => (
                    <View key={c.id} style={styles.rowCardWide}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 2 }}>
                        <View style={styles.driverAvatarCircle}>
                          <Ionicons name={c.icon} size={20} color="#0D1C28" />
                        </View>
                        <View>
                          <Text style={styles.rowTitle}>{c.name}</Text>
                          <Text style={styles.rowSub}>{c.establishmentCount} bares clientes nesta categoria</Text>
                        </View>
                      </View>
                      <View style={[styles.pillActive, styles.pillGreen]}>
                        <Text style={styles.pillText}>ATIVO NO APP</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

                        {/* ========================================================================= */}
            {/* SEÇÃO 6: CATÁLOGO DE PRODUTOS E BEBIDAS (PRODUCTS LIST)                   */}
            {/* ========================================================================= */}
            {activeTab === 'products_list' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Catálogo Unificado de Bebidas B2B</Text>
                    <Text style={styles.sectionSubtitle}>
                      Supervisão de estoque, preços no atacado, embalagens e bebidas retornáveis
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.primaryActionButton}
                    onPress={() => setShowAddProductModal(true)}
                  >
                    <Ionicons name="add-circle" size={17} color="#0D1C28" />
                    <Text style={styles.primaryActionButtonText}>Nova Bebida</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {products.map(prod => (
                    <View key={prod.id} style={styles.rowCardWide}>
                      <Image source={{ uri: prod.imageUrl }} style={styles.prodImageSquare} />
                      <View style={{ flex: 2 }}>
                        <Text style={styles.rowTitle}>{prod.name}</Text>
                        <Text style={styles.rowSub}>Fornecedor: {prod.supplierName} • Marca: {prod.brand}</Text>
                        <Text style={styles.rowSub}>Embalagem: {prod.packageDetails}</Text>
                        {prod.isReturnableBottle && (
                          <View style={styles.returnableTag}>
                            <Ionicons name="repeat" size={11} color="#10B981" />
                            <Text style={styles.returnableTagText}>Exige Devolução de Casco/Vasilhame</Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 1.2, alignItems: 'center' }}>
                        <Text style={styles.rowLabel}>Preço Atacado:</Text>
                        <Text style={styles.rowValue}>R$ {prod.price.toFixed(2)}</Text>
                        <Text style={styles.rowSub}>Estoque: {prod.stock} un</Text>
                      </View>

                      <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
                        <TouchableOpacity 
                          style={styles.editBtnSmall}
                          onPress={() => {
                            updateProduct(prod.id, { stock: prod.stock + 20 });
                            Alert.alert('Estoque Reabastecido', `+20 unidades adicionadas ao produto ${prod.name}.`);
                          }}
                        >
                          <Text style={styles.editBtnSmallText}>+20 Estoque</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.toggleStatusBtn}
                          onPress={() => {
                            const newPrice = prod.price > 100 ? prod.price - 10 : prod.price + 10;
                            updateProduct(prod.id, { price: newPrice });
                            Alert.alert('Preço Atualizado', `Novo preço de R$ ${newPrice.toFixed(2)} salvo.`);
                          }}
                        >
                          <Text style={styles.toggleStatusBtnText}>Ajustar Preço</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

                        {/* ========================================================================= */}
            {/* SEÇÃO 7: VASILHAMES RETORNÁVEIS E COMODATOS (ADDONS)                      */}
            {/* ========================================================================= */}
            {activeTab === 'addons_returnables' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Vasilhames Retornáveis & Comodatos (Addons)</Text>
                    <Text style={styles.sectionSubtitle}>
                      Controle de cascos de cerveja 600ml, barris de chopp 50L e cilindros de CO2
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {addons.map(add => (
                    <View key={add.id} style={styles.rowCardWide}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.rowTitle}>{add.name}</Text>
                        <Text style={styles.rowSub}>Tipo: {add.type} • Estoque Disponível: {add.stock} unidades</Text>
                        <Text style={styles.rowSub}>Taxa Caução / Adicional: R$ {add.depositFee.toFixed(2)}</Text>
                      </View>

                      <View style={{ flex: 1.5, alignItems: 'center' }}>
                        <View style={[styles.pillActive, add.mandatoryReturn ? styles.pillYellow : styles.pillGreen]}>
                          <Text style={styles.pillText}>{add.mandatoryReturn ? 'DEVOLUÇÃO OBRIGATÓRIA' : 'CONSUMÍVEL'}</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <TouchableOpacity 
                          style={styles.editBtnSmall}
                          onPress={() => Alert.alert('Estoque de Cascos', 'Ajuste de inventário de vasilhames realizado.')}
                        >
                          <Text style={styles.editBtnSmallText}>Contar Cascos</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

                        {/* ========================================================================= */}
            {/* SEÇÃO 8: PROMOÇÕES, CAMPANHAS E CUPONS (MARKETING)                       */}
            {/* ========================================================================= */}
            {activeTab === 'campaigns' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Campanhas Promocionais & Festivais B2B</Text>
                    <Text style={styles.sectionSubtitle}>
                      Campanhas ativas para incentivar compras de barris de chopp e destilados
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {campaigns.map(camp => (
                    <View key={camp.id} style={styles.rowCardWide}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.rowTitle}>{camp.title}</Text>
                        <Text style={styles.rowSub}>Categoria Alvo: {camp.targetCategory} • Período: {camp.period}</Text>
                        <View style={[styles.pillActive, styles.pillYellow, { alignSelf: 'flex-start', marginTop: 4 }]}>
                          <Text style={styles.pillText}>{camp.discountBadge}</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <View style={[styles.pillActive, styles.pillGreen]}>
                          <Text style={styles.pillText}>CAMPANHA ATIVA</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <TouchableOpacity 
                          style={styles.editBtnSmall}
                          onPress={() => Alert.alert('Campanha', `Editando regras da campanha ${camp.title}.`)}
                        >
                          <Text style={styles.editBtnSmallText}>Configurar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

                        {activeTab === 'coupons' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Cupons de Desconto B2B</Text>
                    <Text style={styles.sectionSubtitle}>
                      Cupons promocionais disponíveis para checkout nos bares
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.primaryActionButton}
                    onPress={() => setShowAddCouponModal(true)}
                  >
                    <Ionicons name="add-circle" size={17} color="#0D1C28" />
                    <Text style={styles.primaryActionButtonText}>Novo Cupom</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {coupons.map(cp => (
                    <View key={cp.id} style={styles.rowCardWide}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.rowTitle}>{cp.code}</Text>
                        <Text style={styles.rowSub}>Desconto: {cp.discountValue}{cp.discountType === 'percent' ? '%' : ' R$'} • Mínimo de Compra: R$ {cp.minOrder}</Text>
                        <Text style={styles.rowSub}>Válido até: {cp.validUntil} • Usos Registrados: {cp.usageCount} bares</Text>
                      </View>

                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <View style={[styles.pillActive, styles.pillGreen]}>
                          <Text style={styles.pillText}>DISPONÍVEL</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <TouchableOpacity 
                          style={styles.toggleStatusBtn}
                          onPress={() => Alert.alert('Cupom', `O cupom ${cp.code} foi desativado temporariamente.`)}
                        >
                          <Text style={styles.toggleStatusBtnText}>Desativar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

                        {/* ========================================================================= */}
            {/* SEÇÃO 9: MOTORISTAS E FROTAS (DELIVERYMEN)                                */}
            {/* ========================================================================= */}
            {activeTab === 'deliverymen_list' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Motoristas e Caminhoneiros de Entrega</Text>
                    <Text style={styles.sectionSubtitle}>
                      Frotas parceiras, status de rota em tempo real e avaliação de entrega
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {drivers.map(drv => (
                    <View key={drv.id} style={styles.rowCardWide}>
                      <View style={styles.driverAvatarCircle}>
                        <Ionicons name="person" size={20} color="#0D1C28" />
                      </View>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.rowTitle}>{drv.name}</Text>
                        <Text style={styles.rowSub}>Veículo: {drv.vehicleType} • Placa: {drv.plate}</Text>
                        <Text style={styles.rowSub}>Telefone: {drv.phone} • Entregas Concluídas: {drv.completedDeliveries}</Text>
                      </View>

                      <View style={{ flex: 1.5, alignItems: 'center' }}>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={13} color="#FFC107" />
                          <Text style={styles.ratingText}>{drv.rating.toFixed(1)} ★</Text>
                        </View>
                        <Text style={styles.driverStatusText}>
                          {drv.status === 'in_transit' ? '🚛 Em Viagem' : drv.status === 'available' ? '🟢 Disponível' : '⚪ Offline'}
                        </Text>
                      </View>

                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <TouchableOpacity 
                          style={styles.editBtnSmall}
                          onPress={() => Alert.alert('Motorista', `Rotas atribuídas ao motorista ${drv.name} foram sincronizadas.`)}
                        >
                          <Text style={styles.editBtnSmallText}>Ver Rotas</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

                        {/* ========================================================================= */}
            {/* SEÇÃO 10: FINANCEIRO E REPASSES (DISBURSEMENTS)                           */}
            {/* ========================================================================= */}
            {activeTab === 'supplier_disbursements' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Repasses Financeiros para Fornecedores</Text>
                    <Text style={styles.sectionSubtitle}>
                      Cálculo de vendas brutas, retenção da comissão FlowStock e liquidação via Pix B2B
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {suppliers.map(supp => {
                    const suppOrders = orders.filter(o => o.supplierId === supp.id);
                    const gross = suppOrders.reduce((acc, o) => acc + o.total, 0);
                    const fee = gross * (supp.commissionRate / 100);
                    const net = gross - fee;

                    return (
                      <View key={supp.id} style={styles.rowCardWide}>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.rowTitle}>{supp.tradeName}</Text>
                          <Text style={styles.rowSub}>Chave Pix Cadastrada: {supp.bankPixKey}</Text>
                          <Text style={styles.rowSub}>Total de Pedidos Processados: {suppOrders.length} pedidos</Text>
                        </View>

                        <View style={{ flex: 1.5, alignItems: 'center' }}>
                          <Text style={styles.rowLabel}>Vendas Brutas: R$ {gross.toFixed(2)}</Text>
                          <Text style={styles.rowComm}>Comissão Retida ({supp.commissionRate}%): - R$ {fee.toFixed(2)}</Text>
                          <Text style={[styles.rowValue, { color: '#10B981', marginTop: 4 }]}>
                            Líquido: R$ {net.toFixed(2)}
                          </Text>
                        </View>

                        <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                          <TouchableOpacity 
                            style={styles.primaryActionButton}
                            onPress={() => Alert.alert('Repasse Realizado', `Transferência Pix de R$ ${net.toFixed(2)} enviada para a chave ${supp.bankPixKey}.`)}
                          >
                            <Ionicons name="paper-plane" size={14} color="#0D1C28" />
                            <Text style={styles.primaryActionButtonText}>Efetuar Repasse</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ========================================================================= */}
            {/* SEÇÃO 11: EQUIPE ADMINISTRATIVA (EMPLOYEES)                               */}
            {/* ========================================================================= */}
            {activeTab === 'employees_list' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Colaboradores & Equipe de Gestão</Text>
                    <Text style={styles.sectionSubtitle}>
                      Membros com acesso administrativo, funções operacionais e permissões
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {employees.map(emp => (
                    <View key={emp.id} style={styles.rowCardWide}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.rowTitle}>{emp.name}</Text>
                        <Text style={styles.rowSub}>E-mail: {emp.email}</Text>
                        <Text style={styles.rowSub}>Último Acesso: {emp.lastLogin}</Text>
                      </View>

                      <View style={{ flex: 1.5, alignItems: 'center' }}>
                        <View style={[styles.pillActive, styles.pillYellow]}>
                          <Text style={styles.pillText}>{emp.role.toUpperCase()}</Text>
                        </View>
                      </View>

                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <TouchableOpacity 
                          style={styles.editBtnSmall}
                          onPress={() => Alert.alert('Permissões', `Ajustando privilégios de ${emp.name}.`)}
                        >
                          <Text style={styles.editBtnSmallText}>Permissões</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

                        {/* ========================================================================= */}
            {/* SEÇÃO 12: CONFIGURAÇÕES E INTEGRAÇÕES DE NUVEM                            */}
            {/* ========================================================================= */}
            {(activeTab === 'cloud_integrations' || activeTab === 'business_setup' || activeTab === 'payment_gateways') && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Arquitetura de Nuvem, Custos & Banco de Dados</Text>
                    <Text style={styles.sectionSubtitle}>
                      Supabase PostgreSQL, Mercado Pago Sandbox, Google Cloud e Custos R$ 0,00
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.primaryActionButton}
                    onPress={handleCopySql}
                  >
                    <Ionicons name="copy-outline" size={16} color="#0D1C28" />
                    <Text style={styles.primaryActionButtonText}>Copiar Script SQL</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 16, gap: 12 }}>
                  {INTEGRATION_SERVICES.map(svc => (
                    <View key={svc.id} style={styles.rowCardWide}>
                      <View style={{ flex: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.rowTitle}>{svc.name}</Text>
                          <View style={[styles.pillActive, svc.isFreeTierAvailable ? styles.pillGreen : styles.pillYellow]}>
                            <Text style={styles.pillText}>GRÁTIS (TIER FREE)</Text>
                          </View>
                        </View>
                        <Text style={styles.rowSub}>Franquia Gratuita: {svc.freeTierDetails}</Text>
                        <Text style={styles.rowSub}>Requisitos: {svc.paidRequirements}</Text>
                      </View>

                      <View style={{ flex: 1.5, alignItems: 'center' }}>
                        <Text style={styles.rowLabel}>Chaves .env Vinculadas:</Text>
                        <Text style={styles.envKeysList}>{svc.envKeys.join(', ')}</Text>
                      </View>

                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <View style={[styles.pillActive, styles.pillGreen]}>
                          <Text style={styles.pillText}>PRONTO PARA USO</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ========================================================================= */}
            {/* SEÇÃO 13: CENTRAL DE MODERAÇÃO E DENÚNCIAS (APPLE GUIDELINE 1.2)          */}
            {/* ========================================================================= */}
            {activeTab === 'moderation_reports' && (
              <View style={styles.sectionBox}>
                {/* Banner de Conformidade Apple Guideline 1.2 */}
                <View style={{
                  backgroundColor: isDarkMode ? '#1E161C' : '#FFF1F2',
                  borderWidth: 1.5,
                  borderColor: '#EF4444',
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <View style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}>
                    <Ionicons name="shield-checkmark" size={26} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>
                        Central de Moderação de Conteúdo & Denúncias
                      </Text>
                      <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' }}>APPLE GUIDELINE 1.2</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4, lineHeight: 17 }}>
                      Em conformidade com a Apple App Store Review Guideline 1.2 (User-Generated Content), todas as denúncias de produtos falsificados, cobranças indevidas, fraudes ou assédio comercial devem ser apuradas em até 24 horas. Contas infratoras podem ser suspensas imediatamente.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#EF4444',
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 8,
                      marginLeft: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onPress={() => {
                      createReport({
                        targetType: 'supplier',
                        targetId: 'supp_2',
                        targetName: 'Mega Atacado de Destilados & Gins SP',
                        targetDetails: 'Simulação de Denúncia de Teste',
                        reasonCategory: 'fraud',
                        reasonDescription: 'Simulação de denúncia de cobrança indevida para teste dos fluxos de moderação do Painel Master.',
                        evidenceNotes: 'Comprovante bancário simulado anexo.',
                      });
                      Alert.alert('Denúncia Simulada', 'Uma nova denúncia pendente foi gerada para validação da equipe de moderação.');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' }}>Simular Denúncia</Text>
                  </TouchableOpacity>
                </View>

                {/* Métricas e Estatísticas de Moderação */}
                <View style={styles.metricsGrid}>
                  <View style={[styles.metricCard, { borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.metricLabel}>DENÚNCIAS PENDENTES</Text>
                      <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#EF4444' }}>SLA 24H</Text>
                      </View>
                    </View>
                    <Text style={[styles.metricValue, { color: '#EF4444' }]}>
                      {reports.filter(r => r.status === 'pending').length}
                    </Text>
                    <Text style={styles.metricSub}>Ação imediata requerida pela Apple</Text>
                  </View>

                  <View style={[styles.metricCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 4 }]}>
                    <Text style={styles.metricLabel}>EM INVESTIGAÇÃO</Text>
                    <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
                      {reports.filter(r => r.status === 'in_review').length}
                    </Text>
                    <Text style={styles.metricSub}>Em perícia técnica ou contato com distribuidor</Text>
                  </View>

                  <View style={[styles.metricCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
                    <Text style={styles.metricLabel}>RESOLVIDAS / ARQUIVADAS</Text>
                    <Text style={[styles.metricValue, { color: '#10B981' }]}>
                      {reports.filter(r => r.status === 'resolved' || r.status === 'dismissed').length}
                    </Text>
                    <Text style={styles.metricSub}>Com medidas de moderação aplicadas</Text>
                  </View>

                  <View style={[styles.metricCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 4 }]}>
                    <Text style={styles.metricLabel}>DISTRIBUIDORES SUSPENSOS</Text>
                    <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>
                      {suppliers.filter(s => s.status === 'suspended').length + blockedSupplierIds.length}
                    </Text>
                    <Text style={styles.metricSub}>Bloqueados de vender ou interagir</Text>
                  </View>
                </View>

                {/* Barra de Filtros Interativos */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: isDarkMode ? '#112332' : '#F8FAFC',
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 18,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                  flexWrap: 'wrap',
                  gap: 10,
                }}>
                  {/* Filtro por Status */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textSecondary, marginRight: 4 }}>
                      Status:
                    </Text>
                    {[
                      { key: 'all', label: `Todas (${reports.length})` },
                      { key: 'pending', label: `🚨 Pendentes (${reports.filter(r => r.status === 'pending').length})` },
                      { key: 'in_review', label: `🔍 Em Análise (${reports.filter(r => r.status === 'in_review').length})` },
                      { key: 'resolved', label: `✓ Resolvidas (${reports.filter(r => r.status === 'resolved').length})` },
                      { key: 'dismissed', label: `✕ Descartadas (${reports.filter(r => r.status === 'dismissed').length})` },
                    ].map(f => (
                      <TouchableOpacity
                        key={f.key}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: reportFilterStatus === f.key ? '#FFC107' : (isDarkMode ? '#0D1C28' : '#E2E8F0'),
                        }}
                        onPress={() => setReportFilterStatus(f.key as any)}
                      >
                        <Text style={{
                          fontSize: 11,
                          fontWeight: 'bold',
                          color: reportFilterStatus === f.key ? '#0D1C28' : theme.text,
                        }}>
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Filtro por Tipo de Alvo */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textSecondary, marginRight: 4 }}>
                      Tipo:
                    </Text>
                    {[
                      { key: 'all', label: 'Todos' },
                      { key: 'supplier', label: 'Distribuidores' },
                      { key: 'product', label: 'Produtos' },
                      { key: 'user', label: 'Usuários' },
                    ].map(f => (
                      <TouchableOpacity
                        key={f.key}
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: reportFilterTarget === f.key ? '#38BDF8' : (isDarkMode ? '#0D1C28' : '#E2E8F0'),
                        }}
                        onPress={() => setReportFilterTarget(f.key as any)}
                      >
                        <Text style={{
                          fontSize: 11,
                          fontWeight: 'bold',
                          color: reportFilterTarget === f.key ? '#0D1C28' : theme.text,
                        }}>
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Lista de Relatórios e Denúncias */}
                {reports
                  .filter(r => {
                    const matchStatus = reportFilterStatus === 'all' || r.status === reportFilterStatus;
                    const matchTarget = reportFilterTarget === 'all' || r.targetType === reportFilterTarget;
                    const matchSearch = !searchQuery || 
                      r.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.reasonDescription.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchStatus && matchTarget && matchSearch;
                  })
                  .map(report => {
                    const isPending = report.status === 'pending';
                    const isInReview = report.status === 'in_review';
                    const isResolved = report.status === 'resolved';
                    const isDismissed = report.status === 'dismissed';

                    const currentNote = moderatorNotesInput[report.id] || '';

                    return (
                      <View 
                        key={report.id}
                        style={{
                          backgroundColor: theme.surface,
                          borderWidth: 1.5,
                          borderColor: isPending ? '#EF4444' : (isInReview ? '#F59E0B' : theme.border),
                          borderRadius: 14,
                          padding: 18,
                          marginBottom: 16,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 6,
                          elevation: 2,
                        }}
                      >
                        {/* Linha Superior: Protocolo, Data, Badges */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFC107' }}>
                              Protocolo #{report.id.toUpperCase()}
                            </Text>
                            <View style={{
                              backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}>
                              <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.textSecondary, textTransform: 'uppercase' }}>
                                ALVO: {report.targetType}
                              </Text>
                            </View>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                              Recebida em: {new Date(report.createdAt).toLocaleString('pt-BR')}
                            </Text>
                            <View style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              backgroundColor: isPending 
                                ? '#EF4444' 
                                : (isInReview ? '#F59E0B' : (isResolved ? '#10B981' : '#6B7280')),
                            }}>
                              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' }}>
                                {isPending ? '🚨 PENDENTE (SLA 24H)' : (isInReview ? '🔍 EM INVESTIGAÇÃO' : (isResolved ? '✓ RESOLVIDA' : '✕ DESCARTADA'))}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Detalhes do Alvo e Denunciante */}
                        <View style={{
                          backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC',
                          borderRadius: 10,
                          padding: 12,
                          marginBottom: 12,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 12,
                        }}>
                          <View style={{ flex: 1.5, minWidth: 220 }}>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Alvo Denunciado:
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: theme.text, marginTop: 2 }}>
                              {report.targetName}
                            </Text>
                            {report.targetDetails && (
                              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
                                {report.targetDetails}
                              </Text>
                            )}
                          </View>

                          <View style={{ flex: 1.2, minWidth: 180 }}>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Denunciante:
                            </Text>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginTop: 2 }}>
                              {report.reporterName}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                              Perfil: {report.reporterRole === 'bar_owner' ? 'Dono de Bar Verificado' : report.reporterRole}
                            </Text>
                          </View>

                          <View style={{ flex: 1, minWidth: 160 }}>
                            <Text style={{ fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Motivo da Denúncia:
                            </Text>
                            <View style={{
                              alignSelf: 'flex-start',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              marginTop: 4,
                            }}>
                              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#EF4444' }}>
                                {report.reasonCategory === 'counterfeit' && '🚫 Produto Falsificado/Adulterado'}
                                {report.reasonCategory === 'fraud' && '⚠️ Fraude Comercial / Golpe'}
                                {report.reasonCategory === 'damaged' && '📦 Mercadoria Danificada/Vencida'}
                                {report.reasonCategory === 'abusive' && '🛑 Conduta Abusiva / Ameaça'}
                                {report.reasonCategory === 'pricing' && '💰 Cobrança Indevida / Preço'}
                                {report.reasonCategory === 'inappropriate' && '💬 Conteúdo Ofensivo'}
                                {report.reasonCategory === 'other' && '❓ Outro Motivo'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Relato dos Fatos */}
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.text, marginBottom: 4 }}>
                          Relato dos Fatos Enviado pelo Denunciante:
                        </Text>
                        <View style={{
                          backgroundColor: isDarkMode ? '#132130' : '#FFFFFF',
                          borderWidth: 1,
                          borderColor: theme.border,
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 10,
                        }}>
                          <Text style={{ fontSize: 13, color: theme.text, lineHeight: 18 }}>
                            &ldquo;{report.reasonDescription}&rdquo;
                          </Text>
                          {report.evidenceNotes && (
                            <Text style={{ fontSize: 11, color: '#FFC107', marginTop: 6 }}>
                              📎 Evidências / Documentos citados: {report.evidenceNotes}
                            </Text>
                          )}
                        </View>

                        {/* Histórico de Resolução se já finalizado */}
                        {(isResolved || isDismissed) && (
                          <View style={{
                            backgroundColor: isDarkMode ? '#172738' : '#F1F5F9',
                            borderRadius: 8,
                            padding: 12,
                            marginTop: 4,
                            borderLeftWidth: 4,
                            borderLeftColor: isResolved ? '#10B981' : '#6B7280',
                          }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={{ fontSize: 12, fontWeight: 'bold', color: isResolved ? '#10B981' : theme.textSecondary }}>
                                Parecer Final da Moderação FlowStock:
                              </Text>
                              <Text style={{ fontSize: 10, color: theme.textMuted }}>
                                Resolvido por: {report.resolvedBy || 'Admin Master'} em {report.resolvedAt ? new Date(report.resolvedAt).toLocaleDateString('pt-BR') : 'Hoje'}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 12, color: theme.text, marginTop: 4 }}>
                              {report.moderatorNotes || 'Denúncia tratada e arquivada.'}
                            </Text>
                            {report.moderationAction && (
                              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#EF4444', marginTop: 4 }}>
                                Medida Aplicada: {report.moderationAction === 'account_suspended' ? '🚫 CONTA SUSPENSA' : (report.moderationAction === 'warning_issued' ? '⚠️ ADVERTÊNCIA FORMAL' : '✓ CASO REGULARIZADO')}
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Painel de Ações de Moderação (Pendente ou Em Análise) */}
                        {(isPending || isInReview) && (
                          <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: theme.textSecondary, marginBottom: 6, textTransform: 'uppercase' }}>
                              Despacho da Moderação & Decisão Técnica:
                            </Text>

                            <TextInput
                              style={{
                                backgroundColor: isDarkMode ? '#0D1C28' : '#FFFFFF',
                                borderWidth: 1,
                                borderColor: theme.border,
                                borderRadius: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                fontSize: 13,
                                color: theme.text,
                                marginBottom: 10,
                              }}
                              placeholder="Digite parecer técnico ou justificativa do despacho interno..."
                              placeholderTextColor={theme.textMuted}
                              value={currentNote}
                              onChangeText={txt => setModeratorNotesInput(prev => ({ ...prev, [report.id]: txt }))}
                            />

                            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                              {/* Botão: Suspender Fornecedor / Conta */}
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#EF4444',
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                                onPress={() => {
                                  const note = currentNote || 'Suspensão aplicada por violação aos Termos de Serviço e Diretrizes Apple 1.2.';
                                  updateReportStatus(report.id, 'resolved', 'account_suspended', note);
                                  Alert.alert(
                                    '🚫 Conta Suspensa com Sucesso',
                                    `O alvo "${report.targetName}" foi suspenso no sistema. Produtos desativados e acesso bloqueado.`
                                  );
                                }}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="ban" size={14} color="#FFFFFF" />
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' }}>
                                  Suspender Fornecedor / Conta
                                </Text>
                              </TouchableOpacity>

                              {/* Botão: Emitir Advertência Formal */}
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#F59E0B',
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                                onPress={() => {
                                  const note = currentNote || 'Advertência formal emitida para o parceiro com prazo de adequação de 48h.';
                                  updateReportStatus(report.id, 'resolved', 'warning_issued', note);
                                  Alert.alert(
                                    '⚠️ Advertência Notificada',
                                    `Notificação formal de advertência enviada para "${report.targetName}".`
                                  );
                                }}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="alert-circle" size={14} color="#0D1C28" />
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0D1C28' }}>
                                  Emitir Advertência
                                </Text>
                              </TouchableOpacity>

                              {/* Botão: Colocar em Investigação */}
                              {isPending && (
                                <TouchableOpacity
                                  style={{
                                    backgroundColor: '#38BDF8',
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                  onPress={() => {
                                    const note = currentNote || 'Encaminhado para perícia técnica e checagem de nota fiscal.';
                                    updateReportStatus(report.id, 'in_review', 'none', note);
                                    Alert.alert(
                                      '🔍 Em Investigação',
                                      `Denúncia colocada em processo de apuração técnica.`
                                    );
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Ionicons name="search" size={14} color="#0D1C28" />
                                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0D1C28' }}>
                                    Iniciar Investigação
                                  </Text>
                                </TouchableOpacity>
                              )}

                              {/* Botão: Marcar como Resolvido / Regularizado */}
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#10B981',
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                                onPress={() => {
                                  const note = currentNote || 'Questão regularizada entre as partes. Reembolso ou troca efetuada.';
                                  updateReportStatus(report.id, 'resolved', 'cleared', note);
                                  Alert.alert(
                                    '✓ Caso Resolvido',
                                    `A denúncia #${report.id.toUpperCase()} foi marcada como regularizada.`
                                  );
                                }}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFFFFF' }}>
                                  Resolver / Regularizado
                                </Text>
                              </TouchableOpacity>

                              {/* Botão: Descartar (Improcedente) */}
                              <TouchableOpacity
                                style={{
                                  backgroundColor: 'transparent',
                                  borderWidth: 1,
                                  borderColor: theme.border,
                                  paddingHorizontal: 12,
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                                onPress={() => {
                                  const note = currentNote || 'Denúncia analisada e descartada por ausência de evidências ou improcedência.';
                                  updateReportStatus(report.id, 'dismissed', 'none', note);
                                  Alert.alert(
                                    '✕ Denúncia Descartada',
                                    `O registro foi arquivado como improcedente.`
                                  );
                                }}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="close" size={14} color={theme.textSecondary} />
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.textSecondary }}>
                                  Descartar (Improcedente)
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
              </View>
            )}

          </ScrollView>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* MODAL: SELETOR DE ZONA LOGÍSTICA / DROPDOWN                               */}
      {/* ========================================================================= */}
      <Modal
        visible={showZoneDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowZoneDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setShowZoneDropdown(false)}
        >
          <View 
            style={[styles.zoneDropdownCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.zoneDropdownHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.zoneDropdownIconBadge}>
                  <Ionicons name="location" size={16} color="#0D1C28" />
                </View>
                <View>
                  <Text style={[styles.zoneDropdownTitle, { color: theme.text }]}>Zonas Logísticas de Atendimento</Text>
                  <Text style={[styles.zoneDropdownSub, { color: theme.textSecondary }]}>Selecione a região para filtrar pedidos e frotas</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowZoneDropdown(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.zoneDropdownDivider, { backgroundColor: theme.border }]} />

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {/* Opção Global: Todas as Zonas */}
              <TouchableOpacity 
                style={[
                  styles.zoneDropdownOption, 
                  selectedZone === 'all' && styles.zoneDropdownOptionSelected,
                  selectedZone === 'all' && { backgroundColor: isDarkMode ? '#172C40' : '#FEF3C7', borderColor: '#FFC107' }
                ]}
                onPress={() => {
                  setSelectedZone('all');
                  setShowZoneDropdown(false);
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.zoneOptionRadio, selectedZone === 'all' && styles.zoneOptionRadioSelected]}>
                  {selectedZone === 'all' && <View style={styles.zoneOptionRadioDot} />}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.zoneOptionName, { color: theme.text }, selectedZone === 'all' && { color: isDarkMode ? '#FFC107' : '#B45309', fontWeight: 'bold' }]}>
                    Todas as Zonas (SP - Cobertura Global)
                  </Text>
                  <Text style={[styles.zoneOptionMeta, { color: theme.textSecondary }]}>
                    Visão consolidada de todos os galpões, frotas e pedidos ativos
                  </Text>
                </View>
                {selectedZone === 'all' && (
                  <Ionicons name="checkmark-circle" size={18} color="#FFC107" />
                )}
              </TouchableOpacity>

              {/* Lista das Zonas Configuradas */}
              {zones.map(zone => {
                const isSelected = selectedZone === zone.id;
                return (
                  <TouchableOpacity 
                    key={zone.id} 
                    style={[
                      styles.zoneDropdownOption, 
                      isSelected && styles.zoneDropdownOptionSelected,
                      isSelected && { backgroundColor: isDarkMode ? '#172C40' : '#FEF3C7', borderColor: '#FFC107' }
                    ]}
                    onPress={() => {
                      setSelectedZone(zone.id);
                      setShowZoneDropdown(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.zoneOptionRadio, isSelected && styles.zoneOptionRadioSelected]}>
                      {isSelected && <View style={styles.zoneOptionRadioDot} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.zoneOptionName, { color: theme.text }, isSelected && { color: isDarkMode ? '#FFC107' : '#B45309', fontWeight: 'bold' }]}>
                        {zone.name}
                      </Text>
                      <Text style={[styles.zoneOptionMeta, { color: theme.textSecondary }]}>
                        Raio: {zone.radiusKm} km • Frete Base: {zone.deliveryFee === 0 ? 'Grátis' : `R$ ${zone.deliveryFee.toFixed(2)}`} • {zone.activeOrders} entregas hoje
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#FFC107" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.zoneDropdownDivider, { backgroundColor: theme.border, marginTop: 10 }]} />

            {/* Ação rápida para configurar novas zonas */}
            <TouchableOpacity 
              style={styles.manageZonesBtn}
              onPress={() => {
                setShowZoneDropdown(false);
                setActiveTab('zones_setup');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={15} color="#FFC107" />
              <Text style={styles.manageZonesBtnText}>Gerenciar e Cadastrar Novas Zonas de Entrega</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFC107" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: NOVO DISTRIBUIDOR                                                  */}
      {/* ========================================================================= */}
      <Modal visible={showAddSupplierModal} transparent animationType="fade" onRequestClose={() => setShowAddSupplierModal(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAddSupplierModal(false)}
        >
          <View 
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cadastrar Novo Distribuidor B2B</Text>
              <TouchableOpacity onPress={() => setShowAddSupplierModal(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400, marginTop: 12 }}>
              <Text style={styles.inputLabel}>Nome Fantasia</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: Cervejaria Colorado & Malte" 
                placeholderTextColor={theme.textMuted}
                value={newSuppTradeName}
                onChangeText={setNewSuppTradeName}
              />

              <Text style={styles.inputLabel}>Razão Social</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: Colorado Bebidas e Logística Ltda" 
                placeholderTextColor={theme.textMuted}
                value={newSuppCorpName}
                onChangeText={setNewSuppCorpName}
              />

              <Text style={styles.inputLabel}>CNPJ</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: 05.123.456/0001-99" 
                placeholderTextColor={theme.textMuted}
                value={newSuppCnpj}
                onChangeText={setNewSuppCnpj}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Pedido Mínimo (R$)</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    value={newSuppMinOrder}
                    onChangeText={setNewSuppMinOrder}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Taxa Plataforma (%)</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    value={newSuppCommission}
                    onChangeText={setNewSuppCommission}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Telefone Comercial</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="(11) 3333-0000" 
                placeholderTextColor={theme.textMuted}
                value={newSuppPhone}
                onChangeText={setNewSuppPhone}
              />

              <Text style={styles.inputLabel}>Chave Pix para Repasses</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="CNPJ, E-mail ou Chave Aleatória" 
                placeholderTextColor={theme.textMuted}
                value={newSuppPixKey}
                onChangeText={setNewSuppPixKey}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddSupplierModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateSupplier}>
                <Text style={styles.saveBtnText}>Salvar Distribuidor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: NOVO PRODUTO                                                       */}
      {/* ========================================================================= */}
      <Modal visible={showAddProductModal} transparent animationType="fade" onRequestClose={() => setShowAddProductModal(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAddProductModal(false)}
        >
          <View 
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Bebida ao Catálogo B2B</Text>
              <TouchableOpacity onPress={() => setShowAddProductModal(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400, marginTop: 12 }}>
              <Text style={styles.inputLabel}>Nome do Produto</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: Chopp Brahma Claro Barril 50L" 
                placeholderTextColor={theme.textMuted}
                value={newProdName}
                onChangeText={setNewProdName}
              />

              <Text style={styles.inputLabel}>Marca / Cervejaria</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: Brahma / Ambev" 
                placeholderTextColor={theme.textMuted}
                value={newProdBrand}
                onChangeText={setNewProdBrand}
              />

              <Text style={styles.inputLabel}>Categoria da Bebida</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {[
                  { id: 'cervejas', label: 'Cervejas' },
                  { id: 'chopp_barris', label: 'Chopp & Barris' },
                  { id: 'destilados', label: 'Destilados' },
                  { id: 'vinhos', label: 'Vinhos' },
                  { id: 'refrigerantes', label: 'Refrigerantes' },
                  { id: 'aguas_gelo', label: 'Águas & Gelo' }
                ].map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.filterChip, newProdCategory === c.id && styles.filterChipActive]}
                    onPress={() => setNewProdCategory(c.id as any)}
                  >
                    <Text style={[styles.filterChipText, newProdCategory === c.id && styles.filterChipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Preço Atacado (R$)</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    value={newProdPrice}
                    onChangeText={setNewProdPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Estoque Inicial</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    value={newProdStock}
                    onChangeText={setNewProdStock}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Tipo de Embalagem / Unidade</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: Barril Inox 50L ou Caixa com 24 latas 350ml" 
                placeholderTextColor={theme.textMuted}
                value={newProdUnit}
                onChangeText={setNewProdUnit}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <Text style={styles.inputLabel}>Exige devolução de vasilhame/casco?</Text>
                <FigmaSwitch 
                  value={newProdReturnable}
                  onValueChange={setNewProdReturnable}
                  activeTrackColor="#FFC107"
                  inactiveTrackColor="#334155"
                  thumbColor="#FFFFFF"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddProductModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateProduct}>
                <Text style={styles.saveBtnText}>Salvar Bebida</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: NOVO CUPOM                                                         */}
      {/* ========================================================================= */}
      <Modal visible={showAddCouponModal} transparent animationType="fade" onRequestClose={() => setShowAddCouponModal(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAddCouponModal(false)}
        >
          <View 
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Criar Novo Cupom B2B</Text>
              <TouchableOpacity onPress={() => setShowAddCouponModal(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Código do Cupom</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: CHOPP15" 
                placeholderTextColor={theme.textMuted}
                value={newCouponCode}
                onChangeText={setNewCouponCode}
                autoCapitalize="characters"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Desconto (%)</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    value={newCouponValue}
                    onChangeText={setNewCouponValue}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Pedido Mínimo (R$)</Text>
                  <TextInput 
                    style={styles.modalInput} 
                    value={newCouponMin}
                    onChangeText={setNewCouponMin}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddCouponModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateCoupon}>
                <Text style={styles.saveBtnText}>Ativar Cupom</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DISPARO DE PUSH                                                    */}
      {/* ========================================================================= */}
      <Modal visible={showPushModal} transparent animationType="fade" onRequestClose={() => setShowPushModal(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPushModal(false)}
        >
          <View 
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disparar Notificação Push em Massa</Text>
              <TouchableOpacity onPress={() => setShowPushModal(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Título do Alerta</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: 🚛 Caminhão de Chopp na sua região!" 
                placeholderTextColor={theme.textMuted}
                value={pushTitle}
                onChangeText={setPushTitle}
              />

              <Text style={styles.inputLabel}>Mensagem / Conteúdo</Text>
              <TextInput 
                style={[styles.modalInput, { height: 80 }]} 
                placeholder="Ex: Peça barris de 50L agora e receba até às 17h para o Happy Hour." 
                placeholderTextColor={theme.textMuted}
                multiline
                value={pushBody}
                onChangeText={setPushBody}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPushModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSendPush}>
                <Text style={styles.saveBtnText}>Disparar para Todos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// =========================================================================
// FOLHA DE ESTILOS MODERNA E RESPONSIVA (DARK & LIGHT THEME AWARE)          
// =========================================================================
function getStyles(theme: ThemeColors, isDarkMode: boolean) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    desktopLayout: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.background,
    },

    // 1. Sidebar Styles
    sidebar: {
      width: 270,
      backgroundColor: isDarkMode ? '#0A1520' : '#FFFFFF',
      borderRightWidth: 1,
      borderRightColor: isDarkMode ? '#142535' : '#E2E8F0',
      display: 'flex',
      flexDirection: 'column',
    },
    sidebarBrand: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#142535' : '#E2E8F0',
      alignItems: 'flex-start',
    },
    masterBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FFC107',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      marginTop: 10,
    },
    masterBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#0D1C28',
      letterSpacing: 0.5,
    },
    sidebarScroll: {
      paddingVertical: 12,
    },
    menuSectionHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    menuSectionToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
    },
    menuSectionSubtitle: {
      fontSize: 11,
      fontWeight: '800',
      color: isDarkMode ? '#52667A' : '#94A3B8',
      letterSpacing: 0.8,
    },
    sidebarItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginHorizontal: 8,
      borderRadius: 8,
    },
    sidebarItemActive: {
      backgroundColor: '#FFC107',
    },
    sidebarItemText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    sidebarItemTextActive: {
      color: '#0D1C28',
      fontWeight: '700',
    },
    subMenuGroup: {
      paddingLeft: 12,
      marginBottom: 6,
    },
    sidebarSubItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 6,
    },
    sidebarSubItemActive: {
      backgroundColor: isDarkMode ? '#142535' : '#F1F5F9',
    },
    sidebarSubItemText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
      flex: 1,
    },
    sidebarSubItemTextActive: {
      color: isDarkMode ? '#FFC107' : '#0D1C28',
      fontWeight: '700',
    },
    miniBadgeCount: {
      backgroundColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
      color: isDarkMode ? '#FFFFFF' : '#0F172A',
      fontSize: 10,
      fontWeight: '700',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    sidebarFooter: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#142535' : '#E2E8F0',
    },
    adminUserCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 8,
      backgroundColor: isDarkMode ? '#112332' : '#F8FAFC',
      borderRadius: 8,
    },
    adminAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FFC107',
      alignItems: 'center',
      justifyContent: 'center',
    },
    adminUserName: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    adminUserRole: {
      fontSize: 10,
      color: theme.textMuted,
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10B981',
    },

    // 2. Main Canvas & TopBar
    mainCanvas: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    topBarDesktop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: isDarkMode ? '#0D1C28' : '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#142535' : '#E2E8F0',
      gap: 16,
    },
    pageHeadingTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    pageHeadingSub: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    topBarControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDarkMode ? '#112332' : '#F1F5F9',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      width: 220,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    searchInput: {
      fontSize: 12,
      color: theme.text,
      flex: 1,
      padding: 0,
    },
    zoneSelectorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDarkMode ? '#112332' : '#F1F5F9',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    zoneSelectorLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    zoneSelectorBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    zoneSelectorValue: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.text,
      maxWidth: 160,
    },
    dropdownModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    zoneDropdownCard: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      ...(Platform.OS === 'web' ? ({
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
      } as any) : {
        elevation: 8,
      }),
    },
    zoneDropdownHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    zoneDropdownIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FFC107',
      alignItems: 'center',
      justifyContent: 'center',
    },
    zoneDropdownTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.text,
    },
    zoneDropdownSub: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    zoneDropdownDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    zoneDropdownOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    zoneDropdownOptionSelected: {
      borderColor: '#FFC107',
    },
    zoneOptionRadio: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: theme.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    zoneOptionRadioSelected: {
      borderColor: '#FFC107',
    },
    zoneOptionRadioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FFC107',
    },
    zoneOptionName: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    zoneOptionMeta: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
      lineHeight: 14,
    },
    manageZonesBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#132435' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#1E354B' : '#E2E8F0',
      marginTop: 4,
    },
    manageZonesBtnText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFC107',
    },
    actionIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#112332' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    notifBadge: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
      position: 'absolute',
      top: 6,
      right: 6,
    },
    primaryActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FFC107',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 8,
    },
    primaryActionButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#0D1C28',
    },

    // 3. Scroll Content Area
    canvasScroll: {
      padding: 24,
      gap: 20,
    },

    // 4. Stats Cards & KPI Grids
    statsCardGrid: {
      flexDirection: 'row',
      gap: 16,
    },
    statStatusCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      justifyContent: 'space-between',
      minHeight: 100,
    },
    statStatusTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statStatusValue: {
      fontSize: 26,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    statStatusIconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statStatusLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
      marginTop: 8,
    },
    statStatusHint: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.85)',
      marginTop: 2,
    },

    operationalGrid: {
      flexDirection: 'row',
      gap: 16,
    },
    opCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      backgroundColor: isDarkMode ? '#112332' : '#FFFFFF',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    opCardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    opCardCount: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    opCardTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      marginTop: 2,
    },
    opCardSub: {
      fontSize: 10,
      color: theme.textMuted,
    },

    financialRow: {
      flexDirection: 'row',
      gap: 16,
    },
    finCard: {
      flex: 1,
      padding: 16,
      backgroundColor: isDarkMode ? '#112332' : '#FFFFFF',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    finLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    finValue: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      marginTop: 4,
    },
    finSub: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 4,
    },

    twoColumnGrid: {
      flexDirection: 'row',
      gap: 20,
    },
    panelBox: {
      flex: 1,
      backgroundColor: isDarkMode ? '#112332' : '#FFFFFF',
      borderRadius: 12,
      padding: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    panelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1A2C3D' : '#F1F5F9',
    },
    panelTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    topItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
    },
    rankBadge: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFC107',
      width: 24,
    },
    topItemImage: {
      width: 36,
      height: 36,
      borderRadius: 6,
      backgroundColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    topItemTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    topItemSub: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDarkMode ? '#1A2C3D' : '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    ratingText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDarkMode ? '#FFFFFF' : '#92400E',
    },
    prodPriceTag: {
      fontSize: 13,
      fontWeight: '800',
      color: '#10B981',
    },

    // 5. Section Table & Row Cards
    sectionBox: {
      backgroundColor: isDarkMode ? '#112332' : '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: isDarkMode ? '#1A2C3D' : '#F1F5F9',
    },
    filterChipActive: {
      backgroundColor: '#FFC107',
    },
    filterChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    filterChipTextActive: {
      color: '#0D1C28',
      fontWeight: '700',
    },
    rowCardWide: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC',
      padding: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
      gap: 16,
    },
    orderIdBadge: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFC107',
      backgroundColor: isDarkMode ? '#1A2C3D' : '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    orderTimeText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    rowTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      marginTop: 4,
    },
    rowSub: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    rowLabel: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    rowValue: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.text,
      marginTop: 2,
    },
    rowComm: {
      fontSize: 10,
      fontWeight: '600',
      color: '#10B981',
      marginTop: 2,
    },
    statusPill: {
      alignSelf: 'flex-start',
      backgroundColor: isDarkMode ? '#1A2C3D' : '#EEF2F6',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      marginTop: 3,
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
    },
    paymentMethodSub: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 4,
    },
    statusActionBtn: {
      backgroundColor: '#FFC107',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
    },
    statusActionText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#0D1C28',
    },
    suppLogoSquare: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    prodImageSquare: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    returnableTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    returnableTagText: {
      fontSize: 10,
      color: '#10B981',
      fontWeight: '600',
    },
    commissionRateText: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFC107',
      marginTop: 2,
    },
    creditValueLarge: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFC107',
      marginTop: 2,
    },
    editBtnSmall: {
      backgroundColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginTop: 4,
    },
    editBtnSmallText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.text,
    },
    toggleStatusBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: isDarkMode ? '#1A2C3D' : '#F1F5F9',
    },
    toggleStatusBtnText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    pillActive: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    pillGreen: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    pillYellow: {
      backgroundColor: 'rgba(255, 193, 7, 0.15)',
    },
    pillText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.text,
    },
    driverAvatarCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFC107',
      alignItems: 'center',
      justifyContent: 'center',
    },
    driverStatusText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
      marginTop: 4,
    },
    envKeysList: {
      fontSize: 10,
      color: '#38BDF8',
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginTop: 2,
    },

    // 6. Modais de Formulário
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 520,
      backgroundColor: isDarkMode ? '#112332' : '#FFFFFF',
      borderRadius: 14,
      padding: 24,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textSecondary,
      marginTop: 10,
      marginBottom: 4,
    },
    modalInput: {
      backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDarkMode ? '#1A2C3D' : '#CBD5E1',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: theme.text,
    },
    modalFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#1A2C3D' : '#E2E8F0',
    },
    cancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 6,
    },
    cancelBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
    },
    saveBtn: {
      backgroundColor: '#FFC107',
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 8,
    },
    saveBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#0D1C28',
    },
    metricsGrid: {
      flexDirection: 'row',
      gap: 14,
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    metricCard: {
      flex: 1,
      minWidth: 220,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: 'bold',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metricValue: {
      fontSize: 26,
      fontWeight: 'bold',
      marginVertical: 4,
    },
    metricSub: {
      fontSize: 11,
      color: theme.textMuted,
    },
  });
}
