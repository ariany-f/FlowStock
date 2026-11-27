import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

interface LocationHeaderSelectorProps {
  onPress?: () => void;
  maxLen?: number;
  textColor?: string;
}

export const LocationHeaderSelector: React.FC<LocationHeaderSelectorProps> = ({ 
  onPress,
  maxLen = 22,
  textColor,
}) => {
  const { 
    selectedBar, 
    isUsingDeviceLocation, 
    userLocation, 
    theme,
    currentUser 
  } = useApp();

  const activeColor = textColor || theme.text;

  const truncate = (text: string, len: number): string => {
    if (!text) return '';
    const trimmed = text.trim();
    if (trimmed.length <= len) return trimmed;
    return trimmed.substring(0, len).trim() + '...';
  };

  const rawTitle = isUsingDeviceLocation
    ? (userLocation?.street 
        ? `${userLocation.street}${userLocation.number ? `, ${userLocation.number}` : ''}`
        : (userLocation?.address || (userLocation?.neighborhood ? `${userLocation.neighborhood}, ${userLocation.city || 'SP'}` : 'Minha Localização')))
    : (selectedBar ? selectedBar.name.split(' - ')[0] : (currentUser ? 'Conectar Bar' : 'Minha Localização'));

  const displayTitle = truncate(rawTitle, maxLen);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
    >
      <Ionicons 
        name={isUsingDeviceLocation ? "navigate" : "storefront"} 
        size={16} 
        color="#FFC107" 
        style={{ marginRight: 6 }} 
      />
      <Text 
        style={[styles.title, { color: activeColor }]} 
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {displayTitle}
      </Text>
      <Ionicons name="caret-down" size={14} color={activeColor} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
});
