import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';

interface PhoneMockupContainerProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const PhoneMockupContainer: React.FC<PhoneMockupContainerProps> = ({ 
  children, 
  enabled = true 
}) => {
  const { isDarkMode, theme } = useApp();
  const isWeb = Platform.OS === 'web';
  const screenWidth = Dimensions.get('window').width;

  const shouldRenderMockup = isWeb && enabled && screenWidth > 640;

  if (!shouldRenderMockup) {
    return <View style={[styles.fullscreen, { backgroundColor: theme.background }]}>{children}</View>;
  }

  return (
    <View style={[styles.webBackdrop, { backgroundColor: isDarkMode ? '#070F18' : '#EAEEF3' }]}>
      {/* Moldura de Smartphone Profissional de Nova Geração */}
      <View style={[
        styles.phoneDevice,
        {
          backgroundColor: '#0F172A',
          borderColor: isDarkMode ? '#1E293B' : '#CBD5E1',
          shadowColor: isDarkMode ? '#000000' : '#475569',
        }
      ]}>
        {/* Barra superior de status nativo sutil */}
        <View style={[styles.speakerGrill, { backgroundColor: '#334155' }]} />

        {/* Display do App */}
        <View style={[styles.screenViewport, { backgroundColor: theme.background }]}>
          {children}
        </View>

        {/* Indicador de gesto inferior */}
        <View style={styles.gestureIndicatorBox}>
          <View style={[styles.gestureBar, { backgroundColor: '#94A3B8' }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webBackdrop: {
    flex: 1,
    backgroundColor: '#070F18', // Escuro arquitetural estúdio
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    width: '100%',
  },
  phoneDevice: {
    width: 420,
    height: 870,
    backgroundColor: '#0F172A',
    borderRadius: 44,
    borderWidth: 5,
    borderColor: '#1E293B',
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 20 },
    elevation: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  speakerGrill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    zIndex: 9999,
  },
  screenViewport: {
    flex: 1,
    backgroundColor: '#0D1C28',
    paddingTop: 16,
    paddingBottom: 8,
  },
  gestureIndicatorBox: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  gestureBar: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    opacity: 0.5,
  },
});
