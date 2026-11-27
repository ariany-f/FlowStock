import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface EnterpriseHeaderProps {
  isPhoneFrameActive: boolean;
  onTogglePhoneFrame: () => void;
}

export const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({
  isPhoneFrameActive,
  onTogglePhoneFrame,
}) => {
  const { currentUser, switchUserRole } = useApp();

  const modules: { role: UserRole; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; urlParam: string }[] = [
    { role: 'bar_owner', title: 'App do Bar', subtitle: 'Cliente Multi-Bar', icon: 'beer-outline', urlParam: 'bar' },
    { role: 'supplier', title: 'Distribuidor', subtitle: 'Portal Ambev & Cervejarias', icon: 'cube-outline', urlParam: 'supplier' },
    { role: 'driver', title: 'Logística & Frota', subtitle: 'App do Caminhão', icon: 'navigate-outline', urlParam: 'driver' },
    { role: 'admin', title: 'Admin Master', subtitle: 'Controle Geral & Bares', icon: 'shield-checkmark-outline', urlParam: 'admin' },
  ];

  const handleSwitchModule = (m: typeof modules[0]) => {
    switchUserRole(m.role);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('app', m.urlParam);
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <View style={styles.container}>
      {/* Lado Esquerdo: Marca FlowStock com Logo Oficial */}
      <View style={styles.brandRow}>
        <Image 
          source={require('../../assets/brand/logo.png')} 
          style={styles.officialLogo}
          resizeMode="contain"
        />
        <View>
          <View style={styles.logoTitleRow}>
            <Text style={styles.brandName}>FLOW<Text style={styles.brandNameAccent}>STOCK</Text></Text>
            <View style={styles.b2bTag}>
              <Text style={styles.b2bTagText}>B2B BEV</Text>
            </View>
          </View>
          <Text style={styles.brandTagline}>Rede Integrada de Bebidas para Bares</Text>
        </View>
      </View>

      {/* Centro: Switcher de Módulos */}
      <View style={styles.modulesNav}>
        {modules.map(mod => {
          const isActive = currentUser?.role === mod.role;
          return (
            <TouchableOpacity
              key={mod.role}
              style={[styles.moduleTab, isActive && styles.moduleTabActive]}
              onPress={() => handleSwitchModule(mod)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={mod.icon} 
                size={15} 
                color={isActive ? '#FFFFFF' : '#94A3B8'} 
              />
              <View>
                <Text style={[styles.moduleTitle, isActive && styles.moduleTitleActive]}>
                  {mod.title}
                </Text>
              </View>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lado Direito: Controles & Modo de Visualização */}
      <View style={styles.rightActions}>
        <View style={styles.statusPill}>
          <View style={styles.greenPulse} />
          <Text style={styles.statusPillText}>SISTEMA ATIVO</Text>
        </View>

        {Platform.OS === 'web' && (
          <TouchableOpacity 
            style={styles.viewModeBtn}
            onPress={onTogglePhoneFrame}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isPhoneFrameActive ? "expand" : "phone-portrait"} 
              size={14} 
              color="#CBD5E1" 
            />
            <Text style={styles.viewModeBtnText}>
              {isPhoneFrameActive ? 'Tela Cheia' : 'Moldura Mobile'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B192C',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  officialLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EA1D2C', // Vermelho FlowStock
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandNameAccent: {
    color: '#F59E0B', // Dourado
  },
  b2bTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  b2bTagText: {
    color: '#F59E0B',
    fontSize: 8,
    fontWeight: 'bold',
  },
  brandTagline: {
    fontSize: 10,
    color: '#94A3B8',
  },
  modulesNav: {
    flexDirection: 'row',
    backgroundColor: '#112238',
    borderRadius: 10,
    padding: 3,
    gap: 2,
    borderWidth: 1,
    borderColor: '#1E3552',
  },
  moduleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  moduleTabActive: {
    backgroundColor: '#EA1D2C', // Vermelho ativo profissional
  },
  moduleTitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  moduleTitleActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginLeft: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  viewModeBtnText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
});
