import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { AddBarModal } from './AddBarModal';
import { EditBarAddressModal } from './EditBarAddressModal';
import { BarEstablishment } from '../types';

interface BarSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BarSelectorModal: React.FC<BarSelectorModalProps> = ({ visible, onClose }) => {
  const { 
    myBars, 
    selectedBar, 
    selectBar, 
    isUsingDeviceLocation, 
    activateDeviceLocation, 
    setCustomUserLocation,
    userLocation,
    isDarkMode, 
    theme,
  } = useApp();

  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [showAddBar, setShowAddBar] = useState(false);
  const [editingBar, setEditingBar] = useState<BarEstablishment | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<'selector' | 'management' | 'mapPin'>('selector');
  const [mapAddressInput, setMapAddressInput] = useState('');

  const iconColor = isDarkMode ? '#FFFFFF' : '#0D1C28';

  // Detalhes da Localização Atual Formatados
  const currentGpsStreet = userLocation?.street 
    ? `${userLocation.street}${userLocation.number ? `, ${userLocation.number}` : ''}`
    : (userLocation?.address ? userLocation.address.split(' - ')[0] : 'Localização do Aparelho (GPS)');

  const currentGpsSub = userLocation?.neighborhood || userLocation?.city
    ? `${userLocation?.neighborhood ? `${userLocation.neighborhood}, ` : ''}${userLocation?.city || 'São Paulo'} - ${userLocation?.state || 'SP'}`
    : (userLocation?.address || 'Detectado via GPS');

