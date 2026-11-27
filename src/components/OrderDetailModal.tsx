import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderStatus } from '../types';
import { useApp } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';

interface OrderDetailModalProps {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onReorder: (order: Order) => void;
  onTrackOrder?: (order: Order) => void;
  onPayPix?: (order: Order) => void;
  onRequestRefund?: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  visible,
  onClose,
  onReorder,
  onTrackOrder,
  onPayPix,
  onRequestRefund,
}) => {
  const { isDarkMode, theme } = useApp();

  if (!order || !visible) return null;

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return {
          label: 'Aguardando Pagamento Pix',
          color: '#FFC107',
          bg: isDarkMode ? '#1E2C38' : '#FEF3C7',
          border: isDarkMode ? '#2F485E' : '#FDE68A',
          icon: 'time-outline' as const,
          step: 1,
        };
      case 'confirmed':
        return {
          label: 'Pedido Confirmado',
          color: '#FFC107',
          bg: isDarkMode ? '#1E2C38' : '#FEF3C7',
          border: isDarkMode ? '#2F485E' : '#FDE68A',
          icon: 'checkmark-circle-outline' as const,
          step: 2,
        };
      case 'preparing':
        return {
          label: 'Separando no Galpão da Distribuidora',
          color: '#38BDF8',
          bg: isDarkMode ? '#102A3C' : '#E0F2FE',
          border: isDarkMode ? '#1E4968' : '#BAE6FD',
          icon: 'cube-outline' as const,
          step: 3,
        };
      case 'in_transit':
        return {
          label: 'Caminhão em Rota de Entrega',
          color: '#34D399',
          bg: isDarkMode ? '#0F2C2A' : '#D1FAE5',
          border: isDarkMode ? '#184E48' : '#A7F3D0',
          icon: 'car-outline' as const,
          step: 4,
        };
      case 'delivered':
        return {
          label: 'Pedido Entregue no Bar',
          color: '#10B981',
          bg: isDarkMode ? '#0F2C2A' : '#D1FAE5',
          border: isDarkMode ? '#184E48' : '#A7F3D0',
          icon: 'checkmark-done-circle' as const,
          step: 5,
        };
      case 'cancelled':
        return {
          label: 'Pedido Cancelado',
          color: '#EF4444',
          bg: isDarkMode ? '#2B171A' : '#FEE2E2',
          border: isDarkMode ? '#4E2429' : '#FECACA',
          icon: 'close-circle-outline' as const,
          step: 0,
        };
      default:
        return {
          label: 'Em Processamento',
          color: '#FFC107',
          bg: isDarkMode ? '#1E2C38' : '#FEF3C7',
          border: isDarkMode ? '#2F485E' : '#FDE68A',
          icon: 'sync-outline' as const,
          step: 2,
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Hoje';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#051724' : '#F8FAFC' }]}>
        {/* HEADER SUPERIOR */}
        <View style={[styles.header, { backgroundColor: isDarkMode ? '#081C2C' : '#FFFFFF', borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Detalhes do Pedido</Text>
            <Text style={[styles.headerSub, { color: isDarkMode ? '#8FA0AF' : '#64748B' }]}>
              {order.id} • {formatDate(order.createdAt)}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 1. STATUS CARD COM TIMELINE */}
          <View style={[
            styles.cardBox,
            { 
              backgroundColor: isDarkMode ? '#0D2132' : '#FFFFFF',
              borderColor: isDarkMode ? '#1E3C56' : '#E2E8F0' 
            }
          ]}>
            <View style={styles.statusHeaderRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
                <Ionicons name={statusInfo.icon} size={15} color={statusInfo.color} style={{ marginRight: 6 }} />
                <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>

              <Text style={[styles.statusEstimate, { color: isDarkMode ? '#8FA0AF' : '#64748B' }]}>
                {order.estimatedDeliveryTime || 'Previsão: Hoje'}
              </Text>
            </View>

            {/* Stepper visual de entrega */}
            {order.status !== 'cancelled' && (
              <View style={styles.timelineRow}>
                {[
                  { step: 1, label: 'Criado' },
                  { step: 2, label: 'Confirmado' },
                  { step: 3, label: 'Galpão' },
                  { step: 4, label: 'Caminhão' },
                  { step: 5, label: 'Entregue' },
                ].map((st, idx) => {
                  const isDone = statusInfo.step >= st.step;
                  const isCurrent = statusInfo.step === st.step;
                  return (
                    <React.Fragment key={st.step}>
                      {idx > 0 && (
                        <View style={[
                          styles.timelineLine,
                          { backgroundColor: isDone ? '#FFC107' : (isDarkMode ? '#1F3447' : '#E2E8F0') }
                        ]} />
                      )}
                      <View style={styles.timelineStepCol}>
                        <View style={[
                          styles.timelineDot,
                          {
                            backgroundColor: isDone ? '#FFC107' : (isDarkMode ? '#172737' : '#F1F5F9'),
                            borderColor: isCurrent ? '#FFFFFF' : (isDone ? '#FFC107' : (isDarkMode ? '#284157' : '#CBD5E1')),
                          }
                        ]}>
                          <Ionicons 
                            name={isDone ? "checkmark" : "ellipse"} 
                            size={isDone ? 11 : 6} 
                            color={isDone ? "#0D1C28" : (isDarkMode ? "#5A7287" : "#94A3B8")} 
                          />
                        </View>
                        <Text style={[
                          styles.timelineStepLabel,
                          { 
                            color: isCurrent 
                              ? '#FFC107' 
                              : (isDone ? theme.text : (isDarkMode ? '#627A8F' : '#94A3B8')),
                            fontWeight: isCurrent ? 'bold' : 'normal'
                          }
                        ]}>
                          {st.label}
                        </Text>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            )}
          </View>

          {/* 2. CARD DO FORNECEDOR / DISTRIBUIDORA */}
          <View style={[
            styles.cardBox,
            { 
              backgroundColor: isDarkMode ? '#0D2132' : '#FFFFFF',
              borderColor: isDarkMode ? '#1E3C56' : '#E2E8F0' 
            }
          ]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="storefront" size={17} color="#FFC107" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Distribuidora Responsável</Text>
              <View style={styles.supplierTag}>
                <Text style={styles.supplierTagText}>1 FORNECEDOR</Text>
              </View>
            </View>

            <Text style={[styles.supplierNameText, { color: theme.text }]}>
              {order.supplierName}
            </Text>
            <Text style={[styles.supplierMetaText, { color: isDarkMode ? '#8FA0AF' : '#64748B' }]}>
              Despacho direto por caminhão do distribuidor credenciado FlowStock.
            </Text>
          </View>

          {/* 3. CARD DE DESTINO / BAR */}
          <View style={[
            styles.cardBox,
            { 
              backgroundColor: isDarkMode ? '#0D2132' : '#FFFFFF',
              borderColor: isDarkMode ? '#1E3C56' : '#E2E8F0' 
            }
          ]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location" size={17} color="#FFC107" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Local de Entrega</Text>
            </View>

            <Text style={[styles.barNameText, { color: theme.text }]}>
              {order.barName}
            </Text>
            {order.barCnpj ? (
              <Text style={[styles.barCnpjText, { color: isDarkMode ? '#8FA0AF' : '#64748B' }]}>
                CNPJ Faturado: {order.barCnpj}
              </Text>
            ) : null}
            <Text style={[styles.barAddressText, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
              {order.barAddress}
            </Text>

            {order.deliveryNotes ? (
              <View style={[styles.notesBox, { backgroundColor: isDarkMode ? '#142738' : '#F1F5F9', borderColor: isDarkMode ? '#234460' : '#E2E8F0' }]}>
                <Ionicons name="document-text-outline" size={15} color="#FFC107" style={{ marginRight: 6, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notesLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                    Instruções para a doca/motorista:
                  </Text>
                  <Text style={[styles.notesContent, { color: theme.text }]}>
                    {order.deliveryNotes}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* 4. LISTA COMPLETA DE PRODUTOS DO PEDIDO (TODOS DO MESMO FORNECEDOR) */}
          <View style={[
            styles.cardBox,
            { 
              backgroundColor: isDarkMode ? '#0D2132' : '#FFFFFF',
              borderColor: isDarkMode ? '#1E3C56' : '#E2E8F0' 
            }
          ]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="beer-outline" size={17} color="#FFC107" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Itens do Pedido ({order.items.length} {order.items.length === 1 ? 'produto' : 'produtos'})
              </Text>
              <Text style={[styles.totalUnitsBadge, { color: '#FFC107' }]}>
                {totalUnits} un. total
              </Text>
            </View>

            <View style={styles.itemsList}>
              {order.items.map((it, idx) => {
                const thumbKey = it.productName.toLowerCase().includes('chopp') 
                  ? 'keg_inox' 
                  : (it.productName.toLowerCase().includes('spaten') ? 'spaten' : (it.productName.toLowerCase().includes('brahma') ? 'brahma' : (it.productName.toLowerCase().includes('corona') ? 'corona' : 'heineken')));
                const imgSrc = getProductImage(thumbKey);

                return (
                  <View 
                    key={it.productId || idx} 
                    style={[
                      styles.itemRow, 
                      idx > 0 && { borderTopWidth: 1, borderTopColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }
                    ]}
                  >
                    {/* Imagem em fundo branco com bordas arredondadas */}
                    <View style={styles.itemImgWrapper}>
                      <Image source={imgSrc} style={styles.itemThumb} resizeMode="contain" />
                    </View>

                    {/* Dados do item */}
                    <View style={styles.itemInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                          {it.productName}
                        </Text>
                        <View style={[styles.tagMini, { backgroundColor: it.isReturnableBottle ? '#F59E0B' : '#EF4444' }]}>
                          <Text style={styles.tagMiniText}>
                            {it.isReturnableBottle ? 'RET' : 'B2B'}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.itemUnit, { color: isDarkMode ? '#8FA0AF' : '#64748B' }]} numberOfLines={1}>
                        {it.unit || 'Embalagem Atacado'}
                      </Text>

                      <View style={styles.itemPriceLine}>
                        <Text style={[styles.itemQtyPrice, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                          {it.quantity}x R$ {it.unitPrice.toFixed(2).replace('.', ',')}
                        </Text>
                        <Text style={styles.itemSubtotal}>
                          R$ {it.subtotal.toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 5. RESUMO FINANCEIRO E PAGAMENTO */}
          <View style={[
            styles.cardBox,
            { 
              backgroundColor: isDarkMode ? '#0D2132' : '#FFFFFF',
              borderColor: isDarkMode ? '#1E3C56' : '#E2E8F0' 
            }
          ]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="receipt-outline" size={17} color="#FFC107" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Resumo Financeiro</Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                Subtotal dos produtos:
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                R$ {order.subtotal.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLabel, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                Taxa de entrega:
              </Text>
              <Text style={[styles.summaryValue, { color: order.deliveryFee === 0 ? '#10B981' : theme.text }]}>
                {order.deliveryFee === 0 ? 'Grátis' : `R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}`}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} />

            <View style={styles.summaryLine}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>Total do Pedido:</Text>
              <Text style={styles.totalValue}>
                R$ {order.total.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            {/* Informações da Forma de Pagamento */}
            <View style={[styles.paymentMethodCard, { backgroundColor: isDarkMode ? '#142738' : '#F8FAFC', borderColor: isDarkMode ? '#234460' : '#E2E8F0' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name={order.paymentMethod === 'pix' ? "qr-code-outline" : (order.paymentMethod === 'boleto_faturado' ? "document-text-outline" : "card-outline")} 
                  size={20} 
                  color="#FFC107" 
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentMethodName, { color: theme.text }]}>
                    {order.paymentMethod === 'pix' 
                      ? 'Pagamento via Pix' 
                      : (order.paymentMethod === 'boleto_faturado' ? 'Boleto Faturado (15 Dias)' : 'Cartão de Crédito')}
                  </Text>
                  <Text style={[styles.paymentMethodSub, { color: isDarkMode ? '#8FA0AF' : '#64748B' }]}>
                    Status: {order.paymentStatus === 'paid' ? 'Pago com sucesso' : (order.paymentStatus === 'scheduled_faturado' ? 'Agendado no CNPJ' : 'Pendente de pagamento')}
                  </Text>
                </View>
                {order.paymentStatus === 'paid' && (
                  <View style={styles.paidBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.paidBadgeText}>Pago</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={{ height: 10 }} />
        </ScrollView>

        {/* 6. BARRA FIXA DE AÇÕES INFERIORES */}
        <View style={[
          styles.bottomBar,
          { 
            backgroundColor: isDarkMode ? '#081C2C' : '#FFFFFF',
            borderTopColor: isDarkMode ? '#1E3C56' : '#E2E8F0' 
          }
        ]}>
          {/* Se status for Pix Pendente, botão de destaque para pagar */}
          {order.status === 'pending_payment' && onPayPix && (
            <TouchableOpacity 
              style={styles.payPixBtn}
              onPress={() => onPayPix(order)}
              activeOpacity={0.85}
            >
              <Ionicons name="qr-code" size={18} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6 }} />
              <Text style={[styles.payPixBtnText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>Pagar com Pix Agora</Text>
            </TouchableOpacity>
          )}

          {/* Se estiver em trânsito, botão de rastreamento */}
          {order.status === 'in_transit' && onTrackOrder && (
            <TouchableOpacity 
              style={styles.trackBtn}
              onPress={() => onTrackOrder(order)}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate-outline" size={18} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6 }} />
              <Text style={[styles.trackBtnText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>Rastrear Caminhão de Entrega</Text>
            </TouchableOpacity>
          )}

          {/* Botão de Repetir Pedido (Adiciona todos os produtos à sacola de uma vez) */}
          <TouchableOpacity 
            style={styles.reorderBtn}
            onPress={() => {
              onReorder(order);
              onClose();
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="repeat-outline" size={18} color="#FFC107" style={{ marginRight: 8 }} />
            <Text style={styles.reorderBtnText}>
              Pedir Novamente ({order.items.length} {order.items.length === 1 ? 'item' : 'itens'})
            </Text>
          </TouchableOpacity>

          {/* Botão de Ajuda / Reembolso */}
          {onRequestRefund && (
            <TouchableOpacity 
              style={styles.helpBtn}
              onPress={() => {
                onRequestRefund(order);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={16} color={isDarkMode ? "#8FA0AF" : "#64748B"} style={{ marginRight: 6 }} />
              <Text style={[styles.helpBtnText, { color: isDarkMode ? '#8FA0AF' : '#64748B' }]}>
                Precisa de ajuda ou reembolso com este pedido?
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  cardBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusEstimate: {
    fontSize: 11,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    marginBottom: 16,
  },
  timelineStepCol: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  timelineStepLabel: {
    fontSize: 9,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  supplierTag: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 193, 7, 0.4)',
  },
  supplierTagText: {
    color: '#FFC107',
    fontSize: 9,
    fontWeight: 'bold',
  },
  supplierNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  supplierMetaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  barNameText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  barCnpjText: {
    fontSize: 11,
    marginTop: 2,
  },
  barAddressText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 12,
    lineHeight: 16,
  },
  totalUnitsBadge: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemsList: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemImgWrapper: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  itemThumb: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  tagMini: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  tagMiniText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  itemUnit: {
    fontSize: 11,
    marginTop: 2,
  },
  itemPriceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  itemQtyPrice: {
    fontSize: 11,
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  paymentMethodCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  paymentMethodName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  paymentMethodSub: {
    fontSize: 10,
    marginTop: 1,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  paidBadgeText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: 'bold',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 8,
  },
  payPixBtn: {
    backgroundColor: '#FFC107',
    paddingVertical: 13,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payPixBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
  trackBtn: {
    backgroundColor: '#34D399',
    paddingVertical: 13,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reorderBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFC107',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderBtnText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  helpBtnText: {
    fontSize: 11,
  },
});
