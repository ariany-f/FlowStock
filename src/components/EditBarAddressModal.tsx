import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { BarEstablishment } from '../types';

interface EditBarAddressModalProps {
  visible: boolean;
  bar: BarEstablishment | null;
  onClose: () => void;
  onSaved?: (updatedBar: BarEstablishment) => void;
}

interface EditBarAddressFormProps {
  bar: BarEstablishment;
  onClose: () => void;
  onSaved?: (updatedBar: BarEstablishment) => void;
}

const EditBarAddressForm: React.FC<EditBarAddressFormProps> = ({
  bar,
  onClose,
  onSaved,
}) => {
  const { updateBar, userLocation, requestLocation, theme, isDarkMode } = useApp();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [name, setName] = useState(bar.name || '');
  const [zipCode, setZipCode] = useState(bar.zipCode || '');
  const [street, setStreet] = useState(bar.street || '');
  const [number, setNumber] = useState(bar.number || '');
  const [complement, setComplement] = useState(bar.complement || '');
  const [neighborhood, setNeighborhood] = useState(bar.neighborhood || '');
  const [city, setCity] = useState(bar.city || '');
  const [state, setState] = useState(bar.state || 'SP');
  const [deliveryNotes, setDeliveryNotes] = useState(bar.deliveryNotes || '');
  const [latitude, setLatitude] = useState(bar.latitude ? String(bar.latitude) : '');
  const [longitude, setLongitude] = useState(bar.longitude ? String(bar.longitude) : '');

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Busca automática de CEP via ViaCEP
  const handleCepLookup = async (cepToSearch: string) => {
    const cleanCep = cepToSearch.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      Alert.alert('CEP Inválido', 'Digite os 8 dígitos do CEP.');
      return;
    }

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        Alert.alert('CEP não encontrado', 'Verifique o CEP informado e tente novamente.');
      } else {
        if (data.logradouro) setStreet(data.logradouro);
        if (data.bairro) setNeighborhood(data.bairro);
        if (data.localidade) setCity(data.localidade);
        if (data.uf) setState(data.uf.toUpperCase());
      }
    } catch {
      Alert.alert('Atenção', 'Não foi possível buscar o endereço automaticamente. Preencha manualmente.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleZipCodeChange = (text: string) => {
    // Formata CEP com traço 00000-000
    const raw = text.replace(/\D/g, '').slice(0, 8);
    let formatted = raw;
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`;
    }
    setZipCode(formatted);

    if (raw.length === 8) {
      handleCepLookup(raw);
    }
  };

  // Botão para sincronizar coordenadas GPS com a localização atual
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      let loc = userLocation;
      if (!loc) {
        const ok = await requestLocation();
        if (ok && userLocation) {
          loc = userLocation;
        }
      }

      if (loc) {
        setLatitude(loc.latitude.toFixed(6));
        setLongitude(loc.longitude.toFixed(6));
        if (loc.city && !city) setCity(loc.city);
        if (loc.neighborhood && !neighborhood) setNeighborhood(loc.neighborhood);
        Alert.alert(
          '📍 GPS Sincronizado',
          `Coordenadas capturadas com sucesso:\nLat: ${loc.latitude.toFixed(5)}, Long: ${loc.longitude.toFixed(5)}\n\nLocal: ${loc.city || 'São Paulo'} - SP`
        );
      } else {
        // Fallback simulação segura se permissão de geolocalização estiver pendente
        setLatitude('-23.555800');
        setLongitude('-46.689600');
        Alert.alert('Localização Atribuída', 'Coordenadas padrão de São Paulo registradas com sucesso.');
      }
    } catch {
      Alert.alert('Erro GPS', 'Não foi possível obter sua localização exata no momento.');
    } finally {
      setIsLocating(false);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!street.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe a Rua ou Logradouro.');
      return;
    }
    if (!number.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o Número do estabelecimento.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe a Cidade.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedLat = parseFloat(latitude);
      const parsedLng = parseFloat(longitude);

      const updatedFields: Partial<BarEstablishment> = {
        name: name.trim() || bar.name,
        zipCode: zipCode.trim() || bar.zipCode,
        street: street.trim(),
        number: number.trim(),
        complement: complement.trim(),
        neighborhood: neighborhood.trim() || bar.neighborhood,
        city: city.trim(),
        state: state.trim().toUpperCase() || 'SP',
        deliveryNotes: deliveryNotes.trim(),
        ...(Number.isFinite(parsedLat) && { latitude: parsedLat }),
        ...(Number.isFinite(parsedLng) && { longitude: parsedLng }),
      };

      await updateBar(bar.id, updatedFields);

      const finalBar: BarEstablishment = {
        ...bar,
        ...updatedFields,
      };

      Alert.alert('✅ Endereço Atualizado', `Os dados de entrega do ${bar.name} foram salvos com sucesso!`);
      if (onSaved) onSaved(finalBar);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tente novamente.';
      Alert.alert('Erro ao Salvar', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.overlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        pointerEvents="box-none"
      >
        <SafeAreaView 
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.title} numberOfLines={1}>
                  Editar Endereço do Bar
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>B2B</Text>
                </View>
              </View>
              <Text style={styles.subtitle} numberOfLines={1}>
                {bar.name} • CNPJ {bar.cnpj}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Form Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Card de Destaque / Dica */}
            <View style={styles.tipCard}>
              <Ionicons name="information-circle-outline" size={22} color="#FFC107" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.tipText}>
                Mantenha o endereço e instruções de descarga atualizados para garantir entregas pontuais dos caminhões das distribuidoras.
              </Text>
            </View>

            {/* 1. Identificação do Bar */}
            <Text style={styles.sectionHeading}>Identificação do Estabelecimento</Text>
            
            <Text style={styles.label}>Nome do Bar / Filial *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Bar do Urso - Vila Madalena"
              placeholderTextColor={theme.textMuted}
            />

            {/* 2. CEP com Busca */}
            <Text style={styles.sectionHeading}>Endereço Principal de Entrega</Text>
            
            <Text style={styles.label}>CEP *</Text>
            <View style={styles.cepRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={zipCode}
                onChangeText={handleZipCodeChange}
                placeholder="00000-000"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                maxLength={9}
              />
              <TouchableOpacity
                style={styles.cepSearchBtn}
                onPress={() => handleCepLookup(zipCode)}
                disabled={isLoadingCep}
                activeOpacity={0.8}
              >
                {isLoadingCep ? (
                  <ActivityIndicator size="small" color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
                ) : (
                  <>
                    <Ionicons name="search" size={16} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 4 }} />
                    <Text style={styles.cepSearchBtnText}>Buscar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Logradouro */}
            <Text style={styles.label}>Rua / Logradouro *</Text>
            <TextInput
              style={styles.input}
              value={street}
              onChangeText={setStreet}
              placeholder="Ex: Rua Aspicuelta"
              placeholderTextColor={theme.textMuted}
            />

            {/* Número e Complemento */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Número *</Text>
                <TextInput
                  style={styles.input}
                  value={number}
                  onChangeText={setNumber}
                  placeholder="123"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.label}>Complemento</Text>
                <TextInput
                  style={styles.input}
                  value={complement}
                  onChangeText={setComplement}
                  placeholder="Loja 2 / Galpão"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* Bairro, Cidade, Estado */}
            <Text style={styles.label}>Bairro *</Text>
            <TextInput
              style={styles.input}
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="Ex: Vila Madalena"
              placeholderTextColor={theme.textMuted}
            />

            <View style={styles.row}>
              <View style={{ flex: 2, marginRight: 8 }}>
                <Text style={styles.label}>Cidade *</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ex: São Paulo"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>UF *</Text>
                <TextInput
                  style={styles.input}
                  value={state}
                  onChangeText={t => setState(t.toUpperCase())}
                  placeholder="SP"
                  placeholderTextColor={theme.textMuted}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Instruções de Entrega / Ponto de Referência */}
            <Text style={styles.sectionHeading}>Instruções para o Caminhão de Entrega</Text>
            <Text style={styles.label}>Ponto de Referência / Horário de Descarga</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              placeholder="Ex: Doca de descarga nos fundos pela Rua dos Pinheiros. Recebimento de chopp e caixas das 08h às 15h."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Coordenadas GPS */}
            <Text style={styles.sectionHeading}>Geolocalização GPS</Text>
            <Text style={styles.labelDesc}>
              As coordenadas garantem que o sistema FlowStock calcule a rota e frete exatos do caminhão.
            </Text>

            <TouchableOpacity
              style={styles.gpsSyncBtn}
              onPress={handleUseCurrentLocation}
              disabled={isLocating}
              activeOpacity={0.8}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="navigate-circle" size={20} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6 }} />
              )}
              <Text style={styles.gpsSyncBtnText}>
                {isLocating ? 'Obtendo GPS...' : '📍 Usar Minha Localização GPS Atual'}
              </Text>
            </TouchableOpacity>

            {userLocation && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDarkMode ? '#132838' : '#ECFDF5',
                borderWidth: 1,
                borderColor: isDarkMode ? '#1D3B52' : '#A7F3D0',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginBottom: 12,
              }}>
                <Ionicons name="information-circle" size={15} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: isDarkMode ? '#A7F3D0' : '#065F46', flex: 1 }}>
                  Local atual detectado: <Text style={{ fontWeight: 'bold' }}>{userLocation.address || `${userLocation.neighborhood || 'Centro'}, ${userLocation.city || 'São Paulo'}`}</Text>
                </Text>
              </View>
            )}

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="-23.5558"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="-46.6896"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              ) : (
                <>
                  <Ionicons name="checkmark-sharp" size={18} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Salvar Endereço</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableOpacity>
  );
};

export const EditBarAddressModal: React.FC<EditBarAddressModalProps> = ({
  visible,
  bar,
  onClose,
  onSaved,
}) => {
  if (!visible || !bar) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <EditBarAddressForm
        key={`${bar.id}_${bar.street}_${bar.number}`}
        bar={bar}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
};

function getStyles(theme: ThemeColors, isDarkMode: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      maxHeight: '90%',
      width: '100%',
      maxWidth: 440,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    badge: {
      backgroundColor: '#FFC107',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#0D1C28',
    },
    closeBtn: {
      padding: 6,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#172738' : '#F1F5F9',
    },
    body: {
      flexGrow: 1,
    },
    bodyContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    tipCard: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#241E10' : '#FEF3C7',
      borderWidth: 1,
      borderColor: '#F59E0B',
      borderRadius: 12,
      padding: 12,
      marginBottom: 18,
    },
    tipText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      color: isDarkMode ? '#FCD34D' : '#92400E',
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#FFC107',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 14,
      marginBottom: 10,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 6,
    },
    labelDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 10,
      lineHeight: 16,
    },
    input: {
      backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: theme.text,
      marginBottom: 12,
    },
    textArea: {
      minHeight: 70,
      paddingTop: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 10,
    },
    cepSearchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFC107',
      paddingHorizontal: 16,
      height: 46,
      borderRadius: 10,
    },
    cepSearchBtnText: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#0D1C28',
    },
    gpsSyncBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#FFC107' : '#F59E0B',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 14,
    },
    gpsSyncBtnText: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#0D1C28',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 12,
      backgroundColor: theme.surface,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#172738' : '#F1F5F9',
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    saveBtn: {
      flex: 2,
      flexDirection: 'row',
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: '#FFC107',
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#0D1C28',
    },
  });
}
