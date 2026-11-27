import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Image,
  Platform 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { PhoneMockupContainer } from './src/components/PhoneMockupContainer';
import { BarOwnerHomeScreen } from './src/screens/BarOwnerHomeScreen';
import { SupplierDetailScreen } from './src/screens/SupplierDetailScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { SupplierDashboardScreen } from './src/screens/SupplierDashboardScreen';
import { AdminMasterScreen } from './src/screens/AdminMasterScreen';
import { DriverAppScreen } from './src/screens/DriverAppScreen';
import { BarSelectorModal } from './src/components/BarSelectorModal';
import { CartModal } from './src/components/CartModal';
import { SupplierConflictModal } from './src/components/SupplierConflictModal';
import { FigmaBottomNav } from './src/components/FigmaBottomNav';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { FigmaCheckoutScreen } from './src/screens/FigmaCheckoutScreen';
import { FigmaFavoritesScreen } from './src/screens/FigmaFavoritesScreen';
import { FigmaProfileScreen } from './src/screens/FigmaProfileScreen';
import { FigmaLoginScreen } from './src/screens/FigmaLoginScreen';
import { AccessPortalScreen } from './src/screens/AccessPortalScreen';
import { SupplierAccount, BeverageProduct } from './src/types';

function MainApp() {
  const { 
    currentUser, 
    switchUserRole, 
    selectedBar, 
    selectBar, 
    myBars, 
    cart, 
    products, 
    suppliers, 
    orders,
    addToCart,
    isDarkMode,
    theme 
  } = useApp();
  const [currentTab, setCurrentTab] = useState<'home' | 'favorites' | 'orders' | 'menu'>('home');
  const [activeSupplierDetail, setActiveSupplierDetail] = useState<SupplierAccount | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<BeverageProduct | null>(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutScreen, setShowCheckoutScreen] = useState(false);
  const [showBarModal, setShowBarModal] = useState(false);
  const [activeAppRoute, setActiveAppRoute] = useState<'bar' | 'supplier' | 'driver' | 'admin' | 'login' | 'portal'>('bar');
  const [isUrlInitialized, setIsUrlInitialized] = useState(false);

  // 1. Restaurar Estado Completo da URL na Web (suporta refresh, bookmark e botão Voltar/Avançar do navegador)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      setIsUrlInitialized(true);
      return;
    }

    if (typeof document !== 'undefined') {
      const styleId = 'flowstock-input-style-reset';
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
          input, textarea, select {
            outline: none !important;
            outline-style: none !important;
            outline-width: 0 !important;
            border: none !important;
            border-style: none !important;
            border-width: 0 !important;
            box-shadow: none !important;
            background-color: transparent !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }
          input:focus, input:focus-visible, textarea:focus, textarea:focus-visible, select:focus, select:focus-visible {
            outline: none !important;
            outline-style: none !important;
            outline-width: 0 !important;
            border: none !important;
            border-style: none !important;
            border-width: 0 !important;
            box-shadow: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
    }

    const restoreStateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const appParam = params.get('app');
      const barParam = params.get('bar');
      const tabParam = params.get('tab');
      const screenParam = params.get('screen');
      const prodParam = params.get('prod');
      const suppParam = params.get('supp');

      // Restaurar Rota / App - URL principal é o app do bar por padrão
      if (appParam === 'supplier') {
        setActiveAppRoute('supplier');
        switchUserRole('supplier');
      } else if (appParam === 'driver') {
        setActiveAppRoute('driver');
        switchUserRole('driver');
      } else if (appParam === 'admin') {
        setActiveAppRoute('admin');
        switchUserRole('admin');
      } else if (appParam === 'login') {
        setActiveAppRoute('login');
      } else if (appParam === 'portal') {
        setActiveAppRoute('portal');
      } else {
        // App do Bar é a URL raiz padrão
        setActiveAppRoute('bar');
        switchUserRole('bar_owner');
      }

      // Restaurar Bar Selecionado
      if (barParam) {
        selectBar(barParam);
      }

      // Restaurar Tab Ativa
      if (tabParam && ['home', 'favorites', 'orders', 'menu'].includes(tabParam)) {
        setCurrentTab(tabParam as any);
      }

      // Restaurar Telas Sobrepostas (Carrinho, Checkout, Detalhes de Produto ou Fornecedor)
      if (screenParam === 'cart') {
        setShowCartModal(true);
        setShowCheckoutScreen(false);
        setSelectedProductDetail(null);
        setActiveSupplierDetail(null);
      } else if (screenParam === 'checkout') {
        setShowCheckoutScreen(true);
        setShowCartModal(false);
        setSelectedProductDetail(null);
        setActiveSupplierDetail(null);
      } else if (screenParam === 'product' && prodParam) {
        setShowCheckoutScreen(false);
        setShowCartModal(false);
        const prod = products.find(p => p.id === prodParam);
        if (prod) setSelectedProductDetail(prod);
      } else if (screenParam === 'supplier' && suppParam) {
        setShowCheckoutScreen(false);
        setShowCartModal(false);
        const supp = suppliers.find(s => s.id === suppParam);
        if (supp) setActiveSupplierDetail(supp);
      } else {
        setShowCheckoutScreen(false);
        setShowCartModal(false);
        setSelectedProductDetail(null);
        setActiveSupplierDetail(null);
      }

      setIsUrlInitialized(true);
    };

    restoreStateFromUrl();
    window.addEventListener('popstate', restoreStateFromUrl);
    return () => window.removeEventListener('popstate', restoreStateFromUrl);
  }, [products, suppliers]);

  // 2. Persistir Mudanças de Estado na URL da Web (bidirecional, sem recarregar página)
  useEffect(() => {
    if (!isUrlInitialized || Platform.OS !== 'web' || typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (activeAppRoute === 'bar') {
      url.searchParams.delete('app'); // Mantém a URL raiz limpa como a URL principal do app do bar
    } else {
      url.searchParams.set('app', activeAppRoute);
    }

    if (selectedBar) {
      url.searchParams.set('bar', selectedBar.id);
    }

    if (activeAppRoute === 'bar') {
      url.searchParams.set('tab', currentTab);

      if (showCheckoutScreen) {
        url.searchParams.set('screen', 'checkout');
        url.searchParams.delete('prod');
        url.searchParams.delete('supp');
      } else if (showCartModal) {
        url.searchParams.set('screen', 'cart');
        url.searchParams.delete('prod');
        url.searchParams.delete('supp');
      } else if (selectedProductDetail) {
        url.searchParams.set('screen', 'product');
        url.searchParams.set('prod', selectedProductDetail.id);
        url.searchParams.delete('supp');
      } else if (activeSupplierDetail) {
        url.searchParams.set('screen', 'supplier');
        url.searchParams.set('supp', activeSupplierDetail.id);
        url.searchParams.delete('prod');
      } else {
        url.searchParams.delete('screen');
        url.searchParams.delete('prod');
        url.searchParams.delete('supp');
      }
    } else if (activeAppRoute === 'supplier' || activeAppRoute === 'admin') {
      // Preserva o parâmetro 'tab' na URL para o Painel do Distribuidor e Painel Master Admin
      url.searchParams.delete('screen');
      url.searchParams.delete('prod');
      url.searchParams.delete('supp');
    } else {
      url.searchParams.delete('tab');
      url.searchParams.delete('screen');
      url.searchParams.delete('prod');
      url.searchParams.delete('supp');
    }

    window.history.replaceState({}, '', url.toString());
  }, [
    isUrlInitialized,
    activeAppRoute, 
    currentTab, 
    selectedBar?.id, 
    showCartModal,
    showCheckoutScreen, 
    selectedProductDetail?.id, 
    activeSupplierDetail?.id
  ]);

  // Configurar Nome Oficial do FlowStock e Ícone na Aba do Navegador (Web Favicon & Document Title)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const titles: Record<string, string> = {
        bar: 'FlowStock - B2B Bebidas & Chopp',
        supplier: 'FlowStock - Portal do Distribuidor',
        driver: 'FlowStock - App do Entregador',
        admin: 'FlowStock - Painel Master B2B',
        login: 'FlowStock - Login B2B',
        portal: 'FlowStock - Hub Central de Acessos',
      };
      document.title = titles[activeAppRoute] || 'FlowStock - B2B Bebidas & Chopp';

      const faviconBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACBklEQVR4AdXBwc2qUBCA0e/euGUqYDM7epr6pid2s6GCoQCeJpoQ8/tERJRzCgs1bTexo3HoCwsUHmjabuKHjENf+EPhTtN2Ez9sHPrCTGGmabuJAxiHvnBVuGrabuJAxqEvnFUOrnDWtN3EAY1DX058SHowJ6Z8QuXgTqyUHsyJKa9KD+bElFfVpu0mviA9eFfTdlPlS8SUOTFljcpO0oP/SQ/WqHyRmPKuygekB8+kB1uobCQ9eCY92FplhfTgkfRgqfRgLj14VWVD6cES6YGYsoUTC6UHe0kPLsSUZyoLpAdbSw/+kh7cpAfPVBYSU35R5QViipjySyoriCliyi848QYx5SY9WCI92FJlI2KKmLK3EyukBzdiypyYcpEe7KHypvQgPbgnpuyhsoKYci89+IbKSmKKmDKXHuyt8iYxRUy5EFP2VtmImPINlYOrHFzl4CoLpQe/qDRtN7FAenAjpiyRHqwlpixRmrabeEF6MCemPJIevEpMeUVp2m5ihfRgTky5lx4sJaasUThr2m7iDenBjZhykx48I6asNQ59ObEBMeUiPUgPLsSU/xFTtlA4a9puYkPpwSNiylbGoS8nPkBMuUgPbsSUTyhcNW03cSDj0BfOKgdXmGnabuIAxqEvXBXuNG038cPGoS/MFB5o2m7ih4xDX/hDYaGm7SZ2NA59YYF/6sW6UVILMUMAAAAASUVORK5CYII=';

      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/png';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconBase64;
    }
  }, [activeAppRoute]);

  // 1. Se a rota for o Painel Master Admin
  if (activeAppRoute === 'admin') {
    return (
      <SafeAreaView style={styles.outerContainer}>
        <StatusBar style="light" />
        <AdminMasterScreen />
      </SafeAreaView>
    );
  }

  // 3. Se a rota for o Portal do Fornecedor / Distribuidor
  if (activeAppRoute === 'supplier') {
    return (
      <SafeAreaView style={styles.outerContainer}>
        <StatusBar style="light" />
        <SupplierDashboardScreen />
      </SafeAreaView>
    );
  }

  // 4. Se a rota for o App do Entregador (Caminhão)
  if (activeAppRoute === 'driver') {
    return (
      <SafeAreaView style={styles.outerContainer}>
        <StatusBar style="light" />
        <PhoneMockupContainer enabled={true}>
          <DriverAppScreen />
        </PhoneMockupContainer>
      </SafeAreaView>
    );
  }

  // 5. Se a rota for a tela de Login do Figma (122:4)
  if (activeAppRoute === 'login') {
    return (
      <SafeAreaView style={styles.outerContainer}>
        <StatusBar style="light" />
        <PhoneMockupContainer enabled={true}>
          <FigmaLoginScreen 
            onLoginSuccess={() => setActiveAppRoute('bar')} 
            onBack={() => setActiveAppRoute('bar')} 
          />
        </PhoneMockupContainer>
      </SafeAreaView>
    );
  }

  // 6. Se a rota for o Portal Central de Acessos
  if (activeAppRoute === 'portal') {
    return (
      <SafeAreaView style={styles.outerContainer}>
        <StatusBar style="light" />
        <AccessPortalScreen 
          onNavigateToApp={(app) => {
            setActiveAppRoute(app);
            if (app === 'bar') switchUserRole('bar_owner');
            else if (app === 'supplier') switchUserRole('supplier');
            else if (app === 'driver') switchUserRole('driver');
            else if (app === 'admin') switchUserRole('admin');
          }}
        />
      </SafeAreaView>
    );
  }

  // 6. Rota Padrão: App do Bar (Cliente B2B Multi-Estabelecimento)
  const renderBarClientScreen = () => {
    // Tela de Checkout / Sacola do Figma (122:1148)
    if (showCheckoutScreen) {
      return (
        <FigmaCheckoutScreen
          onBack={() => {
            setShowCheckoutScreen(false);
            setShowCartModal(true);
          }}
          onOpenMyBars={() => setShowBarModal(true)}
          onOpenLogin={() => setActiveAppRoute('login')}
          onOrderSuccess={() => {
            setShowCheckoutScreen(false);
            setCurrentTab('orders');
          }}
        />
      );
    }

    // Tela de Detalhes do Produto do Figma (123:481)
    if (selectedProductDetail) {
      return (
        <ProductDetailScreen
          product={selectedProductDetail}
          onBack={() => setSelectedProductDetail(null)}
          onOpenMyBars={() => setShowBarModal(true)}
          onOpenCart={() => {
            setSelectedProductDetail(null);
            setShowCartModal(true);
          }}
        />
      );
    }

    // Catálogo Completo do Fornecedor / Distribuidor
    if (activeSupplierDetail) {
      return (
        <SupplierDetailScreen
          supplier={activeSupplierDetail}
          onBack={() => setActiveSupplierDetail(null)}
          onSelectProduct={(prod) => setSelectedProductDetail(prod)}
          onOpenCart={() => setShowCartModal(true)}
          onOpenMyBars={() => setShowBarModal(true)}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <BarOwnerHomeScreen
            onSelectSupplier={(supp) => setActiveSupplierDetail(supp)}
            onNavigateToIntegrations={() => {}}
            onSelectProduct={(prod) => setSelectedProductDetail(prod)}
            onOpenCheckout={() => setShowCartModal(true)}
            onOpenLogin={() => setActiveAppRoute('login')}
            onOpenOrders={() => setCurrentTab('orders')}
            onOpenInvoices={() => setCurrentTab('menu')}
          />
        );
      case 'favorites':
        return (
          <FigmaFavoritesScreen
            onBack={() => setCurrentTab('home')}
            onOpenMyBars={() => setShowBarModal(true)}
            onSelectProduct={(prod) => setSelectedProductDetail(prod)}
            onSelectSupplier={(supp) => setActiveSupplierDetail(supp)}
            onOpenCart={() => setShowCartModal(true)}
            onOpenFilters={() => {}}
            onOpenLogin={() => setActiveAppRoute('login')}
          />
        );
      case 'orders':
        return (
          <OrdersScreen
            onBack={() => setCurrentTab('home')}
            onOpenMyBars={() => setShowBarModal(true)}
            onOpenCheckout={() => setShowCartModal(true)}
            onOpenLogin={() => setActiveAppRoute('login')}
          />
        );
      case 'menu':
        return (
          <FigmaProfileScreen
            onOpenMyBars={() => setShowBarModal(true)}
            onOpenOrders={() => setCurrentTab('orders')}
            onOpenLogin={() => setActiveAppRoute('login')}
          />
        );
      default:
        return (
          <BarOwnerHomeScreen
            onSelectSupplier={(supp) => setActiveSupplierDetail(supp)}
            onNavigateToIntegrations={() => {}}
            onSelectProduct={(prod) => setSelectedProductDetail(prod)}
            onOpenCheckout={() => setShowCartModal(true)}
            onOpenLogin={() => setActiveAppRoute('login')}
            onOpenOrders={() => setCurrentTab('orders')}
            onOpenInvoices={() => setCurrentTab('menu')}
          />
        );
    }
  };

  const isNavHidden = activeSupplierDetail !== null || selectedProductDetail !== null || showCheckoutScreen || showCartModal;

  return (
    <SafeAreaView style={[styles.outerContainer, { backgroundColor: isDarkMode ? '#070F18' : '#EAEEF3' }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Container com Mockup de Celular Nativo para o App do Bar */}
      <PhoneMockupContainer enabled={true}>
        <View style={[styles.appContainer, { backgroundColor: theme.background }]}>
          {/* Conteúdo do App do Bar */}
          <View style={[styles.contentArea, { backgroundColor: theme.background }]}>
            {renderBarClientScreen()}
          </View>

          {/* Barra de Navegação Inferior Oficial do Figma FlowStock */}
          {!isNavHidden && (
            <FigmaBottomNav
              currentTab={currentTab}
              onSelectTab={(tab) => setCurrentTab(tab)}
              onOpenCart={() => setShowCartModal(true)}
              cartCount={cart.reduce((acc, it) => acc + it.quantity, 0)}
              invoiceBadgeCount={orders.filter(o => 
                o.paymentMethod === 'boleto_faturado' && 
                (o.paymentStatus === 'scheduled_faturado' || o.paymentStatus === 'pending')
              ).length}
            />
          )}

          {/* Modal do Carrinho de Compras B2B */}
          <CartModal
            visible={showCartModal}
            onClose={() => setShowCartModal(false)}
            onProceedToCheckout={() => {
              setShowCartModal(false);
              setShowCheckoutScreen(true);
            }}
          />

          {/* Modal de Bares */}
          <BarSelectorModal
            visible={showBarModal}
            onClose={() => setShowBarModal(false)}
          />

          {/* Modal de Conflito de Fornecedor (Apenas 1 distribuidora por pedido) */}
          <SupplierConflictModal />
        </View>
      </PhoneMockupContainer>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#070F18',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#0D1C28',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#0D1C28',
  },
  tabScreen: {
    flex: 1,
    backgroundColor: '#0D1C28',
  },
  tabHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0D1C28',
    borderBottomWidth: 1,
    borderBottomColor: '#162737',
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabSub: {
    fontSize: 12,
    color: '#8FA0AF',
    marginTop: 2,
  },
  openBarsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162737',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  openBarsBtnTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  openBarsBtnSub: {
    fontSize: 12,
    color: '#8FA0AF',
    marginTop: 2,
  },
  multiBarInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#10223A',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  multiBarInfoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 3,
  },
  multiBarInfoText: {
    fontSize: 11,
    color: '#93C5FD',
    lineHeight: 16,
  },
  creditCardBox: {
    backgroundColor: '#162737',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  creditTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  creditTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0D1C28',
    backgroundColor: '#FFC107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  creditLimit: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFC107',
    marginTop: 10,
  },
  creditSub: {
    fontSize: 11,
    color: '#8FA0AF',
    marginTop: 4,
  },
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162737',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E3042',
  },
  favImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#0D1C28',
  },
  favBrand: {
    fontSize: 10,
    color: '#FFC107',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  favName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  favUnit: {
    fontSize: 11,
    color: '#8FA0AF',
    marginTop: 1,
  },
  favPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFC107',
    marginTop: 2,
  },
  favAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  favAddBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0D1C28',
  },
});
