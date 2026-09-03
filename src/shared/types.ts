export type UserRole = 'superadmin' | 'admin' | 'staff' | 'viewer';
export type OrderStatus = 'pedido_recibido' | 'pedido_aceptado' | 'procesando' | 'listo_entrega' | 'en_camino' | 'entregado' | 'cancelado' | 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered';
export type PaymentMethod = 'sinpe' | 'transfer' | 'cash' | 'card';
export type PaymentStatus = 'pending' | 'proof_sent' | 'paid' | 'refunded' | 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
export type DeliveryMethod = 'pickup' | 'delivery';
export type AIProvider = 'gemini' | 'openai' | 'anthropic';
export type SubscriptionPlan = 'starter' | 'pro' | 'business' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  aiProvider: AIProvider;
  aiApiKeyEncrypted?: string;
  aiModel: string;
  evolutionInstance?: string;
  whatsappNumber?: string;
  plan: SubscriptionPlan;
  active: boolean;
  createdAt: Date;
  settingsJson?: Record<string, any>;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  provider: 'local' | 'google';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRecord extends User {
  passwordHash: string;
}

// Custom variable option for products & services
export interface CustomVariableOption {
  id: string;
  name: string; // e.g., "Rojo", "Azul", "Talla M", "XL", "SUV / 4x4", "Combo Agrandado", "Queso Extra"
  priceDelta?: number; // +/- price adjustment e.g. +500, +1500, 0
  durationMinutesDelta?: number; // +/- time adjustment for services e.g. +15 min, +30 min
  colorHex?: string; // e.g. "#ef4444", "#3b82f6" for color variables
}

// Custom variable group for products & services
export interface CustomVariable {
  id: string;
  name: string; // e.g. "Color", "Talla", "Tipo de Vehículo", "Combo / Agrandado", "Ingredientes Extras"
  type: 'select' | 'radio' | 'color' | 'checkbox' | 'multiselect';
  required: boolean;
  options: CustomVariableOption[];
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  priceDisplay?: string;
  duration: string;
  estimatedMinutes?: number;
  category?: string;
  parallelSlots?: number;
  customVariables?: CustomVariable[];
  active: boolean;
  notes?: string;
  createdAt?: Date;
}

export interface Appointment {
  id: string;
  tenantId: string;
  name: string;
  whatsapp: string;
  service: string;
  date: string;
  time: string;
  amount: number;
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  details?: string;
  vehicleModel?: string;
  selectedVariables?: Record<string, string | string[]>;
  selectedVariablesSummary?: string;
  specialistId?: string;
  createdAt?: Date;
}

export interface AgentPromptConfig {
  id?: string;
  tenantId: string;
  aiChatbotEnabled?: boolean;
  systemPrompt: string;
  model: string;
  temperature: number;
  autoReplyEnabled: boolean;
  notifyNumber?: string;
  businessName?: string;
  currency?: string;
  humanHandoffEnabled?: boolean;
  handoffKeywords?: string[];
  handoffNotifyPhone?: string;
  updatedAt?: Date;
}

export interface ChatMessage {
  id: string;
  tenantId: string;
  remoteJid: string;
  pushName?: string;
  fromMe: boolean;
  messageText: string;
  aiResponse?: string;
  status?: string;
  createdAt?: Date;
}

export interface NotificationLog {
  id: string;
  tenantId: string;
  recipient: string;
  message: string;
  triggerType: string;
  status: string;
  timestamp?: Date;
}

export interface StoreTheme {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  cardBackgroundColor?: string;
  cardRadius?: 'square' | 'rounded' | 'pill';
  cardShadow?: 'none' | 'sm' | 'md' | 'lg';
  fontFamily?: string;
  titleFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  bodyFontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  titleColor?: string;
  bodyTextColor?: string;
  bannerUrl?: string;
  logoUrl?: string;
}

export interface RestaurantConfig {
  allowDineIn: boolean;
  allowTableNumber: boolean;
  allowCallByName: boolean;
  dineInMode?: 'table_number' | 'call_by_name' | 'both';
  tableCount: number;
  allowPickup: boolean;
  allowDelivery: boolean;
}

export interface DeliveryDriver {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  accessPin?: string;
  vehicleType?: 'moto' | 'bici' | 'auto';
  plateNumber?: string;
  active: boolean;
  createdAt?: string;
}

export interface NotificationTemplates {
  orderReceived?: string;
  orderInTransit?: string;
  orderDelivered?: string;
  driverDispatch?: string;
  bookingConfirmed?: string;
}

export interface DeliveryConfig {
  deliveryType: 'flat' | 'distance';
  storeLocation?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
  baseDeliveryFee: number;
  baseDeliveryKm: number;
  feePerExtraKm: number;
  maxDeliveryRadiusKm: number;
  correosCrEnabled: boolean;
  originLocationType: 'GAM' | 'RESTO';
  correosIncludeIva: boolean;
}

export interface CorreosCrRateBracket {
  label: string;
  maxGrams: number;
  gamPrice: number;
  restoPrice: number;
}

export interface CorreosCrConfig {
  enabled: boolean;
  serviceType: 'ems' | 'pyme';
  rates: CorreosCrRateBracket[];
  originType: 'GAM' | 'RESTO';
  includeIva: boolean;
}

export interface LocalDeliveryConfig {
  enabled: boolean;
  fee: number;
  freeAbove?: number;
  estimatedHours?: string;
  notes?: string;
}

export interface StoreScheduleConfig {
  isOpenManual: boolean;
  autoScheduleEnabled: boolean;
  closedMessage?: string;
  schedule: {
    [dayKey: string]: { enabled: boolean; open: string; close: string };
  };
}

export interface StoreModulesConfig {
  storeEnabled: boolean;
  bookingsEnabled: boolean;
  courtsEnabled?: boolean;
}

