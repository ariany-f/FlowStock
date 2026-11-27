import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../types';
import { useApp } from '../context/AppContext';

interface PixPaymentModalProps {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  order,
  visible,
  onClose,
  onPaymentSuccess,
}) => {
  const { confirmOrderPayment, isDarkMode } = useApp();
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 min
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
      setSecondsLeft(600);
      setCopied(false);
    };
  }, [visible]);

  if (!order) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyPix = () => {
    setCopied(true);
    Alert.alert('Copiado!', 'Código Pix Copia e Cola copiado para a área de transferência.');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulatePayment = () => {
    setIsSimulating(true);
    setTimeout(() => {
      confirmOrderPayment(order.id);
      setIsSimulating(false);
      Alert.alert(
        '🎉 Pagamento Pix Confirmado!',
        'O fornecedor já recebeu a confirmação do pagamento e seu pedido entrou em preparação.'
      );
      onPaymentSuccess();
    }, 1200);
  };

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
            <View>
              <Text style={styles.title}>Pagamento via Pix</Text>
              <Text style={styles.subtitle}>Pedido: {order.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Tag Sandbox / Gratuito */}
            <View style={styles.sandboxTag}>
              <Ionicons name="flash" size={14} color="#2E7D32" />
              <Text style={styles.sandboxText}>MODO TESTE / SANDBOX GRATUITO ATIVO</Text>
            </View>

            {/* Valor */}
            <Text style={styles.valueLabel}>Valor a pagar:</Text>
            <Text style={styles.valueText}>
              R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Text>

            {/* Simulação Visual do QR Code */}
            <View style={styles.qrContainer}>
              <View style={styles.qrMock}>
                <Ionicons name="qr-code-outline" size={120} color="#111827" />
              </View>
              <Text style={styles.timerText}>
                <Ionicons name="time-outline" size={14} color="#E65100" /> Expira em: {formatTime(secondsLeft)}
              </Text>
            </View>

            {/* Copia e Cola */}
            <View style={styles.pixCodeBox}>
              <Text style={styles.pixCodeText} numberOfLines={2}>
                {order.pixCode || '00020126580014br.gov.bcb.pix...'}
              </Text>
              <TouchableOpacity 
                style={[styles.copyButton, copied && styles.copiedButton]} 
                onPress={handleCopyPix}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={copied ? "checkmark" : "copy-outline"} 
                  size={16} 
                  color="#FFFFFF" 
                />
                <Text style={styles.copyButtonText}>
                  {copied ? 'Copiado!' : 'Copiar Pix'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.instructionsBox}>
              <Text style={styles.instTitle}>Como pagar:</Text>
              <Text style={styles.instStep}>1. Abra o app do banco da conta jurídica do seu Bar</Text>
              <Text style={styles.instStep}>2. Escolha pagar via Pix {'>'} Pix Copia e Cola</Text>
              <Text style={styles.instStep}>3. Cole o código acima e confirme a transferência</Text>
            </View>

            {/* Botão de Simulação Instantânea */}
            <TouchableOpacity 
              style={styles.simulateButton} 
              onPress={handleSimulatePayment}
              disabled={isSimulating}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
              <Text style={styles.simulateButtonText}>
                {isSimulating ? 'Confirmando no Banco Central...' : 'Simular Confirmação Pix Instantânea'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  subtitle: {
    fontSize: 12,
    color: '#757575',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
    alignItems: 'center',
  },
  sandboxTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  sandboxText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  valueLabel: {
    fontSize: 12,
    color: '#666',
  },
  valueText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#00875F', // Verde Pix
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrMock: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  timerText: {
    marginTop: 8,
    fontSize: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  pixCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pixCodeText: {
    flex: 1,
    fontSize: 11,
    color: '#4B5563',
    marginRight: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00875F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copiedButton: {
    backgroundColor: '#1E293B',
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  instTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  instStep: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EA1D2C',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
  },
  simulateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
