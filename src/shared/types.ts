export type UserRole = 'superadmin' | 'admin' | 'staff' | 'viewer';
export type OrderStatus = 'pedido_recibido' | 'pedido_aceptado' | 'procesando' | 'listo_entrega' | 'en_camino' | 'entregado' | 'cancelado' | 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered';
export type PaymentMethod = 'sinpe' | 'transfer' | 'cash' | 'card';
export type PaymentStatus = 'pending' | 'proof_sent' | 'paid' | 'refunded';
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
  fontFamily?: 'Inter' | 'Poppins' | 'Roboto' | 'Montserrat' | 'Playfair Display';
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
  notes?: string;
  deliveryMethod: DeliveryMethod;
  consumptionMode?: 'dine_in' | 'pickup' | 'delivery';
  tableNumber?: string;
  driverId?: string;
  wazeUrl?: string;
  chatMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DayBreakConfig {
  enabled: boolean;
  breakStart: string;
  breakEnd: string;
}

export interface BookingField {
  id: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  options?: string[];
  required: boolean;
}

export interface ScheduleSettings {
  id?: string;
  tenantId: string;
  scheduleMode: 'jornada' | 'fechas' | 'bloques';
  globalParallelSlots?: number;
  jornadaConfig?: {
    startHour: string;
    endHour: string;
    slotMinutes: number;
    hasBreak: boolean;
    breakStart: string;
    breakEnd: string;
    daysEnabled: number[];
    perDayBreaks?: Record<number, DayBreakConfig>;
  };
  fechasConfig?: {
    enabledDates: string[];
  };
  bloquesConfig?: {
    days: Record<string, Array<{ start: string; end: string }>>;
  };
  customFields?: BookingField[];
  vacationMode?: {
    enabled: boolean;
    startDate: string;
    endDate: string;
    message?: string;
  };
}