  const currentGpsFormattedFull = userLocation?.address 
    ? userLocation.address 
    : `${currentGpsStreet}${currentGpsSub ? ` • ${currentGpsSub}` : ''}`;

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      await activateDeviceLocation();
      setIsLocating(false);
      onClose();
    } catch {
      setIsLocating(false);
      onClose();
    }
  };

  const handleSelectBar = (barId: string) => {
    selectBar(barId);
    onClose();
  };

  const handleSaveCustomMapAddress = async () => {
    if (!mapAddressInput.trim()) {
      Alert.alert('Atenção', 'Digite o endereço ou ponto de referência.');
      return;
    }
    const customLoc = {
      latitude: userLocation?.latitude ?? -23.5558,
      longitude: userLocation?.longitude ?? -46.6896,
      address: mapAddressInput.trim(),
      street: mapAddressInput.trim(),
      neighborhood: userLocation?.neighborhood || 'São Paulo',
      city: userLocation?.city || 'São Paulo',
      state: userLocation?.state || 'SP',
    };
    await setCustomUserLocation(customLoc);
    setViewMode('selector');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <SafeAreaView 
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Top Header */}
          <View style={styles.topHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="storefront" size={20} color="#FFC107" />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {viewMode === 'selector' 
                    ? 'Meus Estabelecimentos' 
                    : viewMode === 'management' 
                    ? 'Gestão de Bares' 
                    : 'Definir no Mapa'}
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {viewMode === 'selector'
                    ? 'Selecione o bar ativo ou altere o endereço de entrega'
                    : viewMode === 'management'
                    ? 'Altere endereços, limites e filiais'
                    : 'Ponto exato para descarregamento'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={iconColor} />
            </TouchableOpacity>
          </View>

          {viewMode === 'selector' && (
            <View style={styles.mainContainer}>
              {/* Lista de Endereços & Bares com Padding Lateral Confortável */}
              <ScrollView 
                style={styles.barList} 
                contentContainerStyle={styles.barListContent}
                showsVerticalScrollIndicator={false}
              >
                {/* ======================================================== */}
                {/* 1. CARD DE LOCALIZAÇÃO ATUAL (GPS DO DISPOSITIVO)        */}
                {/* ======================================================== */}
                <View style={[
                  styles.barCard,
                  isUsingDeviceLocation && styles.barCardSelected,
                  isUsingDeviceLocation && { borderColor: '#10B981' }
                ]}>
                  <TouchableOpacity
                    style={styles.barCardMainTouchable}
                    onPress={handleUseCurrentLocation}
                    activeOpacity={0.75}
                  >
                    <View style={styles.barCardHeaderRow}>
                      <View style={[
                        styles.barIconCircle,
                        isUsingDeviceLocation 
                          ? { backgroundColor: '#10B981' } 
                          : { backgroundColor: isDarkMode ? '#1E3244' : '#E2E8F0' },
                      ]}>
                        <Ionicons 
                          name="navigate" 
                          size={18} 
                          color={isUsingDeviceLocation ? "#FFFFFF" : (isDarkMode ? "#60A5FA" : "#0284C7")} 
                        />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text 
                            style={[
                              styles.barTitleText, 
                              isUsingDeviceLocation && { color: isDarkMode ? '#34D399' : '#059669', fontWeight: 'bold' }
                            ]}
                            numberOfLines={1}
                          >
                            Minha Localização Atual (GPS)
                          </Text>
                          {isUsingDeviceLocation && (
                            <View style={[styles.selectedBadge, { backgroundColor: '#10B981' }]}>
                              <Text style={[styles.selectedBadgeText, { color: '#FFFFFF' }]}>✓ EM USO AGORA</Text>
                            </View>
                          )}
                        </View>

                        <Text style={[styles.barCnpjText, { color: isUsingDeviceLocation ? (isDarkMode ? '#A7F3D0' : '#047857') : theme.textSecondary }]}>
                          {isUsingDeviceLocation 
                            ? 'Você está usando o endereço detectado pelo sensor GPS do seu dispositivo'
                            : 'Detecte automaticamente sua posição atual para calcular fretes e entregas'}
                        </Text>
                      </View>
                    </View>

                    {/* Linha com Endereço Completo Detectado */}
                    <View style={styles.barAddressRow}>
                      <Ionicons 
                        name="location" 
                        size={15} 
                        color={isUsingDeviceLocation ? "#10B981" : "#FFC107"} 
                        style={{ marginRight: 6, marginTop: 2 }} 
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.barAddressText, 
                          isUsingDeviceLocation && { color: theme.text, fontWeight: 'bold' }
                        ]}>
                          {currentGpsFormattedFull}
                        </Text>
                        {userLocation?.latitude != null && userLocation?.longitude != null && (
                          <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
                            Coordenadas: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)} • Entregas direcionadas para este local
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Rodapé do Card de Localização Atual */}
                  <View style={styles.barCardFooter}>
                    <TouchableOpacity
                      style={[
                        styles.alterAddressBtn, 
                        isUsingDeviceLocation 
                          ? { backgroundColor: isDarkMode ? '#17362E' : '#D1FAE5', borderWidth: 1, borderColor: '#10B981' } 
                          : { backgroundColor: '#FFC107' }
                      ]}
                      onPress={handleUseCurrentLocation}
                      disabled={isLocating}
                      activeOpacity={0.8}
                    >
                      {isLocating ? (
                        <ActivityIndicator size="small" color={isUsingDeviceLocation ? "#10B981" : iconColor} style={{ marginRight: 6 }} />
                      ) : (
                        <Ionicons 
                          name={isUsingDeviceLocation ? "refresh" : "navigate"} 
                          size={13} 
                          color={isUsingDeviceLocation ? (isDarkMode ? "#34D399" : "#065F46") : iconColor} 
                          style={{ marginRight: 5 }} 
                        />
                      )}
                      <Text style={[
                        styles.alterAddressBtnText,
                        isUsingDeviceLocation && { color: isDarkMode ? "#34D399" : "#065F46" }
                      ]}>
                        {isLocating 
                          ? 'Atualizando GPS...' 
                          : isUsingDeviceLocation 
                          ? 'Atualizar Posição GPS' 
                          : 'Usar Esta Localização'}
                      </Text>
                    </TouchableOpacity>

                    {!isUsingDeviceLocation && (
                      <TouchableOpacity
                        style={styles.selectBtn}
                        onPress={handleUseCurrentLocation}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.selectBtnText}>Ativar GPS</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFC107" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Divisor Visual Entre GPS e Bares */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: 12,
                  gap: 10
                }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.textMuted, letterSpacing: 0.5 }}>
                    OU ESCOLHA UM DOS SEUS BARES
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
                </View>

                {/* ======================================================== */}
                {/* 2. LISTA DE BARES CADASTRADOS                            */}
                {/* ======================================================== */}
                {myBars.map((bar, idx) => {
                  const isSelected = !isUsingDeviceLocation && selectedBar?.id === bar.id;
                  const displayName = bar.name.split(' - ')[0] || `Bar ${idx + 1}`;

                  return (
                    <View
                      key={bar.id}
                      style={[
                        styles.barCard,
                        isSelected && styles.barCardSelected,
                      ]}
                    >
                      {/* Área clicável principal para selecionar o bar */}
                      <TouchableOpacity
                        style={styles.barCardMainTouchable}
                        onPress={() => handleSelectBar(bar.id)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.barCardHeaderRow}>
                          <View style={[
                            styles.barIconCircle,
                            isSelected && styles.barIconCircleSelected,
                          ]}>
                            <Ionicons 
                              name="storefront" 
                              size={20} 
                              color={isSelected ? (isDarkMode ? "#FFFFFF" : "#0D1C28") : (isDarkMode ? "#FFFFFF" : "#FFC107")} 
                            />
                          </View>

                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text 
                                style={[styles.barTitleText, isSelected && styles.barTitleTextSelected]}
                                numberOfLines={1}
                              >
                                {displayName}
                              </Text>
                              {isSelected && (
                                <View style={styles.selectedBadge}>
                                  <Text style={styles.selectedBadgeText}>ATIVO</Text>
                                </View>
                              )}
                            </View>

                            {bar.cnpj ? (
                              <Text style={styles.barCnpjText}>CNPJ: {bar.cnpj}</Text>
                            ) : null}
                          </View>
                        </View>

                        {/* Linha de Endereço com Ícone de Localização */}
                        <View style={styles.barAddressRow}>
                          <Ionicons name="location" size={14} color="#FFC107" style={{ marginRight: 6, marginTop: 2 }} />
                          <Text style={styles.barAddressText} numberOfLines={2}>
                            {bar.street}, {bar.number} {bar.complement ? `(${bar.complement})` : ''} - {bar.neighborhood}, {bar.city}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Botões de Ação do Card: Alterar Endereço */}
                      <View style={styles.barCardFooter}>
                        <TouchableOpacity
                          style={styles.alterAddressBtn}
                          onPress={() => setEditingBar(bar)}
                          activeOpacity={0.8}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="pencil" size={13} color={iconColor} style={{ marginRight: 5 }} />
                          <Text style={styles.alterAddressBtnText}>Alterar Endereço</Text>
                        </TouchableOpacity>

                        {!isSelected && (
                          <TouchableOpacity
                            style={styles.selectBtn}
                            onPress={() => handleSelectBar(bar.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.selectBtnText}>Selecionar este Bar</Text>
                            <Ionicons name="chevron-forward" size={14} color="#FFC107" style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Botões Inferiores com Padding Lateral Confortável */}
              <View style={styles.bottomButtonsSection}>
                {/* 1. Usar Localização Atual GPS ou Confirmação de Uso */}
                {isUsingDeviceLocation ? (
                  <View style={{
                    backgroundColor: isDarkMode ? '#132838' : '#ECFDF5',
                    borderWidth: 1,
                    borderColor: '#10B981',
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDarkMode ? '#34D399' : '#059669' }}>
                          Localização Atual Ativa (GPS)
                        </Text>
                        <Text style={{ fontSize: 11, color: isDarkMode ? '#A7F3D0' : '#047857' }} numberOfLines={1}>
                          {currentGpsFormattedFull}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={{
                        backgroundColor: '#10B981',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 6,
                      }}
                      onPress={handleUseCurrentLocation}
                      disabled={isLocating}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0D1C28' }}>
                        {isLocating ? '...' : 'Atualizar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.solidYellowBtn} 
                    onPress={handleUseCurrentLocation}
                    disabled={isLocating}
                    activeOpacity={0.85}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color={iconColor} style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="navigate-circle" size={20} color={iconColor} style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.solidYellowBtnText}>
                      {isLocating ? 'Obtendo GPS...' : 'Usar Localização Atual (GPS)'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Linha com 2 botões secundários */}
                <View style={styles.secondaryButtonsRow}>
                  {/* 2. Gerenciar Negócios */}
                  <TouchableOpacity 
                    style={[styles.outlineYellowBtn, { flex: 1 }]} 
                    onPress={() => setViewMode('management')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="business" size={16} color="#FFC107" style={{ marginRight: 6 }} />
                    <Text style={styles.outlineYellowBtnText}>Gerenciar Bares</Text>
                  </TouchableOpacity>

                  {/* 3. Definir no Mapa */}
                  <TouchableOpacity 
                    style={[styles.outlineYellowBtn, { flex: 1 }]} 
                    onPress={() => setViewMode('mapPin')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="map" size={16} color="#FFC107" style={{ marginRight: 6 }} />
                    <Text style={styles.outlineYellowBtnText}>Ponto no Mapa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Sub-tela: Gerenciar Negócios (Edição de endereço, limites, novos bares) */}
          {viewMode === 'management' && (
            <View style={styles.subViewContainer}>
              <View style={styles.subViewHeader}>
                <TouchableOpacity onPress={() => setViewMode('selector')} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={20} color="#FFC107" />
                  <Text style={styles.backBtnText}>Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.subViewTitle}>Gestão de Estabelecimentos</Text>
              </View>

              <ScrollView style={styles.managementList} showsVerticalScrollIndicator={false}>
                {myBars.map(bar => {
                  const creditAvailable = bar.creditLimit - bar.creditUsed;
                  return (
                    <View key={bar.id} style={styles.mgmtCard}>
                      <View style={styles.mgmtCardHeader}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.mgmtBarName}>{bar.name}</Text>
                          <Text style={styles.mgmtBarCnpj}>CNPJ: {bar.cnpj}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.editPencilBtn}
                          onPress={() => setEditingBar(bar)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="pencil" size={13} color={iconColor} style={{ marginRight: 4 }} />
                          <Text style={styles.editPencilText}>Alterar Endereço</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.mgmtAddressLine}>
                        <Ionicons name="location" size={14} color="#FFC107" style={{ marginRight: 6, marginTop: 1 }} />
                        <Text style={styles.mgmtAddressText} numberOfLines={2}>
                          {bar.street}, {bar.number} {bar.complement ? `(${bar.complement})` : ''} - {bar.neighborhood}, {bar.city}
                        </Text>
                      </View>

                      <View style={styles.mgmtCreditRow}>
                        <Text style={styles.mgmtCreditText}>
                          Crédito 15 dias: <Text style={{ color: '#34D399', fontWeight: 'bold' }}>R$ {creditAvailable.toFixed(2).replace('.', ',')}</Text>
                        </Text>
                        <Text style={[styles.mgmtStatusTag, bar.status === 'active' ? styles.statusActive : styles.statusPending]}>
                          ● {bar.status === 'active' ? 'Liberado' : 'Em Análise'}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity 
                  style={styles.addBarDashedBtn}
                  onPress={() => setShowAddBar(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FFC107" />
                  <Text style={styles.addBarDashedText}>Cadastrar Nova Filial / Bar</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          )}

          {/* Sub-tela: Definir no Mapa */}
          {viewMode === 'mapPin' && (
            <View style={styles.subViewContainer}>
              <View style={styles.subViewHeader}>
                <TouchableOpacity onPress={() => setViewMode('selector')} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={20} color="#FFC107" />
                  <Text style={styles.backBtnText}>Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.subViewTitle}>Definir Endereço no Mapa</Text>
              </View>

              <View style={styles.mapPinContent}>
                <View style={styles.mapPlaceholderBox}>
                  <Ionicons name="map" size={54} color="#FFC107" />
                  <Text style={styles.mapPlaceholderTitle}>Ponto no Mapa GPS</Text>
                  <Text style={styles.mapPlaceholderDesc}>
                    O caminhão e os distribuidores da sua região calcularão a rota e entrega até este ponto.
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Endereço ou Ponto de Entrega:</Text>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Ex: Rua Pedro Pomponazzi, 650 - Vila Mariana"
                  placeholderTextColor="#64748B"
                  value={mapAddressInput}
                  onChangeText={setMapAddressInput}
                />

                <TouchableOpacity 
                  style={styles.solidYellowBtn} 
                  onPress={handleSaveCustomMapAddress}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={20} color={iconColor} style={{ marginRight: 8 }} />
                  <Text style={styles.solidYellowBtnText}>Confirmar Endereço</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Modal de Cadastro de Bar */}
          <AddBarModal
            visible={showAddBar}
            onClose={() => setShowAddBar(false)}
          />

          {/* Modal de Edição / Alteração de Endereço do Bar */}
          <EditBarAddressModal
            visible={!!editingBar}
            bar={editingBar}
            onClose={() => setEditingBar(null)}
          />
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

function getStyles(theme: ThemeColors, isDarkMode: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#0F1E2C' : '#FFFFFF',
      borderRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 24,
      maxHeight: '90%',
      width: '100%',
      maxWidth: 480,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1E3244' : '#E2E8F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 12,
      overflow: 'hidden',
    },
    dragHandle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDarkMode ? '#22384C' : '#CBD5E1',
      alignSelf: 'center',
      marginBottom: 12,
    },
    topHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: 10,
    },
    headerIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#172C3F' : '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      color: theme.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
    },
    mainContainer: {
      flex: 1,
      justifyContent: 'space-between',
    },
    barList: {
      maxHeight: 440,
    },
    barListContent: {
      paddingTop: 6,
      paddingBottom: 16,
    },
    barCard: {
      backgroundColor: isDarkMode ? '#142535' : '#F8FAFC',
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: isDarkMode ? '#1C3348' : '#E2E8F0',
    },
    barCardSelected: {
      borderColor: '#FFC107',
      backgroundColor: isDarkMode ? '#192C3D' : '#FFFDF5',
    },
    barCardMainTouchable: {
      paddingBottom: 10,
    },
    barCardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    barIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDarkMode ? '#1A2F42' : '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    barIconCircleSelected: {
      backgroundColor: isDarkMode ? '#234567' : '#FFC107',
    },
    barTitleText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.text,
      flex: 1,
      marginRight: 6,
    },
    barTitleTextSelected: {
      color: isDarkMode ? '#FFFFFF' : '#0F172A',
    },
    selectedBadge: {
      backgroundColor: '#FFC107',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    selectedBadgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#0D1C28',
    },
    barCnpjText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    barAddressRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDarkMode ? '#1D354A' : '#E2E8F0',
    },
    barAddressText: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
      flex: 1,
    },
    barCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#1A3044' : '#EEF2F6',
    },
    alterAddressBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFC107',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    alterAddressBtnText: {
      color: isDarkMode ? '#FFFFFF' : '#0D1C28',
      fontSize: 11,
      fontWeight: 'bold',
    },
    selectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    selectBtnText: {
      color: '#FFC107',
      fontSize: 12,
      fontWeight: 'bold',
    },
    bottomButtonsSection: {
      gap: 10,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    secondaryButtonsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    outlineYellowBtn: {
      height: 44,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: '#FFC107',
      backgroundColor: isDarkMode ? '#142535' : '#FEF3C7',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    outlineYellowBtnText: {
      color: isDarkMode ? '#FFC107' : '#92400E',
      fontSize: 13,
      fontWeight: 'bold',
    },
    solidYellowBtn: {
      height: 46,
      borderRadius: 10,
      backgroundColor: '#FFC107',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    solidYellowBtnText: {
      color: isDarkMode ? '#FFFFFF' : '#0D1C28',
      fontSize: 14,
      fontWeight: 'bold',
    },
    subViewContainer: {
      flex: 1,
    },
    subViewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 12,
      paddingVertical: 4,
    },
    backBtnText: {
      color: '#FFC107',
      fontSize: 14,
      fontWeight: 'bold',
      marginLeft: 4,
    },
    subViewTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    managementList: {
      maxHeight: 400,
    },
    mgmtCard: {
      backgroundColor: isDarkMode ? '#142535' : '#F8FAFC',
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mgmtCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    mgmtBarName: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.text,
    },
    mgmtBarCnpj: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    editPencilBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFC107',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 7,
    },
    editPencilText: {
      color: isDarkMode ? '#FFFFFF' : '#0D1C28',
      fontSize: 11,
      fontWeight: 'bold',
    },
    mgmtAddressLine: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    mgmtAddressText: {
      fontSize: 12,
      color: theme.textSecondary,
      flex: 1,
      lineHeight: 16,
    },
    mgmtCreditRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    mgmtCreditText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    mgmtStatusTag: {
      fontSize: 11,
      fontWeight: 'bold',
    },
    statusActive: {
      color: '#34D399',
    },
    statusPending: {
      color: '#F59E0B',
    },
    addBarDashedBtn: {
      borderWidth: 1.5,
      borderColor: '#FFC107',
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    addBarDashedText: {
      color: '#FFC107',
      fontSize: 14,
      fontWeight: 'bold',
    },
    mapPinContent: {
      paddingVertical: 10,
    },
    mapPlaceholderBox: {
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#142535' : '#F8FAFC',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mapPlaceholderTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 8,
    },
    mapPlaceholderDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 17,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 6,
    },
    addressInput: {
      height: 48,
      backgroundColor: isDarkMode ? '#142535' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      color: theme.text,
      fontSize: 14,
      marginBottom: 16,
    },
  });
}
