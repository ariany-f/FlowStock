import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface RoleSwitcherProps {
  onTogglePhoneFrame?: () => void;
  isPhoneFrameActive?: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ 
  onTogglePhoneFrame,
  isPhoneFrameActive = true 
}) => {
  const { currentUser, switchUserRole } = useApp();

  const roles: { role: UserRole; label: string; icon: keyof typeof Ionicons.glyphMap; urlParam: string }[] = [
    { role: 'bar_owner', label: 'App do Bar', icon: 'beer', urlParam: 'bar' },
    { role: 'supplier', label: 'Distribuidor', icon: 'cube', urlParam: 'supplier' },
    { role: 'driver', label: 'Entregador (Caminhão)', icon: 'bus', urlParam: 'driver' },
    { role: 'admin', label: 'Painel Master', icon: 'shield-checkmark', urlParam: 'admin' },
  ];

  const handleSelectRole = (r: typeof roles[0]) => {
    switchUserRole(r.role);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('app', r.urlParam);
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.leftBox}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>PAINÉIS DE ACESSO</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          {roles.map(r => {
            const isActive = currentUser?.role === r.role;
            return (
              <TouchableOpacity
                key={r.role}
                style={[styles.roleButton, isActive && styles.activeButton]}
                onPress={() => handleSelectRole(r)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={r.icon}
                  size={13}
                  color={isActive ? '#1A2B3C' : '#9CA3AF'}
                />
                <Text style={[styles.roleText, isActive && styles.activeText]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Botão de Alternar Moldura de Celular na Web */}
        {Platform.OS === 'web' && onTogglePhoneFrame && (
          <TouchableOpacity 
            style={styles.frameToggleBtn} 
            onPress={onTogglePhoneFrame}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isPhoneFrameActive ? "expand-outline" : "phone-portrait-outline"} 
              size={16} 
              color="#FFD700" 
            />
            <Text style={styles.frameToggleText}>
              {isPhoneFrameActive ? 'Expandir' : 'Molde Celular'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0F1A24',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2B3C',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  leftBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#1E2D3D',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonGroup: {
    flexDirection: 'row',
    backgroundColor: '#162330',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeButton: {
    backgroundColor: '#FFD700', // Dourado App Bebidas
  },
  roleText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  activeText: {
    color: '#1A2B3C',
    fontWeight: 'bold',
  },
  frameToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E2D3D',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  frameToggleText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
  },
});
