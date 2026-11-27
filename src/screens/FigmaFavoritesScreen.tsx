import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  Modal,
  Alert,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { BeverageProduct, SupplierAccount } from '../types';
import { getProductImage } from '../utils/productImages';
import { LocationHeaderSelector } from '../components/LocationHeaderSelector';

interface FigmaFavoritesScreenProps {
  onSelectProduct: (product: BeverageProduct) => void;
  onSelectSupplier?: (supplier: SupplierAccount) => void;
  onOpenCart: () => void;
  onOpenFilters?: () => void;
  onBack?: () => void;
  onOpenMyBars?: () => void;
  onOpenLogin?: () => void;
}

export const FigmaFavoritesScreen: React.FC<FigmaFavoritesScreenProps> = ({
  onSelectProduct,
  onSelectSupplier,
  onBack,
  onOpenMyBars,
  onOpenCart,
  onOpenLogin,
}) => {
  const { 
    products, 
    suppliers, 
    addToCart, 
    isDarkMode, 
    theme, 
    currentUser,
  } = useApp();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
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

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [favoritedSuppliers, setFavoritedSuppliers] = useState<string[]>(['supp_1', 'supp_2', 'supp_3', 'supp_4']);
  const [reorderQuantities, setReorderQuantities] = useState<{ [key: string]: number }>({
    supp_1: 25,
    supp_2: 20,
    supp_3: 25,
    supp_4: 2,
  });

  const toggleSupplierFavorite = (id: string) => {
    setFavoritedSuppliers(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const updateQuantity = (suppId: string, delta: number) => {
    setReorderQuantities(prev => ({
      ...prev,
      [suppId]: Math.max(1, (prev[suppId] || 25) + delta),
    }));
  };

  // Fornecedores filtrados
  const displaySuppliers = suppliers.filter(s => {
    if (!favoritedSuppliers.includes(s.id)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.tradeName.toLowerCase().includes(q) || s.corporateName.toLowerCase().includes(q);
    }
    return true;
  });

  // Destaques fiéis ao Figma para cada fornecedor
  const highlightItems = [
    { id: 'h1', name: 'Schneider - 600ml', price: 6.80, brand: 'Schneider', img: getProductImage('schneider') },
    { id: 'h2', name: 'Brahma - 350ml', price: 4.80, brand: 'Brahma', img: getProductImage('brahma') },
    { id: 'h3', name: 'Kaiser - 350ml', price: 4.60, brand: 'Kaiser', img: getProductImage('corona') },
    { id: 'h4', name: 'Eisenbahn - 350ml', price: 6.60, brand: 'Eisenbahn', img: getProductImage('eisenbahn') },
  ];

  const handleQuickAddReorder = (supp: SupplierAccount) => {
    const qty = reorderQuantities[supp.id] || 25;
    const reorderProd = products.find(p => p.brand === 'Heineken') || products[0];
    addToCart(reorderProd, qty);
    Alert.alert(
      'Adicionado à Sacola!',
      `${qty}x ${reorderProd.name} da ${supp.tradeName} foi adicionado.`,
      [
        { text: 'Continuar Comprando', style: 'cancel' },
        { text: 'Ver Carrinho', onPress: onOpenCart }
      ]
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={onBack} 
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.barCenterContainer}>
            <LocationHeaderSelector onPress={onOpenMyBars} />
          </View>

          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={onOpenMyBars} 
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.emptyContainer, { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }]}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: isDarkMode ? '#132232' : '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="heart-outline" size={46} color="#FFC107" />
          </View>
          <Text style={[styles.emptyTitle, { fontSize: 20, marginBottom: 8, textAlign: 'center' }]}>
            Nenhum fornecedor favoritado
          </Text>
          <Text style={[styles.emptySub, { textAlign: 'center', marginBottom: 24, lineHeight: 22 }]}>
            Você está navegando como visitante. Conecte a conta do seu bar para salvar seus distribuidores favoritos e agilizar suas reposições semanais.
          </Text>
          {onOpenLogin && (
            <TouchableOpacity 
              style={{
                backgroundColor: '#FFC107',
                paddingVertical: 14,
                paddingHorizontal: 28,
                borderRadius: 24,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 4
              }}
              onPress={onOpenLogin}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 8 }} />
              <Text style={{ color: isDarkMode ? '#FFFFFF' : '#0D1C28', fontWeight: 'bold', fontSize: 15 }}>
                Fazer Login / Cadastrar Bar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar Exata do Figma: Seta Voltar, Bar 01 ▼, Três Pontos */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={onBack} 
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.barCenterContainer}>
          <LocationHeaderSelector onPress={onOpenMyBars} />
        </View>

        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={onOpenMyBars} 
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Barra de Busca Interativa com Efeito Animado Semelhante à Home */}
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
                  setSearch('');
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
            { backgroundColor: theme.surfaceInput, borderColor: (isSearchFocused || isSearchActive) ? '#FFC107' : 'transparent' },
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
              placeholder="Buscar parceiro ou produto favorito..."
              placeholderTextColor={theme.textMuted}
              value={search}
              underlineColorAndroid="transparent"
              onChangeText={(text) => {
                setSearch(text);
                if (text.length > 0) setIsSearchActive(true);
              }}
              onFocus={() => {
                setIsSearchActive(true);
                setIsSearchFocused(true);
              }}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearch('')}
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
              { backgroundColor: theme.surfaceInput, borderColor: theme.border, borderWidth: 1 }
            ]}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="options-outline" 
              size={22} 
              color={theme.text} 
            />
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* CARDS DE FORNECEDORES FAVORITOS (FIGMA 123:314)          */}
        {/* ======================================================== */}
        {displaySuppliers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-dislike-outline" size={48} color="#52667A" />
            <Text style={styles.emptyTitle}>Nenhum fornecedor favoritado</Text>
            <Text style={styles.emptySub}>Marque distribuidores como favoritos para acompanhar estoques e ofertas.</Text>
          </View>
        ) : (
          displaySuppliers.map((supp) => {
              const isAmbev = supp.tradeName.toLowerCase().includes('ambev');
              const isPetropolis = supp.tradeName.toLowerCase().includes('petrópolis') || supp.tradeName.toLowerCase().includes('petropolis');
              const isHeineken = supp.tradeName.toLowerCase().includes('heineken');
              const currentQty = reorderQuantities[supp.id] || 25;
              const unitPrice = 10.00;
              const totalPrice = unitPrice * currentQty;

              return (
                <View key={supp.id} style={styles.figmaSupplierCardContainer}>
                  {/* Card do Fornecedor Exato do Figma (Hero Ambev com Logo Redondo e Coração Amarelo) */}
                  <TouchableOpacity 
                    style={styles.supplierHeroCard}
                    onPress={() => onSelectSupplier && onSelectSupplier(supp)}
                    activeOpacity={0.9}
                  >
                    {/* Logo Redondo Exato do Figma */}
                    {isAmbev ? (
                      <View style={styles.heroLogoWhite}>
                        <Text style={styles.heroLogoAmbevText}>ambev</Text>
                      </View>
                    ) : isPetropolis ? (
                      <View style={styles.heroLogoRed}>
                        <Ionicons name="beer" size={28} color="#FFFFFF" />
                      </View>
                    ) : isHeineken ? (
                      <View style={styles.heroLogoGreen}>
                        <Ionicons name="star" size={28} color="#FFFFFF" />
                      </View>
                    ) : (
                      <View style={styles.heroLogoGold}>
                        <Ionicons name="cube" size={28} color="#0D1C28" />
                      </View>
                    )}

                    {/* Informações Centrais do Fornecedor */}
                    <View style={styles.heroInfoBox}>
                      <Text style={styles.heroSupplierName}>{supp.tradeName}</Text>
                      <Text style={styles.heroSupplierSub} numberOfLines={1}>
                        {isAmbev ? 'Lorem Ipsum is simply dummy' : supp.corporateName}
                      </Text>
                      <View style={styles.heroMetaRow}>
                        <Text style={styles.heroRatingText}>{supp.rating}</Text>
                        <Text style={styles.heroDividerText}>|</Text>
                        <Text style={styles.heroDeliveryText}>Tempo médio 1 dia</Text>
                      </View>
                    </View>

                    {/* Coração Amarelo do Figma */}
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleSupplierFavorite(supp.id);
                      }}
                      style={styles.heartBtn}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="heart" size={24} color="#FFC107" />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Seção "Peça novamente" Exata do Figma */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Peça novamente</Text>
                  </View>

                  <View style={styles.reorderCard}>
                    {/* Garrafa em caixa escura quadrada com cantos arredondados */}
                    <View style={styles.reorderImgBox}>
                      <Image 
                        source={getProductImage('heineken')} 
                        style={styles.reorderImg}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.reorderInfo}>
                      {/* Linha de Título e Preço */}
                      <View style={styles.reorderTopRow}>
                        <Text style={styles.reorderName}>Heineken - 600ml</Text>
                        <Text style={styles.reorderPrice}>R${totalPrice.toFixed(2).replace('.', ',')}</Text>
                      </View>

                      {/* Preço Unitário */}
                      <Text style={styles.reorderUnitText}>Uni R$10,00</Text>

                      {/* Linha Inferior com Stepper e Botão Amarelo */}
                      <View style={styles.reorderActionsRow}>
                        <View style={styles.stepperContainer}>
                          <TouchableOpacity 
                            style={styles.stepperBtn} 
                            onPress={() => updateQuantity(supp.id, -1)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.stepperBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.stepperVal}>{currentQty}</Text>
                          <TouchableOpacity 
                            style={styles.stepperBtn} 
                            onPress={() => updateQuantity(supp.id, 1)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.stepperBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                          style={styles.addToBagBtn}
                          onPress={() => handleQuickAddReorder(supp)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.addToBagBtnText}>Adicionar na sacola</Text>
                          <Ionicons name="bag-handle" size={14} color="#0D1C28" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Seção "Destaques" Exata do Figma */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Destaques</Text>
                  </View>

                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.highlightsScroll}
                  >
                    {highlightItems.map(item => {
                      const match = products.find(p => p.brand.toLowerCase() === item.brand.toLowerCase()) || products[0];
                      return (
                        <TouchableOpacity 
                          key={item.id} 
                          style={styles.highlightCard}
                          onPress={() => onSelectProduct(match)}
                          activeOpacity={0.85}
                        >
                          {/* Botão Amarelo Circular no Canto Superior Direito */}
                          <TouchableOpacity 
                            style={styles.highlightAddBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              addToCart(match, 1);
                              Alert.alert('Adicionado!', `${item.name} foi adicionado à sacola.`);
                            }}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="add" size={18} color="#0D1C28" />
                          </TouchableOpacity>

                          <View style={styles.highlightImgBox}>
                            <Image source={item.img} style={styles.highlightImg} resizeMode="contain" />
                          </View>

                          <Text style={styles.highlightPrice}>R${item.price.toFixed(2).replace('.', ',')}</Text>
                          <Text style={styles.highlightName} numberOfLines={1}>{item.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Link para catálogo completo deste fornecedor */}
                  <TouchableOpacity 
                    style={styles.viewCatalogLink}
                    onPress={() => onSelectSupplier && onSelectSupplier(supp)}
                  >
                    <Text style={styles.viewCatalogText}>Ver Catálogo Completo da {supp.tradeName} →</Text>
                  </TouchableOpacity>

                  <View style={styles.supplierCardDivider} />
                </View>
              );
            })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal de Filtros */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowFilterModal(false)}
        >
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={styles.applyFilterBtn}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyFilterBtnText}>Fechar Filtros</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

