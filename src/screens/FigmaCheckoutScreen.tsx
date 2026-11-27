import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { PixPaymentModal } from '../components/PixPaymentModal';
import { EditBarAddressModal } from '../components/EditBarAddressModal';
import { Order } from '../types';
import { getProductImage } from '../utils/productImages';
import { calculateDistanceKm } from '../services/locationService';
import { getFifteenDaysDueDateFormatted } from '../utils/dateUtils';
import { LocationHeaderSelector } from '../components/LocationHeaderSelector';

interface FigmaCheckoutScreenProps {
  onBack: () => void;
  onOrderSuccess: (order: Order) => void;
  onOpenMyBars?: () => void;
  onOpenLogin?: () => void;
}

type CheckoutStep = 'location' | 'payment' | 'confirmation';

export const FigmaCheckoutScreen: React.FC<FigmaCheckoutScreenProps> = ({
  onBack,
  onOrderSuccess,
  onOpenMyBars,
  onOpenLogin,
}) => {
  const { 
    currentUser,
    cart, 
    cartTotal, 
    cartSupplier,
    updateCartQuantity, 
    selectedBar, 
    createOrder,
    isDarkMode,
    theme,
    userLocation,
    requestLocation,
  } = useApp();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('location');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'boleto_faturado' | 'credit_card'>('boleto_faturado');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);

  // Seleção e validação do endereço de entrega (Bar vs GPS vs Outro)
  const [deliveryAddressType, setDeliveryAddressType] = useState<'bar' | 'current_gps' | 'custom'>('bar');
  const [customAddress, setCustomAddress] = useState('');
  const [showCustomAddressInput, setShowCustomAddressInput] = useState(false);
  const [showLocationMismatchModal, setShowLocationMismatchModal] = useState(false);
  const [hasConfirmedAddressMismatch, setHasConfirmedAddressMismatch] = useState(false);
  const [showEditBarAddressModal, setShowEditBarAddressModal] = useState(false);

  // Distância e validação entre o GPS atual do usuário e o Bar
  const distFromBarKm = useMemo(() => {
    if (
      userLocation?.latitude == null || 
      userLocation?.longitude == null || 
      selectedBar?.latitude == null || 
      selectedBar?.longitude == null
    ) {
      return null;
    }
    return calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      selectedBar.latitude,
      selectedBar.longitude
    );
  }, [userLocation, selectedBar]);

  const [fifteenDaysDueDateFormatted] = useState(getFifteenDaysDueDateFormatted);

  const isLocationDifferent = useMemo(() => {
    if (!userLocation || !selectedBar) return false;
    const userCity = (userLocation.city || '').toLowerCase().trim();
    const barCity = (selectedBar.city || '').toLowerCase().trim();
    const userNeigh = (userLocation.neighborhood || '').toLowerCase().trim();
    const barNeigh = (selectedBar.neighborhood || '').toLowerCase().trim();

    if (userCity && barCity && userCity !== barCity) return true;
    if (userNeigh && barNeigh && userNeigh !== barNeigh) return true;
    if (distFromBarKm !== null && distFromBarKm > 3.0) return true;

    return false;
  }, [userLocation, selectedBar, distFromBarKm]);

  // Endereço de entrega selecionado para o pedido
  const effectiveDeliveryAddress = useMemo(() => {
    if (deliveryAddressType === 'current_gps' && userLocation) {
      return userLocation.address 
        ? `${userLocation.address} - ${userLocation.state || 'SP'}`
        : `${userLocation.neighborhood || 'Centro'}, ${userLocation.city || 'Mogi das Cruzes'} - ${userLocation.state || 'SP'}`;
    }
    if (deliveryAddressType === 'custom' && customAddress.trim().length > 0) {
      return customAddress.trim();
    }
    // Padrão: Preferência do Bar
    if (selectedBar) {
      return `${selectedBar.street}, ${selectedBar.number} - ${selectedBar.neighborhood}, ${selectedBar.city} - ${selectedBar.state}`;
    }
    return 'Endereço Comercial do Bar';
  }, [deliveryAddressType, userLocation, customAddress, selectedBar]);

  const deliveryFee = cartSupplier?.deliveryFee ?? 7.00;
  const grandTotal = Math.max(0, cartTotal + deliveryFee - discountAmount);

  // Voltar passo a passo
  const handleBack = () => {
    if (currentStep === 'confirmation') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('location');
    } else {
      onBack();
    }
  };

  const handleApplyCoupon = () => {
    if (typeof Alert.prompt === 'function') {
      Alert.prompt('Cupom de Desconto', 'Digite o código do cupom (ex: FLOW10 ou BEMVINDOBAR):', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: (code) => {
            const c = (code || '').trim().toUpperCase();
            if (c === 'FLOW10' || c === 'BEMVINDOBAR') {
              const disc = cartTotal * 0.10;
              setDiscountAmount(disc);
              setAppliedCoupon(`${c} (10% OFF)`);
              Alert.alert('Cupom Aplicado!', `Desconto de R$ ${disc.toFixed(2)} aplicado com sucesso.`);
            } else {
              setDiscountAmount(5.00);
              setAppliedCoupon(c || 'DESCONTO5');
              Alert.alert('Cupom Aplicado!', 'Desconto de R$ 5,00 aplicado.');
            }
          },
        },
      ]);
    } else {
      const disc = Math.min(15, cartTotal * 0.10);
      setDiscountAmount(disc);
      setAppliedCoupon('FLOW10 (10% OFF)');
      Alert.alert('Cupom Ativo!', 'Cupom FLOW10 de 10% OFF aplicado com sucesso!');
    }
  };

  const handleFinalOrder = async (confirmedChoice?: 'bar' | 'current_gps' | 'custom') => {
    if (!currentUser || !selectedBar) {
      Alert.alert(
        'Identificação Necessária',
        'Para concluir um pedido B2B e faturar no CNPJ do seu estabelecimento, faça login ou cadastre seu bar.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Fazer Login / Cadastrar Bar', 
            onPress: () => {
              if (onOpenLogin) onOpenLogin();
            }
          }
        ]
      );
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Sacola Vazia', 'Adicione produtos antes de fazer o pedido.');
      return;
    }

    // Se o usuário está em local diferente (ex: Mogi das Cruzes) e o bar está em outro lugar,
    // e ainda não confirmou explicitamente o destino, abre modal de confirmação
    if (isLocationDifferent && !hasConfirmedAddressMismatch && !confirmedChoice && deliveryAddressType === 'bar') {
      setShowLocationMismatchModal(true);
      return;
    }

    let finalAddr = effectiveDeliveryAddress;
    if (confirmedChoice === 'bar') {
      finalAddr = `${selectedBar.street}, ${selectedBar.number} - ${selectedBar.neighborhood}, ${selectedBar.city} - ${selectedBar.state}`;
      setDeliveryAddressType('bar');
    } else if (confirmedChoice === 'current_gps' && userLocation) {
      finalAddr = userLocation.address 
        ? `${userLocation.address} - ${userLocation.state || 'SP'}`
        : `${userLocation.neighborhood || 'Centro'}, ${userLocation.city || 'Mogi das Cruzes'} - ${userLocation.state || 'SP'}`;
      setDeliveryAddressType('current_gps');
    }

    setShowLocationMismatchModal(false);
    setHasConfirmedAddressMismatch(true);
    setIsSubmitting(true);

    try {
      const order = await createOrder({
        paymentMethod,
        deliveryNotes: deliveryNotes.trim(),
        deliveryAddress: finalAddr,
      });
      setCreatedOrder(order);

      if (paymentMethod === 'pix') {
        setShowPixModal(true);
      } else {
        Alert.alert(
          '🎉 Pedido Confirmado!',
          `Entregando em: ${finalAddr}\n\n${
            paymentMethod === 'boleto_faturado'
              ? `Faturado via Boleto B2B para pagar em até 15 dias!\nVencimento: ${order.dueDate ? new Date(order.dueDate).toLocaleDateString('pt-BR') : 'em 15 dias'}.\n\nO boleto já está disponível na página de Perfil para pagamento posterior. Você também receberá notificações quando o vencimento estiver próximo.`
              : 'Pagamento aprovado na hora! O distribuidor foi notificado e seu pedido está em separação.'
          }`
        );
        onOrderSuccess(order);
      }
    } catch (err: any) {
      Alert.alert('Erro ao criar pedido', err.message || 'Tente novamente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar Exata do Figma 122:1148: Seta Voltar, Bar 01 ▼, Três Pontos */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
        </TouchableOpacity>

        <View style={styles.barCenterContainer}>
          <LocationHeaderSelector onPress={onOpenMyBars} />
        </View>

        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => {
            Alert.alert('Opções do Carrinho', 'Gerenciar pedido:', [
              { 
                text: 'Esvaziar Sacola', 
                style: 'destructive', 
                onPress: () => {
                  cart.forEach(item => updateCartQuantity(item.product.id, 0));
                } 
              },
              { 
                text: 'Continuar Comprando', 
                onPress: onBack 
              },
              { text: 'Fechar', style: 'cancel' }
            ]);
          }} 
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!currentUser && (
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDarkMode ? '#231B10' : '#FEF3C7',
              borderWidth: 1,
              borderColor: '#F59E0B',
              borderRadius: 12,
              padding: 12,
              marginHorizontal: 16,
              marginBottom: 12,
            }}
            onPress={onOpenLogin}
            activeOpacity={0.8}
          >
            <Ionicons name="information-circle" size={22} color="#F59E0B" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDarkMode ? '#FDE68A' : '#92400E' }}>
                Navegando como Visitante
              </Text>
              <Text style={{ fontSize: 12, color: isDarkMode ? '#FCD34D' : '#B45309', marginTop: 2 }}>
                Faça login ou cadastre seu bar para faturar no CNPJ com crédito aprovado.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Step Indicator Passo a Passo do Figma 122:1148 */}
        <View style={styles.stepsRow}>
          {/* Passo 1: Localização */}
          <TouchableOpacity 
            style={styles.stepItem}
            onPress={() => setCurrentStep('location')}
            activeOpacity={0.8}
          >
            <View style={
              currentStep === 'location' 
                ? styles.stepCircleActive 
                : (currentStep === 'payment' || currentStep === 'confirmation' ? styles.stepCircleCompleted : styles.stepCircleInactive)
            }>
              {currentStep === 'payment' || currentStep === 'confirmation' ? (
                <Ionicons name="checkmark" size={16} color="#0D1C28" />
              ) : (
                <Ionicons 
                  name="location-sharp" 
                  size={16} 
                  color={currentStep === 'location' ? (isDarkMode ? '#0D1C28' : '#FFFFFF') : (isDarkMode ? '#8FA0AF' : '#475569')} 
                />
              )}
            </View>
            <Text style={currentStep === 'location' ? styles.stepLabelActive : styles.stepLabelInactive}>
              Localização
            </Text>
          </TouchableOpacity>

          {/* Tracejado Figma */}
          <View style={styles.stepDashesRow}>
            <View style={[styles.dashSegment, (currentStep === 'payment' || currentStep === 'confirmation') && styles.dashSegmentDone]} />
            <View style={[styles.dashSegment, (currentStep === 'payment' || currentStep === 'confirmation') && styles.dashSegmentDone]} />
            <View style={[styles.dashSegment, (currentStep === 'payment' || currentStep === 'confirmation') && styles.dashSegmentDone]} />
            <View style={[styles.dashSegment, (currentStep === 'payment' || currentStep === 'confirmation') && styles.dashSegmentDone]} />
          </View>

          {/* Passo 2: Pagamento */}
          <TouchableOpacity 
            style={styles.stepItem}
            onPress={() => {
              if (cart.length > 0) setCurrentStep('payment');
            }}
            activeOpacity={0.8}
          >
            <View style={
              currentStep === 'payment' 
                ? styles.stepCircleActive 
                : (currentStep === 'confirmation' ? styles.stepCircleCompleted : styles.stepCircleInactive)
            }>
              {currentStep === 'confirmation' ? (
                <Ionicons name="checkmark" size={16} color="#0D1C28" />
              ) : (
                <Ionicons 
                  name="card-outline" 
                  size={16} 
                  color={currentStep === 'payment' ? (isDarkMode ? '#0D1C28' : '#FFFFFF') : (isDarkMode ? '#8FA0AF' : '#475569')} 
                />
              )}
            </View>
            <Text style={currentStep === 'payment' ? styles.stepLabelActive : styles.stepLabelInactive}>
              Pagamento
            </Text>
          </TouchableOpacity>

          {/* Tracejado Figma */}
          <View style={styles.stepDashesRow}>
            <View style={[styles.dashSegment, currentStep === 'confirmation' && styles.dashSegmentDone]} />
            <View style={[styles.dashSegment, currentStep === 'confirmation' && styles.dashSegmentDone]} />
            <View style={[styles.dashSegment, currentStep === 'confirmation' && styles.dashSegmentDone]} />
            <View style={[styles.dashSegment, currentStep === 'confirmation' && styles.dashSegmentDone]} />
          </View>

          {/* Passo 3: Confirmação */}
          <TouchableOpacity 
            style={styles.stepItem}
            onPress={() => {
              if (cart.length > 0) setCurrentStep('confirmation');
            }}
            activeOpacity={0.8}
          >
            <View style={currentStep === 'confirmation' ? styles.stepCircleActive : styles.stepCircleInactive}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={16} 
                color={currentStep === 'confirmation' ? (isDarkMode ? '#0D1C28' : '#FFFFFF') : (isDarkMode ? '#8FA0AF' : '#475569')} 
              />
            </View>
            <Text style={currentStep === 'confirmation' ? styles.stepLabelActive : styles.stepLabelInactive}>
              Confirmação
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* PASSO 1: LOCALIZAÇÃO E SACULA DE PRODUTOS               */}
        {/* ======================================================== */}
        {currentStep === 'location' && (
          <>
            {/* Cards de Produtos no Carrinho (Figma 122:1148) */}
            {cart.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cart-outline" size={48} color="#52667A" />
                <Text style={styles.emptyTitle}>Sua sacola está vazia</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={onBack}>
                  <Text style={styles.emptyBtnText}>Voltar e Escolher Bebidas</Text>
                </TouchableOpacity>
              </View>
            ) : (
              cart.map(item => (
                <View key={item.product.id} style={styles.productCard}>
                  {/* Garrafa sem fundo escuro quadrado, repousando direto no card */}
                  <View style={styles.productImgBox}>
                    <Image 
                      source={getProductImage(item.product)} 
                      style={styles.productImg}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.productInfo}>
                    {/* Linha 1: Preço e Ícone de Lixeira */}
                    <View style={styles.productTopRow}>
                      <Text style={styles.productPrice}>
                        R${item.product.price.toFixed(2).replace('.', ',')}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => updateCartQuantity(item.product.id, 0)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={19} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
                      </TouchableOpacity>
                    </View>

                    {/* Linha 2: Nome do Produto e Frete */}
                    <View style={styles.productMidRow}>
                      <Text style={styles.productName} numberOfLines={1}>{item.product.name}</Text>
                      <Text style={styles.productFreight}>Frete: R$7,00</Text>
                    </View>

                    {/* Linha 3: Stepper Capsule [-] 1 [+] */}
                    <View style={styles.miniStepper}>
                      <TouchableOpacity 
                        onPress={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        style={styles.miniStepperBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.miniStepperBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.miniStepperVal}>{item.quantity}</Text>
                      <TouchableOpacity 
                        onPress={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        style={styles.miniStepperBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.miniStepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}

            {/* Alerta de Localização Diferente (ex: Usuário em Mogi das Cruzes e Bar em SP) */}
            {isLocationDifferent && (
              <View style={[styles.locationAlertBox, { backgroundColor: isDarkMode ? '#172738' : '#FEF3C7', borderColor: '#FFC107' }]}>
                <View style={[styles.locationAlertIconCircle, { backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.2)' : '#FDE68A' }]}>
                  <Ionicons name="navigate-circle" size={26} color={isDarkMode ? '#FFC107' : '#B45309'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locationAlertTitle, { color: theme.text }]}>
                    Localização Atual: {userLocation?.city || 'Mogi das Cruzes'}
                  </Text>
                  <Text style={[styles.locationAlertSub, { color: theme.textSecondary }]}>
                    Detectamos que você está em {userLocation?.neighborhood ? `${userLocation.neighborhood}, ` : ''}{userLocation?.city || 'Mogi das Cruzes'}{distFromBarKm ? ` (${distFromBarKm} km de distância)` : ''}.
                    O endereço cadastrado do bar é a preferência recomendada para descarregamento das bebidas.
                  </Text>
                </View>
              </View>
            )}

            {/* Card: Destino de Entrega (Preferência do Bar vs GPS vs Outro) */}
            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <Text style={styles.infoBoxTitle}>Destino da Entrega</Text>
                <Text style={styles.infoBoxRightText}>Frete: R$7,00</Text>
              </View>

              {/* Opção 1: Endereço Oficial do Bar (Preferencial) */}
              <TouchableOpacity 
                style={[
                  styles.addressOptionCard, 
                  deliveryAddressType === 'bar' && styles.addressOptionCardActive
                ]}
                onPress={() => {
                  setDeliveryAddressType('bar');
                  setShowCustomAddressInput(false);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.addressOptionRadio}>
                  <Ionicons 
                    name={deliveryAddressType === 'bar' ? 'radio-button-on' : 'radio-button-off'} 
                    size={20} 
                    color={deliveryAddressType === 'bar' ? (isDarkMode ? '#FFC107' : '#D97706') : (isDarkMode ? '#8FA0AF' : '#475569')} 
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={styles.addressOptionName}>{selectedBar?.name || 'Bar 01'}</Text>
                    <View style={styles.prefBadge}>
                      <Text style={styles.prefBadgeText}>PREFERÊNCIA DO BAR</Text>
                    </View>
                  </View>
                  <Text style={styles.addressOptionDetail}>
                    {selectedBar ? `${selectedBar.street}, ${selectedBar.number} - ${selectedBar.neighborhood}` : 'Rua Aspicuelta, 420 - Vila Madalena'}
                  </Text>
                  <Text style={styles.addressOptionCity}>
                    {selectedBar ? `${selectedBar.city} - ${selectedBar.state}` : 'São Paulo - SP'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.editBtn} 
                  onPress={() => setShowEditBarAddressModal(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={18} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Opção 2: Localização Atual (GPS) */}
              <TouchableOpacity 
                style={[
                  styles.addressOptionCard, 
                  deliveryAddressType === 'current_gps' && styles.addressOptionCardActive
                ]}
                onPress={() => {
                  setDeliveryAddressType('current_gps');
                  setShowCustomAddressInput(false);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.addressOptionRadio}>
                  <Ionicons 
                    name={deliveryAddressType === 'current_gps' ? 'radio-button-on' : 'radio-button-off'} 
                    size={20} 
                    color={deliveryAddressType === 'current_gps' ? (isDarkMode ? '#FFC107' : '#D97706') : (isDarkMode ? '#8FA0AF' : '#475569')} 
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={styles.addressOptionName}>Minha Localização Atual</Text>
                    <View style={styles.gpsBadge}>
                      <Text style={styles.gpsBadgeText}>GPS ATUAL</Text>
                    </View>
                  </View>
                  <Text style={styles.addressOptionDetail}>
                    {userLocation?.neighborhood ? `${userLocation.neighborhood}, ${userLocation.city || 'Mogi das Cruzes'}` : (userLocation?.city || 'Mogi das Cruzes, SP')}
                  </Text>
                  <Text style={styles.addressOptionCity}>
                    {userLocation?.address || `${userLocation?.city || 'Mogi das Cruzes'} - ${userLocation?.state || 'SP'}`}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={requestLocation}>
                  <Ionicons name="refresh" size={18} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Opção 3: Outro Endereço */}
              <TouchableOpacity 
                style={[
                  styles.addressOptionCard, 
                  deliveryAddressType === 'custom' && styles.addressOptionCardActive
                ]}
                onPress={() => {
                  setDeliveryAddressType('custom');
                  setShowCustomAddressInput(true);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.addressOptionRadio}>
                  <Ionicons 
                    name={deliveryAddressType === 'custom' ? 'radio-button-on' : 'radio-button-off'} 
                    size={20} 
                    color={deliveryAddressType === 'custom' ? (isDarkMode ? '#FFC107' : '#D97706') : (isDarkMode ? '#8FA0AF' : '#475569')} 
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.addressOptionName}>Outro Endereço de Entrega</Text>
                  <Text style={styles.addressOptionDetail}>
                    {customAddress.trim() ? customAddress : 'Toque para digitar um endereço diferente'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Campo para Digitar Endereço Customizado */}
              {showCustomAddressInput && (
                <View style={styles.customAddressBox}>
                  <Text style={styles.customAddressLabel}>Digite o endereço completo para entrega:</Text>
                  <TextInput
                    style={styles.customAddressInput}
                    placeholder="Ex: Av. Voluntário Fernando Pinheiro Franco, 500 - Centro, Mogi das Cruzes"
                    placeholderTextColor="#627585"
                    value={customAddress}
                    onChangeText={setCustomAddress}
                  />
                </View>
              )}
            </View>

            {/* Card: Observações */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Observações</Text>
              <View style={styles.notesRow}>
                <Ionicons name="chatbubble-ellipses" size={22} color={isDarkMode ? '#FFC107' : '#0D1C28'} style={{ marginTop: 8 }} />
                <View style={styles.notesInputContainer}>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Ex. O interfone está quebrado"
                    placeholderTextColor="#4E657B"
                    value={deliveryNotes}
                    onChangeText={setDeliveryNotes}
                    multiline
                  />
                </View>
              </View>
            </View>
          </>
        )}

        {/* ======================================================== */}
        {/* PASSO 2: PAGAMENTO E CUPONS                             */}
        {/* ======================================================== */}
        {currentStep === 'payment' && (
          <>
            {/* Escolha da Forma de Pagamento */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Forma de Pagamento</Text>

              {/* Opção 1: Boleto B2B Faturado (15 Dias com Validação Serasa) */}
              <TouchableOpacity 
                style={[
                  styles.paymentOptionRow, 
                  paymentMethod === 'boleto_faturado' && styles.paymentOptionRowActive,
                  selectedBar?.creditStatus === 'restricted' && { opacity: 0.65 }
                ]}
                onPress={() => {
                  if (selectedBar?.creditStatus === 'restricted') {
                    Alert.alert(
                      'Crédito Faturado Indisponível',
                      'Identificamos restrições cadastrais no Serasa para o CNPJ deste bar. Por exigência dos distribuidores parceiros, suas compras devem ser pagas na hora (Pix ou Cartão).'
                    );
                    setPaymentMethod('pix');
                    return;
                  }
                  setPaymentMethod('boleto_faturado');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.paymentOptionLeft}>
                  <Ionicons 
                    name="barcode-outline" 
                    size={24} 
                    color={selectedBar?.creditStatus === 'restricted' ? '#EF4444' : (isDarkMode ? '#FFC107' : '#0D1C28')} 
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.paymentOptionTitle}>Boleto B2B Faturado (15 Dias)</Text>
                      {selectedBar?.creditStatus === 'restricted' ? (
                        <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' }}>BLOQUEADO SERASA</Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: '#10B981', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                          <Text style={{ color: '#0D1C28', fontSize: 9, fontWeight: 'bold' }}>SERASA OK (SCORE {selectedBar?.serasaScore || 845})</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.paymentOptionSub}>
                      {selectedBar?.creditStatus === 'restricted'
                        ? 'Restrição Serasa no CNPJ • Pague na hora via Pix ou Cartão'
                        : `Pague em até 15 dias (Venc: ${fifteenDaysDueDateFormatted}) • Limite Disp: R$ ${(selectedBar ? selectedBar.creditLimit - selectedBar.creditUsed : 15000).toFixed(2)}`}
                    </Text>
                  </View>
                </View>
                <Ionicons 
                  name={paymentMethod === 'boleto_faturado' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={paymentMethod === 'boleto_faturado' ? (isDarkMode ? '#FFC107' : '#D97706') : (isDarkMode ? '#8FA0AF' : '#475569')} 
                />
              </TouchableOpacity>

              {/* Opção 2: Pix Instantâneo */}
              <TouchableOpacity 
                style={[styles.paymentOptionRow, paymentMethod === 'pix' && styles.paymentOptionRowActive]}
                onPress={() => setPaymentMethod('pix')}
                activeOpacity={0.8}
              >
                <View style={styles.paymentOptionLeft}>
                  <Ionicons name="flash" size={22} color={isDarkMode ? '#FFC107' : '#0D1C28'} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.paymentOptionTitle}>Pix Instantâneo</Text>
                    <Text style={styles.paymentOptionSub}>Aprovação imediata e envio expresso</Text>
                  </View>
                </View>
                <Ionicons 
                  name={paymentMethod === 'pix' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={paymentMethod === 'pix' ? (isDarkMode ? '#FFC107' : '#D97706') : (isDarkMode ? '#8FA0AF' : '#64748B')} 
                />
              </TouchableOpacity>

              {/* Opção 3: Cartão de Crédito PJ */}
              <TouchableOpacity 
                style={[styles.paymentOptionRow, paymentMethod === 'credit_card' && styles.paymentOptionRowActive]}
                onPress={() => setPaymentMethod('credit_card')}
                activeOpacity={0.8}
              >
                <View style={styles.paymentOptionLeft}>
                  <Ionicons name="card-outline" size={22} color={isDarkMode ? '#FFC107' : '#0D1C28'} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.paymentOptionTitle}>Cartão de Crédito PJ</Text>
                    <Text style={styles.paymentOptionSub}>Em até 3x sem juros</Text>
                  </View>
                </View>
                <Ionicons 
                  name={paymentMethod === 'credit_card' ? 'radio-button-on' : 'radio-button-off'} 
                  size={20} 
                  color={paymentMethod === 'credit_card' ? (isDarkMode ? '#FFC107' : '#D97706') : (isDarkMode ? '#8FA0AF' : '#64748B')} 
                />
              </TouchableOpacity>
            </View>

            {/* Card: Cupom de Desconto */}
            <TouchableOpacity style={styles.infoBox} onPress={handleApplyCoupon} activeOpacity={0.85}>
              <Text style={styles.infoBoxTitle}>Cupom de desconto</Text>
              <View style={styles.infoBoxBody}>
                <View style={[styles.yellowIconCircle, { backgroundColor: isDarkMode ? '#1E354A' : '#FEF3C7', borderRadius: 14 }]}>
                  <Text style={[styles.yellowPercentText, { color: isDarkMode ? '#FFC107' : '#B45309' }]}>%</Text>
                </View>
                <Text style={styles.discountPlaceholder}>
                  {appliedCoupon ? `Cupom Ativo: ${appliedCoupon}` : 'Adicionar cupom de desconto'}
                </Text>
                <TouchableOpacity style={styles.editBtn} onPress={handleApplyCoupon}>
                  <Ionicons name="create-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Distribuidora Responsável */}
            {cartSupplier && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>Distribuidora do Pedido</Text>
                <View style={styles.infoBoxBody}>
                  <View style={[styles.yellowIconCircle, { backgroundColor: isDarkMode ? '#1E354A' : '#FEF3C7', borderRadius: 14 }]}>
                    <Ionicons name="storefront-outline" size={18} color={isDarkMode ? '#FFC107' : '#B45309'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>
                      {cartSupplier.tradeName}
                    </Text>
                    <Text style={{ fontSize: 11, color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                      Previsão: {cartSupplier.deliveryTimeEstimate || 'Hoje'} • Frota própria da distribuidora
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Resumo de Valores */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Resumo Financeiro</Text>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Subtotal dos produtos:</Text>
                <Text style={styles.summaryLineValue}>R$ {cartTotal.toFixed(2).replace('.', ',')}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLineLabel}>Taxa de entrega:</Text>
                <Text style={styles.summaryLineValue}>R$ {deliveryFee.toFixed(2).replace('.', ',')}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.summaryLine}>
                  <Text style={[styles.summaryLineLabel, { color: '#4ADE80' }]}>Desconto Cupom:</Text>
                  <Text style={[styles.summaryLineValue, { color: '#4ADE80' }]}>- R$ {discountAmount.toFixed(2).replace('.', ',')}</Text>
                </View>
              )}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryLine}>
                <Text style={styles.summaryTotalLabel}>Total a pagar:</Text>
                <Text style={styles.summaryTotalValue}>R$ {grandTotal.toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>
          </>
        )}

        {/* ======================================================== */}
        {/* PASSO 3: CONFIRMAÇÃO DO PEDIDO                          */}
        {/* ======================================================== */}
        {currentStep === 'confirmation' && (
          <>
            {/* Card Resumo do Estabelecimento */}
            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <Text style={styles.infoBoxTitle}>Endereço de Entrega</Text>
                <TouchableOpacity onPress={() => setCurrentStep('location')}>
                  <Text style={styles.changeStepText}>Alterar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.infoBoxBody}>
                <View style={[styles.yellowPinCircle, { backgroundColor: isDarkMode ? '#1E354A' : '#FEF3C7', borderRadius: 14 }]}>
                  <Ionicons name="location-sharp" size={20} color={isDarkMode ? '#FFC107' : '#B45309'} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text style={styles.destName}>
                      {deliveryAddressType === 'bar' 
                        ? (selectedBar?.name || 'Bar 01') 
                        : (deliveryAddressType === 'current_gps' ? 'Localização Atual' : 'Endereço Alternativo')}
                    </Text>
                    {deliveryAddressType === 'bar' && (
                      <View style={styles.prefBadge}>
                        <Text style={styles.prefBadgeText}>BAR PREFERENCIAL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.destAddress}>
                    {effectiveDeliveryAddress}
                  </Text>
                  {deliveryNotes ? (
                    <Text style={styles.notesPreview}>Obs: &quot;{deliveryNotes}&quot;</Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Card Resumo do Pagamento */}
            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <Text style={styles.infoBoxTitle}>Faturamento Selecionado</Text>
                <TouchableOpacity onPress={() => setCurrentStep('payment')}>
                  <Text style={styles.changeStepText}>Alterar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.infoBoxBody}>
                <View style={[styles.yellowIconCircle, { backgroundColor: isDarkMode ? '#1E354A' : '#FEF3C7', borderRadius: 14 }]}>
                  <Ionicons 
                    name={paymentMethod === 'pix' ? 'flash' : (paymentMethod === 'boleto_faturado' ? 'barcode-outline' : 'card-outline')} 
                    size={18} 
                    color={isDarkMode ? '#FFC107' : '#B45309'} 
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.paymentMethodName}>
                    {paymentMethod === 'boleto_faturado' ? 'Boleto B2B Faturado (30 Dias)' : (paymentMethod === 'pix' ? 'Pix Instantâneo com Envio Prioritário' : 'Cartão de Crédito PJ')}
                  </Text>
                  <Text style={styles.destAddress}>Total: R$ {grandTotal.toFixed(2).replace('.', ',')}</Text>
                </View>
              </View>
            </View>

            {/* Card Resumo dos Produtos */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>Itens do Pedido ({cart.reduce((a, b) => a + b.quantity, 0)} unidades)</Text>
              {cart.map(item => (
                <View key={item.product.id} style={styles.confirmItemRow}>
                  <Image 
                    source={getProductImage(item.product)} 
                    style={styles.confirmItemImg}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.confirmItemName}>{item.product.name}</Text>
                    <Text style={styles.confirmItemSub}>Qtd: {item.quantity}x • R$ {item.product.price.toFixed(2).replace('.', ',')}</Text>
                  </View>
                  <Text style={styles.confirmItemTotal}>
                    R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              ))}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryLine}>
                <Text style={styles.summaryTotalLabel}>Total Final:</Text>
                <Text style={styles.summaryTotalValue}>R$ {grandTotal.toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Botão Inferior de Ação Passo a Passo */}
      <View style={styles.bottomBar}>
        {currentStep === 'location' ? (
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => {
              if (cart.length === 0) {
                Alert.alert('Sacola Vazia', 'Adicione bebidas antes de continuar.');
                return;
              }
              setCurrentStep('payment');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>AVANÇAR PARA PAGAMENTO →</Text>
          </TouchableOpacity>
        ) : currentStep === 'payment' ? (
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => setCurrentStep('confirmation')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>AVANÇAR PARA CONFIRMAÇÃO →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => handleFinalOrder()}
            disabled={isSubmitting || cart.length === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>
              {isSubmitting ? 'PROCESSANDO...' : 'FAZER PEDIDO'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal Pix se for selecionado */}
      <PixPaymentModal
        visible={showPixModal}
        order={createdOrder}
        onClose={() => {
          setShowPixModal(false);
          if (createdOrder) onOrderSuccess(createdOrder);
        }}
        onPaymentSuccess={() => {
          setShowPixModal(false);
          if (createdOrder) onOrderSuccess(createdOrder);
        }}
      />

      {/* Modal de Validação de Endereço quando Usuário está em local diferente (ex: Mogi das Cruzes) */}
      <Modal
        visible={showLocationMismatchModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLocationMismatchModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => setShowLocationMismatchModal(false)}
        >
          <View 
            style={[styles.mismatchModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.mismatchModalIconCircle}>
              <Ionicons name="location" size={32} color="#FFC107" />
            </View>

            <Text style={[styles.mismatchModalTitle, { color: theme.text }]}>
              Confirmar Endereço de Entrega
            </Text>

            <Text style={[styles.mismatchModalBody, { color: theme.textSecondary }]}>
              Detectamos que sua localização atual é{' '}
              <Text style={{ fontWeight: 'bold', color: theme.text }}>
                {userLocation?.city || 'Mogi das Cruzes'}
              </Text>
              {distFromBarKm ? ` (${distFromBarKm} km de distância)` : ''}, mas o endereço cadastrado do bar é a{' '}
              <Text style={{ fontWeight: 'bold', color: '#FFC107' }}>
                preferência recomendada
              </Text>{' '}
              para os caminhões de distribuição descarregarem.
            </Text>

            <View style={[styles.mismatchDestPreview, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="business" size={16} color="#FFC107" />
                <Text style={[styles.mismatchDestTitle, { color: theme.text }]}>
                  {selectedBar?.name || 'Bar 01'}
                </Text>
              </View>
              <Text style={[styles.mismatchDestSub, { color: theme.textSecondary }]}>
                {selectedBar ? `${selectedBar.street}, ${selectedBar.number} - ${selectedBar.neighborhood}, ${selectedBar.city}` : 'Vila Madalena, São Paulo'}
              </Text>
            </View>

            {/* Botão Recomendado: Entregar no Bar (Preferencial) */}
            <TouchableOpacity 
              style={styles.modalPrimaryBtn}
              onPress={() => handleFinalOrder('bar')}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-circle" size={18} color="#0D1C28" style={{ marginRight: 6 }} />
              <Text style={styles.modalPrimaryBtnText}>
                Entregar no Bar (Preferencial)
              </Text>
            </TouchableOpacity>

            {/* Botão Secundário: Entregar na Localização Atual */}
            <TouchableOpacity 
              style={[styles.modalSecondaryBtn, { borderColor: theme.border }]}
              onPress={() => handleFinalOrder('current_gps')}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={16} color={theme.text} style={{ marginRight: 6 }} />
              <Text style={[styles.modalSecondaryBtnText, { color: theme.text }]}>
                Entregar em {userLocation?.city || 'Mogi das Cruzes'}
              </Text>
            </TouchableOpacity>

            {/* Botão Cancelar / Revisar */}
            <TouchableOpacity 
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowLocationMismatchModal(false);
                setCurrentStep('location');
              }}
            >
              <Text style={styles.modalCancelBtnText}>Revisar / Outro Endereço</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Edição do Endereço do Bar */}
      <EditBarAddressModal
        visible={showEditBarAddressModal}
        bar={selectedBar}
        onClose={() => setShowEditBarAddressModal(false)}
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
    paddingTop: 12,
    paddingBottom: 24,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 20,
    marginTop: 4,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircleActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDarkMode ? '#FFFFFF' : '#0D1C28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleInactive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: isDarkMode ? '#2A4154' : '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabelActive: {
    color: theme.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  stepLabelInactive: {
    color: isDarkMode ? '#8FA0AF' : '#475569',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  stepDashesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  dashSegment: {
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: isDarkMode ? '#2A4154' : '#94A3B8',
  },
  dashSegmentDone: {
    backgroundColor: '#FFC107',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  productImgBox: {
    width: 64,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  productImg: {
    width: 58,
    height: 96,
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  productMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productName: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  productFreight: {
    color: theme.textMuted,
    fontSize: 12,
  },
  miniStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 15,
    width: 90,
    height: 28,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 8,
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  miniStepperBtn: {
    paddingHorizontal: 4,
  },
  miniStepperBtnText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  miniStepperVal: {
    color: theme.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoBoxTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoBoxRightText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  changeStepText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoBoxBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yellowPinCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowIconCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowPercentText: {
    color: '#FFC107',
    fontSize: 22,
    fontWeight: '900',
  },
  destName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  destAddress: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  notesPreview: {
    color: '#FFC107',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  editBtn: {
    padding: 4,
  },
  discountPlaceholder: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 13,
    marginLeft: 12,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  paymentOptionRowActive: {
    borderColor: '#FFC107',
    backgroundColor: isDarkMode ? '#122435' : '#FFFBEB',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionTitle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  paymentOptionSub: {
    color: theme.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  paymentMethodName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  notesInputContainer: {
    flex: 1,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    height: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  notesInput: {
    flex: 1,
    color: theme.text,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLineLabel: {
    color: theme.textSecondary,
    fontSize: 13,
  },
  summaryLineValue: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 10,
  },
  summaryTotalLabel: {
    color: theme.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    color: '#FFC107',
    fontSize: 18,
    fontWeight: '900',
  },
  confirmItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  confirmItemImg: {
    width: 30,
    height: 48,
  },
  confirmItemName: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmItemSub: {
    color: theme.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  confirmItemTotal: {
    color: theme.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomBar: {
    backgroundColor: theme.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: isDarkMode ? 0 : 1,
    borderTopColor: theme.border,
  },
  ctaButton: {
    backgroundColor: '#FFC107',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  locationAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  locationAlertIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationAlertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  locationAlertSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  addressOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  addressOptionCardActive: {
    borderColor: '#FFC107',
    backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.08)' : 'rgba(255, 193, 7, 0.12)',
  },
  addressOptionRadio: {
    padding: 2,
  },
  addressOptionName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.text,
  },
  addressOptionDetail: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 1,
  },
  addressOptionCity: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 1,
  },
  prefBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prefBadgeText: {
    color: '#0D1C28',
    fontSize: 9,
    fontWeight: '900',
  },
  gpsBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gpsBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  customAddressBox: {
    marginTop: 4,
    marginBottom: 8,
  },
  customAddressLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  customAddressInput: {
    backgroundColor: theme.surfaceInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mismatchModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center',
  },
  mismatchModalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  mismatchModalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  mismatchModalBody: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
  },
  mismatchDestPreview: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  mismatchDestTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  mismatchDestSub: {
    fontSize: 11,
    marginTop: 2,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: '#FFC107',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    color: '#0D1C28',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalSecondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelBtnText: {
    color: '#7E92A4',
    fontSize: 12,
  },
  });
}
