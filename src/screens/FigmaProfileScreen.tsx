import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { FigmaSwitch } from '../components/FigmaSwitch';
import { EditBarAddressModal } from '../components/EditBarAddressModal';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { ReportContentModal } from '../components/ReportContentModal';
import { PolicyDetailModal, PolicyType } from '../components/PolicyDetailModal';
import { PixPaymentModal } from '../components/PixPaymentModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { BarEstablishment, Order } from '../types';

interface FigmaProfileScreenProps {
  onOpenMyBars: () => void;
  onOpenOrders: () => void;
  onOpenLogin?: () => void;
  onBack?: () => void;
}

export const FigmaProfileScreen: React.FC<FigmaProfileScreenProps> = ({
  onOpenMyBars,
  onOpenOrders,
  onOpenLogin,
}) => {
  const { 
    currentUser, 
    selectedBar, 
    myBars,
    bars,
    orders,
    isDarkMode, 
    toggleDarkMode, 
    theme,
    logout,
    updateBarCreditStatus,
    payBoletoInvoice,
  } = useApp();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [showSelectBarAddressModal, setShowSelectBarAddressModal] = useState(false);
  const [barToEditAddress, setBarToEditAddress] = useState<BarEstablishment | null>(null);
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLiveChatModal, setShowLiveChatModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType | null>(null);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [selectedBoletoOrder, setSelectedBoletoOrder] = useState<Order | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const pendingInvoices = orders.filter(o => 
    o.paymentMethod === 'boleto_faturado' && 
    (o.paymentStatus === 'scheduled_faturado' || o.paymentStatus === 'pending')
  );

  const totalUsedCredit = pendingInvoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalLimit = selectedBar?.creditLimit || 15000.00;
  const availableCredit = Math.max(0, totalLimit - totalUsedCredit);

  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return 15;
    const diff = new Date(dueDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const iconColor = isDarkMode ? '#FFFFFF' : '#0D1C28';
  const chevronColor = isDarkMode ? '#FFFFFF' : '#0D1C28';
  const isGuest = !currentUser;

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair? O app voltará para o modo visitante.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair (Logout)', 
          style: 'destructive', 
          onPress: async () => {
            setShowProfileModal(false);
            await logout();
            Alert.alert('Você saiu', 'Sua conta foi desconectada.');
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Exato do Figma 122:1370: Banner Curvo com Avatar "IMG" + Guest User / Login */}
        <View style={[styles.headerBanner, { backgroundColor: isDarkMode ? '#102232' : '#E2E8F0' }]}>
          <TouchableOpacity 
            style={styles.headerRow}
            onPress={() => {
              if (isGuest) {
                if (onOpenLogin) onOpenLogin();
              } else {
                setShowProfileModal(true);
              }
            }}
            activeOpacity={0.85}
          >
            {/* Avatar Circular "IMG" fiel ao Figma */}
            <View style={[styles.avatarCircle, !isDarkMode && { backgroundColor: '#CBD5E1' }]}>
              <Text style={[styles.avatarImgText, !isDarkMode && { color: '#334155' }]}>IMG</Text>
            </View>

            <View style={styles.userInfoBox}>
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                {currentUser?.name || 'Usuário Visitante'}
              </Text>
              <Text style={[styles.userSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {currentUser 
                  ? (selectedBar ? `${selectedBar.name.split(' - ')[0]} • Conectado` : 'Dono do Bar')
                  : 'Faça login para acessar todos os recursos'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Botão de Login/Cadastro no Estado Vazio (Visitante) */}
          {isGuest && (
            <TouchableOpacity 
              style={styles.guestCtaBtn}
              onPress={() => onOpenLogin && onOpenLogin()}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={18} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6 }} />
              <Text style={[styles.guestCtaText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>Fazer Login ou Cadastrar Bar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ======================================================== */}
        {/* SEÇÃO 1: Geral                                           */}
        {/* ======================================================== */}
        <Text style={styles.sectionHeading}>Geral</Text>
        <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Perfil */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => {
              if (isGuest) {
                if (onOpenLogin) onOpenLogin();
              } else {
                setShowProfileModal(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Perfil</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Meus Endereços - Seleção de bar para ver ou alterar endereço */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => {
              if (isGuest) {
                Alert.alert('Modo Visitante', 'Conecte seu bar para gerenciar endereços de entrega.', [
                  { text: 'Fazer Login', onPress: () => onOpenLogin && onOpenLogin() },
                  { text: 'Cancelar', style: 'cancel' }
                ]);
              } else {
                setShowSelectBarAddressModal(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="map-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Meus Endereços</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Faturas & Crédito (15d) - Item de Menu com Bolinha com Contador */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => {
              if (isGuest) {
                Alert.alert('Modo Visitante', 'Faça login com seu CNPJ para acessar faturas e compras a prazo.', [
                  { text: 'Fazer Login', onPress: () => onOpenLogin && onOpenLogin() },
                  { text: 'Cancelar', style: 'cancel' }
                ]);
              } else {
                setShowInvoicesModal(true);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={20} color={iconColor} style={styles.menuIcon} />
              <Text style={[styles.menuTitle, { color: theme.text }]}>Faturas & Crédito (15d)</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {pendingInvoices.length > 0 && (
                <View style={styles.invoiceBadgeCircle}>
                  <Text style={styles.invoiceBadgeCircleText}>{pendingInvoices.length}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color={chevronColor} />
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Idioma */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Idioma</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Modo Escuro */}
          <View style={styles.menuRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={isDarkMode ? "moon-outline" : "sunny-outline"} size={20} color={iconColor} style={styles.menuIcon} />
              <Text style={[styles.menuTitle, { color: theme.text }]}>Modo Escuro</Text>
            </View>
            <FigmaSwitch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              activeTrackColor="#FFC107"
              inactiveTrackColor={isDarkMode ? '#3F576C' : '#CBD5E1'}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ======================================================== */}
        {/* SEÇÃO 2: Promoções & Benefícios                          */}
        {/* ======================================================== */}
        <Text style={styles.sectionHeading}>Promoções & Benefícios</Text>
        <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Cupons */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => setShowCouponsModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pricetag-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Cupons de Desconto</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* SEÇÃO 3: Ajuda & Suporte                                 */}
        {/* ======================================================== */}
        <Text style={styles.sectionHeading}>Ajuda & Suporte</Text>
        <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Chat ao Vivo */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => setShowLiveChatModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Chat ao Vivo</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Fale Conosco */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => setShowHelpModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Fale Conosco (Ajuda & Suporte)</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Sobre Nós */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => setShowAboutModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Sobre o FlowStock</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Termos & Condições */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => setSelectedPolicy('terms')}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Termos & Condições</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Refund Policy */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => setSelectedPolicy('refund')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Política de Reembolso</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Privacy LGPD */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => setSelectedPolicy('privacy')}
            activeOpacity={0.7}
          >
            <Ionicons name="lock-closed-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Privacidade & LGPD</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

          {/* Regras de Cancelamento */}
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => setSelectedPolicy('cancellation')}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={20} color={iconColor} style={styles.menuIcon} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>Regras de Cancelamento</Text>
            <Ionicons name="chevron-forward" size={16} color={chevronColor} />
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* SEÇÃO 4: Conta (Exclusão exigida por Apple / Google Play) */}
        {/* ======================================================== */}
        {!isGuest && (
          <>
            <Text style={styles.sectionHeading}>Conta</Text>
            <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={20} color={iconColor} style={styles.menuIcon} />
                <Text style={[styles.menuTitle, { color: theme.text }]}>Sair da Conta</Text>
                <Ionicons name="chevron-forward" size={16} color={chevronColor} />
              </TouchableOpacity>

              <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setShowDeleteAccountModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" style={styles.menuIcon} />
                <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Excluir Conta</Text>
                <Ionicons name="chevron-forward" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL 1: PERFIL DO USUÁRIO / ESTABELECIMENTO                              */}
      {/* ========================================================================= */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowProfileModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Dados do Perfil</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.profileDetailBox}>
                <Text style={styles.detailLabel}>Nome do Responsável:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{currentUser?.name || 'Carlos Alberto Mendes'}</Text>

                <Text style={styles.detailLabel}>E-mail Cadastrado:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{currentUser?.email || 'carlos.mendes@botecodochico.com.br'}</Text>

                <Text style={styles.detailLabel}>Telefone / WhatsApp:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{currentUser?.phone || '(11) 98765-4321'}</Text>

                <Text style={styles.detailLabel}>Estabelecimento Vinculado:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{selectedBar?.name || 'Boteco do Carlos - Vila Madalena'}</Text>

                <Text style={styles.detailLabel}>CNPJ Cadastrado:</Text>
                <Text style={[styles.detailValue, { color: '#FFC107', fontWeight: 'bold' }]}>
                  {selectedBar?.cnpj || '24.123.456/0001-90'}
                </Text>

                <Text style={styles.detailLabel}>Endereço Comercial:</Text>
                <Text style={[styles.detailValue, { color: theme.textSecondary }]}>
                  {selectedBar ? `${selectedBar.street}, ${selectedBar.number} - ${selectedBar.neighborhood}, ${selectedBar.city}` : 'Rua Aspicuelta, 420 - Vila Madalena, São Paulo'}
                </Text>

                <Text style={styles.detailLabel}>Limite Faturado (15 Dias):</Text>
                <Text style={[styles.detailValue, { color: '#10B981', fontWeight: 'bold' }]}>
                  R$ {selectedBar?.creditLimit ? selectedBar.creditLimit.toFixed(2).replace('.', ',') : '15.000,00'} (Boleto 15d • Serasa Aprovado)
                </Text>
              </View>

              {/* Botão de Logout dentro do modal de perfil */}
              {!isGuest && (
                <TouchableOpacity 
                  style={[styles.modalCloseBtn, { backgroundColor: '#EF4444', marginBottom: 10 }]}
                  onPress={handleLogout}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.modalCloseBtnText, { color: '#FFFFFF' }]}>
                    Sair da Conta (Logout)
                  </Text>
                </TouchableOpacity>
              )}

              {/* Exclusão de conta (Apple Guideline 5.1.1(v) / Google Play) */}
              {!isGuest && (
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EF4444', marginTop: 0, marginBottom: 10 }]}
                  onPress={() => {
                    setShowProfileModal(false);
                    setShowDeleteAccountModal(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.modalCloseBtnText, { color: '#EF4444' }]}>
                    Excluir Minha Conta
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#172738' : '#F1F5F9' }]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={[styles.modalCloseBtnText, { color: theme.text }]}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <DeleteAccountModal
        visible={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
      />

      {/* ========================================================================= */}
      {/* MODAL 2: CUPONS PROMOCIONAIS (COUPON)                                     */}
      {/* ========================================================================= */}
      <Modal
        visible={showCouponsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCouponsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCouponsModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Cupons Disponíveis</Text>
              <TouchableOpacity onPress={() => setShowCouponsModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              </TouchableOpacity>
            </View>

            {[
              { code: 'FLOW10', desc: '10% de desconto em todo o catálogo de Cervejas e Destilados', min: 'Pedido mínimo R$ 300' },
              { code: 'BEMVINDOBAR', desc: '10% OFF na primeira compra faturada do seu bar', min: 'Sem valor mínimo' },
              { code: 'CHOPP50', desc: 'R$ 50 de desconto em barris de Chopp 50L Brahma e Heineken', min: 'Válido para barris 50L' },
            ].map(cp => (
              <View key={cp.code} style={[styles.couponCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.couponCodeText}>{cp.code}</Text>
                  <View style={styles.couponBadge}>
                    <Text style={styles.couponBadgeText}>ATIVO</Text>
                  </View>
                </View>
                <Text style={[styles.couponDescText, { color: theme.text }]}>{cp.desc}</Text>
                <Text style={[styles.couponMinText, { color: theme.textSecondary }]}>{cp.min}</Text>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={() => setShowCouponsModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: LIVE CHAT                                                        */}
      {/* ========================================================================= */}
      <Modal
        visible={showLiveChatModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLiveChatModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLiveChatModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#FFC107" />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Chat ao Vivo FlowStock</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLiveChatModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 12 }}>
              <View style={{
                backgroundColor: isDarkMode ? '#172738' : '#FEF3C7',
                padding: 14,
                borderRadius: 12,
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDarkMode ? '#FFC107' : '#92400E' }}>
                    Mesa de Distribuição Online
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 17 }}>
                  Atendimento direto para pedidos urgentes de chopp, reposição de caixas 600ml e conferência de entregas.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#25D366',
                  paddingVertical: 13,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
                onPress={() => {
                  Alert.alert('WhatsApp FlowStock', 'Iniciando conversa com o suporte operacional no WhatsApp (11) 98765-4321.');
                  setShowLiveChatModal(false);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' }}>
                  Conversar via WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalCloseBtn, { marginTop: 4 }]}
                onPress={() => setShowLiveChatModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: HELP & SUPPORT (COM CANAL DE DENÚNCIAS APPLE)                     */}
      {/* ========================================================================= */}
      <Modal
        visible={showHelpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowHelpModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="call" size={22} color="#FFC107" />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Fale Conosco (Ajuda & Suporte)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 10 }}>
              <View style={[styles.profileDetailBox, { marginBottom: 14 }]}>
                <Text style={styles.detailLabel}>Telefone Comercial / WhatsApp:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>📞 (11) 98765-4321</Text>

                <Text style={styles.detailLabel}>E-mail de Atendimento B2B:</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>✉️ suporte@flowstock.com.br</Text>

                <Text style={styles.detailLabel}>Horário de Operação:</Text>
                <Text style={[styles.detailValue, { color: theme.textSecondary }]}>Segunda a Sábado, das 08h às 22h</Text>
              </View>

              {/* Botão de Denúncia Conforme Apple Guideline 1.2 */}
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderWidth: 1,
                  borderColor: '#EF4444',
                  borderRadius: 10,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
                onPress={() => {
                  setShowHelpModal(false);
                  setShowReportModal(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={22} color="#EF4444" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#EF4444' }}>
                    Canal de Denúncias (Apple Guideline 1.2)
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 1 }}>
                    Relatar produto falso, golpe, cobrança indevida ou assédio
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#EF4444" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowHelpModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: ABOUT US                                                         */}
      {/* ========================================================================= */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAboutModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="person-circle" size={24} color="#FFC107" />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Sobre o FlowStock</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                <View style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: '#FFC107',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Ionicons name="beer" size={28} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>FlowStock B2B</Text>
                <Text style={{ fontSize: 12, color: '#FFC107', fontWeight: 'bold', marginTop: 2 }}>Versão 1.0.0 Oficial</Text>
              </View>

              <Text style={{ fontSize: 13, color: theme.text, lineHeight: 19, marginBottom: 12 }}>
                O FlowStock é a plataforma digital que conecta diretamente donos de bares, restaurantes e casas noturnas às principais cervejarias e distribuidoras de bebidas do Brasil.
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19 }}>
                Com pedidos faturados em até 15 dias, controle automatizado de cascos retornáveis e geolocalização precisa de descarga, eliminamos o desabastecimento em finais de semana e feriados.
              </Text>

              <TouchableOpacity
                style={[styles.modalCloseBtn, { marginTop: 20 }]}
                onPress={() => setShowAboutModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6: TERMS & CONDITIONS                                               */}
      {/* ========================================================================= */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowTermsModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text" size={22} color="#FFC107" />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Termos & Condições</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFC107', marginBottom: 6 }}>
                1. Faturamento B2B & Prazo de Pagamento (15 Dias)
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 17, marginBottom: 14 }}>
                O faturamento de pedidos a prazo com vencimento em até 15 dias corridos está sujeito à prévia aprovação cadastral e consulta Serasa Experian do CNPJ. O não pagamento do boleto enseja bloqueio imediato para novas compras.
              </Text>

              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFC107', marginBottom: 6 }}>
                2. Vasilhames Retornáveis & Comodato
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 17, marginBottom: 14 }}>
                Garrafas de cerveja 600ml e barris de chopp 50L são disponibilizados sob regime de comodato e troca 1-para-1 na entrega. O bar se compromete a devolver os cascos vazios na mesma quantidade no ato da descarga.
              </Text>

              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFC107', marginBottom: 6 }}>
                3. Segurança da Comunidade & Moderação (Apple Guideline 1.2)
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 17, marginBottom: 14 }}>
                Qualquer conduta ilícita, fornecimento de bebida adulterada ou cobrança indevida resultará em exclusão imediata e permanente da plataforma em até 24 horas após denúncia apurada.
              </Text>

              <TouchableOpacity
                style={[styles.modalCloseBtn, { marginTop: 10 }]}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Concordar e Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 6.5: SELEÇÃO DE BAR PARA VER/ALTERAR ENDEREÇO (MY ADDRESS)           */}
      {/* ========================================================================= */}
      <Modal
        visible={showSelectBarAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSelectBarAddressModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSelectBarAddressModal(false)}
        >
          <SafeAreaView 
            style={[
              styles.modalContent, 
              { backgroundColor: isDarkMode ? '#112332' : '#FFFFFF', borderColor: theme.border }
            ]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Endereço do Estabelecimento</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Selecione o bar para visualizar ou alterar o endereço de entrega:
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSelectBarAddressModal(false)} style={styles.closeIconBtn}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={{ maxHeight: 440 }} 
              contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 2 }}
              showsVerticalScrollIndicator={false}
            >
              {(myBars.length > 0 ? myBars : bars).map(bar => {
                const isCurrent = selectedBar?.id === bar.id;
                return (
                  <TouchableOpacity
                    key={bar.id}
                    style={[
                      styles.addressBarItem,
                      {
                        backgroundColor: isCurrent 
                          ? (isDarkMode ? 'rgba(255, 193, 7, 0.1)' : '#FFFBEB') 
                          : (isDarkMode ? '#132230' : '#F8FAFC'),
                        borderColor: isCurrent ? '#FFC107' : (isDarkMode ? '#1E293B' : '#E2E8F0'),
                      }
                    ]}
                    onPress={() => {
                      setBarToEditAddress(bar);
                      setShowSelectBarAddressModal(false);
                      setShowEditAddressModal(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.addressBarHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Ionicons name="storefront" size={20} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 8 }} />
                        <Text style={[styles.addressBarName, { color: theme.text }]} numberOfLines={1}>{bar.name}</Text>
                      </View>
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>SELECIONADO</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.addressBarCnpj, { color: theme.textSecondary }]}>CNPJ: {bar.cnpj}</Text>

                    <View style={styles.addressBarLocationRow}>
                      <Ionicons name="location-outline" size={14} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6, marginTop: 2 }} />
                      <Text style={[styles.addressBarLocationText, { color: theme.text }]} numberOfLines={2}>
                        {bar.street}, {bar.number} {bar.complement ? `(${bar.complement})` : ''} - {bar.neighborhood}, {bar.city} - {bar.state}
                      </Text>
                    </View>

                    <View style={styles.addressBarActionRow}>
                      <Text style={[styles.editAddressHint, { color: theme.textSecondary }]}>Toque para editar dados ou GPS</Text>
                      <View style={styles.editAddressBtn}>
                        <Ionicons name="pencil" size={13} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 4 }} />
                        <Text style={[styles.editAddressBtnText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>Alterar</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 7: EDITAR ENDEREÇO DO BAR (MY ADDRESS)                              */}
      {/* ========================================================================= */}
      <EditBarAddressModal
        visible={showEditAddressModal}
        bar={barToEditAddress || selectedBar}
        onClose={() => {
          setShowEditAddressModal(false);
          setBarToEditAddress(null);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 8: SELEÇÃO DE IDIOMA (LANGUAGE)                                     */}
      {/* ========================================================================= */}
      <LanguageSelectorModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* ========================================================================= */}
      {/* MODAL 9: DENÚNCIAS E MODERAÇÃO (APPLE GUIDELINE 1.2)                      */}
      {/* ========================================================================= */}
      <ReportContentModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="supplier"
        targetName="Distribuidor / Conteúdo FlowStock"
      />

      {/* ========================================================================= */}
      {/* MODAL 10: POLÍTICAS REGULATÓRIAS B2B (REEMBOLSO, LGPD, TERMOS, CANCEL.)    */}
      {/* ========================================================================= */}
      <PolicyDetailModal
        visible={!!selectedPolicy}
        policyType={selectedPolicy || 'refund'}
        onClose={() => setSelectedPolicy(null)}
        onRequestRefund={() => {
          setSelectedPolicy(null);
          onOpenOrders && onOpenOrders();
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 11: TELA DEDICADA DE FATURAS & CRÉDITO SERASA (15 DIAS)             */}
      {/* ========================================================================= */}
      <Modal
        visible={showInvoicesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInvoicesModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowInvoicesModal(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border, maxWidth: 520, maxHeight: '88%' }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="receipt" size={22} color="#FFC107" />
                <View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Faturas & Crédito (15d)</Text>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>{selectedBar?.name || 'Boteco do Carlos'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowInvoicesModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 1. NOTIFICAÇÃO DE VENCIMENTO DE FATURA */}
              {pendingInvoices.length > 0 && (
                <View style={{
                  backgroundColor: isDarkMode ? '#241E10' : '#FEF3C7',
                  borderWidth: 1,
                  borderColor: '#F59E0B',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Ionicons name="notifications" size={26} color="#F59E0B" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDarkMode ? '#FDE68A' : '#92400E' }}>
                      Notificação de Vencimento de Fatura
                    </Text>
                    <Text style={{ fontSize: 12, color: isDarkMode ? '#FCD34D' : '#B45309', marginTop: 2, lineHeight: 16 }}>
                      {pendingInvoices.length === 1 
                        ? `O boleto do Pedido ${pendingInvoices[0].id} de R$ ${pendingInvoices[0].total.toFixed(2).replace('.', ',')} vence em ${getDaysRemaining(pendingInvoices[0].dueDate)} dias.`
                        : `Você possui ${pendingInvoices.length} faturas pendentes. A próxima vence em ${getDaysRemaining(pendingInvoices[0].dueDate)} dias.`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#F59E0B',
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 8,
                      marginLeft: 8,
                    }}
                    onPress={() => setSelectedBoletoOrder(pendingInvoices[0])}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0D1C28' }}>Pagar</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 2. CARD DE CRÉDITO SERASA & FATURAMENTO (15D) */}
              <View style={{
                backgroundColor: isDarkMode ? '#102234' : '#F8FAFC',
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 14,
                padding: 14,
                marginBottom: 18,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="shield-checkmark" size={18} color="#FFC107" />
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.text }}>
                      Crédito Serasa & Faturamento (15d)
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: selectedBar?.creditStatus === 'restricted' ? '#EF4444' : '#10B981',
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 5,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: selectedBar?.creditStatus === 'restricted' ? '#FFFFFF' : '#0D1C28' }}>
                      {selectedBar?.creditStatus === 'restricted' ? 'RESTRITO SERASA' : `SCORE ${selectedBar?.serasaScore || 845}`}
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 10, lineHeight: 16 }}>
                  {selectedBar?.creditStatus === 'restricted'
                    ? 'Identificamos restrições no birô Serasa Experian. Compras liberadas para pagamento à vista (Pix ou Cartão).'
                    : 'Avaliação de crédito Serasa aprovada! Seu estabelecimento pode comprar bebidas para pagar em até 15 dias via boleto.'}
                </Text>

                {/* Barra de Limite */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: theme.textSecondary }}>Limite Disponível</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#10B981' }}>
                    R$ {availableCredit.toFixed(2).replace('.', ',')}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={{ height: 8, backgroundColor: isDarkMode ? '#1E3246' : '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <View style={{
                    width: `${Math.min(100, (totalUsedCredit / totalLimit) * 100)}%`,
                    height: '100%',
                    backgroundColor: '#FFC107',
                    borderRadius: 4,
                  }} />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 10, color: theme.textMuted }}>
                    Utilizado: R$ {totalUsedCredit.toFixed(2).replace('.', ',')}
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.textMuted }}>
                    Total: R$ {totalLimit.toFixed(2).replace('.', ',')}
                  </Text>
                </View>

                {/* Botão de teste para alternar aprovação/restrição Serasa */}
                <TouchableOpacity
                  style={{
                    alignSelf: 'flex-start',
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: isDarkMode ? '#162838' : '#EDF2F7',
                    borderWidth: 1,
                    borderColor: '#2D445A',
                  }}
                  onPress={() => {
                    if (!selectedBar) return;
                    if (selectedBar.creditStatus === 'restricted') {
                      updateBarCreditStatus(selectedBar.id, 'approved', 15000, 845);
                      Alert.alert('Serasa Atualizado', 'Crédito aprovado com limite de R$ 15.000,00 para pagar em até 15 dias.');
                    } else {
                      updateBarCreditStatus(selectedBar.id, 'restricted', 0, 320);
                      Alert.alert('Serasa Atualizado', 'Restrição cadastral simulada. O bar agora só pode comprar pagando na hora.');
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#FFC107' }}>
                    {selectedBar?.creditStatus === 'restricted'
                      ? '🧪 Simular Aprovação Serasa (Liberar 15 dias)'
                      : '🧪 Simular Restrição Serasa (Bloquear 15 dias)'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 3. SEÇÃO: BOLETOS PENDENTES PARA PAGAR DEPOIS */}
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Boletos Pendentes para Pagar Depois ({pendingInvoices.length})
              </Text>

              {pendingInvoices.length === 0 ? (
                <View style={{
                  padding: 16,
                  backgroundColor: isDarkMode ? '#102234' : '#F8FAFC',
                  borderRadius: 10,
                  alignItems: 'center',
                }}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginBottom: 6 }} />
                  <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center' }}>
                    Nenhuma fatura pendente. Seu limite faturado de 15 dias está 100% livre.
                  </Text>
                </View>
              ) : (
                pendingInvoices.map(inv => {
                  const days = getDaysRemaining(inv.dueDate);
                  return (
                    <View 
                      key={inv.id}
                      style={{
                        backgroundColor: isDarkMode ? '#102234' : '#F8FAFC',
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 10,
                        borderLeftWidth: 4,
                        borderLeftColor: days <= 5 ? '#EF4444' : '#FFC107',
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: theme.text, flex: 1, marginRight: 8 }}>
                          {inv.id} • {inv.supplierName}
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFC107' }}>
                          R$ {inv.total.toFixed(2).replace('.', ',')}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <Text style={{ fontSize: 11, color: days <= 5 ? '#EF4444' : theme.textSecondary }}>
                          ⏰ Vencimento: {days} dias restantes
                        </Text>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#FFC107',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                          }}
                          onPress={() => setSelectedBoletoOrder(inv)}
                          activeOpacity={0.8}
                        >
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0D1C28' }}>
                            Ver Boleto / Pagar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}

              <TouchableOpacity 
                style={[styles.modalCloseBtn, { marginTop: 14 }]}
                onPress={() => setShowInvoicesModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Pagamento Pix / Boleto para Liquidar a Fatura */}
      <PixPaymentModal
        visible={!!selectedBoletoOrder}
        order={selectedBoletoOrder}
        onClose={() => setSelectedBoletoOrder(null)}
        onPaymentSuccess={async () => {
          if (selectedBoletoOrder) {
            await payBoletoInvoice(selectedBoletoOrder.id);
            Alert.alert(
              'Boleto Liquidado!',
              `A fatura do Pedido ${selectedBoletoOrder.id} foi liquidada com sucesso via Pix. O valor de R$ ${selectedBoletoOrder.total.toFixed(2).replace('.', ',')} foi restabelecido ao seu limite de crédito faturado!`
            );
            setSelectedBoletoOrder(null);
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D1C28',
  },
  scrollContent: {
    paddingBottom: 95,
  },
  headerBanner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomRightRadius: 55,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImgText: {
    color: '#607D8B',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  userInfoBox: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userSub: {
    color: '#A0B2C6',
    fontSize: 13,
    marginTop: 4,
  },
  guestCtaBtn: {
    marginTop: 16,
    backgroundColor: '#FFC107',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  guestCtaText: {
    color: '#0D1C28',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionHeading: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  menuCard: {
    backgroundColor: '#112332',
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#182C3D',
    overflow: 'hidden',
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuIcon: {
    marginRight: 14,
  },
  menuTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceBadgeCircle: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  invoiceBadgeCircleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#162838',
    marginLeft: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#112332',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileDetailBox: {
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: '#7E92A4',
    textTransform: 'uppercase',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  modalCloseBtn: {
    backgroundColor: '#FFC107',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  modalCloseBtnText: {
    color: '#0D1C28',
    fontSize: 14,
    fontWeight: 'bold',
  },
  couponCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  couponCodeText: {
    color: '#FFC107',
    fontSize: 15,
    fontWeight: 'bold',
  },
  couponBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  couponBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  couponDescText: {
    fontSize: 13,
    marginTop: 6,
  },
  couponMinText: {
    fontSize: 11,
    marginTop: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#A0B2C6',
    marginTop: 4,
  },
  closeIconBtn: {
    padding: 6,
  },
  addressBarItem: {
    backgroundColor: '#132230',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  addressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressBarName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addressBarCnpj: {
    fontSize: 12,
    color: '#A0B2C6',
    marginBottom: 8,
  },
  addressBarLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressBarLocationText: {
    fontSize: 12,
    color: '#E2E8F0',
    flex: 1,
    lineHeight: 18,
  },
  addressBarActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  editAddressHint: {
    fontSize: 11,
    color: '#8FA0AF',
  },
  editAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  editAddressBtnText: {
    color: '#0D1C28',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  currentBadgeText: {
    color: '#FFC107',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
