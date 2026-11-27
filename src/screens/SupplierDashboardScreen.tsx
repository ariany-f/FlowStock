import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  Image, 
  Alert, 
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { BeverageProduct, ReturnableBottleBalance, DeliveryVehicle } from '../types';
import { BrandLogo } from '../components/BrandLogo';
import { getProductImage } from '../utils/productImages';

type SupplierTab = 
  | 'metrics' 
  | 'orders' 
  | 'catalog' 
  | 'bottles' 
  | 'fleet' 
  | 'rules' 
  | 'company' 
  | 'bank' 
  | 'support';

export const SupplierDashboardScreen: React.FC = () => {
  const { 
    currentUser, 
    suppliers, 
    orders, 
    updateOrderStatus, 
    products, 
    addProduct,
    updateProduct,
    deleteProduct,
    updateSupplier
  } = useApp();

  const currentSupplier = suppliers.find(s => s.ownerId === currentUser?.id) || suppliers[0];
  const supplierOrders = orders.filter(o => o.supplierId === currentSupplier?.id);
  const supplierProducts = products.filter(p => p.supplierId === currentSupplier?.id);

  const getInitialTab = (): SupplierTab => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as SupplierTab;
      const validTabs: SupplierTab[] = ['metrics', 'orders', 'catalog', 'bottles', 'fleet', 'rules', 'company', 'bank', 'support'];
      if (tabParam && validTabs.includes(tabParam)) {
        return tabParam;
      }
    }
    return 'metrics';
  };

  const [activeTab, setActiveTabState] = useState<SupplierTab>(getInitialTab);

  const setActiveTab = (tab: SupplierTab) => {
    setActiveTabState(tab);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('app', 'supplier');
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('app') === 'supplier') {
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    }
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as SupplierTab;
      const validTabs: SupplierTab[] = ['metrics', 'orders', 'catalog', 'bottles', 'fleet', 'rules', 'company', 'bank', 'support'];
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTabState(tabParam);
      }
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [activeTab]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'preparing' | 'in_transit' | 'delivered'>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('todas');

  // Modais de Catálogo
  const [showAddProd, setShowAddProd] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BeverageProduct | null>(null);

  // Form de novo produto
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'cervejas' | 'chopp_barris' | 'destilados'>('cervejas');
  const [newProdIsReturnable, setNewProdIsReturnable] = useState(false);
  const [newProdStock, setNewProdStock] = useState('150');
  const [newProdMinUnits, setNewProdMinUnits] = useState('1');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBatch, setNewProdBatch] = useState('');
  const [newProdExpiration, setNewProdExpiration] = useState('');

  // Form de edição de produto
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editIsReturnable, setEditIsReturnable] = useState(false);
  const [editSku, setEditSku] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editExpiration, setEditExpiration] = useState('');

  // -------------------------------------------------------------------------
  // MOCK DE CASCOS & VASILHAMES RETORNÁVEIS
  // -------------------------------------------------------------------------
  const [bottleBalances, setBottleBalances] = useState<ReturnableBottleBalance[]>([
    {
      id: 'bot_1',
      supplierId: currentSupplier.id,
      barId: 'bar_1',
      barName: 'Boteco do Carlos - Vila Madalena',
      bottleType: 'engradado_600ml',
      quantityInCustody: 28,
      lastExchangeDate: '26/11/2026',
      pendingReturn: 14,
    },
    {
      id: 'bot_2',
      supplierId: currentSupplier.id,
      barId: 'bar_1',
      barName: 'Boteco do Carlos - Vila Madalena',
      bottleType: 'barril_chopp_50L',
      quantityInCustody: 4,
      lastExchangeDate: '25/11/2026',
      pendingReturn: 2,
    },
    {
      id: 'bot_3',
      supplierId: currentSupplier.id,
      barId: 'bar_2',
      barName: 'Armazém Central 77',
      bottleType: 'engradado_600ml',
      quantityInCustody: 42,
      lastExchangeDate: '24/11/2026',
      pendingReturn: 30,
    },
    {
      id: 'bot_4',
      supplierId: currentSupplier.id,
      barId: 'bar_2',
      barName: 'Armazém Central 77',
      bottleType: 'barril_chopp_50L',
      quantityInCustody: 6,
      lastExchangeDate: '22/11/2026',
      pendingReturn: 3,
    },
  ]);
  const [showAddBottleModal, setShowAddBottleModal] = useState(false);
  const [newBottleBarName, setNewBottleBarName] = useState('');
  const [newBottleType, setNewBottleType] = useState<'engradado_600ml' | 'barril_chopp_50L' | 'barril_chopp_30L' | 'engradado_litrao'>('engradado_600ml');
  const [newBottleQty, setNewBottleQty] = useState('10');

  // -------------------------------------------------------------------------
  // MOCK DE FROTA & MOTORISTAS
  // -------------------------------------------------------------------------
  const [vehicles, setVehicles] = useState<DeliveryVehicle[]>([
    {
      id: 'veh_1',
      supplierId: currentSupplier.id,
      plate: 'BRA-2E19',
      model: 'Mercedes-Benz Accelo 1016 (Baú Cervejeiro)',
      capacityPallets: 8,
      capacityCrates: 240,
      driverName: 'Marcos Vinícius Silva',
      driverPhone: '(11) 98711-2233',
      status: 'in_route',
    },
    {
      id: 'veh_2',
      supplierId: currentSupplier.id,
      plate: 'FSX-4B22',
      model: 'Volkswagen Delivery 11.180 (Sider Carga)',
      capacityPallets: 10,
      capacityCrates: 320,
      driverName: 'Roberto Santos de Oliveira',
      driverPhone: '(11) 97655-4411',
      status: 'available',
    },
    {
      id: 'veh_3',
      supplierId: currentSupplier.id,
      plate: 'GHT-9K44',
      model: 'Iveco Daily 35-150 VUC (Entregas Expressas)',
      capacityPallets: 4,
      capacityCrates: 110,
      driverName: 'Carlos Eduardo Mendes',
      driverPhone: '(11) 99123-5588',
      status: 'available',
    },
  ]);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [newVehPlate, setNewVehPlate] = useState('');
  const [newVehModel, setNewVehModel] = useState('');
  const [newVehDriver, setNewVehDriver] = useState('');
  const [newVehPhone, setNewVehPhone] = useState('');
  const [newVehCapacity, setNewVehCapacity] = useState('200');

  // Modal para despachar pedido com caminhão
  const [dispatchingOrder, setDispatchingOrder] = useState<any | null>(null);
  const [selectedVehicleForDispatch, setSelectedVehicleForDispatch] = useState<string>(vehicles[0]?.id || '');

  // -------------------------------------------------------------------------
  // CONFIGURAÇÕES COMERCIAIS & LOGÍSTICA
  // -------------------------------------------------------------------------
  const [minOrderInput, setMinOrderInput] = useState(currentSupplier.minOrderValue.toString());
  const [deliveryFeeInput, setDeliveryFeeInput] = useState(currentSupplier.deliveryFee.toString());
  const [freeDeliveryInput, setFreeDeliveryInput] = useState((currentSupplier.freeDeliveryThreshold || 0).toString());
  const [deliveryTimeInput, setDeliveryTimeInput] = useState(currentSupplier.deliveryTimeEstimate || 'Hoje até 18h');
  const [cutOffTimeInput, setCutOffTimeInput] = useState(currentSupplier.cutOffTime || '15:00');
  const [maxRadiusInput, setMaxRadiusInput] = useState((currentSupplier.maxDeliveryRadiusKm || 50).toString());
  const [operatingHoursInput, setOperatingHoursInput] = useState(currentSupplier.operatingHours || 'Segunda a Sexta 07:00 às 18:00 • Sábado 07:00 às 13:00');
  const [isOpenForOrders, setIsOpenForOrders] = useState(currentSupplier.isOpenForOrders ?? true);
  const [acceptedPix, setAcceptedPix] = useState(currentSupplier.acceptedPaymentMethods?.includes('pix') ?? true);
  const [acceptedBoleto, setAcceptedBoleto] = useState(currentSupplier.acceptedPaymentMethods?.includes('boleto_faturado') ?? true);
  const [acceptedCard, setAcceptedCard] = useState(currentSupplier.acceptedPaymentMethods?.includes('credit_card') ?? true);

  // -------------------------------------------------------------------------
  // DADOS CADASTRAIS DA DISTRIBUIDORA
  // -------------------------------------------------------------------------
  const [companyTradeName, setCompanyTradeName] = useState(currentSupplier.tradeName);
  const [companyCorporateName, setCompanyCorporateName] = useState(currentSupplier.corporateName);
  const [companyCnpj, setCompanyCnpj] = useState(currentSupplier.cnpj);
  const [companyIe, setCompanyIe] = useState(currentSupplier.stateRegistration || '114.589.632.110');
  const [companyPhone, setCompanyPhone] = useState(currentSupplier.phone);
  const [companyEmail, setCompanyEmail] = useState(currentSupplier.email);
  const [companyAddress, setCompanyAddress] = useState(currentSupplier.address);
  const [companyCity, setCompanyCity] = useState(currentSupplier.city);
  const [companyState, setCompanyState] = useState(currentSupplier.state);

  // -------------------------------------------------------------------------
  // DADOS BANCÁRIOS & PIX
  // -------------------------------------------------------------------------
  const [bankPixKey, setBankPixKey] = useState(currentSupplier.bankPixKey || 'financeiro@ambevcentral.com.br');
  const [bankName, setBankName] = useState(currentSupplier.bankName || 'Banco Itaú S.A. (341)');
  const [bankAgency, setBankAgency] = useState(currentSupplier.bankAgency || '0955');
  const [bankAccount, setBankAccount] = useState(currentSupplier.bankAccount || '45210-9');

  // Métricas Consolidadas
  const totalRevenue = supplierOrders.reduce((acc, o) => acc + o.total, 0);
  const commissionRate = currentSupplier.commissionRate || 5.0;
  const platformFee = totalRevenue * (commissionRate / 100);
  const netEarnings = totalRevenue - platformFee;
  const pendingOrdersCount = supplierOrders.filter(o => o.status === 'preparing' || o.status === 'pending_payment').length;
  const inTransitOrdersCount = supplierOrders.filter(o => o.status === 'in_transit').length;
  const deliveredOrdersCount = supplierOrders.filter(o => o.status === 'delivered').length;
  const totalCratesInCustody = bottleBalances.reduce((acc, b) => acc + (b.bottleType.includes('engradado') ? b.quantityInCustody : 0), 0);
  const totalKegsInCustody = bottleBalances.reduce((acc, b) => acc + (b.bottleType.includes('barril') ? b.quantityInCustody : 0), 0);

  // -------------------------------------------------------------------------
  // HANDLERS DE PRODUTOS
  // -------------------------------------------------------------------------
  const handleCreateProduct = () => {
    if (!newProdName.trim() || !newProdPrice.trim()) {
      Alert.alert('Dados Incompletos', 'Informe o Nome da Bebida e o Preço de Atacado.');
      return;
    }

    const price = parseFloat(newProdPrice.replace(',', '.'));
    if (isNaN(price)) {
      Alert.alert('Valor Inválido', 'Digite um preço numérico válido.');
      return;
    }

    const origPrice = parseFloat(newProdOriginalPrice.replace(',', '.'));

    addProduct({
      supplierId: currentSupplier.id,
      supplierName: currentSupplier.tradeName,
      name: newProdName.trim(),
      brand: newProdBrand.trim() || 'Cervejaria Parceira',
      description: 'Lote oficial de fábrica direto para bares e restaurantes credenciados.',
      category: newProdCategory,
      unit: newProdUnit.trim() || 'Caixa com 24 unidades',
      packageDetails: newProdUnit.trim() || 'Embalagem B2B',
      price,
      originalPrice: !isNaN(origPrice) && origPrice > price ? origPrice : undefined,
      stock: parseInt(newProdStock) || 100,
      isReturnableBottle: newProdIsReturnable,
      imageUrl: 'https://images.unsplash.com/photo-1608270192802-7936a282f6e5?auto=format&fit=crop&w=500&q=80',
      minOrderUnits: parseInt(newProdMinUnits) || 1,
      sku: newProdSku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      batchNumber: newProdBatch.trim() || 'LOTE-2026/A',
      expirationDate: newProdExpiration.trim() || '12/2026',
      isPaused: false,
    });

    Alert.alert('Sucesso', 'Bebida cadastrada com sucesso no catálogo!');
    setNewProdName('');
    setNewProdBrand('');
    setNewProdUnit('');
    setNewProdPrice('');
    setNewProdOriginalPrice('');
    setNewProdSku('');
    setNewProdBatch('');
    setNewProdExpiration('');
    setShowAddProd(false);
  };

  const handleStartEditProduct = (prod: BeverageProduct) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditBrand(prod.brand);
    setEditPrice(prod.price.toString());
    setEditStock(prod.stock.toString());
    setEditUnit(prod.unit);
    setEditIsReturnable(prod.isReturnableBottle);
    setEditSku(prod.sku || '');
    setEditBatch(prod.batchNumber || '');
    setEditExpiration(prod.expirationDate || '');
  };

  const handleSaveProductEdit = () => {
    if (!editingProduct) return;
    const price = parseFloat(editPrice.replace(',', '.'));
    if (isNaN(price)) {
      Alert.alert('Preço Inválido', 'Insira um valor numérico para o preço.');
      return;
    }

    updateProduct(editingProduct.id, {
      name: editName.trim(),
      brand: editBrand.trim(),
      price,
      stock: parseInt(editStock) || 0,
      unit: editUnit.trim(),
      packageDetails: editUnit.trim(),
      isReturnableBottle: editIsReturnable,
      sku: editSku.trim(),
      batchNumber: editBatch.trim(),
      expirationDate: editExpiration.trim(),
    });

    Alert.alert('Produto Atualizado', 'As alterações foram salvas com sucesso no catálogo!');
    setEditingProduct(null);
  };

  const handleToggleProductPaused = (prod: BeverageProduct) => {
    const nextPaused = !prod.isPaused;
    updateProduct(prod.id, { isPaused: nextPaused });
    Alert.alert(
      nextPaused ? 'Bebida Pausada' : 'Bebida Reativada',
      nextPaused ? `${prod.name} não aparecerá para compra até ser reativada.` : `${prod.name} está ativa para pedidos dos bares.`
    );
  };

  const handleDeleteProduct = (prod: BeverageProduct) => {
    Alert.alert(
      'Excluir Bebida',
      `Tem certeza que deseja remover ${prod.name} do catálogo da distribuidora?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            deleteProduct(prod.id);
            Alert.alert('Removido', 'Produto excluído do catálogo.');
          }
        }
      ]
    );
  };

  const handleQuickStockChange = (prod: BeverageProduct, delta: number) => {
    const nextStock = Math.max(0, prod.stock + delta);
    updateProduct(prod.id, { stock: nextStock });
  };

  // -------------------------------------------------------------------------
  // HANDLER DE SALVAR REGRAS COMERCIAIS
  // -------------------------------------------------------------------------
  const handleSaveCommercialRules = () => {
    const minOrder = parseFloat(minOrderInput.replace(',', '.'));
    const deliveryFee = parseFloat(deliveryFeeInput.replace(',', '.'));
    const freeDelivery = parseFloat(freeDeliveryInput.replace(',', '.'));
    const maxRadius = parseFloat(maxRadiusInput.replace(',', '.'));

    const acceptedMethods: ('pix' | 'boleto_faturado' | 'credit_card')[] = [];
    if (acceptedPix) acceptedMethods.push('pix');
    if (acceptedBoleto) acceptedMethods.push('boleto_faturado');
    if (acceptedCard) acceptedMethods.push('credit_card');

    if (acceptedMethods.length === 0) {
      Alert.alert('Aviso', 'Habilite pelo menos uma forma de pagamento para os bares.');
      return;
    }

    updateSupplier(currentSupplier.id, {
      minOrderValue: isNaN(minOrder) ? currentSupplier.minOrderValue : minOrder,
      deliveryFee: isNaN(deliveryFee) ? 0 : deliveryFee,
      freeDeliveryThreshold: isNaN(freeDelivery) ? undefined : freeDelivery,
      deliveryTimeEstimate: deliveryTimeInput.trim() || currentSupplier.deliveryTimeEstimate,
      cutOffTime: cutOffTimeInput.trim(),
      maxDeliveryRadiusKm: isNaN(maxRadius) ? 50 : maxRadius,
      operatingHours: operatingHoursInput.trim(),
      isOpenForOrders,
      acceptedPaymentMethods: acceptedMethods,
    });

    Alert.alert('Regras Atualizadas', 'As regras comerciais e de logística da distribuidora foram salvas com sucesso!');
  };

  // -------------------------------------------------------------------------
  // HANDLER DE SALVAR DADOS DA EMPRESA
  // -------------------------------------------------------------------------
  const handleSaveCompanyData = () => {
    updateSupplier(currentSupplier.id, {
      tradeName: companyTradeName.trim(),
      corporateName: companyCorporateName.trim(),
      cnpj: companyCnpj.trim(),
      phone: companyPhone.trim(),
      email: companyEmail.trim(),
      address: companyAddress.trim(),
      city: companyCity.trim(),
      state: companyState.trim(),
      stateRegistration: companyIe.trim(),
    });

    Alert.alert('Dados Salvos', 'As informações cadastrais do Centro de Distribuição foram atualizadas!');
  };

  // -------------------------------------------------------------------------
  // HANDLER DE SALVAR DADOS BANCÁRIOS
  // -------------------------------------------------------------------------
  const handleSaveBankData = () => {
    if (!bankPixKey.trim()) {
      Alert.alert('Atenção', 'Informe a Chave Pix da empresa para repasses.');
      return;
    }

    updateSupplier(currentSupplier.id, {
      bankPixKey: bankPixKey.trim(),
      bankName: bankName.trim(),
      bankAgency: bankAgency.trim(),
      bankAccount: bankAccount.trim(),
    });

    Alert.alert('Dados Bancários Salvos', 'Configurações de recebimento Pix e bancário atualizadas com sucesso!');
  };

  // -------------------------------------------------------------------------
  // HANDLER DE CASCOS E VASILHAMES
  // -------------------------------------------------------------------------
  const handleReturnBottles = (balanceId: string) => {
    setBottleBalances(prev => prev.map(b => {
      if (b.id === balanceId && b.pendingReturn > 0) {
        return {
          ...b,
          quantityInCustody: Math.max(0, b.quantityInCustody - b.pendingReturn),
          pendingReturn: 0,
          lastExchangeDate: 'Hoje',
        };
      }
      return b;
    }));
    Alert.alert('Devolução Confirmada', 'Baixa de vasilhames vazios registrada e saldo do bar atualizado no galpão!');
  };

  const handleAddBottleBalance = () => {
    if (!newBottleBarName.trim()) {
      Alert.alert('Nome do Bar', 'Informe o nome do estabelecimento.');
      return;
    }

    const qty = parseInt(newBottleQty) || 10;
    const newEntry: ReturnableBottleBalance = {
      id: `bot_${Date.now()}`,
      supplierId: currentSupplier.id,
      barId: `bar_${Date.now()}`,
      barName: newBottleBarName.trim(),
      bottleType: newBottleType,
      quantityInCustody: qty,
      lastExchangeDate: 'Hoje',
      pendingReturn: 0,
    };

    setBottleBalances(prev => [newEntry, ...prev]);
    setShowAddBottleModal(false);
    setNewBottleBarName('');
    setNewBottleQty('10');
    Alert.alert('Lançamento Concluído', 'Novo saldo de comodato registrado com sucesso.');
  };

  // -------------------------------------------------------------------------
  // HANDLER DE FROTA
  // -------------------------------------------------------------------------
  const handleAddVehicle = () => {
    if (!newVehPlate.trim() || !newVehModel.trim() || !newVehDriver.trim()) {
      Alert.alert('Dados Incompletos', 'Informe Placa, Modelo e Nome do Motorista.');
      return;
    }

    const newVeh: DeliveryVehicle = {
      id: `veh_${Date.now()}`,
      supplierId: currentSupplier.id,
      plate: newVehPlate.trim().toUpperCase(),
      model: newVehModel.trim(),
      capacityPallets: 8,
      capacityCrates: parseInt(newVehCapacity) || 200,
      driverName: newVehDriver.trim(),
      driverPhone: newVehPhone.trim() || '(11) 90000-0000',
      status: 'available',
    };

    setVehicles(prev => [newVeh, ...prev]);
    setShowAddVehicleModal(false);
    setNewVehPlate('');
    setNewVehModel('');
    setNewVehDriver('');
    setNewVehPhone('');
    Alert.alert('Veículo Cadastrado', 'Novo caminhão adicionado à frota da distribuidora!');
  };

  const handleDispatchOrderWithVehicle = () => {
    if (!dispatchingOrder) return;
    const vehicle = vehicles.find(v => v.id === selectedVehicleForDispatch) || vehicles[0];
    
    // Atualiza status do veículo para em rota
    setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: 'in_route' } : v));
    
    // Avança status do pedido para in_transit
    updateOrderStatus(dispatchingOrder.id, 'in_transit');
    
    Alert.alert(
      'Caminhão Despachado!',
      `O pedido ${dispatchingOrder.id} saiu em rota com o caminhão ${vehicle.plate} (${vehicle.driverName}).`
    );
    setDispatchingOrder(null);
  };

  const advanceOrderStatus = (order: any) => {
    if (order.status === 'confirmed' || order.status === 'pending_payment') {
      updateOrderStatus(order.id, 'preparing');
    } else if (order.status === 'preparing') {
      // Abre modal para escolher veículo e motorista da frota
      setDispatchingOrder(order);
    } else if (order.status === 'in_transit') {
      updateOrderStatus(order.id, 'delivered');
      Alert.alert('Entrega Concluída', `Pedido ${order.id} entregue e conferido no estabelecimento.`);
    }
  };

  // Filtragens
  const filteredOrders = supplierOrders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const filteredProducts = supplierProducts.filter(p => {
    if (catalogCategoryFilter !== 'todas' && p.category !== catalogCategoryFilter) {
      return false;
    }
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || 
           p.brand.toLowerCase().includes(q) ||
           (p.sku && p.sku.toLowerCase().includes(q));
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.desktopLayout}>
        {/* =================================================================== */}
        {/* SIDEBAR DESKTOP PROFISSIONAL COM TODAS AS 9 ABAS DE CONTROLE        */}
        {/* =================================================================== */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarBrand}>
            <BrandLogo size="md" variant="dark" showPhrase={true} />
          </View>

          {/* Card do Fornecedor na Sidebar */}
          <View style={styles.supplierCardMini}>
            <Image source={{ uri: currentSupplier.logoUrl }} style={styles.suppLogoMini} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.suppNameMini} numberOfLines={1}>{currentSupplier.tradeName}</Text>
              <Text style={styles.suppCnpjMini}>CNPJ: {currentSupplier.cnpj}</Text>
            </View>
          </View>

          {/* Menus de Navegação Lateral Desktop Completo */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.navScroll}>
            <View style={styles.navGroup}>
              {/* 1. Visão Geral */}
              <TouchableOpacity 
                style={[styles.navBtn, activeTab === 'metrics' && styles.navBtnActive]}
                onPress={() => setActiveTab('metrics')}
                activeOpacity={0.8}
              >
                <Ionicons name="bar-chart" size={17} color={activeTab === 'metrics' ? '#0D1C28' : '#8FA0AF'} />
                <Text style={[styles.navBtnText, activeTab === 'metrics' && styles.navBtnTextActive]}>
                  Visão Geral & KPIs
                </Text>
              </TouchableOpacity>

              {/* 2. Gestão de Pedidos */}
              <TouchableOpacity 
                style={[styles.navBtn, activeTab === 'orders' && styles.navBtnActive]}
                onPress={() => setActiveTab('orders')}
                activeOpacity={0.8}
              >
                <Ionicons name="cube" size={17} color={activeTab === 'orders' ? '#0D1C28' : '#8FA0AF'} />
                <Text style={[styles.navBtnText, activeTab === 'orders' && styles.navBtnTextActive]}>
                  Fila de Pedidos
                </Text>
                {pendingOrdersCount > 0 && (
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{pendingOrdersCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* 3. Catálogo & Estoque */}
              <TouchableOpacity 
                style={[styles.navBtn, activeTab === 'catalog' && styles.navBtnActive]}
                onPress={() => setActiveTab('catalog')}
                activeOpacity={0.8}
              >
                <Ionicons name="beer" size={17} color={activeTab === 'catalog' ? '#0D1C28' : '#8FA0AF'} />
                <Text style={[styles.navBtnText, activeTab === 'catalog' && styles.navBtnTextActive]}>
                  Catálogo & Estoque
                </Text>
                <Text style={styles.catalogCountTag}>{supplierProducts.length}</Text>
              </TouchableOpacity>

              {/* 4. Cascos & Vasilhames Retornáveis */}
              <TouchableOpacity 
                style={[styles.navBtn, activeTab === 'bottles' && styles.navBtnActive]}
                onPress={() => setActiveTab('bottles')}
                activeOpacity={0.8}
              >
                <Ionicons name="repeat" size={17} color={activeTab === 'bottles' ? '#0D1C28' : '#8FA0AF'} />
                <Text style={[styles.navBtnText, activeTab === 'bottles' && styles.navBtnTextActive]}>
                  Cascos & Vasilhames
                </Text>
                <View style={styles.pillBadgeGold}>
                  <Text style={styles.pillBadgeGoldText}>{totalCratesInCustody + totalKegsInCustody}</Text>
                </View>
              </TouchableOpacity>

              {/* 5. Frota & Motoristas */}
              <TouchableOpacity 
                style={[styles.navBtn, activeTab === 'fleet' && styles.navBtnActive]}
                onPress={() => setActiveTab('fleet')}
                activeOpacity={0.8}
              >
                <Ionicons name="car" size={17} color={activeTab === 'fleet' ? '#0D1C28' : '#8FA0AF'} />
                <Text style={[styles.navBtnText, activeTab === 'fleet' && styles.navBtnTextActive]}>
                  Frota & Motoristas
                </Text>
                <Text style={styles.catalogCountTag}>{vehicles.length}</Text>
              </TouchableOpacity>

              {/* 6. Regras Comerciais & Logística */}
              <TouchableOpacity 
                style={[styles.navBtn, activeTab === 'rules' && styles.navBtnActive]}
                onPress={() => setActiveTab('rules')}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={17} color={activeTab === 'rules' ? '#0D1C28' : '#8FA0AF'} />
                <Text style={[styles.navBtnText, activeTab === 'rules' && styles.navBtnTextActive]}>
                  Regras & Logística
                </Text>
              </TouchableOpacity>

              {/* 7. Dados Cadastrais & Doca */}
              <TouchableOpacity 
                style={[styles.navBtn, activeTab === 'company' && styles.navBtnActive]}
                onPress={() => setActiveTab('company')}
                activeOpacity={0.8}
              >
                <Ionicons name="business" size={17} color={activeTab === 'company' ? '#0D1C28' : '#8FA0AF'} />
                <Text style={[styles.navBtnText, activeTab === 'company' && styles.navBtnTextActive]}>
                  Perfil & Doca CD
                </Text>
              </TouchableOpacity>

              {/* 8. Dados Bancários & Pix */}
              <TouchableOpacity 
                style={[styles.navBtn, activeTab === 'bank' && styles.navBtnActive]}
                onPress={() => setActiveTab('bank')}
                activeOpacity={0.8}
              >
                <Ionicons name="card" size={17} color={activeTab === 'bank' ? '#0D1C28' : '#8FA0AF'} />
                <Text style={[styles.navBtnText, activeTab === 'bank' && styles.navBtnTextActive]}>
                  Financeiro & Pix
                </Text>
              </TouchableOpacity>

              {/* 9. Televendas & Suporte */}
              <TouchableOpacity 
                style={[styles.navBtn, activeTab === 'support' && styles.navBtnActive]}
                onPress={() => setActiveTab('support')}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-whatsapp" size={17} color={activeTab === 'support' ? '#0D1C28' : '#8FA0AF'} />
                <Text style={[styles.navBtnText, activeTab === 'support' && styles.navBtnTextActive]}>
                  Televendas & Suporte
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Rodapé da Sidebar */}
          <View style={styles.sidebarFooter}>
            <TouchableOpacity 
              style={styles.switchHubBtn}
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.location.assign('?app=portal');
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="grid-outline" size={16} color="#FFC107" />
              <Text style={styles.switchHubText}>Hub Central de Acessos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================================== */}
        {/* ÁREA DE CONTEÚDO PRINCIPAL (DESKTOP WIDE CANVAS)                    */}
        {/* =================================================================== */}
        <View style={styles.mainCanvas}>
          {/* Top Bar Desktop */}
          <View style={styles.topBarDesktop}>
            <View>
              <Text style={styles.pageHeadingTitle}>
                {activeTab === 'metrics' && 'Painel de Desempenho & Vendas B2B'}
                {activeTab === 'orders' && 'Fila de Pedidos & Expedição de Cargas'}
                {activeTab === 'catalog' && 'Estoque & Catálogo Geral de Bebidas'}
                {activeTab === 'bottles' && 'Controle de Cascos & Vasilhames Retornáveis'}
                {activeTab === 'fleet' && 'Gestão de Frota & Motoristas de Rota'}
                {activeTab === 'rules' && 'Políticas Comerciais, Frete & Pedido Mínimo'}
                {activeTab === 'company' && 'Dados Cadastrais & Centro de Distribuição'}
                {activeTab === 'bank' && 'Chaves Pix, Repasses & Conciliação'}
                {activeTab === 'support' && 'Canal Direto de Televendas & Suporte B2B'}
              </Text>
              <Text style={styles.pageHeadingSub}>
                Distribuidor Oficial credenciado • {currentSupplier.corporateName}
              </Text>
            </View>

            <View style={styles.topBarRightStatus}>
              <View style={[styles.statusOnlinePill, !isOpenForOrders && { borderColor: '#EF4444' }]}>
                <View style={[styles.statusDotGreen, !isOpenForOrders && { backgroundColor: '#EF4444' }]} />
                <Text style={styles.statusOnlineText}>
                  {isOpenForOrders ? 'Doca Aberta para Pedidos' : 'Doca Pausada para Inventário'}
                </Text>
              </View>
              <View style={styles.statusMinOrderPill}>
                <Text style={styles.statusMinOrderText}>
                  Pedido Mín: R$ {currentSupplier.minOrderValue.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.canvasScroll}>
            {/* CARDS DE KPIS / MÉTRICAS EXECUTIVAS EM TODAS AS VISÕES */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Faturamento Bruto</Text>
                <Text style={styles.kpiValue}>R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.kpiHint}>Total vendido para estabelecimentos</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Repasse Líquido</Text>
                <Text style={[styles.kpiValue, { color: '#34D399' }]}>
                  R$ {netEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.kpiHint}>Taxa FlowStock: {commissionRate}%</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Separação / Em Rota</Text>
                <Text style={[styles.kpiValue, { color: '#FFC107' }]}>{pendingOrdersCount} / {inTransitOrdersCount}</Text>
                <Text style={styles.kpiHint}>Cargas em movimentação</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Vasilhames em Comodato</Text>
                <Text style={[styles.kpiValue, { color: '#60A5FA' }]}>{totalCratesInCustody} cx • {totalKegsInCustody} bar</Text>
                <Text style={styles.kpiHint}>Cascos 600ml e barris 50L</Text>
              </View>
            </View>

            {/* =============================================================== */}
            {/* 1. ABA: VISÃO GERAL & MÉTRICAS                                  */}
            {/* =============================================================== */}
            {activeTab === 'metrics' && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>Desempenho Operacional de Entregas</Text>
                <Text style={styles.sectionSubtitle}>
                  Acompanhe a liquidação financeira de boletos e a pontualidade da frota
                </Text>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricDetailBox}>
                    <Ionicons name="checkmark-done-circle" size={28} color="#34D399" />
                    <Text style={styles.metricDetailNum}>{deliveredOrdersCount}</Text>
                    <Text style={styles.metricDetailLabel}>Entregas Concluídas no Mês</Text>
                  </View>

                  <View style={styles.metricDetailBox}>
                    <Ionicons name="time" size={28} color="#FFC107" />
                    <Text style={styles.metricDetailNum}>{currentSupplier.deliveryTimeEstimate}</Text>
                    <Text style={styles.metricDetailLabel}>SLA Médio de Descarregamento</Text>
                  </View>

                  <View style={styles.metricDetailBox}>
                    <Ionicons name="car" size={28} color="#60A5FA" />
                    <Text style={styles.metricDetailNum}>{vehicles.filter(v => v.status === 'available').length} / {vehicles.length}</Text>
                    <Text style={styles.metricDetailLabel}>Caminhões Prontos no Pátio</Text>
                  </View>

                  <View style={styles.metricDetailBox}>
                    <Ionicons name="star" size={28} color="#FFC107" />
                    <Text style={styles.metricDetailNum}>{currentSupplier.rating} ★</Text>
                    <Text style={styles.metricDetailLabel}>Avaliação dos Donos de Bares</Text>
                  </View>
                </View>
              </View>
            )}

            {/* =============================================================== */}
            {/* 2. ABA: GESTÃO DE PEDIDOS & ROMANEIOS                           */}
            {/* =============================================================== */}
            {(activeTab === 'metrics' || activeTab === 'orders') && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Fila de Pedidos & Separação de Cargas</Text>
                    <Text style={styles.sectionSubtitle}>
                      Monitore o status de descarregamento, liberação de caminhões e romaneio
                    </Text>
                  </View>

                  {/* Filtro de Status de Pedido */}
                  <View style={styles.filterPillsRow}>
                    {[
                      { key: 'all', label: `Todos (${supplierOrders.length})` },
                      { key: 'preparing', label: 'Em Separação' },
                      { key: 'in_transit', label: 'Caminhão em Rota' },
                      { key: 'delivered', label: 'Entregues' },
                    ].map(st => (
                      <TouchableOpacity
                        key={st.key}
                        style={[styles.pillBtn, orderStatusFilter === st.key && styles.pillBtnActive]}
                        onPress={() => setOrderStatusFilter(st.key as any)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.pillBtnText, orderStatusFilter === st.key && styles.pillBtnTextActive]}>
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {filteredOrders.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="receipt-outline" size={48} color="#627585" />
                    <Text style={styles.emptyTitle}>Nenhum pedido neste status</Text>
                  </View>
                ) : (
                  filteredOrders.map(order => (
                    <View key={order.id} style={styles.orderCardDesktop}>
                      <View style={styles.orderHeaderDesktop}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={styles.orderIdBadge}>{order.id}</Text>
                          <Text style={styles.orderBarTitle}>{order.barName}</Text>
                          <Text style={styles.orderPaymentTag}>
                            {order.paymentMethod === 'pix' ? '⚡ Pix' : (order.paymentMethod === 'boleto_faturado' ? '📄 Boleto 30d' : '💳 Cartão')}
                          </Text>
                        </View>

                        <View style={styles.statusPillBadge}>
                          <Text style={styles.statusPillBadgeText}>
                            {order.status === 'pending_payment' && 'Aguardando Pix'}
                            {order.status === 'confirmed' && 'Confirmado'}
                            {order.status === 'preparing' && 'Em Separação no Galpão'}
                            {order.status === 'in_transit' && 'Caminhão em Rota'}
                            {order.status === 'delivered' && 'Entregue no Bar'}
                          </Text>
                        </View>
                      </View>

                      {/* Informações de Endereço e Itens */}
                      <View style={styles.orderBodyDesktop}>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.orderAddressLabel}>Endereço de Descarga:</Text>
                          <Text style={styles.orderAddressText}>{order.barAddress}</Text>

                          {order.deliveryNotes ? (
                            <Text style={styles.orderNotesText}>
                              Obs de entrega: {order.deliveryNotes}
                            </Text>
                          ) : null}

                          {order.needsReturnableBottlesExchange && (
                            <View style={styles.exchangeNoticeRow}>
                              <Ionicons name="repeat" size={14} color="#FFC107" />
                              <Text style={styles.exchangeNoticeText}>Exige recolhimento de cascos vazios</Text>
                            </View>
                          )}
                        </View>

                        <View style={{ flex: 3, paddingLeft: 20 }}>
                          <Text style={styles.orderAddressLabel}>Romaneio de Bebidas:</Text>
                          {order.items.map((it, idx) => (
                            <Text key={idx} style={styles.orderItemLine}>
                              • {it.quantity}x {it.productName} ({it.unit})
                            </Text>
                          ))}
                        </View>

                        <View style={styles.orderTotalCol}>
                          <Text style={styles.orderAddressLabel}>Valor Faturado:</Text>
                          <Text style={styles.orderTotalValue}>
                            R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Text>

                          {order.status !== 'delivered' && (
                            <TouchableOpacity 
                              style={styles.advanceBtn}
                              onPress={() => advanceOrderStatus(order)}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.advanceBtnText}>
                                {order.status === 'confirmed' || order.status === 'pending_payment' ? 'Iniciar Separação' : ''}
                                {order.status === 'preparing' ? 'Despachar Caminhão' : ''}
                                {order.status === 'in_transit' ? 'Confirmar Entrega' : ''}
                              </Text>
                              <Ionicons name="arrow-forward" size={14} color="#0D1C28" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* =============================================================== */}
            {/* 3. ABA: CATÁLOGO & ESTOQUE COMPLETO                             */}
            {/* =============================================================== */}
            {activeTab === 'catalog' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Catálogo & Gestão de Estoque</Text>
                    <Text style={styles.sectionSubtitle}>
                      Preços de atacado, controle de lotes, validade e disponibilidade
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.addProdBtn}
                    onPress={() => setShowAddProd(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={18} color="#0D1C28" />
                    <Text style={styles.addProdBtnText}>Cadastrar Nova Bebida</Text>
                  </TouchableOpacity>
                </View>

                {/* Filtros e Busca */}
                <View style={styles.catalogSearchRow}>
                  <View style={styles.searchCatalogBox}>
                    <Ionicons name="search" size={18} color="#8FA0AF" />
                    <TextInput
                      style={styles.searchCatalogInput}
                      placeholder="Buscar por cerveja, marca ou código SKU..."
                      placeholderTextColor="#627585"
                      value={catalogSearch}
                      onChangeText={setCatalogSearch}
                    />
                  </View>

                  <View style={styles.catalogFilterRow}>
                    {[
                      { key: 'todas', label: 'Todas' },
                      { key: 'cervejas', label: 'Cervejas' },
                      { key: 'chopp_barris', label: 'Chopp 50L' },
                      { key: 'destilados', label: 'Destilados' },
                    ].map(cat => (
                      <TouchableOpacity
                        key={cat.key}
                        style={[styles.catFilterChip, catalogCategoryFilter === cat.key && styles.catFilterChipActive]}
                        onPress={() => setCatalogCategoryFilter(cat.key)}
                      >
                        <Text style={[styles.catFilterText, catalogCategoryFilter === cat.key && styles.catFilterTextActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Grid de Produtos com Ações Completas */}
                <View style={styles.productsGrid}>
                  {filteredProducts.map(prod => (
                    <View key={prod.id} style={[styles.productCardWide, prod.isPaused && styles.productCardPaused]}>
                      <Image source={getProductImage(prod)} style={styles.productImgWide} resizeMode="contain" />
                      
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.productBrandWide}>{prod.brand}</Text>
                          {prod.sku && <Text style={styles.skuTag}>SKU: {prod.sku}</Text>}
                          {prod.isPaused && (
                            <View style={styles.pausedBadge}>
                              <Text style={styles.pausedBadgeText}>PAUSADO</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.productNameWide}>{prod.name}</Text>
                        <Text style={styles.productUnitWide}>{prod.unit}</Text>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                          <Text style={styles.productPriceWide}>R$ {prod.price.toFixed(2)}</Text>
                          <Text style={styles.productStockWide}>Estoque: {prod.stock} un</Text>
                          {prod.isReturnableBottle && (
                            <View style={styles.retBadgePill}>
                              <Text style={styles.retBadgePillText}>Vasilhame Retornável</Text>
                            </View>
                          )}
                        </View>

                        {/* Botões de Ação Rápida */}
                        <View style={styles.prodActionRow}>
                          {/* Ajuste rápido de estoque */}
                          <View style={styles.quickStockBox}>
                            <Text style={styles.quickStockLabel}>Estoque rápido:</Text>
                            <TouchableOpacity 
                              style={styles.quickStockBtn}
                              onPress={() => handleQuickStockChange(prod, -10)}
                            >
                              <Text style={styles.quickStockBtnText}>-10</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.quickStockBtn}
                              onPress={() => handleQuickStockChange(prod, +10)}
                            >
                              <Text style={styles.quickStockBtnText}>+10</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            {/* Pausar / Reativar */}
                            <TouchableOpacity 
                              style={[styles.smallActionBtn, prod.isPaused ? styles.smallActionBtnActive : styles.smallActionBtnOutline]}
                              onPress={() => handleToggleProductPaused(prod)}
                            >
                              <Ionicons name={prod.isPaused ? "play" : "pause"} size={13} color={prod.isPaused ? "#0D1C28" : "#FFC107"} />
                              <Text style={[styles.smallActionBtnText, prod.isPaused && { color: '#0D1C28' }]}>
                                {prod.isPaused ? 'Reativar' : 'Pausar'}
                              </Text>
                            </TouchableOpacity>

                            {/* Editar */}
                            <TouchableOpacity 
                              style={styles.smallActionBtnOutline}
                              onPress={() => handleStartEditProduct(prod)}
                            >
                              <Ionicons name="pencil" size={13} color="#60A5FA" />
                              <Text style={[styles.smallActionBtnText, { color: '#60A5FA' }]}>Editar</Text>
                            </TouchableOpacity>

                            {/* Excluir */}
                            <TouchableOpacity 
                              style={styles.smallActionBtnDanger}
                              onPress={() => handleDeleteProduct(prod)}
                            >
                              <Ionicons name="trash-outline" size={13} color="#F87171" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* =============================================================== */}
            {/* 4. ABA: CASCOS & VASILHAMES RETORNÁVEIS                         */}
            {/* =============================================================== */}
            {activeTab === 'bottles' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Controle de Vasilhames & Cascos Retornáveis</Text>
                    <Text style={styles.sectionSubtitle}>
                      Gestão de comodato de garrafas 600ml e barris de chopp 50L por estabelecimento parceiro
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.addProdBtn}
                    onPress={() => setShowAddBottleModal(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={18} color="#0D1C28" />
                    <Text style={styles.addProdBtnText}>Novo Lançamento de Cascos</Text>
                  </TouchableOpacity>
                </View>

                {/* Cards de Saldo de Vasilhames */}
                <View style={styles.bottleSummaryRow}>
                  <View style={styles.bottleSummaryCard}>
                    <Ionicons name="beer-outline" size={24} color="#FFC107" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.bottleSummaryNum}>{totalCratesInCustody} Engradados</Text>
                      <Text style={styles.bottleSummaryLabel}>Cascos 600ml em poder dos bares</Text>
                    </View>
                  </View>

                  <View style={styles.bottleSummaryCard}>
                    <Ionicons name="cube-outline" size={24} color="#60A5FA" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.bottleSummaryNum}>{totalKegsInCustody} Barris Inox</Text>
                      <Text style={styles.bottleSummaryLabel}>Barris de Chopp 50L em comodato</Text>
                    </View>
                  </View>

                  <View style={styles.bottleSummaryCard}>
                    <Ionicons name="repeat-outline" size={24} color="#34D399" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.bottleSummaryNum}>Troca 1-para-1</Text>
                      <Text style={styles.bottleSummaryLabel}>Vazios conferidos na descarga</Text>
                    </View>
                  </View>
                </View>

                {/* Tabela de Vasilhames por Bar */}
                <View style={styles.bottleTable}>
                  <View style={styles.bottleTableHeader}>
                    <Text style={[styles.bottleTableTh, { flex: 3 }]}>Bar / Estabelecimento</Text>
                    <Text style={[styles.bottleTableTh, { flex: 2 }]}>Tipo de Vasilhame</Text>
                    <Text style={[styles.bottleTableTh, { flex: 2, textAlign: 'center' }]}>Em Poder do Bar</Text>
                    <Text style={[styles.bottleTableTh, { flex: 2, textAlign: 'center' }]}>Vazios Pendentes</Text>
                    <Text style={[styles.bottleTableTh, { flex: 2, textAlign: 'right' }]}>Ações</Text>
                  </View>

                  {bottleBalances.map(item => (
                    <View key={item.id} style={styles.bottleTableRow}>
                      <View style={{ flex: 3 }}>
                        <Text style={styles.bottleBarName}>{item.barName}</Text>
                        <Text style={styles.bottleLastDate}>Última troca: {item.lastExchangeDate}</Text>
                      </View>
                      <Text style={[styles.bottleTypeTag, { flex: 2 }]}>
                        {item.bottleType === 'engradado_600ml' && 'Engradado 600ml (24 garrafas)'}
                        {item.bottleType === 'barril_chopp_50L' && 'Barril Inox 50L Chopp'}
                        {item.bottleType === 'barril_chopp_30L' && 'Barril Inox 30L Chopp'}
                        {item.bottleType === 'engradado_litrao' && 'Engradado Litrão 1L'}
                      </Text>
                      <Text style={[styles.bottleQtyNumber, { flex: 2, textAlign: 'center' }]}>
                        {item.quantityInCustody} un.
                      </Text>
                      <View style={{ flex: 2, alignItems: 'center' }}>
                        {item.pendingReturn > 0 ? (
                          <View style={styles.pendingReturnBadge}>
                            <Text style={styles.pendingReturnText}>{item.pendingReturn} a recolher</Text>
                          </View>
                        ) : (
                          <Text style={styles.syncedText}>Em dia</Text>
                        )}
                      </View>
                      <View style={{ flex: 2, alignItems: 'flex-end' }}>
                        {item.pendingReturn > 0 && (
                          <TouchableOpacity 
                            style={styles.confirmReturnBtn}
                            onPress={() => handleReturnBottles(item.id)}
                          >
                            <Ionicons name="checkmark" size={13} color="#0D1C28" />
                            <Text style={styles.confirmReturnBtnText}>Dar Baixa</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* =============================================================== */}
            {/* 5. ABA: FROTA DE CAMINHÕES & MOTORISTAS                         */}
            {/* =============================================================== */}
            {activeTab === 'fleet' && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Gestão de Frota & Motoristas de Rota</Text>
                    <Text style={styles.sectionSubtitle}>
                      Veículos próprios ou terceirizados para expedição e descarregamento nos bares
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.addProdBtn}
                    onPress={() => setShowAddVehicleModal(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={18} color="#0D1C28" />
                    <Text style={styles.addProdBtnText}>Cadastrar Caminhão</Text>
                  </TouchableOpacity>
                </View>

                {/* Cards da Frota */}
                <View style={styles.fleetGrid}>
                  {vehicles.map(veh => (
                    <View key={veh.id} style={styles.vehicleCard}>
                      <View style={styles.vehicleTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={styles.truckIconCircle}>
                            <Ionicons name="car" size={20} color="#FFC107" />
                          </View>
                          <View>
                            <Text style={styles.vehiclePlate}>{veh.plate}</Text>
                            <Text style={styles.vehicleModel}>{veh.model}</Text>
                          </View>
                        </View>

                        <View style={[
                          styles.vehicleStatusBadge, 
                          veh.status === 'in_route' ? styles.vehicleStatusInRoute : styles.vehicleStatusAvail
                        ]}>
                          <Text style={styles.vehicleStatusText}>
                            {veh.status === 'in_route' ? 'EM ROTA' : 'DISPONÍVEL'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.vehicleDivider} />

                      <View style={styles.vehicleMetaRow}>
                        <View>
                          <Text style={styles.vehicleMetaLabel}>Motorista Titular:</Text>
                          <Text style={styles.vehicleMetaValue}>{veh.driverName}</Text>
                          <Text style={styles.vehicleMetaSub}>{veh.driverPhone}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.vehicleMetaLabel}>Capacidade Máxima:</Text>
                          <Text style={styles.vehicleMetaValue}>{veh.capacityCrates} engradados</Text>
                          <Text style={styles.vehicleMetaSub}>{veh.capacityPallets} paletes</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* =============================================================== */}
            {/* 6. ABA: REGRAS COMERCIAIS & LOGÍSTICA                           */}
            {/* =============================================================== */}
            {activeTab === 'rules' && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>Regras Comerciais & Logística de Entrega</Text>
                <Text style={styles.sectionSubtitle}>
                  Defina o pedido mínimo, frete, corte de horário para entrega no mesmo dia e condições de faturamento
                </Text>

                <View style={styles.formGridTwoCol}>
                  {/* Pedido Mínimo */}
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Valor do Pedido Mínimo (R$) *</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: 350.00"
                      placeholderTextColor="#627585"
                      value={minOrderInput}
                      onChangeText={setMinOrderInput}
                      keyboardType="numeric"
                    />
                    <Text style={styles.fieldHelpText}>Bares não conseguem fechar pedido abaixo deste valor.</Text>
                  </View>

                  {/* Frete Padrão */}
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Taxa de Entrega Padrão (R$)</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: 0.00 (Grátis) ou 35.00"
                      placeholderTextColor="#627585"
                      value={deliveryFeeInput}
                      onChangeText={setDeliveryFeeInput}
                      keyboardType="numeric"
                    />
                    <Text style={styles.fieldHelpText}>Informe 0.00 se o frete for sempre gratuito.</Text>
                  </View>

                  {/* Frete Grátis Acima de */}
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Frete Grátis a Partir de (R$)</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: 500.00"
                      placeholderTextColor="#627585"
                      value={freeDeliveryInput}
                      onChangeText={setFreeDeliveryInput}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Horário de Corte (Cut-off Time) */}
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Horário Limite de Corte (Cut-Off)</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: 15:00"
                      placeholderTextColor="#627585"
                      value={cutOffTimeInput}
                      onChangeText={setCutOffTimeInput}
                    />
                    <Text style={styles.fieldHelpText}>Pedidos após este horário são agendados para o dia seguinte.</Text>
                  </View>

                  {/* Estimativa de Entrega */}
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Prazo de Entrega Estimado</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: Hoje até 18h ou 24h a 48h"
                      placeholderTextColor="#627585"
                      value={deliveryTimeInput}
                      onChangeText={setDeliveryTimeInput}
                    />
                  </View>

                  {/* Raio Máximo de Atendimento */}
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Raio Máximo de Atendimento (km)</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: 50"
                      placeholderTextColor="#627585"
                      value={maxRadiusInput}
                      onChangeText={setMaxRadiusInput}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Horário de Expedição da Doca */}
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Horário de Expedição / Doca</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Ex: Seg-Sex 07:00 às 18:00 • Sáb 07:00 às 13:00"
                      placeholderTextColor="#627585"
                      value={operatingHoursInput}
                      onChangeText={setOperatingHoursInput}
                    />
                  </View>
                </View>

                {/* Formas de Pagamento Habilitadas */}
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Formas de Pagamento Habilitadas para os Bares</Text>
                <View style={styles.paymentMethodsRow}>
                  <TouchableOpacity 
                    style={[styles.paymentMethodCard, acceptedPix && styles.paymentMethodCardActive]}
                    onPress={() => setAcceptedPix(!acceptedPix)}
                  >
                    <Ionicons name={acceptedPix ? "checkbox" : "square-outline"} size={20} color={acceptedPix ? "#FFC107" : "#8FA0AF"} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.paymentMethodTitle}>⚡ Pix Imediato</Text>
                      <Text style={styles.paymentMethodSub}>Liquidação instantânea com QR Code</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.paymentMethodCard, acceptedBoleto && styles.paymentMethodCardActive]}
                    onPress={() => setAcceptedBoleto(!acceptedBoleto)}
                  >
                    <Ionicons name={acceptedBoleto ? "checkbox" : "square-outline"} size={20} color={acceptedBoleto ? "#FFC107" : "#8FA0AF"} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.paymentMethodTitle}>📄 Boleto Faturado 15/30 Dias</Text>
                      <Text style={styles.paymentMethodSub}>Sujeito à aprovação de score Serasa</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.paymentMethodCard, acceptedCard && styles.paymentMethodCardActive]}
                    onPress={() => setAcceptedCard(!acceptedCard)}
                  >
                    <Ionicons name={acceptedCard ? "checkbox" : "square-outline"} size={20} color={acceptedCard ? "#FFC107" : "#8FA0AF"} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.paymentMethodTitle}>💳 Cartão Corporativo</Text>
                      <Text style={styles.paymentMethodSub}>Cartão de crédito do estabelecimento</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Status da Doca */}
                <TouchableOpacity 
                  style={styles.toggleDockBtn}
                  onPress={() => setIsOpenForOrders(!isOpenForOrders)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={isOpenForOrders ? "checkmark-circle" : "pause-circle"} size={22} color={isOpenForOrders ? "#34D399" : "#EF4444"} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.toggleDockTitle}>
                      {isOpenForOrders ? 'Doca Aberta para Novos Pedidos' : 'Doca Fechada Temporariamente (Inventário/Feriado)'}
                    </Text>
                    <Text style={styles.toggleDockSub}>
                      {isOpenForOrders ? 'Os bares conseguem adicionar produtos e fechar pedidos normalmente.' : 'Os bares verão que o centro de distribuição está em pausa.'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.saveMainSettingsBtn}
                  onPress={handleSaveCommercialRules}
                  activeOpacity={0.85}
                >
                  <Ionicons name="save-outline" size={18} color="#0D1C28" style={{ marginRight: 8 }} />
                  <Text style={styles.saveMainSettingsBtnText}>Salvar Regras Comerciais & Logística</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* =============================================================== */}
            {/* 7. ABA: PERFIL & DOCA DA DISTRIBUIDORA                          */}
            {/* =============================================================== */}
            {activeTab === 'company' && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>Dados Cadastrais do Centro de Distribuição</Text>
                <Text style={styles.sectionSubtitle}>
                  Informações fiscais para emissão de romaneios e notas fiscais eletrônicas (NFe)
                </Text>

                <View style={styles.formGridTwoCol}>
                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Nome Fantasia da Distribuidora *</Text>
                    <TextInput
                      style={styles.inputField}
                      value={companyTradeName}
                      onChangeText={setCompanyTradeName}
                    />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Razão Social *</Text>
                    <TextInput
                      style={styles.inputField}
                      value={companyCorporateName}
                      onChangeText={setCompanyCorporateName}
                    />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>CNPJ Cadastrado *</Text>
                    <TextInput
                      style={styles.inputField}
                      value={companyCnpj}
                      onChangeText={setCompanyCnpj}
                    />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Inscrição Estadual (IE)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={companyIe}
                      onChangeText={setCompanyIe}
                    />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Telefone Comercial / PABX</Text>
                    <TextInput
                      style={styles.inputField}
                      value={companyPhone}
                      onChangeText={setCompanyPhone}
                    />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>E-mail Comercial & NFe</Text>
                    <TextInput
                      style={styles.inputField}
                      value={companyEmail}
                      onChangeText={setCompanyEmail}
                    />
                  </View>

                  <View style={[styles.formCol, { width: '100%' }]}>
                    <Text style={styles.inputLabel}>Endereço do Galpão / CD</Text>
                    <TextInput
                      style={styles.inputField}
                      value={companyAddress}
                      onChangeText={setCompanyAddress}
                    />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Cidade</Text>
                    <TextInput
                      style={styles.inputField}
                      value={companyCity}
                      onChangeText={setCompanyCity}
                    />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.inputLabel}>Estado (UF)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={companyState}
                      onChangeText={setCompanyState}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.saveMainSettingsBtn, { marginTop: 20 }]}
                  onPress={handleSaveCompanyData}
                  activeOpacity={0.85}
                >
                  <Ionicons name="save-outline" size={18} color="#0D1C28" style={{ marginRight: 8 }} />
                  <Text style={styles.saveMainSettingsBtnText}>Salvar Dados Cadastrais</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* =============================================================== */}
            {/* 8. ABA: FINANCEIRO & CHAVES PIX                                 */}
            {/* =============================================================== */}
            {activeTab === 'bank' && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>Dados de Recebimento & Chaves Pix</Text>
                <Text style={styles.sectionSubtitle}>
                  Configuração de repasses automáticos das vendas líquidas após comissão
                </Text>

                <View style={styles.bankCardWide}>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Chave Pix Oficial da Distribuidora:</Text>
                    <TextInput
                      style={[styles.inputField, { flex: 1, marginLeft: 20 }]}
                      value={bankPixKey}
                      onChangeText={setBankPixKey}
                    />
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Banco de Liquidação:</Text>
                    <TextInput
                      style={[styles.inputField, { flex: 1, marginLeft: 20 }]}
                      value={bankName}
                      onChangeText={setBankName}
                    />
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Agência / Conta Corrente PJ:</Text>
                    <View style={{ flex: 1, flexDirection: 'row', gap: 10, marginLeft: 20 }}>
                      <TextInput
                        style={[styles.inputField, { flex: 1 }]}
                        value={bankAgency}
                        onChangeText={setBankAgency}
                        placeholder="Agência"
                      />
                      <TextInput
                        style={[styles.inputField, { flex: 2 }]}
                        value={bankAccount}
                        onChangeText={setBankAccount}
                        placeholder="Conta com dígito"
                      />
                    </View>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>Taxa da Plataforma FlowStock:</Text>
                    <Text style={[styles.bankValue, { color: '#FFC107' }]}>{currentSupplier.commissionRate}% por venda liquidada</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.saveMainSettingsBtn, { marginTop: 14 }]}
                    onPress={handleSaveBankData}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#0D1C28" style={{ marginRight: 8 }} />
                    <Text style={styles.saveMainSettingsBtnText}>Salvar Dados Bancários & Pix</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* =============================================================== */}
            {/* 9. ABA: TELEVENDAS & SUPORTE OPERACIONAL                        */}
            {/* =============================================================== */}
            {activeTab === 'support' && (
              <View style={styles.sectionBox}>
                <Text style={styles.sectionTitle}>Canal de Televendas & Suporte ao Cliente</Text>
                <Text style={styles.sectionSubtitle}>
                  Atendimento direto para resolução de dúvidas de estoque, barris e faturamento a prazo
                </Text>

                <View style={styles.supportCardWide}>
                  <Ionicons name="logo-whatsapp" size={36} color="#25D366" />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.supportTitle}>Televendas WhatsApp: {currentSupplier.phone}</Text>
                    <Text style={styles.supportSub}>
                      Mesa de atendimento operacional das 07h às 18h para donos de bares credenciados.
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.openWhatsappBtn}
                    onPress={() => Alert.alert('WhatsApp', `Iniciando conversa com televendas: ${currentSupplier.phone}`)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.openWhatsappText}>Abrir WhatsApp Web</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* ===================================================================== */}
      {/* MODAL 1: CADASTRAR NOVA BEBIDA NO CATÁLOGO                            */}
      {/* ===================================================================== */}
      <Modal visible={showAddProd} transparent={true} animationType="fade" onRequestClose={() => setShowAddProd(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAddProd(false)}
        >
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cadastrar Nova Bebida no Catálogo</Text>
              <TouchableOpacity onPress={() => setShowAddProd(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              <Text style={styles.inputLabel}>Nome do Produto / Bebida *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Ex: Cerveja Beck's 330ml Long Neck"
                placeholderTextColor="#627585"
                value={newProdName}
                onChangeText={setNewProdName}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Marca / Cervejaria</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Ex: Beck's"
                    placeholderTextColor="#627585"
                    value={newProdBrand}
                    onChangeText={setNewProdBrand}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Código SKU / EAN</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Ex: 789199100080"
                    placeholderTextColor="#627585"
                    value={newProdSku}
                    onChangeText={setNewProdSku}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Preço de Atacado (R$) *</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="120.00"
                    placeholderTextColor="#627585"
                    value={newProdPrice}
                    onChangeText={setNewProdPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Preço Original / De (Opcional)</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="135.00"
                    placeholderTextColor="#627585"
                    value={newProdOriginalPrice}
                    onChangeText={setNewProdOriginalPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Estoque Disponível</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="150"
                    placeholderTextColor="#627585"
                    value={newProdStock}
                    onChangeText={setNewProdStock}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Qtd Mínima por Pedido</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="1"
                    placeholderTextColor="#627585"
                    value={newProdMinUnits}
                    onChangeText={setNewProdMinUnits}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Categoria de Bebida</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[
                  { key: 'cervejas', label: 'Cervejas' },
                  { key: 'chopp_barris', label: 'Chopp 50L' },
                  { key: 'destilados', label: 'Destilados' },
                ].map(c => (
                  <TouchableOpacity 
                    key={c.key} 
                    style={[styles.catFilterChip, newProdCategory === c.key && styles.catFilterChipActive]}
                    onPress={() => setNewProdCategory(c.key as any)}
                  >
                    <Text style={[styles.catFilterText, newProdCategory === c.key && styles.catFilterTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}
                onPress={() => setNewProdIsReturnable(!newProdIsReturnable)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={newProdIsReturnable ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={newProdIsReturnable ? "#FFC107" : "#8FA0AF"} 
                />
                <Text style={{ color: '#FFFFFF', fontSize: 13 }}>Exige Troca de Casco Retornável (Garrafas 600ml ou Barril Inox)</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Embalagem B2B</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Ex: Caixa com 24 garrafas de 330ml"
                placeholderTextColor="#627585"
                value={newProdUnit}
                onChangeText={setNewProdUnit}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Lote de Fabricação</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Ex: LOTE-2026/A"
                    placeholderTextColor="#627585"
                    value={newProdBatch}
                    onChangeText={setNewProdBatch}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Data de Validade</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Ex: 12/2026"
                    placeholderTextColor="#627585"
                    value={newProdExpiration}
                    onChangeText={setNewProdExpiration}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveProdBtn, { marginTop: 16 }]}
                onPress={handleCreateProduct}
                activeOpacity={0.85}
              >
                <Text style={styles.saveProdBtnText}>Cadastrar Bebida no Catálogo</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: EDITAR PRODUTO EXISTENTE                                     */}
      {/* ===================================================================== */}
      <Modal visible={!!editingProduct} transparent={true} animationType="fade" onRequestClose={() => setEditingProduct(null)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setEditingProduct(null)}
        >
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Bebida no Catálogo</Text>
              <TouchableOpacity onPress={() => setEditingProduct(null)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
              <Text style={styles.inputLabel}>Nome do Produto</Text>
              <TextInput
                style={styles.inputField}
                value={editName}
                onChangeText={setEditName}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Preço de Atacado (R$)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Estoque Atual (un)</Text>
                  <TextInput
                    style={styles.inputField}
                    value={editStock}
                    onChangeText={setEditStock}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Embalagem B2B</Text>
              <TextInput
                style={styles.inputField}
                value={editUnit}
                onChangeText={setEditUnit}
              />

              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 8 }}
                onPress={() => setEditIsReturnable(!editIsReturnable)}
              >
                <Ionicons 
                  name={editIsReturnable ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={editIsReturnable ? "#FFC107" : "#8FA0AF"} 
                />
                <Text style={{ color: '#FFFFFF', fontSize: 13 }}>Exige Vasilhame Retornável</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveProdBtn, { marginTop: 14 }]}
                onPress={handleSaveProductEdit}
              >
                <Text style={styles.saveProdBtnText}>Salvar Alterações</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: NOVO LANÇAMENTO DE CASCOS & COMODATO                         */}
      {/* ===================================================================== */}
      <Modal visible={showAddBottleModal} transparent={true} animationType="fade" onRequestClose={() => setShowAddBottleModal(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAddBottleModal(false)}
        >
          <View 
            style={[styles.modalContent, { maxWidth: 460 }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lançar Cascos / Vasilhames em Comodato</Text>
              <TouchableOpacity onPress={() => setShowAddBottleModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nome do Bar ou Restaurante</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Ex: Bar do Urso - Filial Pinheiros"
              placeholderTextColor="#627585"
              value={newBottleBarName}
              onChangeText={setNewBottleBarName}
            />

            <Text style={styles.inputLabel}>Tipo de Vasilhame</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { key: 'engradado_600ml', label: 'Engradado 600ml' },
                { key: 'barril_chopp_50L', label: 'Barril Chopp 50L' },
                { key: 'barril_chopp_30L', label: 'Barril Chopp 30L' },
              ].map(bt => (
                <TouchableOpacity 
                  key={bt.key}
                  style={[styles.catFilterChip, newBottleType === bt.key && styles.catFilterChipActive]}
                  onPress={() => setNewBottleType(bt.key as any)}
                >
                  <Text style={[styles.catFilterText, newBottleType === bt.key && styles.catFilterTextActive]}>
                    {bt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Quantidade Fornecida</Text>
            <TextInput
              style={styles.inputField}
              placeholder="10"
              placeholderTextColor="#627585"
              value={newBottleQty}
              onChangeText={setNewBottleQty}
              keyboardType="numeric"
            />

            <TouchableOpacity 
              style={[styles.saveProdBtn, { marginTop: 14 }]}
              onPress={handleAddBottleBalance}
            >
              <Text style={styles.saveProdBtnText}>Registrar Comodato de Cascos</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: CADASTRAR CAMINHÃO NA FROTA                                  */}
      {/* ===================================================================== */}
      <Modal visible={showAddVehicleModal} transparent={true} animationType="fade" onRequestClose={() => setShowAddVehicleModal(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAddVehicleModal(false)}
        >
          <View 
            style={[styles.modalContent, { maxWidth: 480 }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cadastrar Novo Caminhão na Frota</Text>
              <TouchableOpacity onPress={() => setShowAddVehicleModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Placa do Veículo (Mercosul ou antiga)</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Ex: BRA2E19"
              placeholderTextColor="#627585"
              value={newVehPlate}
              onChangeText={setNewVehPlate}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>Modelo do Caminhão</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Ex: Mercedes-Benz Accelo 1016 (Baú Cervejeiro)"
              placeholderTextColor="#627585"
              value={newVehModel}
              onChangeText={setNewVehModel}
            />

            <Text style={styles.inputLabel}>Nome do Motorista Titular</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Ex: João Ferreira da Costa"
              placeholderTextColor="#627585"
              value={newVehDriver}
              onChangeText={setNewVehDriver}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Telefone / WhatsApp</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="(11) 98765-4321"
                  placeholderTextColor="#627585"
                  value={newVehPhone}
                  onChangeText={setNewVehPhone}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Capacidade (Engradados)</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="240"
                  placeholderTextColor="#627585"
                  value={newVehCapacity}
                  onChangeText={setNewVehCapacity}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveProdBtn, { marginTop: 14 }]}
              onPress={handleAddVehicle}
            >
              <Text style={styles.saveProdBtnText}>Cadastrar Caminhão</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 5: DESPACHAR PEDIDO COM CAMINHÃO & MOTORISTA                    */}
      {/* ===================================================================== */}
      <Modal visible={!!dispatchingOrder} transparent={true} animationType="fade" onRequestClose={() => setDispatchingOrder(null)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setDispatchingOrder(null)}
        >
          <View 
            style={[styles.modalContent, { maxWidth: 480 }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Despachar Caminhão para Entrega</Text>
              <TouchableOpacity onPress={() => setDispatchingOrder(null)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#8FA0AF', fontSize: 13, marginBottom: 14 }}>
              Pedido: <Text style={{ color: '#FFC107', fontWeight: 'bold' }}>{dispatchingOrder?.id}</Text> • Destino: {dispatchingOrder?.barName}
            </Text>

            <Text style={styles.inputLabel}>Selecione o Caminhão & Motorista da Frota:</Text>
            {vehicles.map(v => (
              <TouchableOpacity 
                key={v.id}
                style={[styles.selectVehRow, selectedVehicleForDispatch === v.id && styles.selectVehRowActive]}
                onPress={() => setSelectedVehicleForDispatch(v.id)}
              >
                <Ionicons name="car" size={20} color={selectedVehicleForDispatch === v.id ? "#0D1C28" : "#FFC107"} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.selectVehPlate, selectedVehicleForDispatch === v.id && { color: '#0D1C28' }]}>
                    {v.plate} • {v.model}
                  </Text>
                  <Text style={[styles.selectVehDriver, selectedVehicleForDispatch === v.id && { color: '#2B3B4A' }]}>
                    Motorista: {v.driverName} ({v.driverPhone})
                  </Text>
                </View>
                <Ionicons 
                  name={selectedVehicleForDispatch === v.id ? "checkmark-circle" : "radio-button-off"} 
                  size={18} 
                  color={selectedVehicleForDispatch === v.id ? "#0D1C28" : "#8FA0AF"} 
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={[styles.saveProdBtn, { marginTop: 16 }]}
              onPress={handleDispatchOrderWithVehicle}
            >
              <Ionicons name="navigate" size={16} color="#0D1C28" style={{ marginRight: 6 }} />
              <Text style={styles.saveProdBtnText}>Liberar Carga & Iniciar Rota</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070F18',
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260,
    backgroundColor: '#0D1C28',
    borderRightWidth: 1,
    borderRightColor: '#182C3D',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sidebarBrand: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#182C3D',
  },
  supplierCardMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#112332',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  suppLogoMini: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#0D1C28',
  },
  suppNameMini: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  suppCnpjMini: {
    color: '#8FA0AF',
    fontSize: 10,
    marginTop: 2,
  },
  navScroll: {
    flex: 1,
  },
  navGroup: {
    paddingHorizontal: 12,
    gap: 4,
    paddingBottom: 10,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 10,
  },
  navBtnActive: {
    backgroundColor: '#FFC107',
  },
  navBtnText: {
    color: '#8FA0AF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  navBtnTextActive: {
    color: '#0D1C28',
    fontWeight: 'bold',
  },
  badgeCount: {
    backgroundColor: '#0D1C28',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCountText: {
    color: '#FFC107',
    fontSize: 10,
    fontWeight: 'bold',
  },
  catalogCountTag: {
    color: '#8FA0AF',
    fontSize: 11,
  },
  pillBadgeGold: {
    backgroundColor: '#262211',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  pillBadgeGoldText: {
    color: '#FFC107',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#182C3D',
  },
  switchHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  switchHubText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainCanvas: {
    flex: 1,
    backgroundColor: '#070F18',
    display: 'flex',
    flexDirection: 'column',
  },
  topBarDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: '#0D1C28',
    borderBottomWidth: 1,
    borderBottomColor: '#182C3D',
  },
  pageHeadingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pageHeadingSub: {
    color: '#8FA0AF',
    fontSize: 12,
    marginTop: 3,
  },
  topBarRightStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#0E291C',
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 6,
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusOnlineText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusMinOrderPill: {
    backgroundColor: '#142535',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E3245',
  },
  statusMinOrderText: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: 'bold',
  },
  canvasScroll: {
    padding: 24,
    paddingBottom: 80,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#0D1C28',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#182C3D',
  },
  kpiLabel: {
    color: '#8FA0AF',
    fontSize: 12,
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 4,
  },
  kpiHint: {
    color: '#627585',
    fontSize: 11,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  metricDetailBox: {
    flex: 1,
    backgroundColor: '#102234',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#182D42',
    alignItems: 'center',
  },
  metricDetailNum: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  metricDetailLabel: {
    color: '#8FA0AF',
    fontSize: 11,
    textAlign: 'center',
  },
  sectionBox: {
    backgroundColor: '#0D1C28',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#182C3D',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: '#8FA0AF',
    fontSize: 12,
    marginTop: 3,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#102234',
    borderWidth: 1,
    borderColor: '#182D42',
  },
  pillBtnActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  pillBtnText: {
    color: '#8FA0AF',
    fontSize: 12,
    fontWeight: '600',
  },
  pillBtnTextActive: {
    color: '#0D1C28',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#8FA0AF',
    fontSize: 14,
    marginTop: 10,
  },
  orderCardDesktop: {
    backgroundColor: '#102234',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#193046',
  },
  orderHeaderDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#193046',
    paddingBottom: 12,
    marginBottom: 12,
  },
  orderIdBadge: {
    backgroundColor: '#FFC107',
    color: '#0D1C28',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderBarTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  orderPaymentTag: {
    color: '#8FA0AF',
    fontSize: 12,
  },
  statusPillBadge: {
    backgroundColor: '#172B3E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#243E56',
  },
  statusPillBadgeText: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderBodyDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderAddressLabel: {
    color: '#8FA0AF',
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
  },
  orderAddressText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  orderNotesText: {
    color: '#FFC107',
    fontSize: 11,
    marginTop: 6,
  },
  exchangeNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#231F0F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  exchangeNoticeText: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: 'bold',
  },
  orderItemLine: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 19,
  },
  orderTotalCol: {
    flex: 2,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  orderTotalValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFC107',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  advanceBtnText: {
    color: '#0D1C28',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addProdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFC107',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addProdBtnText: {
    color: '#0D1C28',
    fontSize: 12,
    fontWeight: 'bold',
  },
  catalogSearchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  searchCatalogBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102234',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  searchCatalogInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 10,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? ({
      outlineStyle: 'none',
      outlineWidth: 0,
      borderWidth: 0,
      boxShadow: 'none',
    } as any) : {}),
  },
  catalogFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#102234',
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  catFilterChipActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  catFilterText: {
    color: '#8FA0AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  catFilterTextActive: {
    color: '#0D1C28',
  },
  productsGrid: {
    gap: 12,
  },
  productCardWide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102234',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A3248',
  },
  productCardPaused: {
    opacity: 0.6,
    borderColor: '#374151',
  },
  productImgWide: {
    width: 65,
    height: 75,
  },
  productBrandWide: {
    color: '#8FA0AF',
    fontSize: 11,
    fontWeight: '600',
  },
  productNameWide: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  productUnitWide: {
    color: '#627585',
    fontSize: 11,
    marginTop: 2,
  },
  productPriceWide: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: 'bold',
  },
  productStockWide: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  skuTag: {
    backgroundColor: '#162838',
    color: '#8FA0AF',
    fontSize: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pausedBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pausedBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  retBadgePill: {
    backgroundColor: '#1B2C3C',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  retBadgePillText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: 'bold',
  },
  prodActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#172C3E',
  },
  quickStockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStockLabel: {
    color: '#8FA0AF',
    fontSize: 11,
  },
  quickStockBtn: {
    backgroundColor: '#172C3E',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#243F57',
  },
  quickStockBtnText: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: 'bold',
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFC107',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  smallActionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#243F57',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  smallActionBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFC107',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  smallActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  smallActionBtnDanger: {
    borderWidth: 1,
    borderColor: '#451A1A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Vasilhames
  bottleSummaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  bottleSummaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102234',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#193046',
  },
  bottleSummaryNum: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottleSummaryLabel: {
    color: '#8FA0AF',
    fontSize: 11,
    marginTop: 2,
  },
  bottleTable: {
    backgroundColor: '#102234',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#193046',
    overflow: 'hidden',
  },
  bottleTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0A1724',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#193046',
  },
  bottleTableTh: {
    color: '#8FA0AF',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bottleTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#152A3C',
  },
  bottleBarName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottleLastDate: {
    color: '#627585',
    fontSize: 11,
    marginTop: 2,
  },
  bottleTypeTag: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  bottleQtyNumber: {
    color: '#FFC107',
    fontSize: 13,
    fontWeight: 'bold',
  },
  pendingReturnBadge: {
    backgroundColor: '#2B2310',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  pendingReturnText: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: 'bold',
  },
  syncedText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  confirmReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#34D399',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  confirmReturnBtnText: {
    color: '#0D1C28',
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Frota
  fleetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  vehicleCard: {
    width: '48%',
    backgroundColor: '#102234',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#193046',
  },
  vehicleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  truckIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#172B3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiclePlate: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  vehicleModel: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 1,
  },
  vehicleStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vehicleStatusAvail: {
    backgroundColor: '#0F2C20',
  },
  vehicleStatusInRoute: {
    backgroundColor: '#2C210C',
  },
  vehicleStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  vehicleDivider: {
    height: 1,
    backgroundColor: '#193046',
    marginVertical: 12,
  },
  vehicleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehicleMetaLabel: {
    color: '#8FA0AF',
    fontSize: 10,
  },
  vehicleMetaValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  vehicleMetaSub: {
    color: '#627585',
    fontSize: 11,
  },
  // Formulários
  formGridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  formCol: {
    width: '48%',
  },
  inputLabel: {
    color: '#8FA0AF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: '#102234',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#1E3246',
    ...(Platform.OS === 'web' ? ({
      outlineStyle: 'none',
      outlineWidth: 0,
      borderWidth: 1,
      boxShadow: 'none',
    } as any) : {}),
  },
  fieldHelpText: {
    color: '#627585',
    fontSize: 11,
    marginTop: 4,
  },
  paymentMethodsRow: {
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102234',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#193046',
  },
  paymentMethodCardActive: {
    borderColor: '#FFC107',
    backgroundColor: '#122538',
  },
  paymentMethodTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  paymentMethodSub: {
    color: '#8FA0AF',
    fontSize: 11,
    marginTop: 2,
  },
  toggleDockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102234',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#193046',
    marginBottom: 16,
  },
  toggleDockTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  toggleDockSub: {
    color: '#8FA0AF',
    fontSize: 11,
    marginTop: 2,
  },
  saveMainSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  saveMainSettingsBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Financeiro & Banco
  bankCardWide: {
    backgroundColor: '#102234',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#193046',
    gap: 14,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankLabel: {
    color: '#8FA0AF',
    fontSize: 13,
    width: 220,
  },
  bankValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Suporte
  supportCardWide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102234',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#193046',
  },
  supportTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  supportSub: {
    color: '#8FA0AF',
    fontSize: 12,
    marginTop: 4,
  },
  openWhatsappBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  openWhatsappText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 12, 19, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#0D1C28',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#243C52',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#182C3D',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveProdBtn: {
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveProdBtnText: {
    color: '#0D1C28',
    fontSize: 13,
    fontWeight: 'bold',
  },
  selectVehRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102234',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#193046',
  },
  selectVehRowActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  selectVehPlate: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  selectVehDriver: {
    color: '#8FA0AF',
    fontSize: 11,
    marginTop: 2,
  },
});
