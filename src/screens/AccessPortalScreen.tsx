import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandLogo } from '../components/BrandLogo';

interface AccessPortalScreenProps {
  onNavigateToApp: (app: 'bar' | 'supplier' | 'driver' | 'admin') => void;
}

export const AccessPortalScreen: React.FC<AccessPortalScreenProps> = ({ onNavigateToApp }) => {
  const portals = [
    {
      id: 'bar' as const,
      title: 'App do Bar (Cliente B2B)',
      description: 'Gestão multi-bar, catálogo de bebidas com preços de atacado, pedido mínimo e faturamento em 30 dias.',
      badge: 'CLIENTE',
      badgeColor: '#EA1D2C',
      icon: 'beer-outline' as const,
      urlHint: 'http://localhost:8081/?app=bar',
    },
    {
      id: 'supplier' as const,
      title: 'Portal do Fornecedor / Distribuidor',
      description: 'Gestão de pedidos recebidos dos bares, avanço de etapas de separação, controle de estoque e catálogo.',
      badge: 'DISTRIBUIDORA',
      badgeColor: '#F59E0B',
      icon: 'cube-outline' as const,
      urlHint: 'http://localhost:8081/?app=supplier',
    },
    {
      id: 'driver' as const,
      title: 'App do Entregador (Frota & Caminhão)',
      description: 'Manifesto de entrega do dia nos bares, romaneio de carga, GPS Waze/Maps e recolhimento de barris vazios.',
      badge: 'LOGÍSTICA',
      badgeColor: '#2563EB',
      icon: 'navigate-outline' as const,
      urlHint: 'http://localhost:8081/?app=driver',
    },
    {
      id: 'admin' as const,
      title: 'Painel Master Geral de Gestão',
      description: 'Aprovação de bares e donos de bares, limites de crédito, credenciamento de distribuidores e métricas.',
      badge: 'ADMIN MASTER',
      badgeColor: '#10B981',
      icon: 'shield-checkmark-outline' as const,
      urlHint: 'http://localhost:8081/?app=admin',
    },
  ];

  const handleSelectPortal = (appId: 'bar' | 'supplier' | 'driver' | 'admin') => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign(`?app=${appId}`);
    } else {
      onNavigateToApp(appId);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Central com a Logo e a Frase Oficial do App Bebidas */}
        <View style={styles.logoHeader}>
          <BrandLogo size="hero" variant="dark" showPhrase={true} />
          <Text style={styles.portalSubTitle}>Plataforma Integrada B2B de Bebidas</Text>
        </View>

        <Text style={styles.sectionHeading}>Selecione o Painel para Acessar:</Text>

        <View style={styles.portalsGrid}>
          {portals.map(portal => (
            <TouchableOpacity
              key={portal.id}
              style={styles.portalCard}
              onPress={() => handleSelectPortal(portal.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconCircle, { backgroundColor: portal.badgeColor }]}>
                  <Ionicons name={portal.icon} size={22} color="#FFFFFF" />
                </View>
                <View style={[styles.badge, { backgroundColor: `${portal.badgeColor}20` }]}>
                  <Text style={[styles.badgeText, { color: portal.badgeColor }]}>{portal.badge}</Text>
                </View>
              </View>

              <Text style={styles.portalTitle}>{portal.title}</Text>
              <Text style={styles.portalDesc}>{portal.description}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.urlText}>{portal.urlHint}</Text>
                <Ionicons name="arrow-forward-circle" size={22} color={portal.badgeColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B192C',
  },
  container: {
    padding: 24,
    alignItems: 'center',
  },
  logoHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  portalSubTitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 12,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  portalsGrid: {
    width: '100%',
    maxWidth: 680,
    gap: 14,
  },
  portalCard: {
    backgroundColor: '#112238',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E3552',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  portalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  portalDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E3552',
  },
  urlText: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
