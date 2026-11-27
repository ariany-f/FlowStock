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
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { ReportTargetType, ReportReasonCategory } from '../types';

interface ReportContentModalProps {
  visible: boolean;
  onClose: () => void;
  targetType?: ReportTargetType;
  targetId?: string;
  targetName?: string;
  targetDetails?: string;
}

interface ReasonOption {
  category: ReportReasonCategory;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const REASONS: ReasonOption[] = [
  {
    category: 'counterfeit',
    label: 'Produto Falsificado / Adulterado',
    description: 'Bebida sem selo fiscal, adulterada ou de origem duvidosa.',
    icon: 'warning-outline',
    color: '#EF4444',
  },
  {
    category: 'fraud',
    label: 'Fraude Comercial ou Golpe',
    description: 'Cobrança não reconhecida, pedido não entregue ou tentativa de golpe.',
    icon: 'shield-half-outline',
    color: '#F59E0B',
  },
  {
    category: 'damaged',
    label: 'Mercadoria Danificada ou Vencida',
    description: 'Embalagem violada, garrafas quebradas ou prazo de validade expirado.',
    icon: 'cube-outline',
    color: '#EAB308',
  },
  {
    category: 'abusive',
    label: 'Conduta Abusiva ou Assédio',
    description: 'Comportamento inadequado de entregador, distribuidor ou usuário.',
    icon: 'hand-left-outline',
    color: '#EC4899',
  },
  {
    category: 'pricing',
    label: 'Cobrança Indevida / Preço Enganoso',
    description: 'Divergência de valores entre o aplicativo e a nota fiscal emitida.',
    icon: 'pricetag-outline',
    color: '#3B82F6',
  },
  {
    category: 'inappropriate',
    label: 'Conteúdo Ofensivo ou Inapropriado',
    description: 'Fotos, descrições ou mensagens que violam as políticas da comunidade.',
    icon: 'eye-off-outline',
    color: '#8B5CF6',
  },
  {
    category: 'other',
    label: 'Outro Motivo',
    description: 'Outras violações às diretrizes de uso e qualidade da plataforma.',
    icon: 'ellipsis-horizontal-circle-outline',
    color: '#6B7280',
  },
];

const ReportForm: React.FC<{
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  targetDetails?: string;
}> = ({
  onClose,
  targetType,
  targetId,
  targetName,
  targetDetails,
}) => {
  const { createReport, blockSupplier, theme, isDarkMode } = useApp();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);

  const [selectedCategory, setSelectedCategory] = useState<ReportReasonCategory>('counterfeit');
  const [description, setDescription] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [shouldBlock, setShouldBlock] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Descrição Obrigatória', 'Por favor, descreva brevemente o motivo da denúncia para que possamos analisar com precisão.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReport({
        targetType,
        targetId,
        targetName,
        targetDetails,
        reasonCategory: selectedCategory,
        reasonDescription: description.trim(),
        evidenceNotes: evidenceNotes.trim(),
      });

      if (shouldBlock && targetType === 'supplier') {
        await blockSupplier(targetId);
      }