function getStyles(theme: ThemeColors, isDarkMode: boolean) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.background,
  },
  iconBtn: {
    padding: 6,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barSelectorTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 95,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  searchBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchInputBoxFocused: {
    borderColor: '#FFC107',
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabSelectorPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabSelectorPillActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  tabSelectorText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabSelectorTextActive: {
    color: '#0D1C28',
    fontWeight: 'bold',
  },
  figmaSupplierCardContainer: {
    marginBottom: 20,
  },
  supplierHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  heroLogoWhite: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoAmbevText: {
    color: '#002F6C',
    fontSize: 16,
    fontWeight: '900',
  },
  heroLogoRed: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#C51A1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoGreen: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#005E23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoGold: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfoBox: {
    flex: 1,
    marginLeft: 14,
  },
  heroSupplierName: {
    color: theme.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroSupplierSub: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  heroRatingText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroDividerText: {
    color: theme.textMuted,
    fontSize: 12,
  },
  heroDeliveryText: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  heartBtn: {
    padding: 6,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reorderCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  reorderImgBox: {
    width: 90,
    height: 104,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  reorderImg: {
    width: 75,
    height: 98,
  },
  reorderInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  reorderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reorderName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  reorderPrice: {
    color: theme.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  reorderUnitText: {
    color: theme.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  reorderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    width: 86,
    justifyContent: 'space-between',
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  stepperBtn: {
    paddingHorizontal: 4,
  },
  stepperBtnText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepperVal: {
    color: theme.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  addToBagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addToBagBtnText: {
    color: '#0D1C28',
    fontSize: 12,
    fontWeight: 'bold',
  },
  highlightsScroll: {
    gap: 10,
    paddingRight: 10,
    marginBottom: 14,
  },
  highlightCard: {
    width: 105,
    height: 145,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 8,
    position: 'relative',
    justifyContent: 'space-between',
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  highlightAddBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFC107',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  highlightImgBox: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  highlightImg: {
    width: 36,
    height: 68,
  },
  highlightPrice: {
    color: theme.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  highlightName: {
    color: theme.textSecondary,
    fontSize: 10,
  },
  viewCatalogLink: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  viewCatalogText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
  },
  supplierCardDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: 20,
  },
  beerCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  beerImgBox: {
    width: 48,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  beerImg: {
    width: 44,
    height: 94,
  },
  beerInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  discountBadge: {
    backgroundColor: '#FFC107',
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  discountBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  beerName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceContainer: {
    marginTop: 2,
  },
  currentPrice: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  subPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  oldPrice: {
    color: theme.textMuted,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  deliveryBadge: {
    color: theme.textSecondary,
    fontSize: 10,
  },
  rightCol: {
    height: 90,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  distributorCircleWhite: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambevLogoText: {
    color: '#002F6C',
    fontSize: 8,
    fontWeight: '900',
  },
  distributorCircleRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C51A1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distributorCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#005E23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowAddBtn: {
    backgroundColor: '#FFC107',
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySub: {
    color: theme.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  applyFilterBtn: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  applyFilterBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
  });
}
