import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BeverageProduct } from '../types';
import { useApp, ThemeColors } from '../context/AppContext';
import { getProductImage } from '../utils/productImages';
import { LocationHeaderSelector } from '../components/LocationHeaderSelector';

interface ProductDetailScreenProps {
  product: BeverageProduct;
  onBack: () => void;
  onOpenCart: () => void;
  onOpenMyBars?: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  product,
  onBack,
  onOpenCart,
  onOpenMyBars,
}) => {
  const { products, addToCart, isDarkMode, theme } = useApp();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [quantity, setQuantity] = useState(1);

  // Produtos para a seção "Que tal pedir também?" do Figma 123:481
  const relatedItems = [
    { 
      id: 'rel_schneider', 
      name: 'Schneider - 600ml', 
      price: 6.80, 
      img: getProductImage('schneider'),
      brand: 'Schneider' 
    },
    { 
      id: 'rel_brahma', 
      name: 'Brahma - 350ml', 
      price: 4.80, 
      img: getProductImage('brahma'),
      brand: 'Brahma' 
    },
    { 
      id: 'rel_kaiser', 
      name: 'Kaiser - 350ml', 
      price: 4.60, 
      img: getProductImage('corona'),
      brand: 'Kaiser' 
    },
    { 
      id: 'rel_eisenbahn', 
      name: 'Eisenbahn - 350ml', 
      price: 6.60, 
      img: getProductImage('eisenbahn'),
      brand: 'Eisenbahn' 
    },
    { 
      id: 'rel_heineken', 
      name: 'Heineken - 600ml', 
      price: 7.70, 
      img: getProductImage('heineken'),
      brand: 'Heineken' 
    },
  ];

  const handleAddPack = (extra: number) => {
    setQuantity(prev => prev + extra);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onOpenCart();
  };

  const totalCalculated = product.price * quantity;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar Exata do Figma 123:481: Seta Voltar, Bar 01 ▼, Três Pontos */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.barCenterContainer}>
          <LocationHeaderSelector onPress={onOpenMyBars} />
        </View>

        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => {
            Alert.alert('Opções do Produto', `${product.name} • ${product.supplierName}`, [
              { text: 'Ver Catálogo do Fornecedor', onPress: onBack },
              { text: 'Fechar', style: 'cancel' }
            ]);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Garrafa Hero Centralizada Flutuando em Fundo Escuro Limpo sem Caixa Arredondada (Figma 123:481) */}
        <View style={styles.heroImgBox}>
          <Image 
            source={getProductImage(product)} 
            style={styles.heroImg}
            resizeMode="contain"
          />
        </View>

        {/* Seção Inferior de Informações (Figma 123:481) */}
        <View style={styles.infoSection}>
          {/* Preço em Destaque Branco */}
          <Text style={styles.priceText}>
            R${product.price.toFixed(2).replace('.', ',')}
          </Text>

          {/* Nome e Volume do Produto */}
          <Text style={styles.productName}>
            {product.name}
          </Text>

          {/* Stepper Retangular de Largura Total [-] 1 [+] */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnText}>-</Text>
            </TouchableOpacity>

            <Text style={styles.stepperValText}>{quantity}</Text>

            <TouchableOpacity 
              style={styles.stepperBtn} 
              onPress={() => setQuantity(quantity + 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Pílulas de Incremento Rápido: [+ 6 un.] [+ 12 un.] [+ 15 un.] */}
          <View style={styles.pillsRow}>
            {[6, 12, 15].map(pack => (
              <TouchableOpacity
                key={pack}
                style={styles.packPill}
                onPress={() => handleAddPack(pack)}
                activeOpacity={0.8}
              >
                <Text style={styles.packPillText}>+ {pack} un.</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Seção: Que tal pedir também? */}
          <Text style={styles.relatedHeading}>Que tal pedir também?</Text>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.relatedScroll}
          >
            {relatedItems.map(item => {
              const matchedProd = products.find(p => p.brand.toLowerCase() === item.brand.toLowerCase()) || product;

              return (
                <View key={item.id} style={styles.relatedCard}>
                  {/* Botão Amarelo Circular no Canto Superior Direito com Ícone + Preto */}
                  <TouchableOpacity 
                    style={styles.relatedAddBtn}
                    onPress={() => {
                      addToCart(matchedProd, 1);
                      Alert.alert('Adicionado!', `${item.name} foi adicionado à sua sacola.`);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={18} color={isDarkMode ? "#FFFFFF" : "#0D1C28"} />
                  </TouchableOpacity>

                  {/* Garrafa sem caixa de fundo */}
                  <View style={styles.relatedImgBox}>
                    <Image source={item.img} style={styles.relatedImg} resizeMode="contain" />
                  </View>

                  <Text style={styles.relatedPrice}>R${item.price.toFixed(2).replace('.', ',')}</Text>
                  <Text style={styles.relatedName} numberOfLines={1}>{item.name}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Botão Inferior CTA Amarelo Fiel ao Figma 123:481: Adicionar (1) R$5,00 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>
            Adicionar ({quantity}) R${totalCalculated.toFixed(2).replace('.', ',')}
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 24,
  },
  heroImgBox: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: theme.background,
  },
  heroImg: {
    width: 140,
    height: 220,
  },
  infoSection: {
    backgroundColor: isDarkMode ? '#07131D' : '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 24,
    minHeight: 440,
    borderTopLeftRadius: isDarkMode ? 0 : 24,
    borderTopRightRadius: isDarkMode ? 0 : 24,
  },
  priceText: {
    color: theme.text,
    fontSize: 26,
    fontWeight: '900',
  },
  productName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 20,
    marginBottom: 14,
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepperBtnText: {
    color: theme.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  stepperValText: {
    color: theme.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24,
  },
  packPill: {
    flex: 1,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  packPillText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  relatedHeading: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  relatedScroll: {
    gap: 12,
    paddingRight: 10,
  },
  relatedCard: {
    width: 110,
    height: 155,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 10,
    position: 'relative',
    justifyContent: 'space-between',
    borderWidth: isDarkMode ? 0 : 1,
    borderColor: theme.border,
  },
  relatedAddBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFC107',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  relatedImgBox: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  relatedImg: {
    width: 38,
    height: 74,
  },
  relatedPrice: {
    color: theme.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  relatedName: {
    color: theme.textSecondary,
    fontSize: 11,
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
  },
  });
}