export interface StoreSettings {
  id: string;
  tenantId: string;
  storeEnabled: boolean;
  storeMode?: 'retail' | 'restaurant';
  storeModules?: StoreModulesConfig;
  restaurantConfig?: RestaurantConfig;
  deliveryConfig?: DeliveryConfig;
  correosCrConfig?: CorreosCrConfig;
  localDeliveryConfig?: LocalDeliveryConfig;
  storeSchedule?: StoreScheduleConfig;
  customStages?: Record<string, string>;
  notificationTemplates?: NotificationTemplates;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  storeTheme?: StoreTheme;
  currency: string;
  acceptSinpe: boolean;
  sinpePhone?: string;
  sinpeName?: string;
  acceptTransfer: boolean;
  bankAccountInfo?: string;
  acceptCashOnDelivery: boolean;
  deliveryEnabled: boolean;
  deliveryFee: number;
  pickupEnabled: boolean;
  whatsappCheckout: boolean;
  minOrderAmount: number;
  storeMessage?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  priceOverride?: number;
  stock: number;
  attributes: Record<string, string>;
  active: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  category?: string;
  tags?: string[];
  stock: number;
  trackStock: boolean;
  sku?: string;
  weightGrams?: number;
  customVariables?: CustomVariable[];
  featured: boolean;
  active: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface OrderItem {
  id?: string;
  productId?: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  selectedVariables?: Record<string, string | string[]>;
  selectedVariablesSummary?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerLocation?: {
    lat: number;
    lng: number;
    mapsUrl?: string;
  };
  whatsappJid?: string;
  source: 'store' | 'whatsapp' | 'manual';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  paymentProofUrl?: string;
  paymentProofStatus?: 'pending' | 'received' | 'verified';
  notes?: string;
  deliveryMethod: DeliveryMethod;
  consumptionMode?: 'dine_in' | 'pickup' | 'delivery' | 'correos_cr';
  tableNumber?: string;
  driverId?: string;
  wazeUrl?: string;
  channelOrigin?: 'WEB_STORE' | 'WHATSAPP';
  paymentLinkToken?: string;
  paymentLinkExpiresAt?: Date | string;
  tilopayTransactionId?: string;
  tilopayAuthCode?: string;
  estimatedDelivery?: Date;
  chatMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantPaymentConfig {
  id?: string;
  tenantId: string;
  provider: 'TILOPAY';
  isEnabled: boolean;
  environment: 'SANDBOX' | 'PRODUCTION';
  apiKeyEncrypted?: string;
  apiKeyMasked?: string;
  apiUser?: string;
  apiPasswordEncrypted?: string;
  apiPasswordMasked?: string;
  captureMode: 'IMMEDIATE' | 'AUTH_ONLY';
  isConfigured?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface TenantWhatsappConfig {
  id?: string;
  tenantId: string;
  instanceName?: string;
  apiUrl?: string;
  apiKeyEncrypted?: string;
  isEnabled: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface PaymentConfigAuditLog {
  id: string;
  tenantId: string;
  changedBy: string;
  fieldChanged: string;
  oldValueMasked?: string;
  newValueMasked?: string;
  timestamp: Date | string;
}

export interface ReminderConfig {
  enabled: boolean;
  firstReminderEnabled: boolean;
  firstReminderHoursBefore: number; // e.g. 24
  firstReminderTemplate: string;
  secondReminderEnabled: boolean;
  secondReminderHoursBefore: number; // e.g. 2
  secondReminderTemplate: string;
}

export interface WhatsAppCampaign {
  id: string;
  tenantId: string;
  name: string;
  messageTemplate: string;
  mediaUrl?: string;
  targetSegment: 'all' | 'orders' | 'bookings' | 'tag';
  targetTag?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'draft' | 'sending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  totalOrders: number;
  totalSpent: number;
  lastInteraction?: string;
  createdAt: string;
}

// ===================== COURTS MODULE =====================

export type SportType = 'futbol' | 'padel' | 'tenis' | 'otro';
export type BookingMode = 'full' | 'seek_match';
export type MatchStatus = 'open' | 'matched' | 'expired' | 'confirmed' | 'cancelled';

export interface Court {
  id: string;
  tenantId: string;
  name: string;
  sportType: SportType;
  customSportType?: string;
  description?: string;
  surface?: string;
  isIndoor: boolean;
  hasLighting: boolean;
  basePrice: number;
  priceDisplay?: string;
  durationMinutes: number;
  teamSize: number;
  maxExtraPlayers: number;
  extraPlayerFee: number;
  active: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface CourtBooking {
  id: string;
  tenantId: string;
  courtId: string;
  courtName?: string;
  date: string;
  time: string;
  durationMinutes: number;
  bookingMode: BookingMode;
  matchStatus: MatchStatus;
  matchExpiryHours: number;
  teamAName: string;
  teamACaptain: string;
  teamAPhone: string;
  teamAPlayers: number;
  teamAExtraPlayers: number;
  teamAPaid: boolean;
  teamBName?: string;
  teamBCaptain?: string;
  teamBPhone?: string;
  teamBPlayers: number;
  teamBExtraPlayers: number;
  teamBPaid: boolean;
  totalPrice: number;
  pricePerTeam?: number;
  paymentMode: 'online' | 'on_site' | 'both';
  sportType: string;
  skillLevel?: string;
  notes?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourtsTheme {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  title?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  announcement?: string;
  sinpePhone?: string;
  sinpeName?: string;
  bankAccountInfo?: string;
}

export interface CourtsConfig {
  paymentMode: 'online' | 'on_site' | 'both';
  matchExpiryHours: number;
  allowSeekMatch: boolean;
  sportTypes: string[];
  theme?: CourtsTheme;
}

