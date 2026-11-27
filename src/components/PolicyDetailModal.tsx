import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';

export type PolicyType = 'refund' | 'privacy' | 'terms' | 'cancellation';

interface PolicyDetailModalProps {
  visible: boolean;
  policyType: PolicyType;
  onClose: () => void;
  onRequestRefund?: () => void;
}

const POLICY_DATA: Record<PolicyType, {
  title: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  sections: { title: string; content: string }[];
}> = {
  refund: {
    title: 'Política de Reembolso e Devolução',
    badge: 'B2B & CDC',
    icon: 'shield-checkmark-outline',
    sections: [
      {
        title: '1. Avarias e Quebra de Vasilhames no Transporte',
        content: 'No ato da entrega das caixas e engradados de vidro (como garrafas 600ml ou long necks), o responsável pelo bar deve inspecionar a carga juntamente com o motorista do caminhão. Qualquer avaria, quebra ou vasilhame trincado deve ser apontado no canhoto da nota fiscal e registrado pelo aplicativo em até 7 dias corridos.',
      },
      {
        title: '2. Cascos Retornáveis e Comodato (Barris 50L e 600ml)',
        content: 'Os engradados plásticos, garrafas retornáveis de vidro e barris de chopp 50L são fornecidos em regime de comodato com troca 1-para-1 na entrega. O valor referente ao vasilhame não é cobrado desde que devolvido na mesma quantidade.',
      },
      {
        title: '3. Prazos e Modalidades de Estorno',
        content: '• Compras via Pix: O estorno é creditado diretamente na conta bancária/chave Pix indicada em até 2 dias úteis após a validação da distribuidora.\n• Compras Faturadas (Boleto 15/30 Dias): O valor aprovado é lançado como abatimento ou carta de correção no boleto faturado antes da data de vencimento.',
      },
      {
        title: '4. Itens Faltantes na Carga',
        content: 'Caso falte algum engradado ou pacote no momento da conferência física, a distribuidora emitirá nota fiscal de devolução proporcional ou reagendará a entrega complementar em até 24 horas úteis sem custo adicional de frete.',
      },
    ],
  },
  privacy: {
    title: 'Política de Privacidade (LGPD)',
    badge: 'Lei 13.709/2018',
    icon: 'lock-closed-outline',
    sections: [
      {
        title: '1. Coleta e Finalidade dos Dados',
        content: 'O FlowStock coleta estritamente dados cadastrais da pessoa jurídica (CNPJ, Razão Social, Inscrição Estadual, Endereço do Estabelecimento) e dados de contato do proprietário para emissão de notas fiscais, verificação de crédito e logística de entrega.',
      },
      {
        title: '2. Consulta Serasa Experian para Crédito Faturado',
        content: 'Ao optar por compras a prazo faturadas (Boleto 15 ou 30 dias), o CNPJ do estabelecimento passa por análise automatizada de pontuação de crédito. Nenhum dado financeiro sensível é compartilhado com empresas externas que não façam parte do birô de crédito autorizado.',
      },
      {
        title: '3. Geolocalização e Rotas de Entrega',
        content: 'A localização geográfica do seu bar é utilizada exclusivamente para calcular a distância e roteirização do caminhão de entrega até a doca de descarga, sem monitoramento contínuo em segundo plano.',
      },
      {
        title: '4. Segurança e Exclusão de Dados',
        content: 'Todos os dados trafegam sob criptografia SSL/TLS. O usuário pode solicitar a anonimização ou exclusão definitiva da sua conta a qualquer momento através do suporte oficial.',
      },
    ],
  },
  terms: {
    title: 'Termos de Compra & Fornecimento B2B',
    badge: 'Contrato Padrão',
    icon: 'document-text-outline',
    sections: [
      {
        title: '1. Condições de Fornecimento B2B',
        content: 'A plataforma FlowStock atua como intermediadora digital conectando estabelecimentos comerciais (bares, restaurantes, casas noturnas) diretamente aos distribuidores e cervejarias oficiais credenciados.',
      },
      {
        title: '2. Faturamento e Pontualidade de Pagamento',
        content: 'O fornecimento faturado a prazo pressupõe adimplemento rigoroso na data de vencimento do boleto. A inadimplência acarreta suspensão imediata de novos pedidos e eventual notificação aos órgãos de proteção ao crédito.',
      },
      {
        title: '3. Regras de Descarga e Acesso',
        content: 'O estabelecimento deve garantir condições adequadas para parada do caminhão de entrega e conferência física das bebidas por colaborador autorizado.',
      },
    ],
  },
  cancellation: {
    title: 'Cancelamento e Arrependimento',
    badge: 'Direito Comercial',
    icon: 'close-circle-outline',
    sections: [
      {
        title: '1. Cancelamento Antes da Saída do Caminhão',
        content: 'Pedidos podem ser cancelados diretamente pelo aplicativo sem custo enquanto estiverem com status "Confirmado" ou "Em Separação".',
      },
      {
        title: '2. Carga em Rota',
        content: 'Uma vez despachado o caminhão com nota fiscal emitida, a recusa deve ser registrada no ato da chegada do motorista, com recusa no verso do Documento Auxiliar da Nota Fiscal Eletrônica (DANFE).',
      },
    ],
  },
};

export const PolicyDetailModal: React.FC<PolicyDetailModalProps> = ({
  visible,
  policyType,
  onClose,
}) => {
  const { theme, isDarkMode } = useApp();
  const styles = getStyles(theme, isDarkMode);

  if (!visible) return null;

  const data = POLICY_DATA[policyType] || POLICY_DATA.refund;

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
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
              <View style={styles.iconCircle}>
                <Ionicons name={data.icon} size={18} color="#FFC107" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.badgeText}>{data.badge}</Text>
                  <Text style={styles.updatedText}>• Vigente 2026</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Conteúdo das Seções */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {data.sections.map((sec, idx) => (
              <View key={idx} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                <Text style={styles.sectionContent}>{sec.content}</Text>
              </View>
            ))}

            <View style={styles.legalFooterNote}>
              <Ionicons name="shield-outline" size={14} color="#8FA0AF" style={{ marginRight: 6 }} />
              <Text style={styles.legalFooterText}>
                FlowStock Intermediação Comercial Ltda • CNPJ 45.128.902/0001-33 • São Paulo/SP
              </Text>
            </View>
          </ScrollView>

          {/* Botão Fechar */}
          <TouchableOpacity style={styles.closeFullBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeFullBtnText}>Entendi</Text>
          </TouchableOpacity>
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
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDarkMode ? '#1A2938' : '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFC107',
    },
    updatedText: {
      fontSize: 10,
      color: theme.textSecondary,
      marginLeft: 4,
    },
    closeBtn: {
      padding: 6,
    },
    scrollBody: {
      maxHeight: 460,
    },
    sectionCard: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#FFC107',
      marginBottom: 6,
    },
    sectionContent: {
      fontSize: 12,
      color: theme.text,
      lineHeight: 18,
    },
    legalFooterNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    legalFooterText: {
      fontSize: 10,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    closeFullBtn: {
      marginTop: 10,
      backgroundColor: '#FFC107',
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeFullBtnText: {
      color: '#0D1C28',
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
}
