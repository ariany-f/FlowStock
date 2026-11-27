import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FreeTierAlertProps {
  title?: string;
  message?: string;
  type?: 'free' | 'warning' | 'info';
  onPressAction?: () => void;
  actionText?: string;
}

export const FreeTierAlert: React.FC<FreeTierAlertProps> = ({
  title = 'Plano Gratuito & Sandbox Ativo',
  message = 'O app está pronto para rodar com cota 100% gratuita (Supabase Free Tier, Google OAuth gratuito e Pix Sandbox). Serviços pagos só aplicam taxas ao faturar em produção.',
  type = 'free',
  onPressAction,
  actionText = 'Ver custos e chaves',
}) => {
  const getColors = () => {
    switch (type) {
      case 'warning':
        return {
          bg: '#FFF8E1',
          border: '#FFE082',
          iconColor: '#F57C00',
          textColor: '#E65100',
        };
      case 'info':
        return {
          bg: '#E3F2FD',
          border: '#90CAF9',
          iconColor: '#1976D2',
          textColor: '#0D47A1',
        };
      case 'free':
      default:
        return {
          bg: '#E8F5E9',
          border: '#A5D6A7',
          iconColor: '#2E7D32',
          textColor: '#1B5E20',
        };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons 
          name={type === 'free' ? 'checkmark-circle' : (type === 'warning' ? 'alert-circle' : 'information-circle')} 
          size={18} 
          color={colors.iconColor} 
        />
        <Text style={[styles.title, { color: colors.textColor }]}>{title}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      {onPressAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onPressAction} activeOpacity={0.7}>
          <Text style={[styles.actionText, { color: colors.textColor }]}>{actionText} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
    fontSize: 13,
  },
  message: {
    fontSize: 12,
    color: '#424242',
    lineHeight: 16,
  },
  actionButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
