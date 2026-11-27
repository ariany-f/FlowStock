import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ThemeColors } from '../context/AppContext';
import { AppNotification, NotificationType } from '../types';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToInvoices?: () => void;
  onNavigateToCoupons?: () => void;
}

const cleanNotificationTitle = (title: string): string => {
  return title.replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim();
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  onNavigateToOrders,
  onNavigateToInvoices,
  onNavigateToCoupons,
}) => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    clearAllNotifications,
    theme,
    isDarkMode,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'all') return true;
    return notif.type === activeFilter;
  });

  const styles = getStyles(theme, isDarkMode);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'order':
        return { name: 'cube-outline' as const, color: '#38BDF8', bg: isDarkMode ? '#0E2A3B' : '#E0F2FE' };
      case 'invoice':
        return { name: 'receipt-outline' as const, color: '#F59E0B', bg: isDarkMode ? '#2B2108' : '#FEF3C7' };
      case 'promo':
        return { name: 'flame-outline' as const, color: '#EF4444', bg: isDarkMode ? '#2D1418' : '#FEE2E2' };
      case 'bottles':
        return { name: 'repeat-outline' as const, color: '#A855F7', bg: isDarkMode ? '#241432' : '#F3E8FF' };
      case 'system':
      default:
        return { name: 'notifications-outline' as const, color: '#10B981', bg: isDarkMode ? '#0E2822' : '#D1FAE5' };
    }
  };

  const handleAction = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);
    onClose();

    if (notif.actionType === 'open_order' && onNavigateToOrders) {
      onNavigateToOrders();
    } else if (notif.actionType === 'open_invoices' && onNavigateToInvoices) {
      onNavigateToInvoices();
    } else if (notif.actionType === 'open_coupon' && onNavigateToCoupons) {
      onNavigateToCoupons();
    } else if (notif.actionType === 'open_bottles' && onNavigateToOrders) {
      onNavigateToOrders();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
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
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="notifications" size={20} color="#FFC107" />
                {unreadNotificationCount > 0 && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>{unreadNotificationCount}</Text>
                  </View>
                )}
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.title}>Notificações</Text>
                <Text style={styles.subtitle}>
                  {unreadNotificationCount > 0
                    ? `${unreadNotificationCount} não lida${unreadNotificationCount > 1 ? 's' : ''}`
                    : 'Tudo lido e em dia'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {unreadNotificationCount > 0 && (
                <TouchableOpacity
                  onPress={markAllNotificationsAsRead}
                  style={styles.markAllBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-done" size={16} color="#FFC107" style={{ marginRight: 4 }} />
                  <Text style={styles.markAllText}>Ler todas</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            {[
              { key: 'all' as const, label: 'Todas' },
              { key: 'order' as const, label: 'Pedidos' },
              { key: 'invoice' as const, label: 'Faturas' },
              { key: 'promo' as const, label: 'Ofertas' },
            ].map(chip => {
              const isActive = activeFilter === chip.key;
              return (
                <TouchableOpacity
                  key={chip.key}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveFilter(chip.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notifications Scroll List */}
          <ScrollView
            style={styles.scrollList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="notifications-off-outline" size={36} color={theme.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilter === 'all'
                    ? 'Você está em dia! Avisos de rotas de entrega e boletos faturados aparecerão aqui.'
                    : 'Nenhum alerta encontrado para o filtro selecionado.'}
                </Text>
              </View>
            ) : (
              filteredNotifications.map(notif => {
                const iconInfo = getNotificationIcon(notif.type);
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      styles.notifCard,
                      !notif.read && styles.notifCardUnread,
                    ]}
                    onPress={() => markNotificationAsRead(notif.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.notifIconBox, { backgroundColor: iconInfo.bg }]}>
                      <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
                    </View>

                    <View style={styles.notifBody}>
                      <View style={styles.notifHeaderRow}>
                        <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={1}>
                          {cleanNotificationTitle(notif.title)}
                        </Text>
                        <Text style={styles.notifTime}>{notif.timestamp}</Text>
                      </View>

                      <Text style={styles.notifMessage}>{notif.message}</Text>

                      {/* Action Button Row */}
                      <View style={styles.notifFooterRow}>
                        {notif.actionText && (
                          <TouchableOpacity
                            style={styles.notifActionBtn}
                            onPress={() => handleAction(notif)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.notifActionBtnText, { color: isDarkMode ? '#FFFFFF' : '#0D1C28' }]}>{notif.actionText}</Text>
                            <Ionicons name="arrow-forward" size={12} color={isDarkMode ? '#FFFFFF' : '#0D1C28'} style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.dismissBtn}
                          onPress={() => clearNotification(notif.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={14} color={theme.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Unread yellow dot indicator */}
                    {!notif.read && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                );
              })
            )}

            {filteredNotifications.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllBtn}
                onPress={clearAllNotifications}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-bin-outline" size={15} color={theme.textMuted} style={{ marginRight: 6 }} />
                <Text style={styles.clearAllText}>Limpar todas as notificações</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
};

function getStyles(theme: ThemeColors, isDarkMode: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    modalContent: {
      backgroundColor: isDarkMode ? '#0F1E2C' : '#FFFFFF',
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 24,
      maxHeight: '88%',
      width: '100%',
      maxWidth: 480,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1E3244' : '#E2E8F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 12,
    },
    dragHandle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDarkMode ? '#22384C' : '#CBD5E1',
      alignSelf: 'center',
      marginBottom: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#172C3F' : '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    headerBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#EF4444',
      borderRadius: 9,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: isDarkMode ? '#0F1E2C' : '#FFFFFF',
    },
    headerBadgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#FFFFFF',
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
    markAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#172C3F' : '#FEF3C7',
    },
    markAllText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: isDarkMode ? '#FFC107' : '#B45309',
    },
    closeBtn: {
      padding: 6,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#152838' : '#F1F5F9',
    },
    filterChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: isDarkMode ? '#142535' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDarkMode ? '#1E354A' : '#E2E8F0',
    },
    filterChipActive: {
      backgroundColor: '#FFC107',
      borderColor: '#FFC107',
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    filterChipTextActive: {
      color: '#0D1C28',
      fontWeight: 'bold',
    },
    scrollList: {
      marginTop: 6,
    },
    scrollContent: {
      paddingTop: 8,
      paddingBottom: 24,
    },
    notifCard: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#142535' : '#F8FAFC',
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1B3145' : '#E2E8F0',
      position: 'relative',
    },
    notifCardUnread: {
      borderColor: '#F59E0B',
      backgroundColor: isDarkMode ? '#182D40' : '#FFFDF7',
    },
    notifIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    notifBody: {
      flex: 1,
    },
    notifHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    notifTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
      marginRight: 8,
    },
    notifTitleUnread: {
      fontWeight: 'bold',
      color: isDarkMode ? '#FFFFFF' : '#0F172A',
    },
    notifTime: {
      fontSize: 11,
      color: theme.textMuted,
    },
    notifMessage: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
      marginBottom: 10,
    },
    notifFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    notifActionBtn: {
      backgroundColor: '#FFC107',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 7,
    },
    notifActionBtnText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#0D1C28',
    },
    dismissBtn: {
      padding: 4,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FFC107',
      position: 'absolute',
      top: 14,
      right: 14,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: isDarkMode ? '#142535' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    clearAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 6,
      borderRadius: 10,
      backgroundColor: isDarkMode ? '#112232' : '#F1F5F9',
    },
    clearAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
    },
  });
}
