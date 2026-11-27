import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Modal,
  Alert,
  Share,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SupplierAccount, BeverageProduct } from '../types';
import { useApp } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';
import { FigmaBottomNav } from '../components/FigmaBottomNav';
import { BarSelectorModal } from '../components/BarSelectorModal';
import { ReportContentModal } from '../components/ReportContentModal';
import { PolicyDetailModal, PolicyType } from '../components/PolicyDetailModal';
import { LocationHeaderSelector } from '../components/LocationHeaderSelector';

interface SupplierDetailScreenProps {
  supplier: SupplierAccount;
  onBack: () => void;
  onSelectProduct?: (product: BeverageProduct) => void;
  onOpenCart?: () => void;
  onOpenMyBars?: () => void;
}

export const SupplierDetailScreen: React.FC<SupplierDetailScreenProps> = ({ 
  supplier, 
  onBack,
  onSelectProduct,
  onOpenCart,
  onOpenMyBars,
}) => {
  const { products, addToCart, updateCartQuantity, cart, cartTotal, isDarkMode, theme } = useApp();
  const [isFavorite, setIsFavorite] = useState(true);
  const [reorderQuantity, setReorderQuantity] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [showBarModal, setShowBarModal] = useState(false);
  const [showSupplierMenuModal, setShowSupplierMenuModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType>('refund');
  const [showCompanyInfoModal, setShowCompanyInfoModal] = useState(false);

  const handleShareSupplier = async () => {
    setShowSupplierMenuModal(false);
    const supplierUrl = Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}/?screen=supplier&supp=${supplier.id}`
      : `https://flowstock.com.br/?screen=supplier&supp=${supplier.id}`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(supplierUrl);
      Alert.alert('Link Copiado!', `O link do distribuidor ${supplier.tradeName} foi copiado para a área de transferência.\n\n${supplierUrl}`);
    } else {
      try {
        await Share.share({
          title: `Catálogo ${supplier.tradeName} no FlowStock`,
          message: `Confira os preços de atacado e barris de chopp da ${supplier.tradeName} no FlowStock:\n${supplierUrl}`,
          url: supplierUrl,
        });
      } catch {
        Alert.alert('Compartilhar', supplierUrl);
      }
    }
  };

  const handleCopyCnpj = async () => {
    const cnpjToCopy = supplier.cnpj || '02.456.789/0001-34';
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(cnpjToCopy);
    }
    Alert.alert('CNPJ Copiado!', `CNPJ ${cnpjToCopy} copiado para a área de transferência.`);
  };

  // Produtos deste fornecedor
  const supplierProducts = products.filter(p => {
    if (p.supplierId !== supplier.id && !p.supplierName.includes(supplier.tradeName.split(' ')[0])) {
      return false;
    }
    if (selectedCategory !== 'todas') {
      return p.category === selectedCategory;
    }
    return true;
  });

  // Produto principal para "Peça novamente" (Fiel ao mockup Ambev: Heineken 600ml)
  const reorderProduct = products.find(p => p.brand === 'Heineken') || products[0];

  // Destaques do Fornecedor idênticos ao Figma
  const highlightItems = [
    { id: 'h1', name: 'Schneider - 600ml', price: 6.80, brand: 'Schneider', img: getProductImage('schneider') },
    { id: 'h2', name: 'Brahma - 350ml', price: 4.80, brand: 'Brahma', img: getProductImage('brahma') },
    { id: 'h3', name: 'Kaiser - 350ml', price: 4.60, brand: 'Kaiser', img: getProductImage('corona') },
    { id: 'h4', name: 'Eisenbahn - 350ml', price: 6.60, brand: 'Eisenbahn', img: getProductImage('eisenbahn') },
    { id: 'h5', name: 'Heineken - 600ml', price: 7.70, brand: 'Heineken', img: getProductImage('heineken') },
  ];

  const cartItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const cartSupplierId = cart.length > 0 ? cart[0].product.supplierId : null;
  const isDifferentSupplierInCart = !!(cartSupplierId && cartSupplierId !== supplier.id);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* 1. Top Bar Idêntica ao Figma: Seta Voltar, Bar 01 ▼, Três Pontos */}
      <View style={[styles.topBar, { backgroundColor: isDarkMode ? '#112332' : theme.surface, borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#FFFFFF" : theme.text} />
        </TouchableOpacity>

        <View style={styles.barCenterContainer}>
          <LocationHeaderSelector onPress={() => onOpenMyBars ? onOpenMyBars() : setShowBarModal(true)} />
        </View>

        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => setShowSupplierMenuModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={isDarkMode ? "#FFFFFF" : theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: cartItemsCount > 0 ? 130 : 40 }
        ]}
      >
        {/* 2. Hero Card do Fornecedor com Borda Inferior Curva (Figma 123:481) */}
        <View style={[styles.supplierHeroSection, { backgroundColor: isDarkMode ? '#112332' : theme.surface, borderBottomColor: theme.border, borderBottomWidth: isDarkMode ? 0 : 1 }]}>
          <View style={styles.supplierHeaderRow}>
            {/* Logo Circular Branco com Tipografia Azul Oficial (ex: ambev) */}
            <View style={styles.supplierLogoCircle}>
              <Text style={styles.ambevLogoText}>
                {supplier.tradeName.toLowerCase().includes('ambev') ? 'ambev' : supplier.tradeName.split(' ')[0].toLowerCase()}
              </Text>
            </View>

            {/* Informações: Ambev, Subtítulo, Avaliação e Prazo */}
            <View style={styles.supplierHeroInfo}>
              <Text style={[styles.supplierHeroTitle, { color: theme.text }]}>{supplier.tradeName.split(' ')[1] || supplier.tradeName}</Text>
              <Text style={[styles.supplierHeroSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {supplier.corporateName || 'Distribuidora Oficial de Bebidas & Chopp'}
              </Text>
              <View style={styles.supplierHeroMeta}>
                <Text style={[styles.metaRatingText, { color: theme.text }]}>⭐ {supplier.rating ? supplier.rating.toFixed(1) : '4.8'}</Text>
                <Text style={styles.metaDividerText}>|</Text>
                <Text style={[styles.metaDeliveryText, { color: theme.textSecondary }]}>{supplier.deliveryTimeEstimate || 'Tempo médio 1 dia'}</Text>
              </View>
            </View>

            {/* Coração Amarelo Dourado de Favorito */}
            <TouchableOpacity 
              style={styles.favoriteBtn}
              onPress={() => setIsFavorite(!isFavorite)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={26} 
                color={isFavorite ? "#FFC107" : "#8FA0AF"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Aviso se o carrinho já possui itens de outro fornecedor */}
        {isDifferentSupplierInCart && (
          <View style={[styles.supplierCartNotice, { backgroundColor: isDarkMode ? '#13283B' : '#FEF3C7', borderColor: isDarkMode ? '#234768' : '#FDE68A' }]}>
            <Ionicons name="information-circle" size={18} color="#FFC107" style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={[styles.supplierCartNoticeText, { color: isDarkMode ? '#E2E8F0' : '#78350F' }]}>
              Sua sacola possui itens de outra distribuidora. Ao adicionar produtos da {supplier.tradeName}, você poderá trocar de fornecedor e esvaziar a sacola anterior.
            </Text>
          </View>
        )}

        {/* 3. Seção: Peça novamente (Exatamente como no Figma) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Peça novamente</Text>
        </View>

        <TouchableOpacity 
          style={[styles.reorderCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
          onPress={() => onSelectProduct && onSelectProduct(reorderProduct)}
          activeOpacity={0.9}
        >
          {/* Caixa da Garrafa com Fundo Escuro */}
          <View style={[styles.reorderImgBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F1F5F9' }]}>
            <Image 
              source={getProductImage(reorderProduct)} 
              style={styles.reorderBottleImg}
              resizeMode="contain"
            />
          </View>

          {/* Dados e Ações */}
          <View style={styles.reorderBody}>
            <View style={styles.reorderTopRow}>
              <View>
                <Text style={[styles.reorderName, { color: theme.text }]}>{reorderProduct.brand} - 600ml</Text>
                <Text style={[styles.reorderUnitPrice, { color: theme.textSecondary }]}>Uni R$10,00</Text>
              </View>
              <Text style={[styles.reorderTotalPrice, { color: theme.text }]}>R$250,00</Text>
            </View>

            <View style={styles.reorderActionRow}>
              {/* Stepper Escuro: [-] 25 [+] */}
              <View style={[styles.reorderStepperBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F1F5F9' }]}>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    setReorderQuantity(Math.max(1, reorderQuantity - 1));
                  }}
                  style={styles.stepperBtn}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.text }]}>-</Text>
                </TouchableOpacity>

                <Text style={[styles.stepperNumText, { color: theme.text }]}>{reorderQuantity}</Text>

                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    setReorderQuantity(reorderQuantity + 1);
                  }}
                  style={styles.stepperBtn}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Botão Amarelo: Adicionar na sacola */}
              <TouchableOpacity 
                style={styles.addToBagYellowBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  addToCart(reorderProduct, reorderQuantity);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.addToBagYellowText}>Adicionar na sacola</Text>
                <Ionicons name="bag-handle" size={13} color="#0D1C28" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* 4. Seção: Destaques (Cards Verticais com Botão Amarelo Flutuante [+]) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Destaques</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.highlightsScroll}
        >
          {highlightItems.map(item => {
            const matched = products.find(p => p.brand.toLowerCase() === item.brand.toLowerCase()) || products[0];

            return (
              <TouchableOpacity 
                key={item.id} 
                style={[styles.highlightCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
                onPress={() => onSelectProduct && onSelectProduct(matched)}
                activeOpacity={0.9}
              >
                {/* Botão Amarelo Circular Flutuante [+] no Topo Direito */}
                <TouchableOpacity 
                  style={styles.floatingAddCircle}
                  onPress={(e) => {
                    e.stopPropagation();
                    addToCart(matched, 1);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={20} color="#0D1C28" />
                </TouchableOpacity>

                {/* Garrafa Grande Centralizada */}
                <View style={[styles.highlightImgBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC' }]}>
                  <Image 
                    source={item.img} 
                    style={styles.highlightBottleImg}
                    resizeMode="contain"
                  />
                </View>

                {/* Preço e Nome */}
                <Text style={[styles.highlightPrice, { color: theme.text }]}>R${item.price.toFixed(2).replace('.', ',')}</Text>
                <Text style={[styles.highlightName, { color: theme.textSecondary }]} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Seção: Catálogo Completo do Fornecedor */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Catálogo da Distribuidora</Text>
          <Text style={[styles.sectionCounter, { color: theme.textSecondary }]}>{supplierProducts.length} itens</Text>
        </View>

        {/* Categorias em Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'cervejas', label: 'Cervejas' },
            { id: 'chopp_barris', label: 'Chopp 50L' },
            { id: 'destilados', label: 'Destilados' },
            { id: 'refrigerantes', label: 'Mixers & Gelo' },
          ].map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[
                styles.catChip, 
                { backgroundColor: isDarkMode ? '#112332' : '#E2E8F0', borderColor: theme.border, borderWidth: 1 },
                selectedCategory === cat.id && styles.catChipActive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[
                styles.catChipText, 
                { color: isDarkMode ? '#8FA0AF' : '#475569' },
                selectedCategory === cat.id && styles.catChipTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista de Itens do Fornecedor (Layout Fiel Figma 123:314) */}
        {supplierProducts.map((prod, idx) => {
          const discount = idx % 2 === 0 ? '-7%' : '-8%';
          const oldPrice = (prod.price * 1.08).toFixed(2).replace('.', ',');

          return (
            <TouchableOpacity 
              key={prod.id} 
              style={[styles.beerCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => onSelectProduct && onSelectProduct(prod)}
              activeOpacity={0.88}
            >
              {/* Garrafa Recortada Transparente */}
              <View style={[styles.beerImgBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC' }]}>
                <Image 
                  source={getProductImage(prod)} 
                  style={styles.beerBottleImg}
                  resizeMode="contain"
                />
              </View>

              {/* Informações Centrais */}
              <View style={styles.beerInfo}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{discount}</Text>
                </View>

                <Text style={[styles.beerName, { color: theme.text }]} numberOfLines={2}>{prod.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={[styles.currentPrice, { color: theme.text }]}>R${prod.price.toFixed(2).replace('.', ',')}</Text>
                  <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>R${oldPrice}</Text>
                </View>

                <Text style={[styles.deliveryBadgeText, { color: theme.textSecondary }]}>Entrega em 24h • Distribuidor Oficial</Text>
              </View>

              {/* Lado Direito: Logo Redondo Ambev e Botão Amarelo [+] ou Stepper */}
              <View style={styles.rightCol}>
                <View style={styles.distributorCircle}>
                  <Text style={styles.distributorCircleText}>
                    {supplier.tradeName.toLowerCase().includes('ambev') ? 'ambev' : supplier.tradeName.split(' ')[0].toLowerCase()}
                  </Text>
                </View>

                {(() => {
                  const cartItem = cart.find(it => it.product.id === prod.id);
                  if (cartItem) {
                    return (
                      <View style={styles.cardQtyStepper}>
                        <TouchableOpacity 
                          style={styles.cardQtyBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            updateCartQuantity(prod.id, cartItem.quantity - 1);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="remove" size={13} color="#0D1C28" />
                        </TouchableOpacity>
                        <Text style={styles.cardQtyNum}>{cartItem.quantity}</Text>
                        <TouchableOpacity 
                          style={styles.cardQtyBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            addToCart(prod, 1);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={13} color="#0D1C28" />
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  return (
                    <TouchableOpacity 
                      style={styles.yellowAddBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        addToCart(prod, 1);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add" size={20} color="#0D1C28" />
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Bottom Cart Bar para ver o total deste fornecedor */}
      {cartItemsCount > 0 && (
        <View style={styles.floatingBottomCart}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{cartItemsCount}</Text>
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.floatingCartTitle} numberOfLines={1}>
                {supplier.tradeName}
              </Text>
              <Text style={styles.floatingCartPrice}>R$ {cartTotal.toFixed(2).replace('.', ',')}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.floatingCartBtn}
            onPress={() => {
              if (onOpenCart) onOpenCart();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.floatingCartBtnText}>Ver Carrinho</Text>
            <Ionicons name="chevron-forward" size={16} color="#0D1C28" />
          </TouchableOpacity>
        </View>
      )}

      {/* 6. Footer Nav Bar Exato do Figma com Notch e Botão Central de Carrinho */}
      <FigmaBottomNav
        currentTab="home"
        onSelectTab={() => onBack()}
        onOpenCart={() => onOpenCart ? onOpenCart() : null}
        cartCount={cartItemsCount}
      />

      {/* Modal de Bares */}
      <BarSelectorModal
        visible={showBarModal}
        onClose={() => setShowBarModal(false)}
      />

      {/* ======================================================== */}
      {/* MODAL 1: MENU DE OPÇÕES DO FORNECEDOR (3 PONTINHOS)     */}
      {/* ======================================================== */}
      <Modal
        visible={showSupplierMenuModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupplierMenuModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSupplierMenuModal(false)}
        >
          <View 
            style={[
              styles.menuModalContent, 
              { backgroundColor: theme.surface, borderColor: theme.border }
            ]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Header do Menu */}
            <View style={styles.menuModalHeader}>
              <View style={[styles.menuModalSupplierThumb, { backgroundColor: '#FFC107' }]}>
                <Text style={styles.menuModalSupplierThumbText}>
                  {supplier.tradeName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.menuModalTitle, { color: theme.text }]} numberOfLines={1}>
                  {supplier.tradeName}
                </Text>
                <Text style={[styles.menuModalSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {supplier.corporateName || 'Distribuidor Homologado B2B'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.closeMenuBtn}
                onPress={() => setShowSupplierMenuModal(false)}
              >
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            {/* 1. Denunciar Distribuidor (Apple Guideline 1.2) */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowSupplierMenuModal(false);
                setShowReportModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="flag" size={18} color="#EF4444" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemTitle, { color: '#EF4444' }]}>Denunciar Distribuidor</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>
                  Preço divergente, quebra de vasilhame, conduta ou fraude (Apple 1.2)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 2. Dados Cadastrais & Centro de Distribuição */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowSupplierMenuModal(false);
                setShowCompanyInfoModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemIconCircle, { backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.15)' : '#FEF3C7' }]}>
                <Ionicons name="business" size={18} color={isDarkMode ? "#FFC107" : "#D97706"} />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemTitle, { color: theme.text }]}>Dados Cadastrais & Galpão</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>
                  CNPJ, razão social, doca e horário de corte para entrega
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 3. Políticas de Vasilhames & Reembolso */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowSupplierMenuModal(false);
                setSelectedPolicy('refund');
                setShowPolicyModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#10B981" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemTitle, { color: theme.text }]}>Políticas de Troca & Vasilhames</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>
                  Regras de troca de engradados 600ml e barris de chopp 50L
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 4. Compartilhar Distribuidor */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleShareSupplier}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="share-social" size={18} color="#3B82F6" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemTitle, { color: theme.text }]}>Compartilhar Distribuidor</Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>
                  Copiar link direto para outros donos de bar parceiros
                </Text>
              </View>
              <Ionicons name="copy-outline" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            {/* 5. Favoritar / Desfavoritar */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsFavorite(!isFavorite);
                setShowSupplierMenuModal(false);
                Alert.alert(
                  !isFavorite ? 'Distribuidor Favoritado' : 'Removido dos Favoritos',
                  !isFavorite 
                    ? `${supplier.tradeName} foi adicionado aos seus parceiros favoritos.`
                    : `${supplier.tradeName} foi removido dos favoritos.`
                );
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuItemIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={18} color="#F59E0B" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={[styles.menuItemTitle, { color: theme.text }]}>
                  {isFavorite ? 'Remover dos Parceiros Favoritos' : 'Salvar como Parceiro Favorito'}
                </Text>
                <Text style={[styles.menuItemSub, { color: theme.textSecondary }]}>
                  {isFavorite ? 'Distribuidor atualmente fixado na aba Favoritos' : 'Fixar distribuidor para recompra rápida'}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={18} color={isFavorite ? "#10B981" : theme.textMuted} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: DENÚNCIAS & MODERAÇÃO (APPLE GUIDELINE 1.2)      */}
      {/* ======================================================== */}
      <ReportContentModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="supplier"
        targetId={supplier.id}
        targetName={supplier.tradeName}
      />

      {/* ======================================================== */}
      {/* MODAL 3: POLÍTICAS DE DEVOLUÇÃO E VASILHAMES            */}
      {/* ======================================================== */}
      <PolicyDetailModal
        visible={showPolicyModal}
        policyType={selectedPolicy}
        onClose={() => setShowPolicyModal(false)}
      />

      {/* ======================================================== */}
      {/* MODAL 4: DADOS CADASTRAIS & CENTRO DE DISTRIBUIÇÃO      */}
      {/* ======================================================== */}
      <Modal
        visible={showCompanyInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompanyInfoModal(false)}
      >
        <TouchableOpacity 
          style={styles.companyModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCompanyInfoModal(false)}
        >
          <View 
            style={[
              styles.companyModalContent, 
              { backgroundColor: theme.surface, borderColor: theme.border }
            ]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.companyModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="business" size={20} color="#FFC107" />
                <Text style={[styles.companyModalTitle, { color: theme.text }]}>Dados Cadastrais do CD</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCompanyInfoModal(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View style={[styles.companyFieldBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC', borderColor: theme.border }]}>
                <Text style={styles.companyFieldLabel}>Nome Fantasia</Text>
                <Text style={[styles.companyFieldValue, { color: theme.text }]}>{supplier.tradeName}</Text>
              </View>

              <View style={[styles.companyFieldBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC', borderColor: theme.border }]}>
                <Text style={styles.companyFieldLabel}>Razão Social</Text>
                <Text style={[styles.companyFieldValue, { color: theme.text }]}>
                  {supplier.corporateName || `${supplier.tradeName} Comércio e Distribuição de Bebidas Ltda`}
                </Text>
              </View>

              <View style={[styles.companyFieldBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC', borderColor: theme.border }]}>
                <Text style={styles.companyFieldLabel}>CNPJ (Cadastro Nacional da Pessoa Jurídica)</Text>
                <Text style={[styles.companyFieldValue, { color: theme.text }]}>{supplier.cnpj || '02.456.789/0001-34'}</Text>
              </View>

              <TouchableOpacity 
                style={styles.copyCnpjBtn}
                onPress={handleCopyCnpj}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={16} color="#0D1C28" />
                <Text style={styles.copyCnpjBtnText}>Copiar CNPJ para Emissão de Nota</Text>
              </TouchableOpacity>

              <View style={[styles.companyFieldBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC', borderColor: theme.border }]}>
                <Text style={styles.companyFieldLabel}>Centro de Distribuição & Doca</Text>
                <Text style={[styles.companyFieldValue, { color: theme.text }]}>
                  {supplier.address || 'Av. das Indústrias, 1000 - Doca 4'}
                  {'\n'}{supplier.city || 'São Paulo'} - {supplier.state || 'SP'}
                </Text>
              </View>

              <View style={[styles.companyFieldBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC', borderColor: theme.border }]}>
                <Text style={styles.companyFieldLabel}>Condições Comerciais</Text>
                <Text style={[styles.companyFieldValue, { color: theme.text }]}>
                  • Pedido Mínimo: R$ {supplier.minOrderValue ? supplier.minOrderValue.toFixed(2).replace('.', ',') : '400,00'}
                  {'\n'}• Prazo Estimado: {supplier.deliveryTimeEstimate || 'Entrega até 18h'}
                  {'\n'}• Pagamentos: Pix, Boleto 15d e Cartão B2B
                </Text>
              </View>

              <View style={[styles.companyFieldBox, { backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC', borderColor: theme.border }]}>
                <Text style={styles.companyFieldLabel}>Televendas & Suporte Operacional</Text>
                <Text style={[styles.companyFieldValue, { color: theme.text }]}>
                  {supplier.phone || '(11) 3333-0000'} • {supplier.email || 'contato@distribuidora.com.br'}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.companyCloseBtn, { marginTop: 12 }]}
              onPress={() => setShowCompanyInfoModal(false)}
            >
              <Text style={styles.companyCloseBtnText}>Fechar</Text>
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
    backgroundColor: '#0D1C28',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#112332',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  supplierHeroSection: {
    backgroundColor: '#112332',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomRightRadius: 40, // Curva suave do mockup Figma
    marginBottom: 8,
  },
  supplierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplierLogoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  ambevLogoText: {
    color: '#002F6C',
    fontWeight: '900',
    fontSize: 18,
    fontFamily: 'sans-serif',
  },
  supplierHeroInfo: {
    flex: 1,
    marginLeft: 16,
  },
  supplierHeroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  supplierHeroSubtitle: {
    color: '#8FA0AF',
    fontSize: 12,
    marginTop: 2,
  },
  supplierHeroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  metaRatingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metaDividerText: {
    color: '#627585',
    fontSize: 12,
  },
  metaDeliveryText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  favoriteBtn: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCounter: {
    color: '#8FA0AF',
    fontSize: 12,
  },
  reorderCard: {
    flexDirection: 'row',
    backgroundColor: '#162839',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F354A',
  },
  reorderImgBox: {
    width: 80,
    height: 95,
    backgroundColor: '#0D1C28',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  reorderBottleImg: {
    width: 65,
    height: 85,
  },
  reorderBody: {
    flex: 1,
    marginLeft: 14,
  },
  reorderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reorderName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reorderUnitPrice: {
    color: '#8FA0AF',
    fontSize: 11,
    marginTop: 2,
  },
  reorderTotalPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reorderActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  reorderStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1C28',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    borderWidth: 1,
    borderColor: '#1E354A',
  },
  stepperBtn: {
    paddingHorizontal: 6,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepperNumText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  addToBagYellowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 32,
  },
  addToBagYellowText: {
    color: '#0D1C28',
    fontSize: 11,
    fontWeight: 'bold',
  },
  highlightsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  highlightCard: {
    width: 135,
    height: 185,
    backgroundColor: '#162839',
    borderRadius: 16,
    padding: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1E354A',
  },
  floatingAddCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  highlightImgBox: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  highlightBottleImg: {
    width: 55,
    height: 95,
  },
  highlightPrice: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
  },
  highlightName: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
  },
  catChipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  catChip: {
    backgroundColor: '#162839',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E354A',
  },
  catChipActive: {
    backgroundColor: '#1E354A',
    borderColor: '#FFC107',
  },
  catChipText: {
    color: '#8FA0AF',
    fontSize: 12,
  },
  catChipTextActive: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
  beerCard: {
    flexDirection: 'row',
    backgroundColor: '#102232',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#172B3C',
    alignItems: 'center',
  },
  beerImgBox: {
    width: 55,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beerBottleImg: {
    width: 50,
    height: 100,
  },
  beerInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  discountBadge: {
    backgroundColor: '#FFC107',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  discountBadgeText: {
    color: '#0D1C28',
    fontSize: 9,
    fontWeight: 'bold',
  },
  beerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  currentPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  oldPrice: {
    color: '#8FA0AF',
    fontSize: 11,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  deliveryBadgeText: {
    color: '#8FA0AF',
    fontSize: 10,
    marginTop: 4,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    marginLeft: 8,
  },
  distributorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distributorCircleText: {
    color: '#002F6C',
    fontSize: 7,
    fontWeight: '900',
  },
  yellowAddBtn: {
    backgroundColor: '#FFC107',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  menuModalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#112332',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1E354B',
  },
  menuModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuModalSupplierThumb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuModalSupplierThumbText: {
    color: '#0D1C28',
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuModalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuModalSubtitle: {
    fontSize: 12,
    color: '#8FA0AF',
    marginTop: 2,
  },
  closeMenuBtn: {
    padding: 6,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#1E354B',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuItemIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextCol: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  menuItemSub: {
    fontSize: 11,
    color: '#8FA0AF',
    marginTop: 2,
    lineHeight: 15,
  },
  companyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  companyModalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#112332',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E354B',
  },
  companyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  companyModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  companyFieldBox: {
    backgroundColor: '#0D1C28',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E354B',
  },
  companyFieldLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8FA0AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  companyFieldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  copyCnpjBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFC107',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  copyCnpjBtnText: {
    color: '#0D1C28',
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyCloseBtn: {
    backgroundColor: '#1E354B',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  companyCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  supplierCartNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  supplierCartNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  cardQtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 4,
  },
  cardQtyBtn: {
    padding: 2,
  },
  cardQtyNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0D1C28',
    minWidth: 16,
    textAlign: 'center',
  },
  floatingBottomCart: {
    position: 'absolute',
    bottom: 74,
    left: 16,
    right: 16,
    backgroundColor: '#FFC107',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  floatingCartBadge: {
    backgroundColor: '#0D1C28',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartBadgeText: {
    color: '#FFC107',
    fontWeight: 'bold',
    fontSize: 12,
  },
  floatingCartTitle: {
    fontSize: 11,
    color: '#0D1C28',
    fontWeight: '600',
  },
  floatingCartPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D1C28',
  },
  floatingCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 28, 40, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  floatingCartBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0D1C28',
  },
});
