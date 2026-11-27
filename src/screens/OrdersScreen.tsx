import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  Image,
  Modal,
  Alert,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { PixPaymentModal } from '../components/PixPaymentModal';
import { RefundRequestModal } from '../components/RefundRequestModal';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { getProductImage } from '../utils/productImages';
import { LocationHeaderSelector } from '../components/LocationHeaderSelector';

interface OrdersScreenProps {
  onBack?: () => void;
  onOpenMyBars?: () => void;
  onOpenCheckout?: () => void;
  onOpenLogin?: () => void;
}

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  onBack,
  onOpenMyBars,
  onOpenCheckout,
  onOpenLogin,
}) => {
  const { 
    orders, 
    addToCart, 
    products, 
    isDarkMode, 
    theme, 
    currentUser,
  } = useApp();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [selectedOrderForPix, setSelectedOrderForPix] = useState<Order | null>(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [orderTab, setOrderTab] = useState<'ongoing' | 'history'>('ongoing');
  const [search, setSearch] = useState('');

  const ongoingOrders = orders.filter(o => 
    o.status === 'pending_payment' || 
    o.status === 'confirmed' || 
    o.status === 'preparing' || 
    o.status === 'in_transit'
  );

  const historyOrders = orders.filter(o => 
    o.status === 'delivered' || 
    o.status === 'cancelled'
  );

  const currentTabOrders = orderTab === 'ongoing' ? ongoingOrders : historyOrders;

  const filteredOrders = currentTabOrders.filter(o => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = o.id.toLowerCase().includes(q) || 
                    o.supplierName.toLowerCase().includes(q) ||
                    o.items.some(it => it.productName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return { 
          label: 'Aguardando Pix', 
          color: '#FFC107', 
          bg: isDarkMode ? '#172C3F' : '#FEF3C7', 
          border: isDarkMode ? '#233E56' : '#FDE68A',
          icon: 'time-outline' as const 
        };
      case 'confirmed':
        return { 
          label: 'Confirmado', 
          color: '#FFC107', 
          bg: isDarkMode ? '#172C3F' : '#FEF3C7', 
          border: isDarkMode ? '#233E56' : '#FDE68A',
          icon: 'checkmark-circle-outline' as const 
        };
      case 'preparing':
        return { 
          label: 'Separando no Galpão', 
          color: '#FFC107', 
          bg: isDarkMode ? '#172C3F' : '#FEF3C7', 
          border: isDarkMode ? '#233E56' : '#FDE68A',
          icon: 'cube-outline' as const 
        };
      case 'in_transit':
        return { 
          label: 'Caminhão em Rota', 
          color: '#FFC107', 
          bg: isDarkMode ? '#172C3F' : '#FEF3C7', 
          border: isDarkMode ? '#233E56' : '#FDE68A',
          icon: 'car-outline' as const 
        };
      case 'delivered':
        return { 
          label: 'Entregue no Bar', 
          color: '#10B981', 
          bg: isDarkMode ? '#102A22' : '#ECFDF5', 
          border: isDarkMode ? '#174738' : '#A7F3D0',
          icon: 'checkmark-done-circle-outline' as const 
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          color: '#94A3B8', 
          bg: isDarkMode ? '#17212B' : '#F1F5F9', 
          border: isDarkMode ? '#293542' : '#CBD5E1',
          icon: 'close-circle-outline' as const 
        };
    }
  };

  const handleReorder = (order: Order) => {
    // Adiciona todos os itens deste pedido ao carrinho (todos do mesmo fornecedor)
    order.items.forEach(it => {
      const found = products.find(p => p.id === it.productId);
      if (found) {
        addToCart(found, it.quantity);
      } else {
        const fallbackProd = {
          id: it.productId,
          supplierId: order.supplierId,
          supplierName: order.supplierName,
          name: it.productName,
          brand: it.productName.split(' ')[0] || 'Ambev',
          description: it.productName,
          category: 'cervejas' as const,
          unit: it.unit,
          packageDetails: it.unit,
          price: it.unitPrice,
          stock: 999,
          isReturnableBottle: it.isReturnableBottle,
          imageUrl: '',
          minOrderUnits: 1,
        };
        addToCart(fallbackProd, it.quantity);
      }
    });

    Alert.alert(
      'Itens Adicionados à Sacola!',
      `Os ${order.items.length} ${order.items.length === 1 ? 'produto' : 'produtos'} de ${order.supplierName} foram adicionados ao carrinho.`,
      [
        { text: 'Continuar Navegando', style: 'cancel' },
        { 
          text: 'Abrir Carrinho', 
          onPress: () => {
            if (onOpenCheckout) onOpenCheckout();
          } 
        }
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

        <View style={[styles.emptyContainer, { flex: 1, justifyContent: 'center', paddingHorizontal: 32 }]}>
          <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: isDarkMode ? '#132232' : '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="receipt-outline" size={46} color="#FFC107" />
          </View>
          <Text style={[styles.emptyTitle, { fontSize: 20, marginBottom: 8 }]}>Nenhum pedido encontrado</Text>
          <Text style={[styles.emptySub, { textAlign: 'center', marginBottom: 24, lineHeight: 22 }]}>
            Você está navegando como visitante. Conecte sua conta para acompanhar seus pedidos e entregas em tempo real.
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
        {/* Duas Abas Principais: Em Andamento e Histórico */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.mainTabBtn, orderTab === 'ongoing' && styles.mainTabBtnActive]}
            onPress={() => setOrderTab('ongoing')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="time-outline" 
              size={18} 
              color={orderTab === 'ongoing' ? "#0D1C28" : (isDarkMode ? "#A0B2C6" : "#64748B")} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.mainTabText, orderTab === 'ongoing' && styles.mainTabTextActive]}>
              Em Andamento {ongoingOrders.length > 0 ? `(${ongoingOrders.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainTabBtn, orderTab === 'history' && styles.mainTabBtnActive]}
            onPress={() => setOrderTab('history')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="checkmark-done-circle-outline" 
              size={18} 
              color={orderTab === 'history' ? "#0D1C28" : (isDarkMode ? "#A0B2C6" : "#64748B")} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.mainTabText, orderTab === 'history' && styles.mainTabTextActive]}>
              Histórico {historyOrders.length > 0 ? `(${historyOrders.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Barra de Busca de Pedidos Pílula */}
        <View style={styles.searchBarBox}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[
              styles.searchInput,
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
            placeholder="Buscar por pedido, distribuidor ou cerveja..."
            placeholderTextColor={theme.textMuted}
            value={search}
            underlineColorAndroid="transparent"
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de Pedidos com Cards no Formato Exato do Figma */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={orderTab === 'ongoing' ? "time-outline" : "receipt-outline"} 
              size={54} 
              color="#52667A" 
            />
            <Text style={styles.emptyTitle}>
              {orderTab === 'ongoing' ? 'Nenhum pedido em andamento' : 'Nenhum pedido no histórico'}
            </Text>
            <Text style={styles.emptySub}>
              {orderTab === 'ongoing' 
                ? 'Quando você confirmar um pedido com um distribuidor parceiro, o status da separação e o caminhão em rota aparecerão aqui.'
                : 'Seus pedidos entregues e concluídos ficarão salvos aqui para você pedir novamente com facilidade.'}
            </Text>
            {onBack && (
              <TouchableOpacity style={styles.emptyCtaBtn} onPress={onBack} activeOpacity={0.85}>
                <Ionicons name="beer-outline" size={16} color="#0D1C28" />
                <Text style={styles.emptyCtaBtnText}>Explorar Catálogo de Bebidas</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredOrders.map(order => {
            const statusConfig = getStatusBadge(order.status);
            const firstItem = order.items[0];
            const firstItemName = firstItem ? firstItem.productName : 'Heineken - 600ml';
            const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <TouchableOpacity 
                key={order.id} 
                style={styles.figmaOrderCard}
                onPress={() => setSelectedOrderForDetails(order)}
                activeOpacity={0.92}
              >
                {/* 1. Topo do Card: Distribuidor Unificado + Nome + Status Badge Coeso */}
                <View style={styles.cardTopRow}>
                  <View style={styles.distributorIconBox}>
                    <Ionicons name="storefront" size={17} color="#FFC107" />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.orderSupplierName}>{order.supplierName}</Text>
                    <Text style={styles.orderSubMeta}>
                      {order.id} • Tempo médio 1 dia
                    </Text>
                  </View>

                  {/* Badge de Status Coeso e Elegante */}
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
                    <Ionicons name={statusConfig.icon} size={13} color={statusConfig.color} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* 2. Card de Produto Interno (Idêntico ao Card "Peça novamente" do Figma) */}
                <View style={styles.reorderStyleBox}>
                  {/* Garrafa em caixa escura quadrada com cantos arredondados */}
                  <View style={styles.itemImgBox}>
                    <Image 
                      source={getProductImage(firstItemName.toLowerCase().includes('chopp') ? 'keg_inox' : 'heineken')} 
                      style={styles.itemImg}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.itemInfoCol}>
                    {/* Linha de Título e Preço Total */}
                    <View style={styles.itemTopRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {order.items.length > 1 
                          ? `${firstItemName} + ${order.items.length - 1} outro${order.items.length > 2 ? 's' : ''}`
                          : firstItemName}
                      </Text>
                      <Text style={styles.itemPrice}>R${order.total.toFixed(2).replace('.', ',')}</Text>
                    </View>

                    {/* Preço Unitário e Quantidade */}
                    <Text style={styles.itemSubText}>
                      {order.items.length === 1 
                        ? `Uni R$${firstItem?.unitPrice.toFixed(2).replace('.', ',') || '10,00'} • ${totalUnits} un.`
                        : `${order.items.length} produtos da distribuidora • ${totalUnits} un. total`}
                    </Text>

                    {/* Linha de Destino */}
                    <View style={styles.barDestRow}>
                      <Ionicons name="location-sharp" size={12} color="#FFC107" />
                      <Text style={styles.barDestText} numberOfLines={1}>
                        {order.barName}
                      </Text>
                    </View>

                    {/* Linha de Ações: Stepper / Contador e Botão Amarelo */}
                    <View style={styles.itemActionRow}>
                      <View style={styles.qtyPill}>
                        <Text style={styles.qtyPillText}>{totalUnits} un.</Text>
                      </View>

                      {order.status === 'in_transit' ? (
                        <TouchableOpacity 
                          style={styles.addToBagBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            setTrackingOrder(order);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.addToBagBtnText}>Rastrear Caminhão</Text>
                          <Ionicons name="car" size={14} color="#0D1C28" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      ) : order.status === 'pending_payment' ? (
                        <TouchableOpacity 
                          style={styles.addToBagBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            setSelectedOrderForPix(order);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.addToBagBtnText}>Pagar com Pix</Text>
                          <Ionicons name="flash" size={14} color="#0D1C28" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          style={styles.addToBagBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleReorder(order);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.addToBagBtnText}>Repetir Pedido</Text>
                          <Ionicons name="bag-handle" size={14} color="#0D1C28" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                {/* Toque para ver detalhes completos */}
                <View style={styles.cardDetailsHintRow}>
                  <Text style={[styles.cardDetailsHintText, { color: isDarkMode ? '#8FA0AF' : '#64748B' }]}>
                    Toque para ver todos os {order.items.length} itens e comprovante
                  </Text>
                  <Ionicons name="chevron-forward" size={13} color="#FFC107" />
                </View>

                {/* Opção Discreta de Ajuda / Reembolso B2B para pedidos finalizados ou entregues */}
                {(order.status === 'delivered' || order.status === 'cancelled') && (
                  <View style={styles.discreetHelpRow}>
                    <TouchableOpacity 
                      style={styles.discreetHelpBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedOrderForRefund(order);
                      }}
                      activeOpacity={0.65}
                    >
                      <Ionicons name="help-circle-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
                      <Text style={styles.discreetHelpText}>Ajuda com esta entrega ou solicitar reembolso</Text>
                      <Ionicons name="chevron-forward" size={11} color={theme.textMuted} style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal de Rastreamento do Caminhão */}
      <Modal
        visible={!!trackingOrder}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTrackingOrder(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setTrackingOrder(null)}
        >
          <View 
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Rastreamento em Tempo Real</Text>
                <Text style={styles.modalSub}>{trackingOrder?.id} • {trackingOrder?.supplierName}</Text>
              </View>
              <TouchableOpacity onPress={() => setTrackingOrder(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.timelineContainer}>
              <View style={styles.timelineStep}>
                <View style={styles.timelineDotDone}>
                  <Ionicons name="checkmark" size={12} color="#0D1C28" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.timelineStepTitle}>Pedido Confirmado</Text>
                  <Text style={styles.timelineStepSub}>Faturamento aprovado pela distribuidora</Text>
                </View>
              </View>
              <View style={styles.timelineLineDone} />

              <View style={styles.timelineStep}>
                <View style={styles.timelineDotDone}>
                  <Ionicons name="checkmark" size={12} color="#0D1C28" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.timelineStepTitle}>Carga Paletizada no Galpão</Text>
                  <Text style={styles.timelineStepSub}>NFe emitida e engradados conferidos</Text>
                </View>
              </View>
              <View style={styles.timelineLineDone} />

              <View style={styles.timelineStep}>
                <View style={styles.timelineDotActive}>
                  <Ionicons name="car" size={12} color="#0D1C28" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.timelineStepTitle, { color: '#FFC107' }]}>Caminhão em Rota de Entrega</Text>
                  <Text style={styles.timelineStepSub}>Previsão: Chegada em ~35 min no estabelecimento</Text>
                </View>
              </View>
              <View style={styles.timelineLinePending} />

              <View style={styles.timelineStep}>
                <View style={styles.timelineDotPending}>
                  <Ionicons name="storefront" size={12} color="#657F99" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.timelineStepTitlePending}>Descarregamento no Bar</Text>
                  <Text style={styles.timelineStepSub}>Troca de vasilhames e baixa pelo motorista</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.closeTrackingBtn}
              onPress={() => setTrackingOrder(null)}
            >
              <Text style={styles.closeTrackingBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Pix se necessário */}
      <PixPaymentModal
        visible={!!selectedOrderForPix}
        order={selectedOrderForPix}
        onClose={() => setSelectedOrderForPix(null)}
        onPaymentSuccess={() => setSelectedOrderForPix(null)}
      />

      {/* Modal Discreto de Solicitação de Reembolso B2B */}
      <RefundRequestModal
        visible={!!selectedOrderForRefund}
        order={selectedOrderForRefund}
        onClose={() => setSelectedOrderForRefund(null)}
        onSubmitted={(protocol) => {
          Alert.alert(
            'Protocolo Registrado',
            `Sua solicitação (${protocol}) foi encaminhada à distribuidora parceira para análise da ocorrência.`
          );
        }}
      />

      {/* Modal Completo de Detalhes do Pedido */}
      <OrderDetailModal
        order={selectedOrderForDetails}
        visible={selectedOrderForDetails !== null}
        onClose={() => setSelectedOrderForDetails(null)}
        onReorder={handleReorder}
        onTrackOrder={(o) => {
          setSelectedOrderForDetails(null);
          setTrackingOrder(o);
        }}
        onPayPix={(o) => {
          setSelectedOrderForDetails(null);
          setSelectedOrderForPix(o);
        }}
        onRequestRefund={(o) => {
          setSelectedOrderForDetails(null);
          setSelectedOrderForRefund(o);
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  mainTabBtnActive: {
    backgroundColor: '#FFC107',
  },
  mainTabText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  mainTabTextActive: {
    color: '#0D1C28',
    fontWeight: 'bold',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceInput,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? ({
      outlineStyle: 'none',
      outlineWidth: 0,
      borderWidth: 0,
      boxShadow: 'none',
    } as any) : {}),
  },
  figmaOrderCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distributorIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: isDarkMode ? '#162C42' : '#FEF3C7',
    borderWidth: 1,
    borderColor: isDarkMode ? '#22405E' : '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderSupplierName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  orderSubMeta: {
    color: theme.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reorderStyleBox: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemImgBox: {
    width: 76,
    height: 86,
    backgroundColor: isDarkMode ? '#162839' : '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  itemImg: {
    width: 38,
    height: 76,
  },
  itemInfoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  itemPrice: {
    color: theme.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  itemSubText: {
    color: theme.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  barDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  barDestText: {
    color: theme.textMuted,
    fontSize: 11,
    flex: 1,
  },
  itemActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qtyPill: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  qtyPillText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: 'bold',
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDetailsHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#1A3042' : '#EEF2F6',
  },
  cardDetailsHintText: {
    fontSize: 11,
    fontWeight: '500',
  },
  discreetHelpRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: isDarkMode ? '#1E3244' : '#E2E8F0',
    alignItems: 'flex-end',
  },
  discreetHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  discreetHelpText: {
    color: theme.textMuted,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  emptyCtaBtn: {
    marginTop: 18,
    backgroundColor: '#FFC107',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyCtaBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  modalSub: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  timelineContainer: {
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDotDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#2A4154' : '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineStepTitle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  timelineStepTitlePending: {
    color: theme.textMuted,
    fontSize: 13,
  },
  timelineStepSub: {
    color: theme.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  timelineLineDone: {
    width: 2,
    height: 24,
    backgroundColor: '#4ADE80',
    marginLeft: 11,
    marginVertical: 4,
  },
  timelineLinePending: {
    width: 2,
    height: 24,
    backgroundColor: isDarkMode ? '#2A4154' : '#CBD5E1',
    marginLeft: 11,
    marginVertical: 4,
  },
  closeTrackingBtn: {
    backgroundColor: '#FFC107',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  closeTrackingBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
  });
}
