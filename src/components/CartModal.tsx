import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  Image,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';
import { BeverageProduct } from '../types';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ 
  visible, 
  onClose, 
  onProceedToCheckout 
}) => {
  const { 
    cart, 
    cartTotal, 
    cartSupplier,
    updateCartQuantity, 
    addToCart,
    products, 
    isDarkMode, 
    theme 
  } = useApp();

  // Estados dos Acordeões
  const [showUnavailableOptions, setShowUnavailableOptions] = useState(false);
  const [unavailableChoice, setUnavailableChoice] = useState<'substitute' | 'remove' | 'call'>('substitute');
  
  const [showDeliveryNotes, setShowDeliveryNotes] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Sugestões de "Você também pode gostar!" do MESMO FORNECEDOR (regra: 1 fornecedor por pedido)
  const cartProductIds = new Set(cart.map(c => c.product.id));
  const currentSupplierId = cart.length > 0 ? cart[0].product.supplierId : null;
  const suggestedProducts = products
    .filter(p => (!currentSupplierId || p.supplierId === currentSupplierId) && !cartProductIds.has(p.id))
    .slice(0, 6);

  const crossSellList = suggestedProducts;

  const handleProceedToCheckout = () => {
    if (cartSupplier && cartSupplier.minOrderValue > 0 && cartTotal < cartSupplier.minOrderValue) {
      const diff = cartSupplier.minOrderValue - cartTotal;
      Alert.alert(
        'Pedido Mínimo da Distribuidora',
        `A distribuidora ${cartSupplier.tradeName} possui valor mínimo de pedido de R$ ${cartSupplier.minOrderValue.toFixed(2).replace('.', ',')}.\n\nFaltam R$ ${diff.toFixed(2).replace('.', ',')} para fechar este pedido.`,
        [{ text: 'Completar Pedido', style: 'default' }]
      );
      return;
    }
    onProceedToCheckout();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#051724' : '#F8FAFC' }]}>
        {/* ======================================================== */}
        {/* HEADER SUPERIOR: <   Meu Carrinho                       */}
        {/* ======================================================== */}
        <View style={[styles.header, { backgroundColor: isDarkMode ? '#081C2C' : '#FFFFFF', borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>Meu Carrinho</Text>

          {/* Placeholder para balanceamento simétrico */}
          <View style={{ width: 36 }} />
        </View>

        {cart.length === 0 ? (
          /* ESTADO CARRINHO VAZIO */
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? '#132435' : '#FEF3C7' }]}>
              <Ionicons name="cart-outline" size={48} color="#FFC107" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Seu carrinho está vazio</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Adicione cervejas, chopp, refrigerantes e destilados para abastecer seu bar.
            </Text>
            <TouchableOpacity 
              style={styles.emptyCtaBtn}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Ionicons name="beer-outline" size={18} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 8 }} />
              <Text style={[styles.emptyCtaBtnText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>Explorar Bebidas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* CORPO DO CARRINHO (IGUAL À IMAGEM DE REFERÊNCIA) */
          <View style={{ flex: 1 }}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* BANNER DA DISTRIBUIDORA ÚNICA DO PEDIDO */}
              {cartSupplier && (
                <View style={[
                  styles.supplierHeaderCard,
                  { 
                    backgroundColor: isDarkMode ? '#0E2235' : '#EFF6FF',
                    borderColor: isDarkMode ? '#1F3F5C' : '#BFDBFE'
                  }
                ]}>
                  <View style={styles.supplierHeaderRow}>
                    <View style={[styles.supplierIconBox, { backgroundColor: isDarkMode ? '#16314A' : '#DBEAFE' }]}>
                      <Ionicons name="storefront-outline" size={18} color="#FFC107" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.supplierCardTitle, { color: theme.text }]} numberOfLines={1}>
                          {cartSupplier.tradeName}
                        </Text>
                        <View style={styles.singleSupplierTag}>
                          <Text style={styles.singleSupplierTagText}>1 FORNECEDOR</Text>
                        </View>
                      </View>
                      <Text style={[styles.supplierCardSub, { color: isDarkMode ? '#8FA0AF' : '#64748B' }]}>
                        Previsão: {cartSupplier.deliveryTimeEstimate || 'Hoje'} • Frete: {cartSupplier.deliveryFee === 0 ? 'Grátis' : `R$ ${cartSupplier.deliveryFee.toFixed(2).replace('.', ',')}`}
                      </Text>
                    </View>
                  </View>

                  {/* Informação de Pedido Mínimo */}
                  {cartSupplier.minOrderValue > 0 && (
                    <View style={[styles.minOrderRow, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                      <Text style={[styles.minOrderLabel, { color: isDarkMode ? '#A0B2C6' : '#64748B' }]}>
                        Pedido mínimo: R$ {cartSupplier.minOrderValue.toFixed(2).replace('.', ',')}
                      </Text>
                      {cartTotal < cartSupplier.minOrderValue ? (
                        <Text style={styles.minOrderMissingText}>
                          Faltam R$ {(cartSupplier.minOrderValue - cartTotal).toFixed(2).replace('.', ',')}
                        </Text>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                          <Text style={styles.minOrderReachedText}>Atingido</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* LISTA DE ITENS DO CARRINHO */}
              <View style={styles.itemsSection}>
                {cart.map((item) => {
                  const product = item.product;
                  const thumbKey = product.name.toLowerCase().includes('chopp') ? 'keg_inox' : product.brand.toLowerCase();
                  const imgSrc = getProductImage(thumbKey);

                  return (
                    <View 
                      key={product.id}
                      style={[
                        styles.itemCard,
                        { backgroundColor: isDarkMode ? '#102234' : '#FFFFFF', borderColor: isDarkMode ? '#1C344A' : '#E2E8F0' }
                      ]}
                    >
                      {/* Topo do Item: Imagem + Nome/Preço + Controles (-) 14 (+) */}
                      <View style={styles.itemTopRow}>
                        {/* Imagem em fundo branco quadrado com cantos arredondados */}
                        <View style={styles.itemImgWrapper}>
                          <Image 
                            source={imgSrc} 
                            style={styles.itemThumb} 
                            resizeMode="contain" 
                          />
                        </View>

                        {/* Dados do Produto */}
                        <View style={styles.itemInfoCol}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text 
                              style={[styles.itemNameText, { color: theme.text }]}
                              numberOfLines={1}
                            >
                              {product.name}
                            </Text>
                            {/* Selo mini vermelho/dourado */}
                            <View style={styles.miniTag}>
                              <Text style={styles.miniTagText}>
                                {product.isReturnableBottle ? 'RET' : 'B2B'}
                              </Text>
                            </View>
                          </View>

                          <Text style={[styles.itemPriceText, { color: isDarkMode ? '#A0B2C6' : '#64748B' }]}>
                            R$ {product.price.toFixed(2).replace('.', ',')}
                            <Text style={{ fontSize: 11, color: theme.textMuted }}> / un</Text>
                          </Text>

                          <Text style={{ fontSize: 11, color: '#FFC107', fontWeight: 'bold' }}>
                            Subtotal: R$ {(product.price * item.quantity).toFixed(2).replace('.', ',')}
                          </Text>
                        </View>

                        {/* Controles de Quantidade: (-) 14 (+) */}
                        <View style={styles.qtyControlsRow}>
                          <TouchableOpacity 
                            style={styles.qtyCircleBtn}
                            onPress={() => updateCartQuantity(product.id, Math.max(0, item.quantity - 1))}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="remove-circle-outline" size={26} color={theme.text} />
                          </TouchableOpacity>

                          <Text style={[styles.qtyNumberText, { color: theme.text }]}>
                            {item.quantity}
                          </Text>

                          <TouchableOpacity 
                            style={styles.qtyCircleBtn}
                            onPress={() => updateCartQuantity(product.id, item.quantity + 1)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="add-circle-outline" size={26} color={theme.text} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Pílulas de Incremento Rápido: +6, +12, +24 (Perfeito para Fardos e Caixas de Bebidas) */}
                      <View style={styles.quickAddRow}>
                        <TouchableOpacity 
                          style={[styles.quickAddPill, { backgroundColor: isDarkMode ? '#172C3F' : '#FEF3C7', borderColor: isDarkMode ? '#23415C' : '#FDE68A' }]}
                          onPress={() => updateCartQuantity(product.id, item.quantity + 6)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.quickAddPillText, { color: isDarkMode ? '#FFC107' : '#92400E' }]}>+6</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.quickAddPill, { backgroundColor: isDarkMode ? '#172C3F' : '#FEF3C7', borderColor: isDarkMode ? '#23415C' : '#FDE68A' }]}
                          onPress={() => updateCartQuantity(product.id, item.quantity + 12)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.quickAddPillText, { color: isDarkMode ? '#FFC107' : '#92400E' }]}>+12</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.quickAddPill, { backgroundColor: isDarkMode ? '#172C3F' : '#FEF3C7', borderColor: isDarkMode ? '#23415C' : '#FDE68A' }]}
                          onPress={() => updateCartQuantity(product.id, item.quantity + 24)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.quickAddPillText, { color: isDarkMode ? '#FFC107' : '#92400E' }]}>+24</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Botão: (+) Adicionar mais itens */}
              <TouchableOpacity 
                style={styles.addMoreItemsBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFC107" style={{ marginRight: 6 }} />
                <Text style={styles.addMoreItemsBtnText}>Adicionar mais itens</Text>
              </TouchableOpacity>

              {/* SEÇÃO: Você também pode gostar! (Produtos do mesmo fornecedor) */}
              {crossSellList.length > 0 && (
                <View style={styles.crossSellSection}>
                  <Text style={[styles.crossSellHeading, { color: theme.text }]}>
                    Você também pode gostar!
                  </Text>

                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.crossSellScroll}
                  >
                    {crossSellList.map((itemProd: BeverageProduct) => {
                      const thumb = getProductImage(itemProd.name.toLowerCase().includes('chopp') ? 'keg_inox' : itemProd.brand.toLowerCase());

                      return (
                        <View 
                          key={itemProd.id}
                          style={[
                            styles.crossSellCard,
                            { backgroundColor: isDarkMode ? '#102234' : '#FFFFFF', borderColor: isDarkMode ? '#1B3145' : '#E2E8F0' }
                          ]}
                        >
                          <View style={styles.crossSellImgBox}>
                            <Image 
                              source={thumb} 
                              style={styles.crossSellThumb} 
                              resizeMode="contain" 
                            />
                          </View>

                          <View style={styles.crossSellContent}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text 
                                style={[styles.crossSellName, { color: theme.text }]}
                                numberOfLines={1}
                              >
                                {itemProd.name.split(' - ')[0]}
                              </Text>
                              <View style={styles.miniTag}>
                                <Text style={styles.miniTagText}>RET</Text>
                              </View>
                            </View>
                            <Text style={styles.crossSellBrand} numberOfLines={1}>
                              {itemProd.brand}
                            </Text>
                            <Text style={styles.crossSellPrice}>
                              R$ {itemProd.price.toFixed(2).replace('.', ',')}
                            </Text>
                          </View>

                          {/* Botão (+) Circular */}
                          <TouchableOpacity
                            style={[styles.crossSellAddBtn, { backgroundColor: isDarkMode ? '#162F44' : '#FEF3C7', borderColor: isDarkMode ? '#23415C' : '#FDE68A' }]}
                            onPress={() => addToCart(itemProd, 1)}
                            activeOpacity={0.8}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="add" size={16} color="#FFC107" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* ACORDEÃO 1: Se algum produto não estiver disponível */}
              <View style={[styles.accordionBox, { borderColor: isDarkMode ? '#233E56' : '#E2E8F0', backgroundColor: isDarkMode ? '#102234' : '#FFFFFF' }]}>
                <TouchableOpacity 
                  style={styles.accordionHeader}
                  onPress={() => setShowUnavailableOptions(!showUnavailableOptions)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accordionTitle, { color: theme.text }]}>
                    Se algum produto não estiver disponível
                  </Text>
                  <Ionicons 
                    name={showUnavailableOptions ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>

                {showUnavailableOptions && (
                  <View style={styles.accordionBody}>
                    <TouchableOpacity 
                      style={styles.radioOption}
                      onPress={() => setUnavailableChoice('substitute')}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={unavailableChoice === 'substitute' ? "radio-button-on" : "radio-button-off"} 
                        size={18} 
                        color={unavailableChoice === 'substitute' ? "#FFC107" : theme.textMuted} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={[styles.radioText, { color: theme.text }]}>
                        Substituir por similar da mesma marca (Recomendado)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.radioOption}
                      onPress={() => setUnavailableChoice('remove')}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={unavailableChoice === 'remove' ? "radio-button-on" : "radio-button-off"} 
                        size={18} 
                        color={unavailableChoice === 'remove' ? "#FFC107" : theme.textMuted} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={[styles.radioText, { color: theme.text }]}>
                        Não substituir e abater o valor do total
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.radioOption}
                      onPress={() => setUnavailableChoice('call')}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={unavailableChoice === 'call' ? "radio-button-on" : "radio-button-off"} 
                        size={18} 
                        color={unavailableChoice === 'call' ? "#FFC107" : theme.textMuted} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={[styles.radioText, { color: theme.text }]}>
                        Me ligar antes de enviar o caminhão de entrega
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* ACORDEÃO 2: Adicionar mais instruções de entrega */}
              <View style={[styles.accordionBox, { borderColor: isDarkMode ? '#233E56' : '#E2E8F0', backgroundColor: isDarkMode ? '#102234' : '#FFFFFF' }]}>
                <TouchableOpacity 
                  style={styles.accordionHeader}
                  onPress={() => setShowDeliveryNotes(!showDeliveryNotes)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accordionTitle, { color: theme.text }]}>
                    Adicionar mais instruções de entrega
                  </Text>
                  <Ionicons 
                    name={showDeliveryNotes ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>

                {showDeliveryNotes && (
                  <View style={styles.accordionBody}>
                    <TextInput
                      style={[
                        styles.notesInput,
                        { color: theme.text, borderColor: theme.border, backgroundColor: isDarkMode ? '#081724' : '#F8FAFC' },
                        Platform.OS === 'web' && ({ outline: 'none' } as any)
                      ]}
                      placeholder="Ex: Entregar pela doca dos fundos; tocar interfone do almoxarifado; receber das 08h às 15h..."
                      placeholderTextColor={theme.textMuted}
                      value={deliveryNotes}
                      onChangeText={setDeliveryNotes}
                      multiline={true}
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                )}
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>

            {/* ======================================================== */}
            {/* BARRA FIXA INFERIOR COM SUBTOTAL & CTA CONFIRMAR ENTREGA */}
            {/* ======================================================== */}
            <View style={[
              styles.bottomBar, 
              { backgroundColor: isDarkMode ? '#091C2C' : '#FFFFFF', borderTopColor: isDarkMode ? '#1B3145' : '#E2E8F0' }
            ]}>
              {/* Drag handle sutil */}
              <View style={[styles.bottomHandleBar, { backgroundColor: isDarkMode ? '#334D66' : '#CBD5E1' }]} />

              {/* Linha de Subtotal */}
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Subtotal</Text>
                <Text style={styles.subtotalValue}>
                  R$ {cartTotal.toFixed(2).replace('.', ',')}
                </Text>
              </View>

              {/* Botão de Confirmação para Prosseguir ao Checkout */}
              <TouchableOpacity 
                style={styles.confirmCheckoutBtn}
                onPress={handleProceedToCheckout}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmCheckoutBtnText}>
                  Confirmar Detalhes da Entrega
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  itemsSection: {
    gap: 12,
  },
  supplierHeaderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  supplierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplierIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  singleSupplierTag: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 193, 7, 0.4)',
  },
  singleSupplierTagText: {
    color: '#FFC107',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  supplierCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  minOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  minOrderLabel: {
    fontSize: 11,
  },
  minOrderMissingText: {
    fontSize: 11,
    color: '#FFC107',
    fontWeight: '600',
  },
  minOrderReachedText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: 'bold',
  },
  itemCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImgWrapper: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemThumb: {
    width: '100%',
    height: '100%',
  },
  itemInfoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  miniTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  itemPriceText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  qtyControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
  },
  qtyCircleBtn: {
    padding: 2,
  },
  qtyNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 22,
    textAlign: 'center',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickAddPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickAddPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  addMoreItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },
  addMoreItemsBtnText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
  },
  crossSellSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  crossSellHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  crossSellScroll: {
    gap: 12,
    paddingRight: 10,
  },
  crossSellCard: {
    width: 170,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  crossSellImgBox: {
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  crossSellThumb: {
    width: '100%',
    height: '100%',
  },
  crossSellContent: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 20,
  },
  crossSellName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  crossSellBrand: {
    fontSize: 10,
    color: '#8FA0AF',
    marginTop: 1,
  },
  crossSellPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFC107',
    marginTop: 2,
  },
  crossSellAddBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionBox: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  radioText: {
    fontSize: 12,
    flex: 1,
  },
  notesInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    minHeight: 60,
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  bottomHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subtotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  subtotalValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  confirmCheckoutBtn: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmCheckoutBtnText: {
    color: '#0D1C28',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyCtaBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