      Alert.alert(
        '🛡️ Denúncia Enviada com Sucesso',
        'Sua denúncia foi registrada sob protocolo de alta prioridade. Nossa equipe de moderação avaliará o caso em até 24 horas, conforme as diretrizes da Apple App Store (Guideline 1.2).\n\nAgradecemos por ajudar a manter nossa plataforma segura.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch {
      Alert.alert('Erro ao Enviar', 'Não foi possível processar sua denúncia no momento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
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
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="shield-checkmark" size={18} color="#EF4444" />
                <Text style={styles.title}>Canal de Denúncia</Text>
                <View style={styles.appleBadge}>
                  <Text style={styles.appleBadgeText}>Apple UGC 1.2</Text>
                </View>
              </View>
              <Text style={styles.subtitle} numberOfLines={1}>
                Alvo: {targetName || 'Conteúdo / Fornecedor'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Aviso de Moderação Apple 24h */}
            <View style={styles.guidelineCard}>
              <Ionicons name="time-outline" size={20} color="#FFC107" style={{ marginRight: 8, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.guidelineTitle}>Compromisso de Moderação em até 24h</Text>
                <Text style={styles.guidelineText}>
                  Em conformidade com a Apple App Store Guideline 1.2, todas as denúncias são apuradas pelo nosso time de moderação em até 24 horas. Conteúdos abusivos são removidos e contas infratoras são suspensas.
                </Text>
              </View>
            </View>

            {/* Categoria do Motivo */}
            <Text style={styles.sectionTitle}>Selecione o Motivo da Denúncia *</Text>
            <View style={styles.reasonsList}>
              {REASONS.map(r => {
                const isSelected = selectedCategory === r.category;
                return (
                  <TouchableOpacity
                    key={r.category}
                    style={[
                      styles.reasonCard,
                      isSelected && styles.reasonCardActive,
                    ]}
                    onPress={() => setSelectedCategory(r.category)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.reasonIconBox, { backgroundColor: isSelected ? `${r.color}25` : (isDarkMode ? '#112332' : '#F1F5F9') }]}>
                      <Ionicons name={r.icon} size={20} color={isSelected ? r.color : theme.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reasonLabel, isSelected && { color: r.color, fontWeight: '700' }]}>
                        {r.label}
                      </Text>
                      <Text style={styles.reasonSub}>{r.description}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isSelected ? r.color : theme.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Descrição Detalhada */}
            <Text style={styles.sectionTitle}>Relato dos Fatos / Detalhes *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva o que ocorreu de forma clara (ex: recebimento de caixas sem lacre, comportamento inapropriado, divergência de produto, etc.)."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Evidências / Notas Adicionais */}
            <Text style={styles.sectionTitle}>Número de NF-e, Lote ou Evidências (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={evidenceNotes}
              onChangeText={setEvidenceNotes}
              placeholder="Ex: NF-e 4492, Lote de Chopp 881-A, Pedido PED-8812"
              placeholderTextColor={theme.textMuted}
            />

            {/* Opção de Bloquear o Fornecedor (Apple Requirement: Mechanism to Block) */}
            {targetType === 'supplier' && (
              <TouchableOpacity
                style={styles.blockRow}
                onPress={() => setShouldBlock(!shouldBlock)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={shouldBlock ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={shouldBlock ? '#EF4444' : theme.textMuted}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.blockText, shouldBlock && { color: '#EF4444', fontWeight: 'bold' }]}>
                    Bloquear este distribuidor para mim
                  </Text>
                  <Text style={styles.blockSub}>
                    Os produtos deste fornecedor não serão mais recomendados nem exibidos no seu catálogo.
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Footer Actions */}
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send-sharp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Enviar Denúncia</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableOpacity>
  );
};

export const ReportContentModal: React.FC<ReportContentModalProps> = ({
  visible,
  onClose,
  targetType = 'supplier',
  targetId = 'supp_general',
  targetName = 'Distribuidor / Conteúdo',
  targetDetails,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <ReportForm
        key={`${targetType}_${targetId}_${visible}`}
        onClose={onClose}
        targetType={targetType}
        targetId={targetId}
        targetName={targetName}
        targetDetails={targetDetails}
      />
    </Modal>
  );
};

function getStyles(theme: ThemeColors, isDarkMode: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    container: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.35,
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
    appleBadge: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderWidth: 1,
      borderColor: '#EF4444',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    appleBadgeText: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#EF4444',
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
    guidelineCard: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#241E10' : '#FEF3C7',
      borderWidth: 1,
      borderColor: '#F59E0B',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    guidelineTitle: {
      fontSize: 13,
      fontWeight: 'bold',
      color: isDarkMode ? '#FDE68A' : '#92400E',
      marginBottom: 3,
    },
    guidelineText: {
      fontSize: 11,
      lineHeight: 16,
      color: isDarkMode ? '#FCD34D' : '#B45309',
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.text,
      marginTop: 12,
      marginBottom: 10,
    },
    reasonsList: {
      gap: 8,
      marginBottom: 10,
    },
    reasonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC',
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 12,
    },
    reasonCardActive: {
      borderColor: '#EF4444',
      backgroundColor: isDarkMode ? '#1E161C' : '#FFF1F2',
    },
    reasonIconBox: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    reasonLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    reasonSub: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
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
      marginBottom: 10,
    },
    textArea: {
      minHeight: 85,
      paddingTop: 10,
    },
    blockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#181E26' : '#F1F5F9',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      marginTop: 8,
    },
    blockText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    blockSub: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
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
      paddingVertical: 12,
      borderRadius: 10,
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
    submitBtn: {
      flex: 1.8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: '#EF4444',
    },
    submitBtnText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
  });
}
