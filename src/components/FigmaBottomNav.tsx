import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface FigmaBottomNavProps {
  currentTab: 'home' | 'favorites' | 'orders' | 'menu';
  onSelectTab: (tab: 'home' | 'favorites' | 'orders' | 'menu') => void;
  onOpenCart: () => void;
  cartCount: number;
  invoiceBadgeCount?: number;
}

export const FigmaBottomNav: React.FC<FigmaBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCart,
  cartCount,
  invoiceBadgeCount = 0,
}) => {
  const { theme } = useApp();
  const unselectedColor = '#8FA0AF';

  return (
    <View style={styles.wrapper}>
      {/* Notch Cutout de Fundo que simula a curvatura côncava exata do Figma */}
      <View style={styles.notchCutout}>
        <View style={[styles.notchCircle, { backgroundColor: theme.background }]} />
      </View>

      {/* Barra de Navegação Horizontal Fiel ao Figma (sempre Dark Navy Blue) */}
      <View style={[
        styles.navBar,
        {
          backgroundColor: '#162838',
          borderTopColor: '#1E354A',
          ...(Platform.OS === 'web' ? { boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25)' } : {}),
        }
      ]}>
        {/* 1. Home (Casa) */}
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => onSelectTab('home')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="home" 
            size={22} 
            color={currentTab === 'home' ? '#FFC107' : unselectedColor} 
          />
        </TouchableOpacity>

        {/* 2. Favoritos (Coração Amarelo Dourado quando ativo) */}
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => onSelectTab('favorites')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="heart" 
            size={22} 
            color={currentTab === 'favorites' ? '#FFC107' : unselectedColor} 
          />
        </TouchableOpacity>

        {/* Espaço Central Vazio para o Notch Cutout e FAB */}
        <View style={styles.centerGap} />

        {/* 4. Sacola / Pedidos (Bolsa Amarela Dourada quando ativa) */}
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => onSelectTab('orders')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="bag-handle" 
            size={22} 
            color={currentTab === 'orders' ? '#FFC107' : unselectedColor} 
          />
        </TouchableOpacity>

        {/* 5. Menu Hambúrguer (3 Barras Horizontais Amarelas quando ativo - Figma) */}
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => onSelectTab('menu')}
          activeOpacity={0.7}
        >
          <View style={{ position: 'relative' }}>
            <Ionicons 
              name="menu" 
              size={24} 
              color={currentTab === 'menu' ? '#FFC107' : unselectedColor} 
            />
            {invoiceBadgeCount > 0 && (
              <View style={styles.menuBadgeDot}>
                <Text style={styles.menuBadgeDotText}>{invoiceBadgeCount > 9 ? '9+' : invoiceBadgeCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Botão Central Flutuante do Carrinho (FAB no Notch do Figma) */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity 
          style={[
            styles.fabButton,
            {
              backgroundColor: '#273E52',
              borderColor: '#102232',
            }
          ]}
          onPress={onOpenCart}
          activeOpacity={0.85}
        >
          <Ionicons name="cart" size={24} color="#CBD5E1" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    backgroundColor: 'transparent',
    width: '100%',
  },
  notchCutout: {
    position: 'absolute',
    top: -22,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  notchCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0D1C28', // Mesma cor do fundo da página para o recorte perfeito do Figma
  },
  navBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#162838', // Tom exato do mockup Figma
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E354A',
    zIndex: 2,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerGap: {
    width: 68,
  },
  fabWrapper: {
    position: 'absolute',
    top: -24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#273E52', // Tom azul elevado do botão Figma
    borderWidth: 4,
    borderColor: '#102232',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
        cursor: 'pointer',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFC107',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#0D1C28',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuBadgeDot: {
    position: 'absolute',
    top: -4,
    right: -7,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#162838',
  },
  menuBadgeDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
