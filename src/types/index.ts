export type UserRole = 'bar_owner' | 'supplier' | 'admin' | 'driver';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
  // Campos específicos
  linkedEntityId?: string; // id do Bar principal ou do Fornecedor vinculado
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  accuracy?: number;
}

export interface BarEstablishment {
  id: string;
  ownerId: string;
  name: string;
  tradingName: string;
  cnpj: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  status: 'active' | 'pending_approval' | 'blocked';
  creditLimit: number; // Limite para compras faturadas
  creditUsed: number;
  monthlyAverageConsumption?: number;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  serasaScore?: number; // Score Serasa Experian (ex: 850)
  creditStatus?: 'approved' | 'restricted' | 'pending_analysis';
  creditTermsDays?: number; // Prazo de faturamento em dias (15 dias)
  deliveryNotes?: string; // Ponto de referência / Instruções para o caminhão
}

export interface SupplierAccount {
  id: string;
  ownerId: string;
  tradeName: string;
  corporateName: string;
  cnpj: string;
  phone: string;
  email: string;
  status: 'active' | 'pending_approval' | 'suspended';
  commissionRate: number; // Porcentagem de comissão da plataforma (ex: 5%)
  minOrderValue: number;  // Pedido mínimo em R$
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  deliveryTimeEstimate: string; // Ex: 'Hoje até 18h' ou '24h - 48h'
  categories: string[];
  logoUrl: string;
  bannerUrl: string;
  rating: number;
  reviewCount: number;
  bankPixKey: string;
  address: string;
  city: string;
  state: string;
  acceptedPaymentMethods: ('pix' | 'boleto_faturado' | 'credit_card')[];
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  stateRegistration?: string;
  operatingHours?: string;
  cutOffTime?: string;
  maxDeliveryRadiusKm?: number;
  isOpenForOrders?: boolean;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
}

export interface BeverageProduct {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  brand: string;
  description: string;
  category: 'cervejas' | 'chopp_barris' | 'destilados' | 'vinhos' | 'refrigerantes' | 'aguas_gelo' | 'insumos_bar';
  unit: string; // Ex: 'Caixa com 24 latas 350ml', 'Barril 50L', 'Garrafa 1L', 'Fardo com 12'
  packageDetails: string;
  price: number;
  originalPrice?: number;
  stock: number;
  isReturnableBottle: boolean; // Se exige vasilhame retornável
  imageUrl: string;
  minOrderUnits: number; // Quantidade mínima de compra deste produto
  isPromoted?: boolean;
  sku?: string;
  batchNumber?: string;
  expirationDate?: string;
  isPaused?: boolean;
  volumeDiscountTier?: { minQuantity: number; discountPercent: number };
}

export interface ReturnableBottleBalance {
  id: string;
  supplierId: string;
  barId: string;
  barName: string;
  bottleType: 'engradado_600ml' | 'barril_chopp_50L' | 'barril_chopp_30L' | 'engradado_litrao';
  quantityInCustody: number;
  lastExchangeDate: string;
  pendingReturn: number;
}

export interface DeliveryVehicle {
  id: string;
  supplierId: string;
  plate: string;
  model: string;
  capacityPallets: number;
  capacityCrates: number;
  driverName: string;
  driverPhone: string;
  status: 'available' | 'in_route' | 'maintenance';
}

export interface CartItem {
  product: BeverageProduct;
  quantity: number;
}

export interface SupplierConflict {
  pendingProduct: BeverageProduct;
  pendingQuantity: number;
  currentSupplierName: string;
  newSupplierName: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  isReturnableBottle: boolean;
}

export type OrderStatus = 
  | 'pending_payment'
  | 'confirmed'
  | 'preparing'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  barId: string;
  barName: string;
  barAddress: string;
  barCnpj: string;
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'pix' | 'boleto_faturado' | 'credit_card';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'scheduled_faturado';
  pixCode?: string;
  pixQrCodeUrl?: string;
  boletoBarcode?: string;
  boletoDigitableLine?: string;
  dueDate?: string; // Data de vencimento do boleto faturado (15 dias)
  boletoPaidAt?: string;
  status: OrderStatus;
  deliveryNotes?: string;
  needsReturnableBottlesExchange: boolean;
  createdAt: string;
  estimatedDeliveryTime: string;
}

export interface IntegrationServiceConfig {
  id: string;
  name: string;
  category: 'auth' | 'database' | 'payment' | 'maps' | 'notifications';
  isConfigured: boolean;
  isFreeTierAvailable: boolean;
  freeTierDetails: string;
  paidRequirements: string;
  documentationUrl: string;
  envKeys: string[];
  statusMessage: string;
}

export interface RegisterOwnerAndBarData {
  ownerName: string;
  email: string;
  phone: string;
  password?: string;
  barName: string;
  tradingName: string;
  cnpj: string;
  stateRegistration?: string;
  category?: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  simulatedSerasaStatus?: 'approved' | 'restricted';
}

// ============================================================================
// MODERAÇÃO DE CONTEÚDO & DENÚNCIAS (APPLE APP STORE GUIDELINE 1.2)
// ============================================================================
export type ReportTargetType = 'product' | 'supplier' | 'user' | 'order' | 'review';

export type ReportReasonCategory = 
  | 'fraud'           // Fraude ou Golpe Comercial
  | 'counterfeit'     // Produto Ilegal, Adulterado ou Sem Registro
  | 'inappropriate'   // Conteúdo Inapropriado ou Ofensivo
  | 'abusive'         // Conduta Abusiva, Ameaça ou Assédio
  | 'damaged'         // Mercadoria Danificada / Vencida
  | 'pricing'         // Cobrança Indevida ou Preço Enganoso
  | 'other';          // Outro Motivo

export type ReportStatus = 'pending' | 'in_review' | 'resolved' | 'dismissed';

export type ModerationAction = 
  | 'none' 
  | 'content_removed' 
  | 'account_suspended' 
  | 'warning_issued' 
  | 'cleared';

export interface ContentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterRole: string;
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  targetDetails?: string;
  reasonCategory: ReportReasonCategory;
  reasonDescription: string;
  evidenceNotes?: string;
  createdAt: string;
  status: ReportStatus;
  moderationAction?: ModerationAction;
  moderatorNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// ============================================================================
// NOTIFICAÇÕES DO SISTEMA (CENTRAL DE NOTIFICAÇÕES / PUSH)
// ============================================================================
export type NotificationType = 'order' | 'invoice' | 'promo' | 'system' | 'bottles';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationType;
  read: boolean;
  orderId?: string;
  invoiceId?: string;
  couponCode?: string;
  actionText?: string;
  actionType?: 'open_order' | 'open_invoices' | 'open_coupon' | 'open_bottles' | 'none';
}

// ============================================================================
// AUTENTICAÇÃO MULTIFATOR (MFA / 2FA) & SESSÃO
// ============================================================================
export type MfaChannel = 'whatsapp' | 'sms' | 'email';

export interface MfaSession {
  userId: string;
  userName: string;
  barName?: string;
  destination: string;
  maskedDestination: string;
  channel: MfaChannel;
  code: string;
  createdAt: number;
  expiresAt: number;
}


