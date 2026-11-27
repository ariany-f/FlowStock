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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { Order } from '../types';

interface RefundRequestModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSubmitted?: (protocol: string) => void;
}

const REFUND_REASONS = [
  { id: 'damaged', label: 'Avaria ou quebra de vasilhame na descarga', icon: 'wine-outline' },
  { id: 'missing', label: 'Item ou engradado faltante na entrega', icon: 'cube-outline' },
  { id: 'wrong_product', label: 'Produto divergente da nota fiscal / pedido', icon: 'repeat-outline' },
  { id: 'billing_error', label: 'Erro de faturamento ou valor do boleto', icon: 'receipt-outline' },
  { id: 'other', label: 'Outro motivo operacional', icon: 'help-circle-outline' },
];

export const RefundRequestModal: React.FC<RefundRequestModalProps> = ({
  visible,
  order,
  onClose,
  onSubmitted,
}) => {
  const { theme, isDarkMode } = useApp();
  const styles = getStyles(theme, isDarkMode);

  const [selectedReason, setSelectedReason] = useState(REFUND_REASONS[0].id);
  const [description, setDescription] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!visible || !order) return null;

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Observação necessária', 'Por favor descreva resumidamente o ocorrido para agilizar a análise da distribuidora.');
      return;
    }

    setIsSubmitting(true);
    // Simula protocolo oficial de reembolso B2B
    setTimeout(() => {
      setIsSubmitting(false);
      const protocolNumber = `REF-${Date.now().toString().slice(-6)}`;
      
      Alert.alert(
        'Solicitação Registrada',
        `Protocolo: #${protocolNumber}\n\nSua solicitação foi enviada para ${order.supplierName}. O prazo de análise é de até 48 horas úteis.\n\nEm caso de aprovação, o estorno ocorre via Pix ou abatimento do boleto faturado.`,
        [
          {
            text: 'Entendi',
            onPress: () => {
              setDescription('');
              setPixKey('');
              if (onSubmitted) onSubmitted(protocolNumber);
              onClose();
            }
          }
        ]
      );
    }, 800);
  };

  const isBoleto = order.paymentMethod === 'boleto_faturado';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
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
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.title}>Solicitar Reembolso / Ajuda</Text>
              <Text style={styles.subtitle}>Pedido {order.id} • {order.supplierName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Resumo do Pedido */}
            <View style={styles.orderSummaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Valor Total:</Text>
                <Text style={styles.summaryValue}>R$ {order.total.toFixed(2).replace('.', ',')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Forma de Pagamento:</Text>
                <Text style={styles.summaryValue}>
                  {isBoleto ? 'Boleto Faturado (15 Dias)' : 'Pix à Vista'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estabelecimento:</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>{order.barName}</Text>
              </View>
            </View>

            {/* Motivo do Reembolso */}
            <Text style={styles.sectionLabel}>Motivo da Solicitação:</Text>
            <View style={styles.reasonsList}>
              {REFUND_REASONS.map(r => {
                const isSelected = selectedReason === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                    onPress={() => setSelectedReason(r.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={r.icon as any} 
                      size={18} 
                      color={isSelected ? '#FFC107' : theme.textSecondary} 
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                      {r.label}
                    </Text>
                    <Ionicons 
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'} 
                      size={18} 
                      color={isSelected ? '#FFC107' : theme.textMuted} 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Chave Pix para Estorno se Pix */}
            {!isBoleto && (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.sectionLabel}>Chave Pix para Estorno (se aprovado):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="CNPJ, E-mail, Telefone ou Chave Aleatória"
                  placeholderTextColor={theme.textMuted}
                  value={pixKey}
                  onChangeText={setPixKey}
                />
              </View>
            )}

            {/* Descrição Detalhada */}
            <Text style={styles.sectionLabel}>Detalhes do Ocorrido / Itens Avariados:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: 3 garrafas de Heineken 600ml chegaram trincadas na descarga, anotado no canhoto da NF..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={3}
            />

            {/* Termos & Política B2B Nota Informativa */}
            <View style={styles.noticeBox}>
              <Ionicons name="information-circle-outline" size={18} color="#FFC107" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.noticeText}>
                {isBoleto 
                  ? 'Para compras faturadas, o valor aprovado é lançado como abatimento / desconto no boleto antes da data de vencimento.'
                  : 'Para pagamentos via Pix, o estorno é processado em até 2 dias úteis após conferência da nota fiscal.'}
              </Text>
            </View>
          </ScrollView>

          {/* Botões do Rodapé */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              ) : (
                <>
                  <Ionicons name="send" size={16} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6 }} />
                  <Text style={[styles.submitBtnText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>Enviar Solicitação</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

function getStyles(theme: ThemeColors, isDarkMode: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#112332' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 24,
      maxHeight: '88%',
      width: '100%',
      maxWidth: 440,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 17,
      fontWeight: 'bold',
      color: theme.text,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
    },
    scrollBody: {
      maxHeight: 460,
    },
    orderSummaryBox: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 3,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    summaryValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
      textAlign: 'right',
      marginLeft: 10,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 8,
    },
    reasonsList: {
      gap: 8,
      marginBottom: 16,
    },
    reasonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    reasonItemSelected: {
      borderColor: '#FFC107',
      backgroundColor: isDarkMode ? 'rgba(255, 193, 7, 0.08)' : '#FFFBEB',
    },
    reasonText: {
      flex: 1,
      fontSize: 12,
      color: theme.text,
    },
    reasonTextSelected: {
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#0D1C28',
    },
    input: {
      backgroundColor: theme.surfaceInput,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 14,
    },
    textArea: {
      height: 70,
      textAlignVertical: 'top',
    },
    noticeBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDarkMode ? '#182736' : '#FEF3C7',
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? '#273C4E' : '#FDE68A',
    },
    noticeText: {
      flex: 1,
      fontSize: 11,
      color: isDarkMode ? '#CBD5E1' : '#92400E',
      lineHeight: 16,
    },
    footer: {
      flexDirection: 'row',
      gap: 10,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#182736' : '#F1F5F9',
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    submitBtn: {
      flex: 1.4,
      flexDirection: 'row',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFC107',
    },
    submitBtnText: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#0D1C28',
    },
  });
}
