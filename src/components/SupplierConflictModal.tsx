import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';

const { width } = Dimensions.get('window');

export const SupplierConflictModal: React.FC = () => {
  const { 
    supplierConflict, 
    resolveSupplierConflict, 
    isDarkMode, 
    theme 
  } = useApp();

  if (!supplierConflict) return null;

  const { pendingProduct, pendingQuantity, currentSupplierName, newSupplierName } = supplierConflict;
  const thumbKey = pendingProduct.name.toLowerCase().includes('chopp') 
    ? 'keg_inox' 
    : pendingProduct.brand.toLowerCase();
  const imgSrc = getProductImage(thumbKey);

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={() => resolveSupplierConflict(false)}
    >
      <TouchableWithoutFeedback onPress={() => resolveSupplierConflict(false)}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[
              styles.card,
              { 
                backgroundColor: isDarkMode ? '#0A1C2C' : '#FFFFFF',
                borderColor: isDarkMode ? '#1E3C58' : '#E2E8F0'
              }
            ]}>
              {/* ÍCONE DE ALERTA DE FORNECEDOR */}
              <View style={[
                styles.iconCircle,
                { backgroundColor: isDarkMode ? '#1A334B' : '#FEF3C7' }
              ]}>
                <Ionicons name="storefront-outline" size={32} color="#FFC107" />
              </View>

              {/* TÍTULO PRINCIPAL */}
              <Text style={[styles.title, { color: theme.text }]}>
                Apenas 1 Fornecedor por Pedido
              </Text>

              {/* MENSAGEM EXPLICATIVA */}
              <Text style={[styles.message, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                Sua sacola atual contém itens de:{'\n'}
                <Text style={{ fontWeight: 'bold', color: theme.text }}>
                  {currentSupplierName}
                </Text>
              </Text>

              <Text style={[styles.submessage, { color: isDarkMode ? '#7D92A6' : '#94A3B8' }]}>
                Como cada distribuidora despacha seu próprio caminhão de entrega, você deve fechar um pedido por vez.
              </Text>

              {/* CAIXA DE PREVIEW DO NOVO ITEM */}
              <View style={[
                styles.previewBox,
                { 
                  backgroundColor: isDarkMode ? '#102438' : '#F8FAFC',
                  borderColor: isDarkMode ? '#224464' : '#E2E8F0'
                }
              ]}>
                <View style={styles.previewThumbBox}>
                  <Image source={imgSrc} style={styles.previewThumb} resizeMode="contain" />
                </View>

                <View style={styles.previewInfo}>
                  <Text style={[styles.previewNewSup, { color: '#FFC107' }]} numberOfLines={1}>
                    Novo: {newSupplierName}
                  </Text>
                  <Text style={[styles.previewProdName, { color: theme.text }]} numberOfLines={1}>
                    {pendingProduct.name}
                  </Text>
                  <Text style={[styles.previewProdMeta, { color: isDarkMode ? '#8CA0B3' : '#64748B' }]}>
                    {pendingQuantity}x R$ {pendingProduct.price.toFixed(2).replace('.', ',')} • {pendingProduct.unit}
                  </Text>
                </View>
              </View>

              <Text style={[styles.questionText, { color: theme.text }]}>
                Deseja <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>esvaziar a sacola atual</Text> e iniciar seu pedido com esta nova distribuidora?
              </Text>

              {/* BOTÕES DE AÇÃO */}
              <View style={styles.buttonCol}>
                {/* Botão Primário: Esvaziar e Trocar */}
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => resolveSupplierConflict(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="trash-outline" size={18} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6 }} />
                  <Text style={[styles.confirmBtnText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>
                    Esvaziar sacola e trocar
                  </Text>
                </TouchableOpacity>

                {/* Botão Secundário: Manter Sacola Atual */}
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    { 
                      backgroundColor: isDarkMode ? '#13283B' : '#F1F5F9',
                      borderColor: isDarkMode ? '#234462' : '#CBD5E1'
                    }
                  ]}
                  onPress={() => resolveSupplierConflict(false)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.text }]}>
                    Manter sacola atual de {currentSupplierName}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: Math.min(width - 32, 420),
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 6,
  },
  submessage: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  previewBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewThumbBox: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  previewInfo: {
    flex: 1,
    marginLeft: 10,
  },
  previewNewSup: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  previewProdName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 1,
  },
  previewProdMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  questionText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  buttonCol: {
    width: '100%',
    gap: 10,
  },
  confirmBtn: {
    backgroundColor: '#FFC107',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#0A1926',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
