import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { AppLanguage, SUPPORTED_LANGUAGES, LanguageOption } from '../utils/translations';

interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

const FlagRenderer: React.FC<{ code: AppLanguage; isDarkMode: boolean }> = ({ code, isDarkMode }) => {
  if (code === 'pt') {
    return (
      <View style={flagStyles.box}>
        <View style={flagStyles.brContainer}>
          <View style={flagStyles.brDiamond} />
          <View style={flagStyles.brCircle} />
        </View>
      </View>
    );
  }
  if (code === 'en') {
    return (
      <View style={flagStyles.box}>
        <View style={flagStyles.usContainer}>
          <View style={flagStyles.usStripe} />
          <View style={flagStyles.usStripe} />
          <View style={flagStyles.usStripe} />
          <View style={flagStyles.usCanton}>
            <Text style={flagStyles.usStar}>★</Text>
          </View>
        </View>
      </View>
    );
  }
  if (code === 'es') {
    return (
      <View style={flagStyles.box}>
        <View style={flagStyles.esContainer}>
          <View style={flagStyles.esRedStripe} />
          <View style={flagStyles.esYellowStripe}>
            <View style={flagStyles.esShield} />
          </View>
          <View style={flagStyles.esRedStripe} />
        </View>
      </View>
    );
  }
  return (
    <View style={flagStyles.box}>
      <Ionicons name="globe-outline" size={20} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
    </View>
  );
};

const LanguageSelectorContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { language, setLanguage, theme, isDarkMode, t } = useApp();
  const styles = useMemo(() => getStyles(theme, isDarkMode), [theme, isDarkMode]);
  const [selected, setSelected] = useState<AppLanguage>(language);

  const handleSelect = (code: AppLanguage) => {
    setSelected(code);
  };

  const handleSave = async () => {
    await setLanguage(selected);
    onClose();
  };

  return (
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.headerIconCircle, { backgroundColor: isDarkMode ? '#1E354A' : '#FEF3C7' }]}>
              <Ionicons name="globe" size={20} color="#FFC107" />
            </View>
            <View>
              <Text style={styles.title}>{t('selectLanguage', 'Selecionar Idioma')}</Text>
              <Text style={styles.subtitle}>
                {t('language', 'Idioma')} / Language / Idioma
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
          </TouchableOpacity>
        </View>

        {/* Lista de Opções de Idioma */}
        <View style={styles.body}>
          {SUPPORTED_LANGUAGES.map((item: LanguageOption) => {
            const isChosen = selected === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.langCard,
                  isChosen && styles.langCardSelected,
                ]}
                onPress={() => handleSelect(item.code)}
                activeOpacity={0.8}
              >
                <FlagRenderer code={item.code} isDarkMode={isDarkMode} />

                <View style={styles.langInfo}>
                  <Text
                    style={[
                      styles.langName,
                      isChosen && styles.langNameSelected,
                    ]}
                  >
                    {item.nativeName}
                  </Text>
                  <Text style={styles.langSub}>{item.name}</Text>
                </View>

                <View style={styles.badgeBox}>
                  <Text
                    style={[
                      styles.badgeText,
                      isChosen && styles.badgeTextSelected,
                    ]}
                  >
                    {item.badge}
                  </Text>
                </View>

                <View style={styles.radioBox}>
                  <Ionicons
                    name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isChosen ? '#FFC107' : (isDarkMode ? '#FFFFFF' : '#0D1C28')}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer com Ações */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>{t('cancel', 'Cancelar')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-sharp" size={18} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginRight: 6 }} />
            <Text style={styles.confirmBtnText}>{t('confirm', 'Confirmar')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableOpacity>
  );
};

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <LanguageSelectorContent onClose={onClose} />
    </Modal>
  );
};

function getStyles(theme: ThemeColors, isDarkMode: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 18,
      backgroundColor: isDarkMode ? '#172738' : '#F1F5F9',
    },
    body: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 10,
    },
    langCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#0D1C28' : '#F8FAFC',
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    langCardSelected: {
      borderColor: '#FFC107',
      backgroundColor: isDarkMode ? '#172738' : '#FEF3C7',
    },
    flagEmoji: {
      fontSize: 28,
      marginRight: 14,
    },
    langInfo: {
      flex: 1,
    },
    langName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    langNameSelected: {
      color: isDarkMode ? '#FFC107' : '#92400E',
      fontWeight: '700',
    },
    langSub: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
    },
    badgeBox: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: isDarkMode ? '#1E354A' : '#E2E8F0',
      marginRight: 12,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#0D1C28',
    },
    badgeTextSelected: {
      color: isDarkMode ? '#FFC107' : '#92400E',
    },
    radioBox: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 12,
      backgroundColor: theme.surface,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDarkMode ? '#172738' : '#F1F5F9',
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    confirmBtn: {
      flex: 1.6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#1D3B56' : '#FFC107',
      borderWidth: isDarkMode ? 1 : 0,
      borderColor: isDarkMode ? '#FFC107' : 'transparent',
    },
    confirmBtnText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#0D1C28',
    },
  });
}

const flagStyles = StyleSheet.create({
  box: {
    width: 38,
    height: 26,
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  // Brazil
  brContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#009739',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brDiamond: {
    width: 24,
    height: 16,
    backgroundColor: '#FEDD00',
    transform: [{ rotate: '45deg' }, { scaleX: 1.1 }, { scaleY: 0.75 }],
  },
  brCircle: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#012169',
  },
  // USA
  usContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#B22234',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  usStripe: {
    height: 3.5,
    backgroundColor: '#FFFFFF',
    marginTop: 3,
  },
  usCanton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 15,
    height: 13,
    backgroundColor: '#3C3B6E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usStar: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    lineHeight: 9,
  },
  // Spain
  esContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  esRedStripe: {
    flex: 1,
    backgroundColor: '#AA151B',
  },
  esYellowStripe: {
    flex: 2,
    backgroundColor: '#F1BF00',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  esShield: {
    width: 4,
    height: 6,
    backgroundColor: '#AA151B',
    borderRadius: 1,
  },
});
