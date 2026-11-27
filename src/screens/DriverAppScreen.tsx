import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { BrandLogo } from '../components/BrandLogo';

export const DriverAppScreen: React.FC = () => {
  const { orders, updateOrderStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'truck_cargo'>('deliveries');

  // Pedidos que estão em rota ou preparados para entrega
  const deliveries = orders.filter(o => o.status === 'in_transit' || o.status === 'preparing' || o.status === 'delivered');

  // Carga estimada total no caminhão
  const totalUnits = orders.reduce((acc, o) => 
    acc + o.items.reduce((sum, it) => sum + it.quantity, 0), 0
  );

  const totalReturnables = orders.reduce((acc, o) => 
    acc + o.items.filter(it => it.isReturnableBottle).reduce((sum, it) => sum + it.quantity, 0), 0
  );

  const handleStartRoute = (orderId: string) => {
    updateOrderStatus(orderId, 'in_transit');
    Alert.alert('🚛 Caminhão em Rota!', 'O bar foi notificado que o caminhão está a caminho.');
  };

  const handleFinishDelivery = (orderId: string) => {
    updateOrderStatus(orderId, 'delivered');
    Alert.alert('✅ Entrega Concluída!', 'Comprovante registrado e estoque baixado no estabelecimento.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header do Motorista com Identidade Dark Oficial */}
      <View style={styles.header}>
        <View style={styles.driverInfo}>
          <BrandLogo size="sm" variant="dark" showPhrase={true} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.driverGreeting}>Caminhão Mercedes 1114</Text>
            <Text style={styles.driverName}>Marcos Silva (Frota Logística SP)</Text>
          </View>
        </View>
        <View style={styles.badgeOnline}>
          <Text style={styles.badgeOnlineText}>● GPS ATIVO</Text>
        </View>
      </View>

      {/* Tabs com Estética FlowStock */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'deliveries' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('deliveries')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="map" 
            size={16} 
            color={activeTab === 'deliveries' ? '#FFC107' : '#8FA0AF'} 
          />
          <Text style={[styles.tabText, activeTab === 'deliveries' && styles.tabTextActive]}>
            Entregas ({deliveries.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'truck_cargo' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('truck_cargo')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="cube" 
            size={16} 
            color={activeTab === 'truck_cargo' ? '#FFC107' : '#8FA0AF'} 
          />
          <Text style={[styles.tabText, activeTab === 'truck_cargo' && styles.tabTextActive]}>
            Carga na Caçamba
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {activeTab === 'deliveries' ? (
          <>
            {/* Resumo da Rota */}
            <View style={styles.routeSummaryCard}>
              <View style={styles.routeSummaryHeader}>
                <Ionicons name="navigate-circle" size={26} color="#FFC107" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.routeSummaryTitle}>Manifesto de Transporte B2B</Text>
                  <Text style={styles.routeSummarySub}>Distribuidora Central ➔ Rota dos Bares</Text>
                </View>
                <View style={styles.cargoTag}>
                  <Text style={styles.cargoTagText}>{totalUnits} VOLUMES</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Paradas do Dia</Text>

            {deliveries.map((delivery, index) => {
              const isDelivered = delivery.status === 'delivered';
              const isInTransit = delivery.status === 'in_transit';

              return (
                <View key={delivery.id} style={[styles.deliveryCard, isDelivered && styles.deliveredCard]}>
                  {/* Número da Parada */}
                  <View style={styles.stopNumberRow}>
                    <View style={[styles.stopNumberCircle, isDelivered && styles.stopDeliveredCircle]}>
                      <Text style={styles.stopNumberText}>#{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.barName}>{delivery.barName}</Text>
                      <Text style={styles.deliveryEstimate}>Previsão: {delivery.estimatedDeliveryTime}</Text>
                    </View>
                    <View style={[
                      styles.statusPill, 
                      isDelivered ? styles.statusDone : (isInTransit ? styles.statusTransit : styles.statusWaiting)
                    ]}>
                      <Text style={styles.statusPillText}>
                        {isDelivered ? 'ENTREGUE' : (isInTransit ? 'EM ROTA' : 'NO GALPÃO')}
                      </Text>
                    </View>
                  </View>

                  {/* Endereço */}
                  <View style={styles.addressBox}>
                    <Ionicons name="location" size={16} color="#FFC107" />
                    <Text style={styles.addressText}>{delivery.barAddress}</Text>
                  </View>

                  {/* Itens a descarregar */}
                  <View style={styles.cargoItemsList}>
                    <Text style={styles.cargoItemsTitle}>Itens para descarregar:</Text>
                    {delivery.items.map((it, idx) => (
                      <View key={idx} style={styles.cargoItemRow}>
                        <Ionicons 
                          name={it.isReturnableBottle ? "repeat" : "cube-outline"} 
                          size={14} 
                          color={it.isReturnableBottle ? "#60A5FA" : "#CBD5E1"} 
                        />
                        <Text style={styles.cargoItemText}>
                          {it.quantity}x {it.productName} ({it.unit})
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Alerta de Vasilhames */}
                  {delivery.needsReturnableBottlesExchange && (
                    <View style={styles.returnableAlert}>
                      <Ionicons name="alert-circle" size={16} color="#FFC107" />
                      <Text style={styles.returnableAlertText}>
                        Exige recolhimento de vasilhames/barris vazios!
                      </Text>
                    </View>
                  )}

                  {/* Ações do Motorista */}
                  <View style={styles.actionRow}>
                    {delivery.status === 'preparing' && (
                      <TouchableOpacity 
                        style={styles.startBtn}
                        onPress={() => handleStartRoute(delivery.id)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="play" size={16} color="#0D1C28" />
                        <Text style={styles.startBtnText}>Iniciar Rota para este Bar</Text>
                      </TouchableOpacity>
                    )}

                    {delivery.status === 'in_transit' && (
                      <TouchableOpacity 
                        style={styles.finishBtn}
                        onPress={() => handleFinishDelivery(delivery.id)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="checkmark-done" size={18} color="#0D1C28" />
                        <Text style={styles.finishBtnText}>Confirmar Entrega e Descarga</Text>
                      </TouchableOpacity>
                    )}

                    {isDelivered && (
                      <View style={styles.deliveredBadgeBox}>
                        <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                        <Text style={styles.deliveredBadgeBoxText}>Comprovante emitido e assinado</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          /* Aba: Carga na Caçamba */
          <View>
            <View style={styles.cargoOverviewCard}>
              <Text style={styles.cargoOverviewTitle}>Romaneio de Carga do Caminhão</Text>
              <Text style={styles.cargoOverviewSub}>Total embarcado no galpão para distribuição</Text>
              
              <View style={styles.cargoGrid}>
                <View style={styles.cargoStat}>
                  <Text style={styles.cargoStatVal}>{totalUnits}</Text>
                  <Text style={styles.cargoStatLabel}>Caixas / Engradados</Text>
                </View>
                <View style={styles.cargoStat}>
                  <Text style={styles.cargoStatVal}>{totalReturnables}</Text>
                  <Text style={styles.cargoStatLabel}>Vasilhames Retornáveis</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Distribuição da Carga</Text>
            {orders.map(o => (
              <View key={o.id} style={styles.cargoOrderCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.cargoBarName}>{o.barName}</Text>
                  <Text style={styles.cargoOrderId}>{o.id}</Text>
                </View>
                {o.items.map((it, idx) => (
                  <Text key={idx} style={styles.cargoItemLine}>
                    • {it.quantity}x {it.productName}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D1C28',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#112332',
    borderBottomWidth: 1,
    borderBottomColor: '#182C3D',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverGreeting: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
  },
  driverName: {
    color: '#8FA0AF',
    fontSize: 11,
    marginTop: 2,
  },
  badgeOnline: {
    backgroundColor: '#0F2B20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  badgeOnlineText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#112332',
    borderBottomWidth: 1,
    borderBottomColor: '#182C3D',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  tabBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#FFC107',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8FA0AF',
  },
  tabTextActive: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  routeSummaryCard: {
    backgroundColor: '#162737',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  routeSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeSummaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  routeSummarySub: {
    fontSize: 11,
    color: '#8FA0AF',
    marginTop: 2,
  },
  cargoTag: {
    backgroundColor: '#292010',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B45309',
  },
  cargoTagText: {
    color: '#FFC107',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  deliveryCard: {
    backgroundColor: '#162737',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#1E3042',
  },
  deliveredCard: {
    opacity: 0.65,
    borderColor: '#182C3D',
  },
  stopNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopDeliveredCircle: {
    backgroundColor: '#059669',
  },
  stopNumberText: {
    color: '#0D1C28',
    fontSize: 12,
    fontWeight: 'bold',
  },
  barName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deliveryEstimate: {
    fontSize: 11,
    color: '#8FA0AF',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDone: {
    backgroundColor: '#0F2B20',
  },
  statusTransit: {
    backgroundColor: '#292010',
  },
  statusWaiting: {
    backgroundColor: '#112332',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F202E',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  addressText: {
    fontSize: 12,
    color: '#CBD5E1',
    flex: 1,
  },
  cargoItemsList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E3042',
    gap: 6,
  },
  cargoItemsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8FA0AF',
    marginBottom: 2,
  },
  cargoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cargoItemText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  returnableAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#292010',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#B45309',
  },
  returnableAlertText: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E3042',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    borderRadius: 10,
  },
  startBtnText: {
    color: '#0D1C28',
    fontSize: 13,
    fontWeight: 'bold',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34D399',
    paddingVertical: 12,
    borderRadius: 10,
  },
  finishBtnText: {
    color: '#0D1C28',
    fontSize: 13,
    fontWeight: 'bold',
  },
  deliveredBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  deliveredBadgeBoxText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '600',
  },
  cargoOverviewCard: {
    backgroundColor: '#162737',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  cargoOverviewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cargoOverviewSub: {
    fontSize: 11,
    color: '#8FA0AF',
    marginTop: 2,
    marginBottom: 16,
  },
  cargoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  cargoStat: {
    flex: 1,
    backgroundColor: '#0F202E',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  cargoStatVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  cargoStatLabel: {
    fontSize: 11,
    color: '#8FA0AF',
    marginTop: 4,
  },
  cargoOrderCard: {
    backgroundColor: '#162737',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  cargoBarName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cargoOrderId: {
    color: '#FFC107',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cargoItemLine: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 4,
  },
});
