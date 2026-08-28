export interface Tenant {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  aiProvider: 'gemini' | 'openai' | 'anthropic';
  aiApiKeyEncrypted?: string;
  aiModel: string;
  evolutionInstance?: string;
  whatsappNumber?: string;
  plan: 'starter' | 'pro' | 'business' | 'enterprise';
  active: boolean;
  createdAt: Date;
  settingsJson?: Record<string, any>;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'staff' | 'viewer';
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
  systemPrompt: string;
  model: string;
  temperature: number;
  autoReplyEnabled: boolean;
  notifyNumber?: string;
  businessName?: string;
  currency?: string;
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

export interface StoreSettings {
  id: string;
  tenantId: string;
  storeEnabled: boolean;
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pedido_recibido' | 'pedido_aceptado' | 'procesando' | 'listo_entrega' | 'entregado' | 'cancelado' | 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  tenantId: string;
  orderNumber: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  whatsappJid?: string;
  source: 'store' | 'whatsapp' | 'manual';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: 'sinpe' | 'transfer' | 'cash' | 'card';
  paymentStatus: 'pending' | 'proof_sent' | 'paid' | 'refunded';
  paymentReference?: string;
  notes?: string;
  deliveryMethod: 'pickup' | 'delivery';
  chatMessageId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScheduleSettings {
  id?: string;
  tenantId: string;
  scheduleMode: 'jornada' | 'fechas' | 'bloques';
  jornadaConfig?: {
    startHour: string; // "08:00"
    endHour: string;   // "17:00"
    slotMinutes: number; // 45
    hasBreak: boolean;
    breakStart: string; // "12:00"
    breakEnd: string;   // "13:00"
    daysEnabled: number[]; // [1, 2, 3, 4, 5, 6] (1 = Lunes, 7 = Domingo)
  };
  fechasConfig?: {
    enabledDates: string[]; // ["2026-08-28", "2026-08-29"]
    slotsByDate?: Record<string, string[]>;
  };
  bloquesConfig?: {
    days: Record<string, Array<{ start: string; end: string }>>;
    slotMinutes?: number;
  };
  updatedAt?: Date;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}
