import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  Modal, 
  SafeAreaView, 
  Animated, 
  Easing, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp, ThemeColors } from '../context/AppContext';
import { BarSelectorModal } from '../components/BarSelectorModal';
import { NotificationsModal } from '../components/NotificationsModal';
import { LocationHeaderSelector } from '../components/LocationHeaderSelector';
import { SupplierAccount, BeverageProduct } from '../types';
import { getProductImage } from '../utils/productImages';

interface BarOwnerHomeScreenProps {
  onSelectSupplier: (supplier: SupplierAccount) => void;
  onNavigateToIntegrations: () => void;
  onSelectProduct?: (product: BeverageProduct) => void;
  onOpenCheckout?: () => void;
  onOpenLogin?: () => void;
  onOpenOrders?: () => void;
  onOpenInvoices?: () => void;
}

export const BarOwnerHomeScreen: React.FC<BarOwnerHomeScreenProps> = ({ 
  onSelectSupplier,
  onNavigateToIntegrations,
  onSelectProduct,
  onOpenCheckout,
  onOpenLogin,
  onOpenOrders,
  onOpenInvoices,
}) => {
  const { 
    currentUser,
    suppliers, 
    products, 
    cart, 
    cartTotal,
    cartSupplier,
    addToCart,
    isDarkMode,
    theme,
    locationPermission,
    isRequestingLocation,
    isUsingDeviceLocation,
    requestLocation,
    getSupplierDistance,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    unreadNotificationCount,
  } = useApp();

  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [showBarModal, setShowBarModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [reorderQuantity, setReorderQuantity] = useState(25);
  const [isFavorite, setIsFavorite] = useState(true);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const handleQuickAdd = (product: BeverageProduct, feedbackId: string) => {
    if (!product) return;
    addToCart(product, 1);
    setRecentlyAddedId(feedbackId);
    setTimeout(() => {
      setRecentlyAddedId(prev => prev === feedbackId ? null : prev);
    }, 1200);
  };

  // Animação de transição fluida da barra de busca (FlowStock / StackFood)
  const [searchAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: isSearchActive ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isSearchActive, searchAnim]);

  const backBtnOpacity = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const backBtnTranslateX = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
  });

  const searchContentOpacity = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const searchContentTranslateY = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  // Solicitar localização automaticamente no GPS se o usuário estiver no modo de localização e ainda não foi definida
  useEffect(() => {
    if (isUsingDeviceLocation && locationPermission === 'undetermined') {
      requestLocation();
    }
  }, [isUsingDeviceLocation, locationPermission, requestLocation]);

  // Fornecedores ordenados por proximidade (distância em km calculada via Haversine)
  const sortedSuppliers = useMemo(() => {
    return [...suppliers].map(sup => ({
      ...sup,
      distanceInfo: getSupplierDistance(sup),
    })).sort((a, b) => a.distanceInfo.distanceKm - b.distanceInfo.distanceKm);
  }, [suppliers, getSupplierDistance]);

  const supplierDistMap = useMemo(() => {
    const map: Record<string, { distanceKm: number; formatted: string }> = {};
    suppliers.forEach(s => {
      map[s.id] = getSupplierDistance(s);
    });
    return map;
  }, [suppliers, getSupplierDistance]);

  // Filtros rápidos e avançados
  const [activeQuickFilter, setActiveQuickFilter] = useState<'todos' | 'proximos' | 'mais_vendidas' | 'retornaveis' | 'desconto' | 'entrega_hoje'>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedSort, setSelectedSort] = useState<'mais_proximo' | 'menor_preco' | 'maior_preco' | 'mais_rapido' | 'agendada'>('mais_proximo');
  const [filterDiscountOnly, setFilterDiscountOnly] = useState(false);
  const [filterFourStars, setFilterFourStars] = useState(true);
  const [filterReturnableOnly, setFilterReturnableOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  // Fornecedor em destaque (Ambev do Figma)
  const mainSupplier = suppliers[0];

  // Produto em destaque de "Peça novamente"
  const reorderProduct = products.find(p => p.brand === 'Heineken') || products[0];

  // Banners Promocionais Rotativos Interativos FlowStock
  const promoBanners = [
    {
      id: 'b1',
      title: 'Festival de Chopp FlowStock',
      subtitle: 'Barris 50L Brahma e Heineken com entrega garantida até 18h',
      tag: 'PRONTA ENTREGA',
      ctaText: 'Ver Chopp 50L',
      action: 'chopp',
      image: require('../../assets/products/keg_inox.jpg'),
    },
    {
      id: 'b2',
      title: 'Reposição Ambev com Faturamento 30d',
      subtitle: 'Compre garrafas retornáveis 600ml direto da fábrica sem taxa',
      tag: 'B2B EXCLUSIVO',
      ctaText: 'Catálogo Ambev',
      action: 'ambev',
      image: require('../../assets/products/warehouse_beer.jpg'),
    },
  ];

  // Categorias de Bebidas
  const beverageCategories = [
    { id: 'todas', label: 'Todas', icon: 'grid-outline' },
    { id: 'cervejas', label: 'Cervejas', icon: 'beer-outline' },
    { id: 'chopp_barris', label: 'Chopp 50L', icon: 'wine-outline' },
    { id: 'destilados', label: 'Destilados & Gins', icon: 'flask-outline' },
    { id: 'refrigerantes', label: 'Energéticos & Mixers', icon: 'flash-outline' },
  ];

  // Lista de Destaques horizontal do Figma com fotos reais de garrafas e latas comerciais (zero pessoas)
  const highlightProducts = useMemo(() => [
    { id: 'h1', name: 'Erdinger Weißbier - 500ml', price: 16.80, brand: 'Erdinger', image: getProductImage('erdinger'), productId: 'prod_17' },
    { id: 'h2', name: 'Brahma Duplo Malte - 600ml', price: 6.20, brand: 'Brahma', image: getProductImage('brahma'), productId: 'prod_15' },
    { id: 'h3', name: 'Corona Extra - 330ml', price: 5.80, brand: 'Corona', image: getProductImage('corona'), productId: 'prod_2' },
    { id: 'h4', name: 'Eisenbahn Pilsen - 355ml', price: 5.50, brand: 'Eisenbahn', image: getProductImage('eisenbahn'), productId: 'prod_13' },
    { id: 'h5', name: 'Heineken Puro Malte - 600ml', price: 7.70, brand: 'Heineken', image: getProductImage('heineken'), productId: 'prod_14' },
    { id: 'h6', name: 'Gin Tanqueray London - 750ml', price: 99.00, brand: 'Tanqueray', image: getProductImage('tanqueray'), productId: 'prod_5' },
  ], []);

  // Distribuidores Favoritos do Topo da Home (Fiel ao Figma: Favoritas)
  const favoriteDistributors = useMemo(() => [
    {
      id: 'fav_ambev',
      name: 'Ambev',
      label: 'Ambev',
      supplier: suppliers.find(s => s.tradeName.toLowerCase().includes('ambev')) || suppliers[0],
      bg: '#FFFFFF',
      border: isDarkMode ? '#1E3A5F' : '#E2E8F0',
      textColor: '#1E40AF',
      type: 'ambev' as const,
    },
    {
      id: 'fav_topbeer',
      name: 'TopBeer',
      label: 'TopBeer',
      supplier: suppliers.find(s => s.tradeName.toLowerCase().includes('petrópolis') || s.tradeName.toLowerCase().includes('topbeer')) || suppliers[1] || suppliers[0],
      bg: '#DC2626',
      border: isDarkMode ? '#7F1D1D' : '#B91C1C',
      textColor: '#FFFFFF',
      type: 'topbeer' as const,
    },
    {
      id: 'fav_breja',
      name: "Breja's",
      label: 'Breja',
      supplier: suppliers.find(s => s.tradeName.toLowerCase().includes('heineken') || s.tradeName.toLowerCase().includes('breja')) || suppliers[2] || suppliers[0],
      bg: '#0F172A',
      border: isDarkMode ? '#334155' : '#475569',
      textColor: '#FFFFFF',
      type: 'breja' as const,
    },
    {
      id: 'fav_proibida',
      name: 'Proibida',
      label: 'Proibida',
      supplier: suppliers[3] || suppliers[0],
      bg: '#F59E0B',
      border: '#0F172A',
      textColor: '#0F172A',
      type: 'proibida' as const,
    },
  ], [suppliers, isDarkMode]);

  // Últimos Pedidos do Figma (Fiel ao Figma: Antarctica, Albatros, Skol, Brahma, Heineken, Spaten)
  const recentOrderProducts = useMemo(() => [
    {
      id: 'rec_1',
      name: 'Cerveja Antarctica',
      brand: 'Antarctica',
      unit: '350ml',
      price: 6.00,
      image: require('../../assets/products/guarana.png'),
      productId: 'prod_19',
      product: products.find(p => p.id === 'prod_19') || products.find(p => p.brand.toLowerCase() === 'antarctica' && !p.name.includes('Tônica')) || products[0],
    },
    {
      id: 'rec_2',
      name: 'Cerveja Albatros',
      brand: 'Albatros',
      unit: '473ml',
      price: 5.50,
      image: require('../../assets/products/eisenbahn.png'),
      productId: 'prod_21',
      product: products.find(p => p.id === 'prod_21') || products.find(p => p.brand.toLowerCase() === 'albatros') || products[1] || products[0],
    },
    {
      id: 'rec_3',
      name: 'Cerveja Skol',
      brand: 'Skol',
      unit: '269ml',
      price: 5.10,
      image: require('../../assets/products/brahma.png'),
      productId: 'prod_18',
      product: products.find(p => p.id === 'prod_18') || products.find(p => p.brand.toLowerCase() === 'skol') || products[2] || products[0],
    },
    {
      id: 'rec_4',
      name: 'Cerveja Brahma',
      brand: 'Brahma',
      unit: '350ml',
      price: 4.20,
      image: require('../../assets/products/brahma.png'),
      productId: 'prod_20',
      product: products.find(p => p.id === 'prod_20') || products.find(p => p.id === 'prod_15') || products[3] || products[0],
    },
    {
      id: 'rec_5',
      name: 'Cerveja Heineken',
      brand: 'Heineken',
      unit: '330ml',
      price: 5.80,
      image: require('../../assets/products/heineken.png'),
      productId: 'prod_9',
      product: products.find(p => p.id === 'prod_9') || products.find(p => p.id === 'prod_14') || products[4] || products[0],
    },
    {
      id: 'rec_6',
      name: 'Cerveja Spaten',
      brand: 'Spaten',
      unit: '350ml',
      price: 4.50,
      image: require('../../assets/products/spaten.png'),
      productId: 'prod_1',
      product: products.find(p => p.id === 'prod_1') || products[0],
    },
  ], [products]);

  // Sugestões dinâmicas de busca baseadas no termo digitado
  const searchSuggestions = searchQuery.trim().length > 0 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchSubmit = (term: string) => {
    setSearchQuery(term);
    setIsSearchActive(true);
    setIsSearchFocused(false);
    if (term.trim()) {
      addRecentSearch(term.trim());
    }
  };

  const handleRemoveRecentSearch = (itemToRemove: string) => {
    removeRecentSearch(itemToRemove);
  };

  const handleClearAllRecentSearches = () => {
    clearRecentSearches();
  };

  const handleResetFilters = () => {
    setActiveQuickFilter('todos');
    setSelectedCategory('todas');
    setSelectedSort('mais_proximo');
    setFilterDiscountOnly(false);
    setFilterReturnableOnly(false);
    setMaxPrice(null);
    setSearchQuery('');
    setIsSearchActive(false);
  };

  // Filtragem composta e real dos produtos
  const filteredProducts = products.filter(prod => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchText = prod.name.toLowerCase().includes(q) || prod.brand.toLowerCase().includes(q);
      if (!matchText) return false;
    }
    if (selectedCategory !== 'todas' && prod.category !== selectedCategory) {
      return false;
    }
    if (activeQuickFilter === 'proximos') {
      const dist = supplierDistMap[prod.supplierId]?.distanceKm ?? 999;
      if (dist > 6.0) return false;
    }
    if (activeQuickFilter === 'mais_vendidas' && !prod.isPromoted) {
      return false;
    }
    if ((activeQuickFilter === 'retornaveis' || filterReturnableOnly) && !prod.isReturnableBottle) {
      return false;
    }
    if ((activeQuickFilter === 'desconto' || filterDiscountOnly) && !prod.originalPrice) {
      return false;
    }
    if (maxPrice !== null && prod.price > maxPrice) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (selectedSort === 'mais_proximo') {
      const distA = supplierDistMap[a.supplierId]?.distanceKm ?? 999;
      const distB = supplierDistMap[b.supplierId]?.distanceKm ?? 999;
      return distA - distB;
    }
    if (selectedSort === 'menor_preco') return a.price - b.price;
    if (selectedSort === 'maior_preco') return b.price - a.price;
    return 0;
  });

  const activeFilterCount = 
    (selectedCategory !== 'todas' ? 1 : 0) +
    (activeQuickFilter !== 'todos' ? 1 : 0) +
    (filterDiscountOnly ? 1 : 0) +
    (filterReturnableOnly ? 1 : 0) +
    (selectedSort !== 'mais_proximo' ? 1 : 0) +
    (maxPrice !== null ? 1 : 0);

  const isFilteringActive = activeFilterCount > 0 || searchQuery.trim().length > 0;
  const cartItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Bar com Localização Dinâmica de Entrega centralizada e limpa */}
      <View style={[styles.topBar, { backgroundColor: theme.background }]}>
        {/* Placeholder esquerdo simétrico para centralizar perfeitamente o bar na tela */}
        <View style={styles.topBarSpacer} />

        <View style={styles.barCenterContainer}>
          <LocationHeaderSelector onPress={() => setShowBarModal(true)} />
        </View>

        <TouchableOpacity 
          style={styles.notificationBtn}
          onPress={() => setShowNotificationsModal(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Opções e Notificações"
        >
          <Ionicons 
            name={unreadNotificationCount > 0 ? "notifications" : "ellipsis-vertical"} 
            size={22} 
            color={unreadNotificationCount > 0 ? "#FFC107" : theme.text} 
          />
          {unreadNotificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner de Estado Vazio / Visitante */}
        {!currentUser && (
          <View style={[styles.guestBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.guestBannerLeft}>
              <View style={styles.guestIconCircle}>
                <Ionicons name="sparkles" size={20} color={isDarkMode ? "#FFC107" : "#D97706"} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.guestBannerTitle, { color: theme.text }]}>
                  Modo Visitante
                </Text>
                <Text style={[styles.guestBannerSub, { color: theme.textSecondary }]}>
                  Conecte seu bar ou cadastre seu CNPJ para faturamento a 30 dias e preços de atacado.
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.guestLoginBtn}
              onPress={() => onOpenLogin && onOpenLogin()}
              activeOpacity={0.85}
            >
              <Text style={styles.guestLoginBtnText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Barra de Busca Interativa com Animação Fluida de Transição (Figma: Busca) */}
        <View style={styles.searchSection}>
          {isSearchActive && (
            <Animated.View style={{
              opacity: backBtnOpacity,
              transform: [{ translateX: backBtnTranslateX }],
              marginRight: 2,
            }}>
              <TouchableOpacity 
                onPress={() => {
                  setIsSearchActive(false);
                  setIsSearchFocused(false);
                  setSearchQuery('');
                }}
                style={[styles.searchBackBtn, { backgroundColor: theme.surfaceInput, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color={theme.text} />
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={[
            styles.searchInputBox,
            { backgroundColor: isDarkMode ? '#101F2D' : '#F8FAFC', borderColor: (isSearchFocused || isSearchActive) ? '#FFC107' : theme.border },
            (isSearchFocused || isSearchActive) && styles.searchInputBoxFocused
          ]}>
            <Ionicons 
              name="search" 
              size={18} 
              color={(isSearchFocused || isSearchActive) ? "#FFC107" : theme.textMuted} 
              style={{ marginRight: 8 }} 
            />
            <TextInput
              style={[
                styles.searchInput, 
                { color: theme.text },
                Platform.OS === 'web' && ({
                  outline: 'none',
                  outlineStyle: 'none',
                  outlineWidth: 0,
                  border: 'none',
                  borderStyle: 'none',
                  borderWidth: 0,
                  boxShadow: 'none',
                } as any)
              ]}
              placeholder="Busca"
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length > 0) setIsSearchActive(true);
              }}
              onFocus={() => {
                setIsSearchActive(true);
                setIsSearchFocused(true);
              }}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onSubmitEditing={() => handleSearchSubmit(searchQuery)}
              returnKeyType="search"
              underlineColorAndroid="transparent"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.filterMenuBtn, 
              { backgroundColor: theme.surfaceInput, borderColor: theme.border, borderWidth: 1 },
              activeFilterCount > 0 && styles.filterMenuBtnActive
            ]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="options-outline" 
              size={22} 
              color={activeFilterCount > 0 ? "#0D1C28" : theme.text} 
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Banner de Ativação de GPS se a permissão não foi concedida */}
        {locationPermission !== 'granted' && (
          <View style={[styles.locationBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.locationBannerIconBox}>
              <Ionicons name="location-outline" size={24} color={isDarkMode ? "#FFC107" : "#D97706"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationBannerTitle, { color: theme.text }]}>
                Distribuidores Mais Próximos
              </Text>
              <Text style={[styles.locationBannerSub, { color: theme.textSecondary }]}>
                Ative sua localização para ver centros de distribuição que entregam chopp e cervejas no seu bairro.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.locationBannerBtn}
              onPress={requestLocation}
              disabled={isRequestingLocation}
              activeOpacity={0.8}
            >
              {isRequestingLocation ? (
                <ActivityIndicator size="small" color="#0D1C28" />
              ) : (
                <Text style={styles.locationBannerBtnText}>Ativar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Dropdown de Auto-Sugestões em Tempo Real */}
        {isSearchFocused && searchSuggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <Text style={styles.suggestionsHeader}>Sugestões em Tempo Real</Text>
            {searchSuggestions.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionRow}
                onPress={() => {
                  handleSearchSubmit(item.name);
                  if (onSelectProduct) onSelectProduct(item);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="search-outline" size={14} color="#FFC107" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText}>{item.name}</Text>
                <Text style={styles.suggestionPrice}>R$ {item.price.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Histórico de Buscas Recentes (conforme FlowStock e StackFood) */}
        {recentSearches.length > 0 && searchQuery.trim().length === 0 && (
          <View style={styles.recentSearchBox}>
            <View style={styles.recentSearchHeader}>
              <Text style={styles.recentSearchTitle}>Buscas Recentes</Text>
              <TouchableOpacity onPress={handleClearAllRecentSearches}>
                <Text style={styles.recentClearAllText}>Limpar tudo</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentChipsRow}>
              {recentSearches.map((item, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.recentChip}
                  onPress={() => setSearchQuery(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="time-outline" size={13} color="#8FA0AF" style={{ marginRight: 4 }} />
                  <Text style={styles.recentChipText}>{item}</Text>
                  <TouchableOpacity 
                    onPress={() => handleRemoveRecentSearch(item)}
                    style={{ marginLeft: 6 }}
                  >
                    <Ionicons name="close" size={13} color="#8FA0AF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Se busca ou filtro estiver ativo, exibe o catálogo de busca com animação suave de transição */}
        {(isFilteringActive || isSearchActive) ? (
          <Animated.View style={[
            { marginBottom: 24, paddingHorizontal: 16 },
            { opacity: searchContentOpacity, transform: [{ translateY: searchContentTranslateY }] }
          ]}>
            {/* Filtros Rápidos Elegantes em Pills Horizontais na Busca */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.quickFiltersScroll}
            >
              {[
                { key: 'todos', label: 'Todos', icon: 'grid-outline' },
                { key: 'proximos', label: 'Mais Próximos', icon: 'navigate-outline' },
                { key: 'mais_vendidas', label: 'Mais Vendidos', icon: 'flame-outline' },
                { key: 'retornaveis', label: 'Retornáveis', icon: 'repeat-outline' },
                { key: 'desconto', label: 'Com Desconto', icon: 'pricetag-outline' },
                { key: 'entrega_hoje', label: 'Entrega Hoje', icon: 'flash-outline' },
              ].map(qf => {
                const isActive = activeQuickFilter === qf.key;
                return (
                  <TouchableOpacity
                    key={qf.key}
                    style={[
                      styles.quickFilterChip,
                      isActive && styles.quickFilterChipActive
                    ]}
                    onPress={() => setActiveQuickFilter(qf.key as any)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={qf.icon as any} 
                      size={14} 
                      color={isActive ? "#FFC107" : (isDarkMode ? "#FFFFFF" : "#0D1C28")} 
                      style={{ marginRight: 6 }} 
                    />
                    <Text style={[
                      styles.quickFilterText,
                      isActive && styles.quickFilterTextActive
                    ]}>
                      {qf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Faixa de Filtros Ativos com Contador e Botão de Limpar */}
            {isFilteringActive && (
              <View style={styles.activeFiltersBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="filter" size={14} color="#FFC107" />
                  <Text style={styles.activeFiltersText}>
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'bebida encontrada' : 'bebidas encontradas'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleResetFilters} style={styles.resetFiltersBtn}>
                  <Text style={styles.resetFiltersText}>Limpar Filtros</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Distribuidores Mais Próximos em Carrossel Horizontal na Busca */}
            <View style={styles.nearbySuppliersSection}>
              <View style={styles.sectionHeaderNoPad}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="navigate-circle" size={18} color="#FFC107" />
                  <Text style={styles.sectionTitle}>Distribuidores Mais Próximos</Text>
                </View>
                <Text style={styles.filterMetaCount}>{sortedSuppliers.length} próximos</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScroll}>
                {sortedSuppliers.map(sup => (
                  <TouchableOpacity 
                    key={sup.id} 
                    style={[styles.nearbySupCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => onSelectSupplier(sup)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.nearbySupTop}>
                      <View style={[styles.nearbySupDistBadge, { backgroundColor: isDarkMode ? '#1E3A5F' : '#FFC107' }]}>
                        <Ionicons name="location-sharp" size={11} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
                        <Text style={[styles.nearbySupDistText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>{sup.distanceInfo.formatted}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="star" size={11} color="#FFC107" style={{ marginRight: 3 }} />
                        <Text style={styles.nearbySupRating}>{sup.rating}</Text>
                      </View>
                    </View>
                    <Text style={[styles.nearbySupName, { color: theme.text }]} numberOfLines={1}>{sup.tradeName}</Text>
                    <Text style={[styles.nearbySupSub, { color: theme.textSecondary }]} numberOfLines={1}>{sup.corporateName}</Text>
                    <View style={styles.nearbySupFooter}>
                      <View style={styles.nearbySupEtaBox}>
                        <Ionicons name="time-outline" size={12} color={theme.textMuted} style={{ marginRight: 4 }} />
                        <Text style={styles.nearbySupEta} numberOfLines={1}>{sup.deliveryTimeEstimate || '24h'}</Text>
                      </View>
                      <View style={styles.nearbySupMinBadge}>
                        <Text style={styles.nearbySupMin}>Min R${sup.minOrderValue.toFixed(0)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.sectionHeaderNoPad, { marginTop: 8 }]}>
              <Text style={styles.sectionTitle}>
                {searchQuery.trim().length > 0 
                  ? `Resultados para "${searchQuery}"` 
                  : 'Bebidas Filtradas'}
              </Text>
              <Text style={styles.filterMetaCount}>{filteredProducts.length} itens</Text>
            </View>

            {filteredProducts.length === 0 ? (
              <View style={styles.emptyFilteredBox}>
                <Ionicons name="wine-outline" size={48} color="#627585" />
                <Text style={styles.emptyFilteredTitle}>Nenhuma bebida encontrada</Text>
                <Text style={styles.emptyFilteredSub}>Tente ajustar os filtros ou digitar outro termo de busca.</Text>
                <TouchableOpacity onPress={handleResetFilters} style={styles.emptyResetBtn}>
                  <Text style={styles.emptyResetBtnText}>Restaurar Catálogo Completo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredProducts.map(prod => (
                <TouchableOpacity 
                  key={prod.id} 
                  style={styles.beerRowCard}
                  onPress={() => onSelectProduct && onSelectProduct(prod)}
                  activeOpacity={0.9}
                >
                  <View style={styles.beerRowLeft}>
                    <Image 
                      source={getProductImage(prod)} 
                      style={styles.beerRowImg}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.beerRowBody}>
                    {prod.originalPrice && (
                      <View style={styles.discountTag}>
                        <Text style={styles.discountTagText}>
                          -{Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)}%
                        </Text>
                      </View>
                    )}
                    <Text style={styles.beerRowName}>{prod.name}</Text>
                    <Text style={styles.deliveryBadgeText}>{prod.brand} • {prod.unit}</Text>
                    <View style={styles.beerRowPrices}>
                      <Text style={styles.beerRowCurrentPrice}>R$ {prod.price.toFixed(2)}</Text>
                      {prod.originalPrice && (
                        <Text style={styles.beerRowOldPrice}>R$ {prod.originalPrice.toFixed(2)}</Text>
                      )}
                    </View>
                    <Text style={styles.supplierSub}>
                      {prod.supplierName} • {supplierDistMap[prod.supplierId]?.formatted || '1.8 km'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.beerRowAddBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      addToCart(prod, 1);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={20} color="#0D1C28" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </Animated.View>
        ) : (
          <>
            {/* 1. SEÇÃO: FAVORITAS (Fiel ao Figma) */}
            <View style={styles.figmaSectionHeader}>
              <Text style={[styles.figmaSectionTitle, { color: theme.text }]}>Favoritas</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.favoritasScroll}
            >
              {favoriteDistributors.map(fav => (
                <TouchableOpacity 
                  key={fav.id}
                  style={styles.favoritaItem}
                  onPress={() => fav.supplier && onSelectSupplier(fav.supplier)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.favoritaCircle, { backgroundColor: fav.bg, borderColor: fav.border }]}>
                    {fav.type === 'ambev' && (
                      <Text style={styles.ambevFavText}>ambev</Text>
                    )}
                    {fav.type === 'topbeer' && (
                      <View style={styles.topbeerFavBox}>
                        <Ionicons name="beer" size={17} color="#FFC107" />
                        <Text style={styles.topbeerFavText}>TopBeer</Text>
                      </View>
                    )}
                    {fav.type === 'breja' && (
                      <View style={styles.brejaFavBox}>
                        <Ionicons name="star" size={13} color="#FFC107" />
                        <Text style={styles.brejaFavText}>{"Breja's"}</Text>
                      </View>
                    )}
                    {fav.type === 'proibida' && (
                      <View style={styles.proibidaFavBox}>
                        <Ionicons name="ban" size={26} color="#0F172A" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.favoritaLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                    {fav.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 2. HERO BANNER PROMOCIONAL: HOJE TEM CERVEJA EM PROMOÇÃO (Fiel ao Figma) */}
            <TouchableOpacity 
              style={styles.figmaPromoBannerCard}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedCategory('cervejas');
                setActiveQuickFilter('desconto');
              }}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706', '#B45309']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.figmaPromoBannerGradient}
              >
                {/* Tag de Marca FlowStock */}
                <View style={styles.figmaPromoFlowTag}>
                  <Text style={styles.figmaPromoFlowTagText}>FlowStock</Text>
                </View>

                {/* Bloco Central Superior: hoje tem CERVEJA em promoção */}
                <View style={styles.figmaPromoTitleBlock}>
                  <Text style={styles.figmaPromoHojeTem}>hoje tem</Text>
                  <Text style={styles.figmaPromoCerveja}>CERVEJA</Text>
                  <View style={styles.figmaPromoBadgePill}>
                    <Text style={styles.figmaPromoBadgeText}>em promoção</Text>
                  </View>
                </View>

                {/* Garrafas Centrais em Destaque */}
                <View style={styles.figmaPromoCenterBottles}>
                  <Image 
                    source={getProductImage('brahma')} 
                    style={[styles.figmaPromoBottle, { transform: [{ rotate: '-8deg' }], marginRight: -12 }]} 
                    resizeMode="contain" 
                  />
                  <Image 
                    source={getProductImage('heineken')} 
                    style={[styles.figmaPromoBottle, { zIndex: 2 }]} 
                    resizeMode="contain" 
                  />
                  <Image 
                    source={getProductImage('spaten')} 
                    style={[styles.figmaPromoBottle, { transform: [{ rotate: '8deg' }], marginLeft: -12 }]} 
                    resizeMode="contain" 
                  />
                </View>

                {/* Badge Lateral Esquerdo: 1 dia */}
                <View style={styles.figmaPromoDeliveryBadge}>
                  <Ionicons name="arrow-back" size={10} color="#FFC107" />
                  <Text style={styles.figmaPromoDeliveryText}>1 dia</Text>
                  <Ionicons name="arrow-forward" size={10} color="#FFC107" />
                </View>

                {/* Ícone de Caneca de Chopp no Canto Direito */}
                <View style={styles.figmaPromoBeerMug}>
                  <Ionicons name="beer" size={28} color="rgba(255, 255, 255, 0.75)" />
                </View>

                {/* Botão Inferior: CONFIRA TODAS */}
                <View style={styles.figmaPromoCtaBtn}>
                  <Text style={styles.figmaPromoCtaText}>CONFIRA TODAS</Text>
                  <Ionicons name="beer" size={13} color="#FFC107" style={{ marginLeft: 4 }} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* 3. SEÇÃO: ÚLTIMOS PEDIDOS (Fiel ao Figma) */}
            <View style={styles.figmaSectionHeader}>
              <Text style={[styles.figmaSectionTitle, { color: theme.text }]}>Últimos pedidos</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.ultimosPedidosScroll}
            >
              {recentOrderProducts.map(item => {
                const isAdded = recentlyAddedId === item.id;
                return (
                  <View 
                    key={item.id}
                    style={[styles.ultimosCard, { backgroundColor: theme.card, borderColor: isDarkMode ? '#1E354A' : '#F1F5F9' }]}
                  >
                    <TouchableOpacity 
                      style={[
                        styles.ultimosAddBtn,
                        isAdded && { backgroundColor: '#10B981' }
                      ]}
                      onPress={() => item.product && handleQuickAdd(item.product, item.id)}
                      activeOpacity={0.75}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons 
                        name={isAdded ? "checkmark" : "add"} 
                        size={14} 
                        color={isAdded ? "#FFFFFF" : (isDarkMode ? '#FFFFFF' : '#0D1C28')} 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1, width: '100%', alignItems: 'center' }}
                      onPress={() => item.product && onSelectProduct && onSelectProduct(item.product)}
                      activeOpacity={0.88}
                    >
                      <View style={styles.ultimosImgContainer}>
                        <Image source={item.image} style={styles.ultimosProductImg} resizeMode="contain" />
                      </View>
                      <Text style={[styles.ultimosPrice, { color: theme.text }]}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
                      <Text style={[styles.ultimosSub, { color: theme.textMuted }]} numberOfLines={1}>
                        {item.brand} • {item.unit}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
            {/* Banner Promocional FlowStock Interativo */}
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bannerContainer}
            >
              {promoBanners.map(banner => (
                <TouchableOpacity 
                  key={banner.id} 
                  style={styles.promoBannerCard}
                  activeOpacity={0.88}
                  onPress={() => {
                    if (banner.action === 'chopp') {
                      setSelectedCategory('chopp_barris');
                      setSearchQuery('');
                      setActiveQuickFilter('todos');
                    } else if (banner.action === 'ambev') {
                      if (mainSupplier) onSelectSupplier(mainSupplier);
                    }
                  }}
                >
                  <Image source={banner.image} style={styles.promoBannerImg} />
                  <View style={styles.promoBannerOverlay}>
                    <View style={styles.promoBannerContent}>
                      <View style={styles.promoBannerBadge}>
                        <Text style={styles.promoBannerBadgeText}>{banner.tag}</Text>
                      </View>
                      <Text style={styles.promoBannerTitle} numberOfLines={2}>{banner.title}</Text>
                      <Text style={styles.promoBannerSub} numberOfLines={2}>{banner.subtitle}</Text>
                    </View>
                    <View style={styles.promoBannerCtaBtn}>
                      <Text style={styles.promoBannerCtaText}>{banner.ctaText} →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Categorias de Bebidas em Ícones */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categorias</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
              {beverageCategories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === cat.id && styles.categoryCardActive
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.categoryIconCircle,
                    selectedCategory === cat.id && styles.categoryIconCircleActive
                  ]}>
                    <Ionicons 
                      name={cat.icon as any} 
                      size={20} 
                      color={selectedCategory === cat.id ? "#0D1C28" : "#FFC107"} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryLabel,
                    selectedCategory === cat.id && styles.categoryLabelActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Card do Fornecedor Principal (Ambev) - Clicável para abrir catálogo */}
            <TouchableOpacity 
              style={styles.supplierCard}
              onPress={() => mainSupplier && onSelectSupplier(mainSupplier)}
              activeOpacity={0.88}
            >
              <View style={styles.supplierHeader}>
                <View style={styles.supplierLogoCircle}>
                  <Text style={styles.ambevLogoText}>ambev</Text>
                </View>

                <View style={styles.supplierInfo}>
                  <Text style={styles.supplierTitle}>{mainSupplier?.tradeName.split(' ')[1] || 'Ambev'}</Text>
                  <Text style={styles.supplierSub} numberOfLines={1}>
                    Distribuidor Oficial de Chopp & Cervejas • Toque p/ catálogo
                  </Text>
                  
                  <View style={styles.supplierMetaRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="star" size={12} color="#FFC107" style={{ marginRight: 3 }} />
                      <Text style={styles.ratingText}>4.8</Text>
                    </View>
                    <Text style={styles.metaDivider}>|</Text>
                    <Text style={styles.deliveryEstimateText}>Tempo médio 1 dia</Text>
                    {mainSupplier && (
                      <>
                        <Text style={styles.metaDivider}>|</Text>
                        <Text style={styles.supplierDistanceText}>
                          {getSupplierDistance(mainSupplier).formatted}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Coração Dourado Favorito */}
                <TouchableOpacity 
                  style={styles.favBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    setIsFavorite(!isFavorite);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={24} 
                    color="#FFC107" 
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Seção: Distribuidores Próximos do seu Bar */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location-sharp" size={18} color="#FFC107" />
                  <Text style={styles.sectionTitle}>Distribuidores Próximos</Text>
                </View>
                <TouchableOpacity onPress={requestLocation} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.gpsRefreshText}>Atualizar GPS</Text>
                  <Ionicons name="refresh" size={12} color="#FFC107" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScroll}>
              {sortedSuppliers.map(sup => (
                <TouchableOpacity 
                  key={sup.id} 
                  style={[styles.nearbySupCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => onSelectSupplier(sup)}
                  activeOpacity={0.88}
                >
                  <View style={styles.nearbySupTop}>
                    <View style={[styles.nearbySupDistBadge, { backgroundColor: isDarkMode ? '#1E3A5F' : '#FFC107' }]}>
                      <Ionicons name="location-sharp" size={11} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
                      <Text style={[styles.nearbySupDistText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>{sup.distanceInfo.formatted}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="star" size={11} color="#FFC107" style={{ marginRight: 3 }} />
                      <Text style={styles.nearbySupRating}>{sup.rating}</Text>
                    </View>
                  </View>
                  <Text style={[styles.nearbySupName, { color: theme.text }]} numberOfLines={1}>{sup.tradeName}</Text>
                  <Text style={[styles.nearbySupSub, { color: theme.textSecondary }]} numberOfLines={1}>{sup.corporateName}</Text>
                  <View style={styles.nearbySupFooter}>
                    <View style={styles.nearbySupEtaBox}>
                      <Ionicons name="time-outline" size={12} color={theme.textMuted} style={{ marginRight: 4 }} />
                      <Text style={styles.nearbySupEta} numberOfLines={1}>{sup.deliveryTimeEstimate || '24h'}</Text>
                    </View>
                    <View style={styles.nearbySupMinBadge}>
                      <Text style={styles.nearbySupMin}>Min R${sup.minOrderValue.toFixed(0)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Seção: Peça novamente com Imagem Grande */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Peça novamente</Text>
            </View>

            <TouchableOpacity 
              style={styles.reorderCard}
              onPress={() => onSelectProduct && onSelectProduct(reorderProduct)}
              activeOpacity={0.9}
            >
              <View style={styles.reorderLeft}>
                <View style={styles.reorderImgBox}>
                  <Image 
                    source={getProductImage(reorderProduct)} 
                    style={styles.bottleImg}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={styles.reorderBody}>
                <View style={styles.reorderTopRow}>
                  <View>
                    <Text style={styles.reorderName}>Heineken - 600ml</Text>
                    <Text style={styles.reorderUnitPrice}>Uni R$7,70 • Retornável</Text>
                  </View>
                  <Text style={styles.reorderTotalPrice}>R${(7.70 * reorderQuantity).toFixed(2).replace('.', ',')}</Text>
                </View>

                <View style={styles.reorderActionRow}>
                  {/* Controle de Quantidade: [-] 25 [+] */}
                  <View style={styles.qtyControlBox}>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        setReorderQuantity(Math.max(1, reorderQuantity - 1));
                      }}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyNumText}>{reorderQuantity}</Text>

                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        setReorderQuantity(reorderQuantity + 1);
                      }}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Botão Amarelo: Adicionar na sacola */}
                  <TouchableOpacity 
                    style={styles.addToBagBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (reorderProduct) addToCart(reorderProduct, reorderQuantity);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.addToBagBtnText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>Adicionar na sacola</Text>
                    <Ionicons name="bag-handle" size={14} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>

            {/* Seção: Destaques com Cards Maiores e Garrafas Grandes */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Destaques</Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.highlightScroll}
            >
              {highlightProducts.map(item => {
                const prod = products.find(p => p.id === item.productId)
                  || products.find(p => p.brand.toLowerCase() === item.brand.toLowerCase() && !p.category.includes('chopp'))
                  || products.find(p => p.brand.toLowerCase() === item.brand.toLowerCase())
                  || products[0];

                const isAdded = recentlyAddedId === item.id;

                return (
                  <View 
                    key={item.id} 
                    style={styles.highlightCard}
                  >
                    <TouchableOpacity 
                      style={[
                        styles.floatingAddBtn,
                        isAdded && { backgroundColor: '#10B981' }
                      ]}
                      onPress={() => handleQuickAdd(prod, item.id)}
                      activeOpacity={0.75}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons 
                        name={isAdded ? "checkmark" : "add"} 
                        size={20} 
                        color={isAdded ? "#FFFFFF" : (isDarkMode ? '#FFFFFF' : '#0D1C28')} 
                      />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1, width: '100%', alignItems: 'center' }}
                      onPress={() => onSelectProduct && onSelectProduct(prod)}
                      activeOpacity={0.88}
                    >
                      <View style={styles.highlightImgBox}>
                        <Image 
                          source={item.image} 
                          style={styles.highlightBottleImg}
                          resizeMode="contain"
                        />
                      </View>

                      <Text style={styles.highlightPrice}>R${item.price.toFixed(2).replace('.', ',')}</Text>
                      <Text style={styles.highlightName} numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            {/* Lista de Cervejas com Desconto em Grade com Imagens Grandes */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ofertas de Cervejas em Grade</Text>
            </View>

            {[
              { id: 'of_1', name: 'Heineken - 600ml Retornável', price: 'R$7,70', oldPrice: 'R$8,25', discount: '-7%', brand: 'Heineken', img: getProductImage('heineken'), productId: 'prod_14' },
              { id: 'of_2', name: 'Brahma Duplo Malte - 600ml', price: 'R$6,20', oldPrice: 'R$6,70', discount: '-8%', brand: 'Brahma', img: getProductImage('brahma'), productId: 'prod_15' },
              { id: 'of_3', name: 'Spaten Puro Malte - 350ml', price: 'R$3,95', oldPrice: 'R$4,30', discount: '-8%', brand: 'Spaten', img: getProductImage('spaten'), productId: 'prod_1' },
            ].map((prodItem) => {
              const matched = products.find(p => p.id === prodItem.productId) 
                || products.find(p => p.brand.toLowerCase() === prodItem.brand.toLowerCase() && !p.category.includes('chopp')) 
                || products[0];
              const isAdded = recentlyAddedId === prodItem.id;

              return (
                <View 
                  key={prodItem.id} 
                  style={styles.beerRowCard}
                >
                  <TouchableOpacity 
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => onSelectProduct && onSelectProduct(matched)}
                    activeOpacity={0.88}
                  >
                    <View style={styles.beerRowLeft}>
                      <Image 
                        source={prodItem.img} 
                        style={styles.beerRowImg}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.beerRowBody}>
                      <View style={styles.discountTag}>
                        <Text style={styles.discountTagText}>{prodItem.discount}</Text>
                      </View>
                      <Text style={styles.beerRowName}>{prodItem.name}</Text>
                      <View style={styles.beerRowPrices}>
                        <Text style={styles.beerRowCurrentPrice}>{prodItem.price}</Text>
                        <Text style={styles.beerRowOldPrice}>{prodItem.oldPrice}</Text>
                      </View>
                      <Text style={styles.deliveryBadgeText}>Entrega em 24h • Distribuidor Ambev</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.beerRowAddBtn, isAdded && { backgroundColor: '#10B981' }]}
                    onPress={() => handleQuickAdd(matched, prodItem.id)}
                    activeOpacity={0.75}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons 
                      name={isAdded ? "checkmark" : "add"} 
                      size={20} 
                      color={isAdded ? "#FFFFFF" : (isDarkMode ? '#FFFFFF' : '#0D1C28')} 
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: cartItemsCount > 0 ? 80 : 40 }} />
      </ScrollView>

      {/* Floating Bottom Cart Bar (igual ao StackFood bottom_cart_widget) */}
      {cartItemsCount > 0 && (
        <View style={styles.floatingBottomCart}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{cartItemsCount}</Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.floatingCartTitle} numberOfLines={1}>
                {cartSupplier ? cartSupplier.tradeName : 'Sacola de Compras'}
              </Text>
              <Text style={styles.floatingCartPrice}>R$ {cartTotal.toFixed(2).replace('.', ',')}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.floatingCartBtn}
            onPress={() => {
              if (onOpenCheckout) onOpenCheckout();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.floatingCartBtnText}>Finalizar Pedido</Text>
            <Ionicons name="chevron-forward" size={16} color="#0D1C28" />
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Filtros (Fiel ao Screenshot 2 do Figma) */}
      <Modal 
        visible={showFilterModal} 
        animationType="slide" 
        transparent={true} 
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFilterModal(false)}
        >
          <View 
            style={styles.filterSheet}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.dragHandle} />

            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>Filtros Avançados</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Ordenar por */}
              <Text style={styles.filterSectionTitle}>Ordenar por</Text>
              <View style={styles.filterChipsGrid}>
                {[
                  { key: 'mais_proximo', label: 'Mais Próximo' },
                  { key: 'menor_preco', label: 'Preço mais baixo' },
                  { key: 'maior_preco', label: 'Preço mais alto' },
                  { key: 'mais_rapido', label: 'Entrega mais rápida' },
                  { key: 'agendada', label: 'Entrega agendada' },
                ].map(sort => (
                  <TouchableOpacity
                    key={sort.key}
                    style={[styles.sortChip, selectedSort === sort.key && styles.sortChipActive]}
                    onPress={() => setSelectedSort(sort.key as any)}
                  >
                    <Text style={[styles.sortChipText, selectedSort === sort.key && styles.sortChipTextActive]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterDivider} />

              {/* Filtrar por */}
              <Text style={styles.filterSectionTitle}>Filtrar por</Text>

              {[
                { label: '5 estrelas', checked: false, toggle: () => {} },
                { label: '4+ estrelas', checked: filterFourStars, toggle: () => setFilterFourStars(!filterFourStars) },
                { label: 'Apenas Retornáveis (Troca de Vasilhame)', checked: filterReturnableOnly, toggle: () => setFilterReturnableOnly(!filterReturnableOnly) },
                { label: 'Produtos com descontos', checked: filterDiscountOnly, toggle: () => setFilterDiscountOnly(!filterDiscountOnly) },
              ].map((filter, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.checkboxRow}
                  onPress={filter.toggle}
                >
                  <Text style={styles.checkboxLabel}>{filter.label}</Text>
                  <Ionicons 
                    name={filter.checked ? "checkbox" : "square-outline"} 
                    size={22} 
                    color={filter.checked ? "#FFC107" : "#627585"} 
                  />
                </TouchableOpacity>
              ))}

              <View style={styles.filterDivider} />

              {/* Faixa de Preço Máximo */}
              <Text style={styles.filterSectionTitle}>Preço Máximo</Text>
              <View style={styles.filterChipsGrid}>
                {[
                  { value: null, label: 'Qualquer Valor' },
                  { value: 50, label: 'Até R$ 50' },
                  { value: 150, label: 'Até R$ 150' },
                  { value: 300, label: 'Até R$ 300' },
                  { value: 600, label: 'Até R$ 600' },
                ].map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.sortChip, maxPrice === p.value && styles.sortChipActive]}
                    onPress={() => setMaxPrice(p.value)}
                  >
                    <Text style={[styles.sortChipText, maxPrice === p.value && styles.sortChipTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 }}>
                <TouchableOpacity 
                  style={styles.resetModalBtn}
                  onPress={() => {
                    handleResetFilters();
                    setShowFilterModal(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.resetModalBtnText}>Limpar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.applyFilterBtn}
                  onPress={() => setShowFilterModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.applyFilterBtnText}>Aplicar ({filteredProducts.length})</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Bares */}
      <BarSelectorModal
        visible={showBarModal}
        onClose={() => setShowBarModal(false)}
      />

      {/* Central de Notificações */}
      <NotificationsModal
        visible={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        onNavigateToOrders={() => {
          setShowNotificationsModal(false);
          if (onOpenOrders) onOpenOrders();
        }}
        onNavigateToInvoices={() => {
          setShowNotificationsModal(false);
          if (onOpenInvoices) onOpenInvoices();
        }}
        onNavigateToCoupons={() => {
          setShowNotificationsModal(false);
          if (onOpenInvoices) onOpenInvoices();
        }}
      />


    </SafeAreaView>
  );
};

function getStyles(theme: ThemeColors, isDarkMode: boolean) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  guestBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.15)' : '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  guestBannerSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  guestLoginBtn: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  guestLoginBtnText: {
    color: '#0D1C28',
    fontSize: 12,
    fontWeight: 'bold',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.background,
  },
  figmaSectionHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  figmaSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  favoritasScroll: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 4,
  },
  favoritaItem: {
    alignItems: 'center',
    width: 68,
  },
  favoritaCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)' } : { elevation: 2 }),
  },
  favoritaLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  ambevFavText: {
    color: '#002B7F',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: -0.5,
  },
  topbeerFavBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbeerFavText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 0.2,
  },
  brejaFavBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brejaFavText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 10,
  },
  proibidaFavBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  figmaPromoBannerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 165,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 14px rgba(245, 158, 11, 0.28)' } : { elevation: 4 }),
  },
  figmaPromoBannerGradient: {
    flex: 1,
    padding: 12,
    position: 'relative',
    justifyContent: 'space-between',
  },
  figmaPromoFlowTag: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  figmaPromoFlowTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  figmaPromoTitleBlock: {
    alignItems: 'center',
    marginTop: 2,
  },
  figmaPromoHojeTem: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: 'bold',
    fontStyle: 'italic',
    lineHeight: 15,
  },
  figmaPromoCerveja: {
    color: '#7F1D1D',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    lineHeight: 20,
  },
  figmaPromoBadgePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  figmaPromoBadgeText: {
    color: '#FFC107',
    fontSize: 9.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  figmaPromoCenterBottles: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  figmaPromoBottle: {
    width: 38,
    height: 72,
  },
  figmaPromoDeliveryBadge: {
    position: 'absolute',
    bottom: 24,
    left: 14,
    backgroundColor: '#0D1C28',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFC107',
    gap: 3,
  },
  figmaPromoDeliveryText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  figmaPromoBeerMug: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  figmaPromoCtaBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#0D1C28',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  figmaPromoCtaText: {
    color: '#FFC107',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  ultimosPedidosScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 16,
  },
  ultimosCard: {
    width: 106,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' } : { elevation: 1 }),
  },
  ultimosAddBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)' } : { elevation: 2 }),
  },
  ultimosImgContainer: {
    height: 64,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ultimosProductImg: {
    width: 44,
    height: 64,
  },
  ultimosPrice: {
    fontSize: 12.5,
    fontWeight: 'bold',
    marginTop: 2,
  },
  ultimosSub: {
    fontSize: 9.5,
    marginTop: 2,
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 34,
  },
  iconBtn: {
    width: 34,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#0D1C28' : '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  barSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.12)' : 'rgba(255, 193, 7, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
    maxWidth: 260,
  },
  topLocationText: {
    fontSize: 10,
    color: theme.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  locationBannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.15)' : '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  locationBannerSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  locationBannerBtn: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  locationBannerBtnText: {
    color: '#0D1C28',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nearbySuppliersSection: {
    marginBottom: 16,
  },
  nearbyScroll: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  nearbySupCard: {
    width: 205,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  nearbySupTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nearbySupDistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  nearbySupDistText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  nearbySupRating: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.text,
  },
  nearbySupName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  nearbySupSub: {
    fontSize: 11,
    marginBottom: 8,
  },
  nearbySupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    gap: 6,
  },
  nearbySupEtaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  nearbySupEta: {
    fontSize: 10,
    color: theme.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  nearbySupMinBadge: {
    flexShrink: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.12)' : '#FEF3C7',
  },
  nearbySupMin: {
    fontSize: 10,
    color: isDarkMode ? '#FFC107' : '#92400E',
    fontWeight: '700',
  },
  supplierDistanceText: {
    fontSize: 11,
    color: '#FFC107',
    fontWeight: 'bold',
  },
  gpsRefreshText: {
    fontSize: 11,
    color: '#FFC107',
    fontWeight: '600',
  },
  barSelectorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    gap: 8,
  },
  searchBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surfaceInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#101F2D' : '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#182C3D' : '#E2E8F0',
  },
  searchInputBoxFocused: {
    borderColor: '#FFC107',
    backgroundColor: isDarkMode ? '#101F2D' : '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    paddingVertical: 2,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? ({
      outlineStyle: 'none',
      outlineWidth: 0,
      borderWidth: 0,
      boxShadow: 'none',
    } as any) : {}),
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterMenuBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surfaceInput,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterMenuBtnActive: {
    backgroundColor: '#FFC107',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFC107',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.background,
  },
  filterBadgeText: {
    color: '#0D1C28',
    fontSize: 10,
    fontWeight: '900',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeFiltersText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600',
  },
  resetFiltersBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resetFiltersText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyFilteredBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: theme.surface,
    borderRadius: 16,
    marginVertical: 10,
  },
  emptyFilteredTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyFilteredSub: {
    color: theme.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  emptyResetBtn: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyResetBtnText: {
    color: '#0D1C28',
    fontSize: 13,
    fontWeight: 'bold',
  },
  suggestionsBox: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  suggestionsHeader: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: theme.text,
  },
  suggestionPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  recentSearchBox: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  recentSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentSearchTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.textSecondary,
  },
  recentClearAllText: {
    fontSize: 11,
    color: '#EF4444',
  },
  recentChipsRow: {
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recentChipText: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  quickFiltersScroll: {
    gap: 8,
    marginBottom: 14,
    paddingVertical: 2,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#132435' : '#F1F5F9',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDarkMode ? '#1E354A' : '#E2E8F0',
  },
  quickFilterChipActive: {
    backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.16)' : '#FEF3C7',
    borderColor: '#FFC107',
  },
  quickFilterText: {
    color: isDarkMode ? '#FFFFFF' : '#0D1C28',
    fontSize: 12,
    fontWeight: '600',
  },
  quickFilterTextActive: {
    color: isDarkMode ? '#FFC107' : '#B45309',
    fontWeight: 'bold',
  },
  bannerContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  promoBannerCard: {
    width: 315,
    height: 165,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0D1C28',
    borderWidth: 1,
    borderColor: isDarkMode ? '#1E354B' : 'rgba(13, 28, 40, 0.15)',
    ...(Platform.OS === 'web' ? ({
      boxShadow: isDarkMode 
        ? '0 4px 16px rgba(0, 0, 0, 0.4)' 
        : '0 4px 14px rgba(13, 28, 40, 0.2)',
    } as any) : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 4,
    }),
  },
  promoBannerImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: isDarkMode ? 0.38 : 0.42,
  },
  promoBannerOverlay: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? 'rgba(5, 18, 30, 0.72)' : 'rgba(7, 22, 36, 0.78)',
  },
  promoBannerContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  promoBannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 6,
  },
  promoBannerBadgeText: {
    color: '#0D1C28',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  promoBannerTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  promoBannerSub: {
    fontSize: 11.5,
    color: '#F1F5F9',
    marginTop: 4,
    lineHeight: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowRadius: 2,
  },
  promoBannerCtaBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  promoBannerCtaText: {
    color: '#0D1C28',
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    alignItems: 'center',
    width: 76,
  },
  categoryCardActive: {},
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryIconCircleActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  categoryLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
  supplierCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplierLogoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambevLogoText: {
    color: '#002F6C',
    fontWeight: '900',
    fontSize: 16,
    fontFamily: 'sans-serif',
  },
  supplierInfo: {
    flex: 1,
    marginLeft: 14,
  },
  supplierTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  supplierSub: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  supplierMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.text,
  },
  metaDivider: {
    color: theme.textMuted,
    fontSize: 12,
  },
  deliveryEstimateText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  favBtn: {
    padding: 6,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionHeaderNoPad: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  filterMetaCount: {
    fontSize: 12,
    color: '#FFC107',
    fontWeight: '600',
  },
  reorderCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  reorderLeft: {
    width: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderImgBox: {
    width: 96,
    height: 110,
    borderRadius: 12,
    backgroundColor: isDarkMode ? '#0D1C28' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  bottleImg: {
    width: 90,
    height: 106,
  },
  reorderBody: {
    flex: 1,
    marginLeft: 12,
  },
  reorderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reorderName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
  },
  reorderUnitPrice: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  reorderTotalPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.text,
  },
  reorderActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  qtyControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  qtyBtn: {
    paddingHorizontal: 8,
  },
  qtyBtnText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  qtyNumText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  addToBagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addToBagBtnText: {
    color: '#0D1C28',
    fontSize: 11,
    fontWeight: 'bold',
  },
  highlightScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8,
  },
  highlightCard: {
    width: 140,
    height: 205,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  floatingAddBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  highlightImgBox: {
    width: '100%',
    height: 130,
    backgroundColor: isDarkMode ? '#0D1C28' : '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 6,
    padding: 2,
  },
  highlightBottleImg: {
    width: 96,
    height: 124,
  },
  highlightPrice: {
    color: theme.text,
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  highlightName: {
    color: theme.textSecondary,
    fontSize: 11,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  beerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  beerRowLeft: {
    width: 96,
    height: 110,
    backgroundColor: isDarkMode ? '#0D1C28' : '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  beerRowImg: {
    width: 90,
    height: 106,
  },
  beerRowBody: {
    flex: 1,
    marginLeft: 12,
  },
  discountTag: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  discountTagText: {
    color: '#0D1C28',
    fontSize: 10,
    fontWeight: 'bold',
  },
  beerRowName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  beerRowPrices: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 3,
  },
  beerRowCurrentPrice: {
    color: theme.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  beerRowOldPrice: {
    color: theme.textMuted,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  deliveryBadgeText: {
    color: theme.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  beerRowAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  floatingBottomCart: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: '#FFC107',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingCartBadge: {
    backgroundColor: '#0D1C28',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartBadgeText: {
    color: '#FFC107',
    fontWeight: 'bold',
    fontSize: 13,
  },
  floatingCartTitle: {
    fontSize: 11,
    color: '#0D1C28',
    fontWeight: '600',
  },
  floatingCartPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0D1C28',
  },
  floatingCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 28, 40, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  floatingCartBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0D1C28',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: isDarkMode ? '#334155' : '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 10,
  },
  filterChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  sortChipActive: {
    backgroundColor: '#FFC107',
  },
  sortChipText: {
    color: theme.text,
    fontSize: 12,
  },
  sortChipTextActive: {
    color: '#0D1C28',
    fontWeight: 'bold',
  },
  filterDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  resetModalBtn: {
    flex: 1,
    backgroundColor: theme.surfaceSecondary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetModalBtnText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  applyFilterBtn: {
    flex: 2,
    backgroundColor: '#FFC107',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFilterBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
  });
}
