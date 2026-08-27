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
  aiResponse?: boolean;
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

export interface StoreSettings {
  id: string;
  tenantId: string;
  storeEnabled: boolean;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  storeTheme?: Record<string, string>;
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
  id: string;
  productId?: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

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
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'sinpe' | 'transfer' | 'cash' | 'card';
  paymentStatus: 'pending' | 'proof_sent' | 'paid' | 'refunded';
  paymentReference?: string;
  notes?: string;
  deliveryMethod: 'pickup' | 'delivery';
  chatMessageId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
}

export interface Cart {
  id: string;
  tenantId: string;
  sessionId?: string;
  whatsappId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  status: string;
  expiresAt: Date;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EvolutionState {
  status: string;
  qrCode?: string;
  connectedPhone?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: User;
}

export interface DbStatus {
  connected: boolean;
  error?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}
