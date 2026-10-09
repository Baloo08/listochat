import React, { useState, useEffect } from 'react';
import RegisterModal from './RegisterModal';
import {
  Bot,
  MessageSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  Utensils,
  MapPin,
  TrendingUp,
  ArrowRight,
  Clock,
  Send,
  Building2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Lock,
  Headphones,
  Check,
  ShoppingBag,
  Calendar,
  Palette,
  CheckCircle,
  Menu,
  X,
  CreditCard,
  Truck,
  ExternalLink,
  Store,
  Star,
  Users,
  Globe,
  Layers,
  HelpCircle,
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  Share2,
  QrCode,
  Sliders,
  DollarSign,
  Award,
  Gift,
  Scissors,
  Coffee,
  Trophy,
  AlertTriangle,
  XCircle,
  Server,
  FileCode,
  Target,
  Repeat,
  Cpu,
  HeartHandshake,
  BadgePercent,
  Search,
  Compass
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  isLoggedIn?: boolean;
  onGoToDashboard?: () => void;
}

// ============================================================================
// RECURSOS GRÁFICOS 100% SVG NATIVOS (RESPONSIVOS, LIGEROS Y CON IDENTIDAD BETICO)
// ============================================================================

function HeroBentoShowcaseSvg() {
  return (
    <svg viewBox="0 0 940 440" width="100%" height="100%" style={{ display: 'block', maxHeight: '430px' }} aria-label="Ecosistema Betico: 3 Momentos de la Venta y Asistente IA">
      <defs>
        <linearGradient id="heroCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B3C3D" />
          <stop offset="100%" stopColor="#134B4C" />
        </linearGradient>
        <linearGradient id="loyaltyCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#002526" />
          <stop offset="100%" stopColor="#0B3C3D" />
        </linearGradient>
        <filter id="bentoCardShadow" x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.05" />
        </filter>
      </defs>

      {/* ==============================================================
          CUADRANTE 1: CAPTACIÓN Y PROSPECCIÓN (Izquierda)
      ============================================================== */}
      <g filter="url(#bentoCardShadow)">
        <rect x="15" y="15" width="285" height="280" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        
        {/* Header Pill */}
        <rect x="27" y="27" width="130" height="22" rx="11" fill="#EFF7F7" stroke="#B0DCDC" strokeWidth="1" />
        <circle cx="38" cy="38" r="5" stroke="#0B3C3D" strokeWidth="1.3" fill="none" />
        <ellipse cx="38" cy="38" rx="2.5" ry="5" stroke="#0B3C3D" strokeWidth="1" fill="none" />
        <line x1="33" y1="38" x2="43" y2="38" stroke="#0B3C3D" strokeWidth="1" />
        <text x="49" y="42" fill="#0B3C3D" fontSize="8.5" fontWeight="800" letterSpacing="0.04em">01. CAPTACIÓN</text>

        <text x="27" y="68" fill="#0F172A" fontSize="13" fontWeight="900">Sitio Web y Marca</text>
        <rect x="27" y="77" width="120" height="5" rx="2.5" fill="#E2E8F0" />

        {/* Mockup de Navegador Web */}
        <rect x="27" y="94" width="261" height="152" rx="10" fill="#FAF8F5" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="27" y="94" width="261" height="24" rx="10" fill="#F1F5F9" />
        <rect x="27" y="108" width="261" height="10" fill="#F1F5F9" />
        <circle cx="38" cy="106" r="3" fill="#EF4444" />
        <circle cx="47" cy="106" r="3" fill="#F59E0B" />
        <circle cx="56" cy="106" r="3" fill="#10B981" />
        
        {/* URL Pill con icono lineal de candado */}
        <rect x="68" y="99" width="145" height="14" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
        <rect x="75" y="104" width="6" height="5" rx="1" stroke="#0B3C3D" strokeWidth="1" fill="none" />
        <path d="M76.5 104 V102.5 A1.5 1.5 0 0 1 79.5 102.5 V104" stroke="#0B3C3D" strokeWidth="1" fill="none" />
        <text x="86" y="109.5" fill="#0B3C3D" fontSize="7" fontWeight="700" fontFamily="monospace">betico.tech/tu-marca</text>

        {/* Navbar mockup */}
        <rect x="37" y="125" width="48" height="12" rx="3" fill="#0B3C3D" />
        <text x="43" y="134" fill="#FFFFFF" fontSize="6.5" fontWeight="800">TU LOGO</text>
        <rect x="186" y="129" width="20" height="4" rx="2" fill="#CBD5E1" />
        <rect x="212" y="129" width="20" height="4" rx="2" fill="#CBD5E1" />
        <rect x="238" y="126" width="38" height="10" rx="3" fill="#B51C12" />
        <text x="244" y="133.5" fill="#FFFFFF" fontSize="6" fontWeight="800">ACCEDER</text>

        {/* Hero Banner Mockup con wireframe bars */}
        <rect x="37" y="144" width="241" height="42" rx="6" fill="url(#heroCardGrad)" />
        <rect x="47" y="154" width="95" height="7" rx="3.5" fill="#FFFFFF" opacity="0.95" />
        <rect x="47" y="165" width="65" height="5" rx="2.5" fill="#B0DCDC" opacity="0.8" />
        
        {/* CTA Button con icono lineal calendario */}
        <rect x="206" y="153" width="64" height="18" rx="4" fill="#B51C12" />
        <rect x="212" y="157" width="8" height="8" rx="1.5" stroke="#FFFFFF" strokeWidth="1" fill="none" />
        <line x1="212" y1="160" x2="220" y2="160" stroke="#FFFFFF" strokeWidth="0.8" />
        <text x="224" y="165" fill="#FFFFFF" fontSize="6.5" fontWeight="800">RESERVAR</text>

        {/* 2 Mini Cards de Módulos (Catálogo y Tráfico) */}
        <rect x="37" y="193" width="116" height="43" rx="5" fill="#FFFFFF" stroke="#E2E8F0" />
        <rect x="43" y="199" width="24" height="24" rx="4" fill="#EFF7F7" />
        <rect x="48" y="206" width="14" height="12" rx="2.5" stroke="#0B3C3D" strokeWidth="1.2" fill="none" />
        <path d="M52 206 V203 A3 3 0 0 1 58 203 V206" stroke="#0B3C3D" strokeWidth="1" fill="none" />
        <text x="73" y="208" fill="#0F172A" fontSize="7.5" fontWeight="800">Catálogo Web</text>
        <rect x="73" y="214" width="60" height="4" rx="2" fill="#CBD5E1" />
        <rect x="73" y="221" width="38" height="4" rx="2" fill="#E2E8F0" />

        <rect x="162" y="193" width="116" height="43" rx="5" fill="#FFFFFF" stroke="#E2E8F0" />
        <rect x="168" y="199" width="24" height="24" rx="4" fill="#FFF1F0" />
        <path d="M180 203 A4 4 0 0 0 172 203 C172 207 176 213 176 213 C176 213 180 207 180 203 Z" stroke="#B51C12" strokeWidth="1.2" fill="none" />
        <circle cx="176" cy="203" r="1.5" fill="#B51C12" />
        <text x="198" y="208" fill="#0F172A" fontSize="7.5" fontWeight="800">Tráfico Directo</text>
        <rect x="198" y="214" width="60" height="4" rx="2" fill="#CBD5E1" />
        <rect x="198" y="221" width="38" height="4" rx="2" fill="#E2E8F0" />

        {/* Footer Pill */}
        <rect x="27" y="258" width="261" height="24" rx="6" fill="#EFF7F7" />
        <circle cx="39" cy="270" r="3" fill="#0B3C3D" />
        <text x="47" y="273.5" fill="#0B3C3D" fontSize="8" fontWeight="800">Portal oficial con marca y catálogo activo</text>
      </g>

      {/* ==============================================================
          CUADRANTE 2: LA VENTA Y EL CIERRE (Centro)
      ============================================================== */}
      <g filter="url(#bentoCardShadow)">
        <rect x="315" y="15" width="310" height="280" rx="16" fill="#FFFFFF" stroke="#B0DCDC" strokeWidth="1.8" />
        
        {/* Header Pill */}
        <rect x="329" y="27" width="110" height="22" rx="11" fill="#EFF7F7" stroke="#0B3C3D" strokeWidth="1" />
        <rect x="337" y="33" width="12" height="9" rx="2" stroke="#0B3C3D" strokeWidth="1.2" fill="none" />
        <line x1="337" y1="36.5" x2="349" y2="36.5" stroke="#0B3C3D" strokeWidth="1" />
        <text x="354" y="42" fill="#0B3C3D" fontSize="8.5" fontWeight="800" letterSpacing="0.04em">02. LA VENTA</text>

        <text x="329" y="68" fill="#0F172A" fontSize="13" fontWeight="900">Tienda, Citas y Pagos</text>
        <rect x="329" y="77" width="140" height="5" rx="2.5" fill="#E2E8F0" />

        {/* Card de Pedido / Servicio */}
        <rect x="329" y="94" width="282" height="66" rx="10" fill="#FAF8F5" stroke="#E2E8F0" />
        {/* Receipt linear icon box */}
        <rect x="339" y="104" width="46" height="46" rx="8" fill="#FFFFFF" stroke="#CBD5E1" />
        <rect x="350" y="112" width="24" height="30" rx="3" stroke="#0B3C3D" strokeWidth="1.3" fill="#EFF7F7" />
        <line x1="355" y1="119" x2="369" y2="119" stroke="#0B3C3D" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="355" y1="125" x2="365" y2="125" stroke="#0B3C3D" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="355" y1="131" x2="363" y2="131" stroke="#0B3C3D" strokeWidth="1.2" strokeLinecap="round" />
        
        {/* Ticket Details */}
        <text x="394" y="118" fill="#0F172A" fontSize="9.5" fontWeight="800">Orden o Reserva de Servicio</text>
        <rect x="394" y="125" width="90" height="4" rx="2" fill="#94A3B8" />
        <rect x="394" y="136" width="68" height="15" rx="3.5" fill="#EFF7F7" />
        <text x="400" y="146.5" fill="#0B3C3D" fontSize="7.5" fontWeight="800">CITA 15:00</text>

        <text x="599" y="125" fill="#0B3C3D" fontSize="14" fontWeight="900" textAnchor="end">₡5.500</text>
        <rect x="545" y="133" width="54" height="13" rx="3" fill="#ECFDF5" />
        <text x="572" y="142" fill="#059669" fontSize="6.8" fontWeight="800" textAnchor="middle">CONFIRMADO</text>

        {/* 2 Métodos de Pago */}
        {/* SINPE Móvil */}
        <rect x="329" y="168" width="136" height="52" rx="8" fill="#FFFFFF" stroke="#0B3C3D" strokeWidth="1.2" />
        <rect x="337" y="176" width="22" height="22" rx="5" fill="#EFF7F7" />
        <rect x="342" y="180" width="12" height="15" rx="2.5" stroke="#0B3C3D" strokeWidth="1.2" fill="none" />
        <line x1="346" y1="182" x2="350" y2="182" stroke="#0B3C3D" strokeWidth="1" />
        <circle cx="348" cy="191.5" r="1" fill="#0B3C3D" />
        <text x="365" y="186" fill="#0F172A" fontSize="8" fontWeight="800">SINPE MÓVIL</text>
        <rect x="365" y="192" width="65" height="4" rx="2" fill="#94A3B8" />
        <polyline points="365,207 368,210 373,204" fill="none" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="377" y="209" fill="#059669" fontSize="7" fontWeight="800">INMEDIATO</text>

        {/* Tarjetas Bancarias */}
        <rect x="475" y="168" width="136" height="52" rx="8" fill="#FFFFFF" stroke="#B51C12" strokeWidth="1.2" />
        <rect x="483" y="176" width="22" height="22" rx="5" fill="#FFF1F0" />
        <rect x="487" y="181" width="14" height="11" rx="2" stroke="#B51C12" strokeWidth="1.2" fill="none" />
        <line x1="487" y1="185" x2="501" y2="185" stroke="#B51C12" strokeWidth="1" />
        <rect x="490" y="188" width="3" height="2.5" rx="0.5" fill="#B51C12" />
        <text x="511" y="186" fill="#0F172A" fontSize="8" fontWeight="800">TARJETAS</text>
        <rect x="511" y="192" width="65" height="4" rx="2" fill="#94A3B8" />
        <rect x="511" y="204" width="6" height="5" rx="1" stroke="#B51C12" strokeWidth="0.8" fill="none" />
        <path d="M512.5 204 V202.5 A1.5 1.5 0 0 1 515.5 202.5 V204" stroke="#B51C12" strokeWidth="0.8" fill="none" />
        <text x="520" y="209" fill="#B51C12" fontSize="7" fontWeight="800">3D SECURE</text>

        {/* Live Status Bar */}
        <rect x="329" y="228" width="282" height="26" rx="6" fill="#0B3C3D" />
        <path d="M341 238 A4 4 0 0 1 349 234 H353 A4 4 0 0 1 357 238 V241 A4 4 0 0 1 353 245 H346 L342 248 Z" stroke="#34D399" strokeWidth="1.2" fill="none" />
        <circle cx="363" cy="241" r="3" fill="#34D399" />
        <text x="372" y="244.5" fill="#FFFFFF" fontSize="7.8" fontWeight="800">WHATSAPP EN VIVO</text>
        <text x="600" y="244.5" fill="#A7F3D0" fontSize="7" fontWeight="700" textAnchor="end">NOTIFICACIÓN 0s</text>

        {/* Footer Pill */}
        <rect x="329" y="258" width="282" height="24" rx="6" fill="#EFF7F7" />
        <circle cx="341" cy="270" r="3" fill="#0B3C3D" />
        <text x="349" y="273.5" fill="#0B3C3D" fontSize="8" fontWeight="800">Cobro verificado y sincronizado a tu cuenta</text>
      </g>

      {/* ==============================================================
          CUADRANTE 3: FIDELIZACIÓN Y RETENCIÓN (Derecha)
      ============================================================== */}
      <g filter="url(#bentoCardShadow)">
        <rect x="640" y="15" width="285" height="280" rx="16" fill="#FFFFFF" stroke="#FFC7C4" strokeWidth="1.5" />
        
        {/* Header Pill */}
        <rect x="652" y="27" width="130" height="22" rx="11" fill="#FFF1F0" stroke="#B51C12" strokeWidth="1" />
        <circle cx="663" cy="38" r="5" stroke="#B51C12" strokeWidth="1.2" fill="none" />
        <path d="M663 35 L664.2 37.4 L667 37.8 L665 39.4 L665.6 42 L663 40.5 L660.4 42 L661 39.4 L659 37.8 L661.8 37.4 Z" fill="#B51C12" />
        <text x="674" y="42" fill="#B51C12" fontSize="8.5" fontWeight="800" letterSpacing="0.04em">03. FIDELIZACIÓN</text>

        <text x="652" y="68" fill="#0F172A" fontSize="13" fontWeight="900">Sellos y Puntos</text>
        <rect x="652" y="77" width="120" height="5" rx="2.5" fill="#E2E8F0" />

        {/* Tarjeta de Fidelidad Digital */}
        <rect x="652" y="94" width="261" height="152" rx="10" fill="url(#loyaltyCardGrad)" />
        
        {/* Header de la tarjeta */}
        <rect x="662" y="104" width="75" height="14" rx="3" fill="rgba(255,255,255,0.15)" />
        <text x="668" y="114" fill="#B0DCDC" fontSize="7" fontWeight="800">CLUB DIGITAL</text>
        <text x="898" y="114" fill="#34D399" fontSize="7" fontWeight="800" textAnchor="end">Billetera Móvil</text>

        <text x="662" y="133" fill="#FFFFFF" fontSize="9.5" fontWeight="900">Tarjeta de Sellos</text>
        <rect x="662" y="139" width="95" height="4" rx="2" fill="rgba(255,255,255,0.25)" />

        {/* 8 Casillas de Sellos (4x2) con iconos lineales limpios */}
        {[
          { x: 662, y: 151, done: true },
          { x: 700, y: 151, done: true },
          { x: 738, y: 151, done: true },
          { x: 776, y: 151, done: true },
          { x: 662, y: 181, done: true },
          { x: 700, y: 181, done: true },
          { x: 738, y: 181, done: true },
          { x: 776, y: 181, done: false, prize: true }
        ].map((s, idx) => (
          <g key={idx}>
            <rect
              x={s.x}
              y={s.y}
              width="32"
              height="26"
              rx="5"
              fill={s.prize ? '#B51C12' : (s.done ? '#064E3B' : 'rgba(255,255,255,0.12)')}
              stroke={s.prize ? '#FFC7C4' : (s.done ? '#34D399' : 'rgba(255,255,255,0.25)')}
              strokeWidth="1.2"
            />
            {s.prize ? (
              <g transform={`translate(${s.x + 8}, ${s.y + 5})`}>
                <path d="M3 3 H13 V7 A5 5 0 0 1 3 7 Z" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
                <path d="M1 4 H3 V6 H1 Z" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
                <path d="M13 4 H15 V6 H13 Z" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
                <line x1="8" y1="10" x2="8" y2="13" stroke="#FFFFFF" strokeWidth="1.2" />
                <line x1="5" y1="13" x2="11" y2="13" stroke="#FFFFFF" strokeWidth="1.2" />
              </g>
            ) : s.done ? (
              <polyline
                points={`${s.x + 10},${s.y + 13} ${s.x + 14},${s.y + 17} ${s.x + 22},${s.y + 9}`}
                fill="none"
                stroke="#34D399"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <text x={s.x + 16} y={s.y + 16} fill="rgba(255,255,255,0.5)" fontSize="8.5" fontWeight="700" textAnchor="middle">
                {String(idx + 1)}
              </text>
            )}
          </g>
        ))}

        {/* Badge Monedero de Puntos en la tarjeta */}
        <rect x="817" y="151" width="86" height="56" rx="6" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" />
        <text x="860" y="166" fill="#B0DCDC" fontSize="7" fontWeight="700" textAnchor="middle">PUNTOS</text>
        <text x="860" y="183" fill="#FFFFFF" fontSize="12" fontWeight="900" textAnchor="middle">₡4.250</text>
        <rect x="830" y="191" width="60" height="10" rx="2.5" fill="rgba(52,211,153,0.2)" />
        <text x="860" y="198" fill="#34D399" fontSize="6.5" fontWeight="800" textAnchor="middle">CANJEABLE</text>

        <rect x="662" y="215" width="241" height="20" rx="4" fill="rgba(255,255,255,0.08)" />
        <rect x="670" y="219" width="14" height="10" rx="2" stroke="#B0DCDC" strokeWidth="1" fill="none" />
        <circle cx="674" cy="223" r="1.5" fill="#B0DCDC" />
        <line x1="677" y1="223" x2="681" y2="223" stroke="#B0DCDC" strokeWidth="1" />
        <line x1="677" y1="226" x2="681" y2="226" stroke="#B0DCDC" strokeWidth="1" />
        <text x="690" y="228" fill="#FFFFFF" fontSize="7" fontWeight="700">Acceso por cédula en betico.tech/fidelidad</text>

        {/* Footer Pill */}
        <rect x="652" y="258" width="261" height="24" rx="6" fill="#FFF1F0" />
        <circle cx="664" cy="270" r="3" fill="#B51C12" />
        <text x="672" y="273.5" fill="#B51C12" fontSize="8" fontWeight="800">Acumulación automática en citas y compras</text>
      </g>

      {/* ==============================================================
          NÚCLEO CENTRAL CONECTOR: CEREBRO IA TRANSVERSAL
      ============================================================== */}
      <g filter="url(#bentoCardShadow)">
        <rect x="15" y="310" width="910" height="115" rx="16" fill="#002526" stroke="#134B4C" strokeWidth="2" />
        
        {/* Glow de acento central */}
        <circle cx="470" cy="367" r="70" fill="rgba(52, 211, 153, 0.08)" />

        {/* Icono lineal del Procesador / Microchip IA */}
        <rect x="35" y="328" width="56" height="56" rx="12" fill="#0B3C3D" stroke="#34D399" strokeWidth="1.5" />
        <rect x="45" y="338" width="36" height="36" rx="6" fill="#002526" stroke="#34D399" strokeWidth="1.2" />
        <circle cx="63" cy="356" r="4" fill="#34D399" />
        <line x1="63" y1="340" x2="63" y2="352" stroke="#34D399" strokeWidth="1.2" />
        <line x1="63" y1="360" x2="63" y2="372" stroke="#34D399" strokeWidth="1.2" />
        <line x1="47" y1="356" x2="59" y2="356" stroke="#34D399" strokeWidth="1.2" />
        <line x1="67" y1="356" x2="79" y2="356" stroke="#34D399" strokeWidth="1.2" />
        <line x1="41" y1="334" x2="41" y2="328" stroke="#34D399" strokeWidth="1.2" />
        <line x1="53" y1="334" x2="53" y2="328" stroke="#34D399" strokeWidth="1.2" />
        <line x1="73" y1="334" x2="73" y2="328" stroke="#34D399" strokeWidth="1.2" />
        <line x1="85" y1="334" x2="85" y2="328" stroke="#34D399" strokeWidth="1.2" />

        {/* Textos y Badges del Orquestador IA */}
        <text x="108" y="347" fill="#34D399" fontSize="9.5" fontWeight="900" letterSpacing="0.06em">
          NÚCLEO DE AUTOMATIZACIÓN 24/7 • ORQUESTADOR IA
        </text>
        <text x="108" y="369" fill="#FFFFFF" fontSize="13.5" fontWeight="900">
          Vende, Agenda y Atiende de Forma Automática en WhatsApp
        </text>

        {/* 3 Micro Pilares con iconos lineales y skeletons */}
        <g transform="translate(108, 380)">
          {/* Pilar 1: Vende */}
          <rect x="0" y="0" width="180" height="28" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          <path d="M10 9 H14 L16 19 H26 L28 12 H15" stroke="#34D399" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18" cy="22" r="1.5" fill="#34D399" />
          <circle cx="24" cy="22" r="1.5" fill="#34D399" />
          <text x="34" y="14" fill="#FFFFFF" fontSize="8" fontWeight="800">1. VENDE</text>
          <rect x="34" y="17" width="130" height="3" rx="1.5" fill="#94A3B8" />

          {/* Pilar 2: Agenda */}
          <rect x="190" y="0" width="180" height="28" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
          <rect x="199" y="8" width="12" height="12" rx="2" stroke="#34D399" strokeWidth="1.2" fill="none" />
          <line x1="199" y1="12" x2="211" y2="12" stroke="#34D399" strokeWidth="1" />
          <line x1="202" y1="6" x2="202" y2="9" stroke="#34D399" strokeWidth="1" />
          <line x1="208" y1="6" x2="208" y2="9" stroke="#34D399" strokeWidth="1" />
          <text x="218" y="14" fill="#FFFFFF" fontSize="8" fontWeight="800">2. AGENDA</text>
          <rect x="218" y="17" width="130" height="3" rx="1.5" fill="#94A3B8" />

          {/* Pilar 3: Filtro Humano */}
          <rect x="380" y="0" width="200" height="28" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(181,28,18,0.4)" />
          <path d="M394 8 L389 10 V14 C389 18 394 21 394 21 C394 21 399 18 399 14 V10 Z" stroke="#FFC7C4" strokeWidth="1.2" fill="none" />
          <text x="406" y="14" fill="#FFC7C4" fontSize="8" fontWeight="800">3. FILTRO HUMANO</text>
          <rect x="406" y="17" width="150" height="3" rx="1.5" fill="#94A3B8" />
        </g>

        {/* Conexiones hacia los 3 momentos */}
        <line x1="160" y1="300" x2="160" y2="310" stroke="#34D399" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="160" cy="305" r="3" fill="#34D399" />
        <line x1="470" y1="300" x2="470" y2="310" stroke="#34D399" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="470" cy="305" r="3" fill="#34D399" />
        <line x1="780" y1="300" x2="780" y2="310" stroke="#34D399" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="780" cy="305" r="3" fill="#34D399" />

        {/* Badges de Proveedores de IA */}
        <rect x="730" y="328" width="180" height="74" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" />
        <text x="820" y="344" fill="#B0DCDC" fontSize="8" fontWeight="800" textAnchor="middle">COMPATIBLE CON</text>
        
        <rect x="740" y="351" width="48" height="18" rx="4" fill="#0B3C3D" stroke="#34D399" strokeWidth="0.8" />
        <text x="764" y="363.5" fill="#34D399" fontSize="7" fontWeight="800" textAnchor="middle">Gemini</text>

        <rect x="796" y="351" width="48" height="18" rx="4" fill="#0B3C3D" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
        <text x="820" y="363.5" fill="#FFFFFF" fontSize="7" fontWeight="800" textAnchor="middle">OpenAI</text>

        <rect x="852" y="351" width="48" height="18" rx="4" fill="#0B3C3D" stroke="#FFC7C4" strokeWidth="0.8" />
        <text x="876" y="363.5" fill="#FFC7C4" fontSize="7" fontWeight="800" textAnchor="middle">Claude</text>

        <text x="820" y="388" fill="#34D399" fontSize="7.5" fontWeight="700" textAnchor="middle">Conexión BYOK Segura</text>
      </g>
    </svg>
  );
}

function CaptacionWebsiteSvg() {
  return (
    <svg viewBox="0 0 520 290" width="100%" height="100%" style={{ maxHeight: '270px', display: 'block' }} aria-label="Sitio Web Oficial Personalizable">
      <defs>
        <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B3C3D" />
          <stop offset="100%" stopColor="#134B4C" />
        </linearGradient>
        <linearGradient id="capAccentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#B51C12" />
          <stop offset="100%" stopColor="#E0352B" />
        </linearGradient>
        <filter id="capShadow" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0B3C3D" floodOpacity="0.08" />
        </filter>
      </defs>
      <rect x="15" y="12" width="490" height="266" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="url(#capShadow)" />
      
      {/* Barra de Navegador */}
      <rect x="15" y="12" width="490" height="34" rx="14" fill="#F8FAFC" />
      <rect x="15" y="34" width="490" height="12" fill="#F8FAFC" />
      <line x1="15" y1="46" x2="505" y2="46" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="34" cy="28" r="4.5" fill="#EF4444" />
      <circle cx="48" cy="28" r="4.5" fill="#F59E0B" />
      <circle cx="62" cy="28" r="4.5" fill="#10B981" />
      
      {/* Dirección URL con candado lineal */}
      <rect x="80" y="20" width="240" height="18" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="88" y="25" width="6" height="5" rx="1" stroke="#0B3C3D" strokeWidth="1" fill="none" />
      <path d="M89.5 25 V23.5 A1.5 1.5 0 0 1 92.5 23.5 V25" stroke="#0B3C3D" strokeWidth="1" fill="none" />
      <text x="100" y="32.5" fill="#0B3C3D" fontSize="9" fontWeight="700" fontFamily="monospace">betico.tech/tu-marca</text>
      
      {/* Píldoras de Redes / Tráfico con icono lineal */}
      <rect x="330" y="20" width="165" height="18" rx="5" fill="#EFF7F7" stroke="#B0DCDC" strokeWidth="1" />
      <circle cx="340" cy="29" r="3.5" stroke="#0B3C3D" strokeWidth="1" fill="none" />
      <polyline points="340,27 340,29 342,30" stroke="#0B3C3D" strokeWidth="0.8" fill="none" />
      <text x="348" y="32.5" fill="#0B3C3D" fontSize="8" fontWeight="800">ENLACE EN BIO Y REDES</text>

      {/* Cabecera del Sitio Web */}
      <rect x="28" y="56" width="464" height="34" rx="8" fill="#FFFFFF" />
      <rect x="38" y="63" width="75" height="20" rx="5" fill="#0B3C3D" />
      <text x="46" y="77" fill="#FFFFFF" fontSize="8.5" fontWeight="800">TU MARCA</text>
      
      {/* Botones y Navegación de Cabecera */}
      <rect x="285" y="65" width="85" height="16" rx="4" fill="#EFF7F7" />
      <text x="295" y="76.5" fill="#0B3C3D" fontSize="8" fontWeight="700">TIENDA WEB</text>
      <rect x="378" y="65" width="104" height="16" rx="4" fill="#0B3C3D" />
      <rect x="386" y="69" width="8" height="8" rx="1.5" stroke="#FFFFFF" strokeWidth="1" fill="none" />
      <line x1="386" y1="72" x2="394" y2="72" stroke="#FFFFFF" strokeWidth="0.8" />
      <text x="398" y="76.5" fill="#FFFFFF" fontSize="8" fontWeight="700">RESERVAR CITA</text>

      {/* Portada Banner con tu Identidad */}
      <rect x="28" y="98" width="464" height="104" rx="10" fill="url(#capGrad)" />
      
      {/* Abstract UI decorative circles */}
      <circle cx="435" cy="125" r="42" fill="rgba(255,255,255,0.06)" />
      <circle cx="400" cy="170" r="28" fill="rgba(181,28,18,0.25)" />
      
      {/* Banner Content: Clean UI skeleton wireframes */}
      <rect x="42" y="112" width="135" height="14" rx="3.5" fill="rgba(255,255,255,0.18)" />
      <text x="48" y="122.5" fill="#B0DCDC" fontSize="7.5" fontWeight="800" letterSpacing="0.04em">PORTAL WEB OFICIAL</text>
      
      <rect x="42" y="134" width="180" height="10" rx="4" fill="#FFFFFF" opacity="0.95" />
      <rect x="42" y="150" width="130" height="6" rx="3" fill="#B0DCDC" opacity="0.8" />
      <rect x="42" y="160" width="95" height="5" rx="2.5" fill="#E2E8F0" opacity="0.6" />

      {/* Primary CTA */}
      <rect x="42" y="174" width="105" height="18" rx="4" fill="url(#capAccentGrad)" />
      <text x="50" y="186.5" fill="#FFFFFF" fontSize="8" fontWeight="800">VER CATÁLOGO</text>

      {/* Wireframe Mini Cards on the right */}
      <rect x="345" y="110" width="132" height="78" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" />
      <rect x="355" y="120" width="30" height="30" rx="6" fill="rgba(255,255,255,0.15)" />
      <rect x="393" y="122" width="70" height="6" rx="3" fill="#FFFFFF" />
      <rect x="393" y="132" width="50" height="5" rx="2.5" fill="#B0DCDC" />
      <rect x="393" y="142" width="40" height="8" rx="2" fill="#34D399" />
      <rect x="355" y="160" width="112" height="18" rx="4" fill="#0B3C3D" />
      <text x="411" y="172" fill="#FFFFFF" fontSize="7.5" fontWeight="800" textAnchor="middle">PEDIR AHORA</text>

      {/* 3 Badges de Valor con Iconos Lineales */}
      {/* Badge 1: Línea Gráfica */}
      <rect x="28" y="210" width="148" height="54" rx="7" fill="#F8FAFC" stroke="#E2E8F0" />
      <circle cx="43" cy="227" r="7" stroke="#0B3C3D" strokeWidth="1.2" fill="none" />
      <circle cx="41" cy="225" r="1.2" fill="#0B3C3D" />
      <circle cx="45" cy="225" r="1.2" fill="#0B3C3D" />
      <circle cx="43" cy="229" r="1.2" fill="#0B3C3D" />
      <text x="56" y="230" fill="#0B3C3D" fontSize="9" fontWeight="800">Línea Gráfica</text>
      <rect x="38" y="240" width="125" height="4" rx="2" fill="#CBD5E1" />
      <rect x="38" y="248" width="85" height="4" rx="2" fill="#E2E8F0" />

      {/* Badge 2: Adaptable Móvil */}
      <rect x="186" y="210" width="148" height="54" rx="7" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="196" y="219" width="12" height="17" rx="2.5" stroke="#0B3C3D" strokeWidth="1.2" fill="none" />
      <line x1="200" y1="221" x2="204" y2="221" stroke="#0B3C3D" strokeWidth="0.8" />
      <circle cx="202" cy="233" r="1" fill="#0B3C3D" />
      <text x="214" y="230" fill="#0B3C3D" fontSize="9" fontWeight="800">Multi-Dispositivo</text>
      <rect x="196" y="240" width="125" height="4" rx="2" fill="#CBD5E1" />
      <rect x="196" y="248" width="85" height="4" rx="2" fill="#E2E8F0" />

      {/* Badge 3: Dominio y SSL */}
      <rect x="344" y="210" width="148" height="54" rx="7" fill="#F8FAFC" stroke="#E2E8F0" />
      <path d="M358 221 L353 223 V227 C353 231 358 234 358 234 C358 234 363 231 363 227 V223 Z" stroke="#0B3C3D" strokeWidth="1.2" fill="none" />
      <text x="370" y="230" fill="#0B3C3D" fontSize="9" fontWeight="800">Dominio y SSL</text>
      <rect x="354" y="240" width="125" height="4" rx="2" fill="#CBD5E1" />
      <rect x="354" y="248" width="85" height="4" rx="2" fill="#E2E8F0" />
    </svg>
  );
}

function VentaProcesoPasoSvg() {
  return (
    <svg viewBox="0 0 520 290" width="100%" height="100%" style={{ maxHeight: '270px', display: 'block' }} aria-label="Proceso de Venta, Pagos y Reservas">
      <defs>
        <linearGradient id="vtaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
        <filter id="vtaShadow" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.06" />
        </filter>
      </defs>
      
      <rect x="15" y="12" width="490" height="266" rx="14" fill="url(#vtaGrad)" stroke="#B0DCDC" strokeWidth="1.5" filter="url(#vtaShadow)" />

      {/* Franja Superior */}
      <rect x="15" y="12" width="490" height="34" rx="14" fill="#0B3C3D" />
      <rect x="15" y="32" width="490" height="14" fill="#0B3C3D" />
      <rect x="28" y="21" width="14" height="12" rx="2" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
      <path d="M32 21 V18 A3 3 0 0 1 38 18 V21" stroke="#FFFFFF" strokeWidth="1" fill="none" />
      <text x="48" y="30.5" fill="#FFFFFF" fontSize="10" fontWeight="800" letterSpacing="0.04em">CONTROL TOTAL DEL PROCESO DE VENTA</text>
      <circle cx="426" cy="27" r="3" fill="#34D399" />
      <text x="434" y="30.5" fill="#34D399" fontSize="8.5" fontWeight="700">TIEMPO REAL</text>

      {/* Bloque 1: Catálogo y Citas */}
      <rect x="28" y="56" width="224" height="98" rx="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="38" y="65" width="105" height="16" rx="3.5" fill="#EFF7F7" />
      <text x="44" y="76.5" fill="#0B3C3D" fontSize="8" fontWeight="800">1. CATÁLOGO Y CITAS</text>
      
      {/* Item wireframe */}
      <rect x="38" y="89" width="204" height="36" rx="6" fill="#FAF8F5" stroke="#E2E8F0" />
      <rect x="44" y="94" width="26" height="26" rx="4" fill="#EFF7F7" />
      <path d="M49 101 L57 101 L64 108 L58 114 L51 107 Z" stroke="#0B3C3D" strokeWidth="1" fill="none" />
      <circle cx="53" cy="104" r="1" fill="#0B3C3D" />
      <rect x="76" y="98" width="80" height="6" rx="3" fill="#0F172A" />
      <rect x="76" y="108" width="55" height="4" rx="2" fill="#94A3B8" />
      <text x="236" y="109" fill="#0B3C3D" fontSize="11" fontWeight="900" textAnchor="end">₡5.500</text>
      
      <rect x="38" y="131" width="75" height="14" rx="3" fill="#ECFDF5" />
      <text x="44" y="141" fill="#059669" fontSize="7" fontWeight="800">EN STOCK ACTIVO</text>

      {/* Bloque 2: Múltiples Formas de Pago */}
      <rect x="268" y="56" width="224" height="98" rx="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="278" y="65" width="118" height="16" rx="3.5" fill="#FFF1F0" />
      <text x="284" y="76.5" fill="#B51C12" fontSize="8" fontWeight="800">2. FORMAS DE PAGO</text>
      
      {/* 2 payment methods badges */}
      <rect x="278" y="89" width="98" height="36" rx="6" fill="#FFFFFF" stroke="#0B3C3D" strokeWidth="1" />
      <rect x="284" y="95" width="10" height="14" rx="2" stroke="#0B3C3D" strokeWidth="1" fill="none" />
      <line x1="287" y1="97" x2="291" y2="97" stroke="#0B3C3D" strokeWidth="0.8" />
      <circle cx="289" cy="105" r="0.8" fill="#0B3C3D" />
      <text x="298" y="104" fill="#0B3C3D" fontSize="7.5" fontWeight="800">SINPE</text>
      <text x="298" y="115" fill="#059669" fontSize="6.5" fontWeight="700">Verificado</text>

      <rect x="384" y="89" width="98" height="36" rx="6" fill="#FFFFFF" stroke="#B51C12" strokeWidth="1" />
      <rect x="390" y="96" width="13" height="10" rx="1.5" stroke="#B51C12" strokeWidth="1" fill="none" />
      <line x1="390" y1="99.5" x2="403" y2="99.5" stroke="#B51C12" strokeWidth="0.8" />
      <text x="407" y="104" fill="#B51C12" fontSize="7.5" fontWeight="800">TARJETA</text>
      <text x="407" y="115" fill="#B51C12" fontSize="6.5" fontWeight="700">3D Secure</text>

      <rect x="278" y="131" width="110" height="14" rx="3" fill="#EFF7F7" />
      <text x="284" y="141" fill="#0B3C3D" fontSize="7" fontWeight="800">BANCOS NACIONALES</text>

      {/* Bloque 3: WhatsApp en Tiempo Real */}
      <rect x="28" y="162" width="464" height="102" rx="9" fill="#FFFFFF" stroke="#0B3C3D" strokeWidth="1.2" />
      <rect x="38" y="172" width="170" height="18" rx="4" fill="#0B3C3D" />
      <path d="M46 179 A3 3 0 0 1 52 176 H56 A3 3 0 0 1 60 179 V182 A3 3 0 0 1 56 186 H51 L48 188 Z" stroke="#FFFFFF" strokeWidth="1" fill="none" />
      <text x="64" y="184.5" fill="#FFFFFF" fontSize="8" fontWeight="800">3. WHATSAPP EN VIVO</text>

      {/* Ticket Notification Simulation */}
      <rect x="38" y="196" width="270" height="58" rx="6" fill="#EFF7F7" stroke="#B0DCDC" />
      <polyline points="48,211 52,215 58,207" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="64" y="213" fill="#0B3C3D" fontSize="8.5" fontWeight="800">ORDEN #ORD-84 CONFIRMADA</text>
      <text x="250" y="213" fill="#0B3C3D" fontSize="8.5" fontWeight="900">₡12.500</text>
      <rect x="48" y="222" width="245" height="4" rx="2" fill="#CBD5E1" />
      <rect x="48" y="230" width="160" height="4" rx="2" fill="#E2E8F0" />
      <rect x="48" y="238" width="85" height="10" rx="2.5" fill="#0B3C3D" />
      <text x="90" y="246" fill="#FFFFFF" fontSize="6.5" fontWeight="800" textAnchor="middle">EN PREPARACIÓN</text>

      {/* Metric badge on the right */}
      <rect x="320" y="196" width="162" height="58" rx="6" fill="#F8FAFC" stroke="#E2E8F0" />
      <text x="330" y="214" fill="#0F172A" fontSize="9" fontWeight="800">Trazabilidad Total</text>
      <rect x="330" y="222" width="135" height="4" rx="2" fill="#CBD5E1" />
      <rect x="330" y="230" width="95" height="4" rx="2" fill="#E2E8F0" />
      <rect x="330" y="238" width="90" height="12" rx="3" fill="#EFF7F7" />
      <text x="336" y="247" fill="#0B3C3D" fontSize="6.8" fontWeight="800">NOTIFICACIÓN 0s</text>
    </svg>
  );
}

function FidelizacionSvg() {
  return (
    <svg viewBox="0 0 520 290" width="100%" height="100%" style={{ maxHeight: '270px', display: 'block' }} aria-label="Tarjetas de Fidelización, Sellos y Puntos">
      <defs>
        <linearGradient id="fidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B3C3D" />
          <stop offset="100%" stopColor="#134B4C" />
        </linearGradient>
        <filter id="fidShadow" x="-5%" y="-5%" width="110%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#B51C12" floodOpacity="0.08" />
        </filter>
      </defs>
      
      <rect x="15" y="12" width="490" height="266" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="url(#fidShadow)" />

      {/* Header */}
      <rect x="15" y="12" width="490" height="34" rx="14" fill="#0B3C3D" />
      <rect x="15" y="32" width="490" height="14" fill="#0B3C3D" />
      <path d="M28 20 H38 V24 A4 4 0 0 1 28 24 Z" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
      <line x1="33" y1="26" x2="33" y2="29" stroke="#FFFFFF" strokeWidth="1" />
      <line x1="30" y1="29" x2="36" y2="29" stroke="#FFFFFF" strokeWidth="1" />
      <text x="46" y="30.5" fill="#FFFFFF" fontSize="10" fontWeight="800" letterSpacing="0.04em">SISTEMA DE FIDELIZACIÓN DIGITAL</text>
      <text x="430" y="30.5" fill="#B0DCDC" fontSize="8.5" fontWeight="700">betico.tech/fidelidad</text>

      {/* Tarjeta de Sellos (Izquierda) */}
      <rect x="28" y="56" width="240" height="208" rx="10" fill="url(#fidGrad)" />
      <rect x="38" y="66" width="110" height="16" rx="3.5" fill="rgba(255,255,255,0.16)" />
      <text x="44" y="77.5" fill="#B0DCDC" fontSize="7.5" fontWeight="800">TARJETA DE SELLOS</text>
      <text x="38" y="98" fill="#FFFFFF" fontSize="11" fontWeight="900">Programa de Visitas</text>
      <rect x="38" y="104" width="115" height="4" rx="2" fill="rgba(255,255,255,0.25)" />

      {/* 8 Casillas de Sellos (4x2) con iconos lineales limpios */}
      {[
        { x: 38, y: 118, done: true },
        { x: 92, y: 118, done: true },
        { x: 146, y: 118, done: true },
        { x: 200, y: 118, done: true },
        { x: 38, y: 164, done: true },
        { x: 92, y: 164, done: true },
        { x: 146, y: 164, done: true },
        { x: 200, y: 164, done: false, prize: true }
      ].map((s, i) => (
        <g key={i}>
          <rect
            x={s.x}
            y={s.y}
            width="40"
            height="38"
            rx="7"
            fill={s.prize ? '#B51C12' : (s.done ? '#064E3B' : 'rgba(255,255,255,0.15)')}
            stroke={s.prize ? '#FFC7C4' : (s.done ? '#34D399' : 'rgba(255,255,255,0.3)')}
            strokeWidth="1.5"
          />
          {s.prize ? (
            <g transform={`translate(${s.x + 11}, ${s.y + 10})`}>
              <path d="M3 3 H15 V8 A6 6 0 0 1 3 8 Z" stroke="#FFFFFF" strokeWidth="1.3" fill="none" />
              <path d="M1 5 H3 V7 H1 Z" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
              <path d="M15 5 H17 V7 H15 Z" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
              <line x1="9" y1="11" x2="9" y2="15" stroke="#FFFFFF" strokeWidth="1.2" />
              <line x1="5" y1="15" x2="13" y2="15" stroke="#FFFFFF" strokeWidth="1.2" />
            </g>
          ) : s.done ? (
            <polyline
              points={`${s.x + 12},${s.y + 19} ${s.x + 18},${s.y + 25} ${s.x + 28},${s.y + 14}`}
              fill="none"
              stroke="#34D399"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <text x={s.x + 20} y={s.y + 23} fill="rgba(255,255,255,0.4)" fontSize="11" textAnchor="middle" fontWeight="bold">
              {String(i + 1)}
            </text>
          )}
        </g>
      ))}

      <text x="38" y="222" fill="#34D399" fontSize="8.5" fontWeight="800">7 / 8 SELLOS COMPLETADOS</text>
      <rect x="38" y="230" width="180" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
      <rect x="38" y="230" width="157" height="4" rx="2" fill="#34D399" />

      {/* Monedero de Puntos (Derecha Arriba) */}
      <rect x="278" y="56" width="214" height="96" rx="9" fill="#FAF8F5" stroke="#E2E8F0" />
      <circle cx="292" cy="74" r="5" stroke="#B51C12" strokeWidth="1.2" fill="none" />
      <text x="290" y="77" fill="#B51C12" fontSize="6.5" fontWeight="900">P</text>
      <text x="302" y="77" fill="#B51C12" fontSize="8.5" fontWeight="800">MONEDERO DE PUNTOS</text>
      <text x="290" y="104" fill="#0B3C3D" fontSize="20" fontWeight="900">₡4.250</text>
      <rect x="290" y="114" width="95" height="4" rx="2" fill="#94A3B8" />
      <rect x="290" y="124" width="135" height="18" rx="4" fill="#0B3C3D" />
      <text x="357" y="136" fill="#FFFFFF" fontSize="7.5" fontWeight="800" textAnchor="middle">CANJEAR EN CAJA O TIENDA</text>

      {/* Vínculo sin Registro (Derecha Abajo) */}
      <rect x="278" y="160" width="214" height="104" rx="9" fill="#EFF7F7" stroke="#B0DCDC" />
      <rect x="290" y="172" width="16" height="12" rx="2" stroke="#0B3C3D" strokeWidth="1.2" fill="none" />
      <circle cx="295" cy="177" r="1.5" fill="#0B3C3D" />
      <line x1="299" y1="176" x2="303" y2="176" stroke="#0B3C3D" strokeWidth="1" />
      <line x1="299" y1="179" x2="303" y2="179" stroke="#0B3C3D" strokeWidth="1" />
      <text x="312" y="182" fill="#0B3C3D" fontSize="9" fontWeight="800">Identificación por Cédula</text>
      <rect x="290" y="194" width="165" height="4" rx="2" fill="#CBD5E1" />
      <rect x="290" y="202" width="115" height="4" rx="2" fill="#CBD5E1" />
      <rect x="290" y="218" width="165" height="22" rx="4" fill="#FFFFFF" stroke="#B0DCDC" />
      <circle cx="302" cy="229" r="2.5" fill="#059669" />
      <text x="312" y="232.5" fill="#0B3C3D" fontSize="7.5" fontWeight="800">SIN DESCARGA DE APPS</text>
    </svg>
  );
}

function CerebroIaOrchestratorSvg() {
  return (
    <svg viewBox="0 0 520 290" width="100%" height="100%" style={{ maxHeight: '270px', display: 'block' }} aria-label="Asistente de Inteligencia Artificial para Ventas y Citas">
      <defs>
        <linearGradient id="aiBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#002526" />
          <stop offset="100%" stopColor="#0B3C3D" />
        </linearGradient>
      </defs>

      <rect x="15" y="12" width="490" height="266" rx="14" fill="url(#aiBgGrad)" stroke="#134B4C" strokeWidth="2" />

      {/* Encabezado */}
      <rect x="30" y="23" width="14" height="14" rx="3" stroke="#34D399" strokeWidth="1.2" fill="none" />
      <rect x="33" y="26" width="8" height="8" rx="1" fill="#34D399" />
      <text x="50" y="34.5" fill="#34D399" fontSize="9.5" fontWeight="800" letterSpacing="0.04em">MOTOR DE IA 24/7 • ORQUESTADOR MULTI-MODELO</text>
      <text x="440" y="34.5" fill="#B0DCDC" fontSize="8" fontWeight="700">BYOK</text>

      {/* Hub Central de IA con microchip lineal */}
      <rect x="165" y="48" width="190" height="54" rx="10" fill="#0B3C3D" stroke="#34D399" strokeWidth="1.5" />
      <circle cx="185" cy="75" r="4" fill="#34D399" />
      <line x1="185" y1="62" x2="185" y2="71" stroke="#34D399" strokeWidth="1.2" />
      <line x1="185" y1="79" x2="185" y2="88" stroke="#34D399" strokeWidth="1.2" />
      <text x="268" y="68" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle">TU IA FAVORITA</text>
      <text x="268" y="82" fill="#A7F3D0" fontSize="7.8" fontWeight="700" textAnchor="middle">Gemini • OpenAI • Claude</text>
      <rect x="205" y="88" width="126" height="4" rx="2" fill="rgba(52,211,153,0.3)" />

      {/* 3 Ramas de Ejecución */}
      {/* 1. Vende */}
      <rect x="28" y="118" width="144" height="78" rx="9" fill="rgba(255,255,255,0.06)" stroke="#34D399" strokeWidth="1" />
      <path d="M38 132 H42 L44 140 H52 L54 135 H43" stroke="#34D399" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="45" cy="143" r="1.2" fill="#34D399" />
      <circle cx="51" cy="143" r="1.2" fill="#34D399" />
      <text x="60" y="137" fill="#34D399" fontSize="9.5" fontWeight="900">1. VENDE</text>
      <rect x="38" y="148" width="124" height="4" rx="2" fill="#E2E8F0" opacity="0.8" />
      <rect x="38" y="156" width="95" height="4" rx="2" fill="#E2E8F0" opacity="0.6" />
      <rect x="38" y="164" width="70" height="4" rx="2" fill="#E2E8F0" opacity="0.4" />
      <rect x="38" y="174" width="60" height="12" rx="3" fill="rgba(52,211,153,0.15)" />
      <text x="68" y="183" fill="#34D399" fontSize="6.8" fontWeight="800" textAnchor="middle">&lt; 1.5s RESPUESTA</text>

      {/* 2. Agenda */}
      <rect x="188" y="118" width="144" height="78" rx="9" fill="rgba(255,255,255,0.06)" stroke="#34D399" strokeWidth="1" />
      <rect x="198" y="128" width="12" height="12" rx="2" stroke="#34D399" strokeWidth="1.2" fill="none" />
      <line x1="198" y1="132" x2="210" y2="132" stroke="#34D399" strokeWidth="0.8" />
      <text x="218" y="137" fill="#34D399" fontSize="9.5" fontWeight="900">2. AGENDA</text>
      <rect x="198" y="148" width="124" height="4" rx="2" fill="#E2E8F0" opacity="0.8" />
      <rect x="198" y="156" width="95" height="4" rx="2" fill="#E2E8F0" opacity="0.6" />
      <rect x="198" y="164" width="70" height="4" rx="2" fill="#E2E8F0" opacity="0.4" />
      <rect x="198" y="174" width="72" height="12" rx="3" fill="rgba(52,211,153,0.15)" />
      <text x="234" y="183" fill="#34D399" fontSize="6.8" fontWeight="800" textAnchor="middle">CALENDARIO EN VIVO</text>

      {/* 3. Atiende */}
      <rect x="348" y="118" width="144" height="78" rx="9" fill="rgba(255,255,255,0.06)" stroke="#34D399" strokeWidth="1" />
      <path d="M358 132 A3 3 0 0 1 364 129 H368 A3 3 0 0 1 372 132 V135 A3 3 0 0 1 368 139 H364 L360 142 Z" stroke="#34D399" strokeWidth="1.2" fill="none" />
      <text x="378" y="137" fill="#34D399" fontSize="9.5" fontWeight="900">3. ATIENDE</text>
      <rect x="358" y="148" width="124" height="4" rx="2" fill="#E2E8F0" opacity="0.8" />
      <rect x="358" y="156" width="95" height="4" rx="2" fill="#E2E8F0" opacity="0.6" />
      <rect x="358" y="164" width="70" height="4" rx="2" fill="#E2E8F0" opacity="0.4" />
      <rect x="358" y="174" width="60" height="12" rx="3" fill="rgba(52,211,153,0.15)" />
      <text x="388" y="183" fill="#34D399" fontSize="6.8" fontWeight="800" textAnchor="middle">AUDIO A TEXTO</text>

      {/* Barra de Filtro Humano / Handoff */}
      <rect x="28" y="210" width="464" height="50" rx="9" fill="#B51C12" stroke="#FFC7C4" strokeWidth="1" />
      <path d="M42 225 L37 228 V233 C37 238 42 242 42 242 C42 242 47 238 47 233 V228 Z" stroke="#FFFFFF" strokeWidth="1.3" fill="none" />
      <text x="56" y="231" fill="#FFFFFF" fontSize="9.5" fontWeight="900" letterSpacing="0.04em">FILTRO HUMANO INTELIGENTE (HANDOFF)</text>
      <text x="56" y="247" fill="#FFC7C4" fontSize="8" fontWeight="700">Derivación en tiempo real solo cuando el caso requiere tu intervención directa</text>
      <rect x="424" y="222" width="56" height="16" rx="3.5" fill="rgba(0,0,0,0.25)" />
      <text x="452" y="233" fill="#FFFFFF" fontSize="7" fontWeight="800" textAnchor="middle">0% SPAM</text>
    </svg>
  );
}

export default function LandingPageView({ onLoginClick, isLoggedIn, onGoToDashboard }: LandingPageProps) {
  // Calculator State
  const [dailyMessages, setDailyMessages] = useState<number>(120);
  const [avgTicket, setAvgTicket] = useState<number>(8500);

  // Industry Vertical Tab State
  const [activeVertical, setActiveVertical] = useState<'restaurantes' | 'servicios' | 'canchas' | 'retail' | 'fidelidad'>('restaurantes');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [selectedPlanForRegister, setSelectedPlanForRegister] = useState<'pro' | 'enterprise'>('pro');

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Betico | Software de Ventas, Captación, Fidelización e IA para WhatsApp en Costa Rica';
    
    // Meta description para motores de búsqueda (SEO)
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Betico cubre los 3 momentos clave de tu venta: prospección con sitio web personalizable, venta con tienda virtual, reservas, pagos con SINPE Móvil y tarjetas, y fidelización con tarjetas de sellos y puntos. Potenciado por tu IA favorita en WhatsApp.');

    // Datos estructurados Schema.org (JSON-LD) para indexación enriquecida
    const schemaId = 'betico-seo-jsonld';
    let schemaScript = document.getElementById(schemaId) as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = schemaId;
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Betico',
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web, WhatsApp, iOS, Android',
      'description': 'Plataforma comercial para emprendimientos en Costa Rica: sitio web oficial, tienda virtual con pagos SINPE y tarjeta, reservas con complementos, club de fidelización con sellos y puntos, y asistente de IA 24/7 en WhatsApp.',
      'offers': {
        '@type': 'Offer',
        'price': '55000',
        'priceCurrency': 'CRC',
        'availability': 'https://schema.org/InStock'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'reviewCount': '140'
      }
    });

    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      const s = document.getElementById(schemaId);
      if (s) s.remove();
    };
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ROI Calculations
  const formatColones = (num: number) => {
    return '₡' + num.toLocaleString('es-CR');
  };

  // 2.5 min per human response * 30 days
  const horasMes = Math.round((dailyMessages * 2.5 * 30) / 60);
  const jornadas = (horasMes / 8).toFixed(1);
  // ~8% extra sales converted due to <2s response
  const ventasRecuperadas = Math.round(dailyMessages * 30 * 0.08 * avgTicket);

  // Industry Verticals Data
  const verticalData = {
    restaurantes: {
      badge: 'Modo Restaurante y Comidas',
      title: 'Restaurantes, Pizzerías, Cafeterías y Sodas',
      subtitle: 'Digitaliza tus pedidos desde la mesa, para llevar o a domicilio sin pagar comisiones abusivas.',
      features: [
        {
          title: 'Pantalla de Cocina (KDS) en Tiempo Real',
          desc: 'Los pedidos de WhatsApp y de tu tienda web aparecen al instante en una pantalla táctil en cocina organizados por orden de llegada y estado (Recibido, En Cocina, Listo).'
        },
        {
          title: 'Menú QR para Comer en Mesa o Llevar',
          desc: 'Tus comensales escanean el código QR en su mesa, seleccionan sus platillos con acompañamientos y pagan al instante por SINPE Móvil o tarjeta bancaria.'
        },
        {
          title: 'Flota Propia de Delivery con GPS',
          desc: 'Asigna pedidos a tus repartidores en su propio portal móvil, con cálculo automático del costo de entrega por kilómetro usando Google Maps.'
        }
      ],
      impact: 'Atiende hasta un 40% más de comandas en horas pico y ahorra hasta ₡350.000 al mes en comisiones de plataformas de entrega.',
      ctaText: 'Probar Betico para Restaurantes'
    },
    servicios: {
      badge: 'Agenda y Servicios 24/7',
      title: 'Salones de Belleza, Barberías, Spas y Clínicas',
      subtitle: 'Llena tu agenda en automático mientras atiendes a tus clientes, sin secretarias saturadas.',
      features: [
        {
          title: 'Asistente de Citas 24/7 en WhatsApp',
          desc: 'Tu bot de IA atiende a cualquier hora, consulta la disponibilidad en tiempo real según el servicio solicitado y confirma la cita en segundos.'
        },
        {
          title: 'Portal Privado para Especialistas',
          desc: 'Cada barbero, estilista o terapeuta accede desde su propio celular con su usuario para revisar únicamente su agenda y clientes del día.'
        },
        {
          title: 'Recordatorios Automáticos 24h y 2h Antes',
          desc: 'Betico envía recordatorios directos por WhatsApp con botón de confirmación o reprogramación, reduciendo las sillas vacías al mínimo.'
        }
      ],
      impact: 'Reduce las citas olvidadas a 0% y asegura tus ingresos cobrando señas o anticipos por SINPE Móvil o tarjeta al agendar.',
      ctaText: 'Probar Betico para Citas y Salones'
    },
    canchas: {
      badge: 'Canchas y Complejos Deportivos',
      title: 'Complejos de Pádel, Fútbol 5, Tenis y Deportes',
      subtitle: 'Administra tus canchas por horas, automatiza el cobro de señas y llena los horarios nocturnos.',
      features: [
        {
          title: 'Reservas por Bloque Horario en Vivo',
          desc: 'Tus clientes eligen cancha, fecha y hora disponible desde una grilla interactiva en tu sitio web o directamente conversando con tu bot de WhatsApp.'
        },
        {
          title: 'Tarifas Diferenciadas de Día y Noche',
          desc: 'Configura precios automáticos según el horario (tarifa regular diurna o tarifa nocturna con iluminación de canchas incluida).'
        },
        {
          title: 'Cobro de Seña Inmediata con SINPE o Tarjeta',
          desc: 'El espacio solo queda reservado cuando el cliente transfiere por SINPE Móvil o paga con tarjeta, protegiendo tu cancha contra cancelaciones.'
        }
      ],
      impact: 'Elimina las reservas duplicadas por llamadas telefónicas y maximiza la ocupación de tus canchas en horarios estelares.',
      ctaText: 'Probar Betico para Canchas Deportivas'
    },
    retail: {
      badge: 'Tienda Digital y Retail',
      title: 'Tiendas de Ropa, Boutiques, Calzado y Accesorios',
      subtitle: 'Convierte tus redes sociales en ventas reales con un catálogo que cobra y despacha solo.',
      features: [
        {
          title: 'Catálogo con Variantes Completas',
          desc: 'Muestra tus productos con opciones de talla, color y modelo, con fotos automáticas enviadas al WhatsApp cuando un cliente consulta.'
        },
        {
          title: 'Integración con Correos de Costa Rica',
          desc: 'Cálculo automatizado de costos de envío para el Gran Área Metropolitana (GAM) y Resto del País, más opción de mensajería express.'
        },
        {
          title: 'Control de Stock en Tiempo Real',
          desc: 'Cada compra descuenta el inventario al instante en la tienda web y en WhatsApp, evitando ventas de productos sin existencia.'
        }
      ],
      impact: 'Aumenta tus ventas por WhatsApp hasta un 35% ofreciendo cobro directo con tarjeta y verificación automática de SINPE.',
      ctaText: 'Probar Betico para Tiendas y Boutiques'
    },
    fidelidad: {
      badge: 'Retención y Fidelización Universal',
      title: 'Club de Clientes, Tarjetas de Sellos y Puntos',
      subtitle: 'Multiplica la recompra de tu negocio con una billetera digital moderna accesible por cédula.',
      features: [
        {
          title: 'Tarjetas de Sellos Digitales en el Móvil',
          desc: 'Dile adiós a las tarjetas de cartón que se pierden o se dañan. Premia a tus clientes al acumular sellos (ej. 8 cafés o 10 cortes y el siguiente es gratis).'
        },
        {
          title: 'Acumulación de Puntos por Compras',
          desc: 'Define un porcentaje de cashback en puntos por cada colón comprado, canjeable como dinero en futuras compras o cupones de descuento.'
        },
        {
          title: 'Billetera Digital Universal por Cédula',
          desc: 'Tus clientes entran a betico.tech/fidelidad con su cédula para ver todas sus tarjetas y cupones de tus comercios, o consultan su saldo con el bot.'
        }
      ],
      impact: 'Los negocios con programa de lealtad activo reportan hasta un 45% más de frecuencia de compra y mayor ticket promedio.',
      ctaText: 'Activar Club de Fidelización'
    }
  };

  const faqs = [
    {
      q: '¿Por qué elegir Betico en lugar de contratar hosting, diseñador y bots por separado?',
      a: 'Si intentas armar tu infraestructura digital por separado necesitas pagar hosting web mensual ($15 - $30/mes), pagar un diseñador web ($300 - $800), pagar un servidor cloud para mantener el bot activo ($20 - $50/mes), pagar consumos de tokens de IA en dólares y lidiar con programadores para integrar pasarelas de pago y calendarios. Betico te da toda tu presencia digital estratégica unificada en 15 minutos por una sola tarifa plana en colones.'
    },
    {
      q: '¿Cómo funciona el nuevo Creador de Sitios Web de Betico?',
      a: 'Cada negocio tiene su propio creador visual en el panel donde puede personalizar la portada, colores corporativos, tipografía, logo blanco/oscuro y activar las secciones que necesite. Al guardar, se genera instantáneamente tu enlace web oficial (ej. betico.tech/sitio/tu-negocio) con tu tienda y botón de reservas incluidos.'
    },
    {
      q: '¿Cómo ayuda Betico a restaurantes, sodas y cafeterías?',
      a: 'Incluye Modo Restaurante con menú digital para comer en el local con número de mesa o para llevar, Pantalla de Cocina (KDS) en tiempo real para no usar comandas de papel, y portal para tus propios repartidores con cálculo de envío por kilómetro mediante Google Maps.'
    },
    {
      q: '¿Puedo administrar canchas de fútbol 5, pádel o tenis?',
      a: 'Sí. Betico cuenta con un módulo específico para complejos deportivos donde tus clientes reservan canchas por horas en vivo, con tarifas diferenciadas de día y de noche (con iluminación), confirmación inmediata y cobro de señas por SINPE o tarjeta.'
    },
    {
      q: '¿Cómo funciona el nuevo Club de Fidelización y las tarjetas de sellos?',
      a: 'Reemplaza las tarjetas de cartón que los clientes siempre pierden. Puedes crear tarjetas por sellos digitales (ej. "el 8° corte o café es gratis") o monederos de puntos por compras. Tus clientes consultan sus sellos y puntos en su billetera digital en betico.tech/fidelidad ingresando su número de cédula, o preguntándole al bot de WhatsApp.'
    },
    {
      q: '¿Cómo funciona la conexión con mi modelo de IA favorito (Gemini, OpenAI o Claude)?',
      a: 'Conectas tu clave de API de Google Gemini, OpenAI o Anthropic Claude en segundos desde tu panel. Betico aplica una arquitectura de prompts altamente eficiente que optimiza al máximo cada token consumido, logrando respuestas comerciales rápidas, precisas y con una gran utilidad sin desperdiciar presupuesto.'
    },
    {
      q: '¿Necesito cambiar mi número de WhatsApp actual?',
      a: 'No. Puedes conectar el mismo número comercial que ya tienes activo mediante código QR en menos de 2 minutos. Tus contactos, chats existentes y fotos de perfil se mantienen intactos.'
    },
    {
      q: '¿Cómo funciona la verificación de SINPE Móvil?',
      a: 'En Betico puedes ofrecer dos modalidades según prefieras: SINPE Automático, donde la pasarela verifica la transacción de forma inmediata directamente con el banco y confirma el pedido o cita en segundos; o SINPE Manual, donde tu cliente transfiere a tu número habitual y recibes el comprobante en tu panel para confirmarlo tú mismo con un clic.'
    },
    {
      q: '¿Cómo funciona el cobro con Tarjetas de Crédito y Débito en Betico?',
      a: 'Tus clientes pueden pagar con Visa, Mastercard y AMEX de manera fácil y rápida al comprar en tu tienda web, agendar una cita o reservar una cancha. La verificación es inmediata y el dinero de tus ventas se liquida directamente en tu cuenta bancaria nacional.'
    },
    {
      q: '¿El asistente entiende notas de voz y modismos costarricenses?',
      a: 'Sí. Betico procesa y transcribe audios de voz de cualquier duración y comprende expresiones locales como "pura vida", "a cachete", "brete", "señas de SINPE", horarios en lenguaje natural y nombres de cantones o distritos en Costa Rica.'
    },
    {
      q: '¿La tienda online, pasarelas de pago y agenda de citas tienen costo adicional?',
      a: 'No. Todo está unificado en una sola tarifa plana mensual en colones (₡55.000 para el plan Pro). No cobramos comisiones por pedido procesado en Betico ni cobros adicionales por citas agendadas.'
    }
  ];

  return (
    <div style={{
      backgroundColor: '#FAF8F5',
      color: '#1e293b',
      fontFamily: "'Poppins', sans-serif",
      minHeight: '100vh',
      position: 'relative'
    }}>

      {/* ==============================================================
          1. HEADER Y BARRA DE NAVEGACIÓN
      ============================================================== */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 20px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          {/* Logo Oficial Único (Máximo Protagonismo) */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, padding: '4px 0' }}
          >
            <img
              src="/logo.png"
              alt="Betico"
              style={{ height: '54px', width: 'auto', objectFit: 'contain', cursor: 'pointer', transition: 'transform 0.2s' }}
            />
          </a>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.86rem', fontWeight: '600', color: '#475569' }}>
              <a onClick={() => scrollToSection('tres-momentos')} style={{ color: '#0b3c3d', textDecoration: 'none', cursor: 'pointer', fontWeight: '800' }}>3 Momentos de Venta</a>
              <a onClick={() => scrollToSection('cerebro-ia')} style={{ color: '#b51c12', textDecoration: 'none', cursor: 'pointer', fontWeight: '800' }}>Asistente IA</a>
              <a onClick={() => scrollToSection('giros-negocio')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Giros de Negocio</a>
              <a onClick={() => scrollToSection('comparativa')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Comparativa</a>
              <a onClick={() => scrollToSection('pagos-tarjeta')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b51c12' }} />
                Pagos Tarjeta y SINPE
              </a>
              <a onClick={() => scrollToSection('calculadora-roi')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Calculadora ROI</a>
              <a onClick={() => scrollToSection('precios')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Precios</a>
            </nav>
          )}

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLoggedIn ? (
              <button
                onClick={onGoToDashboard}
                style={{
                  backgroundColor: '#0b3c3d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(11, 60, 61, 0.22)',
                  transition: 'all 0.2s'
                }}
              >
                <span>Ir al Panel</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: isMobile ? 'none' : 'inline-block'
                  }}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setSelectedPlanForRegister('pro');
                    setShowRegisterModal(true);
                  }}
                  style={{
                    backgroundColor: '#0b3c3d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(11, 60, 61, 0.22)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Zap size={16} />
                  <span>Comenzar Prueba Gratis</span>
                </button>
              </>
            )}

            {/* Mobile Hamburger Button */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'none',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Abrir Menú"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobile && mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 20px 30px rgba(0,0,0,0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            fontSize: '0.92rem',
            fontWeight: '600'
          }}>
            <a onClick={() => scrollToSection('tres-momentos')} style={{ color: '#0b3c3d', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontWeight: '800' }}>⭐ Los 3 Momentos de Venta</a>
            <a onClick={() => scrollToSection('cerebro-ia')} style={{ color: '#b51c12', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontWeight: '800' }}>🤖 Tu Asistente IA Favorito</a>
            <a onClick={() => scrollToSection('giros-negocio')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🎯 Giros de Negocio</a>
            <a onClick={() => scrollToSection('comparativa')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>⚖️ Comparativa Estratégica</a>
            <a onClick={() => scrollToSection('pagos-tarjeta')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>💳 Pagos Tarjeta y SINPE</a>
            <a onClick={() => scrollToSection('calculadora-roi')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>💰 Calculadora de Ahorro</a>
            <a onClick={() => scrollToSection('precios')} style={{ color: '#0f172a', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>🏷️ Planes y Precios</a>
            <a onClick={onLoginClick} style={{ color: '#0b3c3d', padding: '8px 0', fontWeight: 'bold' }}>🔑 Iniciar Sesión</a>
          </div>
        )}
      </header>

      {/* ==============================================================
          2. CONTENIDO PRINCIPAL
      ============================================================== */}
      <main style={{ paddingTop: '80px' }}>

        {/* ------------------------------------------------------------
            HERO SECTION
        ------------------------------------------------------------ */}
        <section style={{
          padding: isMobile ? '50px 16px 60px 16px' : '90px 24px 90px 24px',
          background: 'linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 50%, #F8FAFC 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ambient Accent Glows */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: '800px', height: '400px',
            background: 'radial-gradient(ellipse at center, rgba(11,60,61,0.08) 0%, rgba(240,67,55,0.05) 50%, transparent 80%)',
            filter: 'blur(60px)', pointerEvents: 'none'
          }} />

          <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', textAlign: 'center' }}>
            
            {/* Launch Badge Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              backgroundColor: '#fff1f0',
              border: '1px solid #ffc7c4',
              borderRadius: '9999px',
              color: '#b51c12',
              fontSize: isMobile ? '0.78rem' : '0.88rem',
              fontWeight: '700',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(240, 67, 55, 0.08)'
            }}>
              <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
                <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#f04337', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#b51c12' }} />
              </span>
              <span>⚡ Los 3 Momentos Clave de la Venta + Tu IA Favorita en WhatsApp</span>
            </div>

            {/* Hero Headline */}
            <h1 style={{
              fontSize: 'clamp(2.1rem, 5.5vw, 4.2rem)',
              fontWeight: '900',
              color: '#0f172a',
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              margin: '0 0 20px 0',
              maxWidth: '1040px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              La Herramienta que Cubre los 3 Momentos de tu Venta:{' '}
              <span style={{
                background: 'linear-gradient(135deg, #0b3c3d 0%, #134b4c 45%, #b51c12 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Prospección, Venta y Fidelización
              </span>
            </h1>

            {/* Hero Description */}
            <p style={{
              fontSize: 'clamp(1rem, 2.3vw, 1.25rem)',
              color: '#475569',
              lineHeight: 1.65,
              maxWidth: '920px',
              margin: '0 auto 36px auto',
              fontWeight: 400
            }}>
              Betico es la herramienta que te cubre en 3 momentos importantísimos de la venta: <strong>prospección y captación</strong> con un sitio web personalizable con tu línea y marca; <strong>la venta</strong> con tienda virtual con diferentes formas de pago, reservas con complementos y WhatsApp en tiempo real; y <strong>fidelización</strong> con tarjetas por puntos o sellos para premiar a clientes frecuentes. Además, potencíalo con <strong>tu IA favorita</strong> para vender, agendar y atender automáticamente, refiriendo solo lo necesario.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              marginBottom: '56px'
            }}>
              <button
                onClick={() => {
                  setSelectedPlanForRegister('pro');
                  setShowRegisterModal(true);
                }}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#0b3c3d',
                  color: 'white',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '700',
                  padding: '16px 32px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(11, 60, 61, 0.28)',
                  transition: 'all 0.2s'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Comenzar Prueba Gratis (15 Días)</span>
              </button>

              <a
                href="https://wa.me/50688888888?text=Hola%20Betico,%20quiero%20probar%20la%20demo"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: isMobile ? '100%' : 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  fontSize: '1rem',
                  fontWeight: '700',
                  padding: '16px 28px',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s'
                }}
              >
                <MessageSquare size={18} color="#b51c12" />
                <span>Probar Demo en WhatsApp</span>
              </a>
            </div>

            {/* HERO SHOWCASE: BENTO SUITE VISUAL */}
            <div style={{
              maxWidth: '960px',
              margin: '0 auto',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.10)',
              overflow: 'hidden',
              textAlign: 'left'
            }}>
              {/* Showcase Browser Bar */}
              <div style={{
                backgroundColor: '#002526',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#cbd5e1',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f04337' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ marginLeft: '8px', fontWeight: '700', color: '#f8fafc' }}>
                    Betico • Ecosistema Integral para los 3 Momentos de tu Venta
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }} />
                  <span style={{ color: '#6ee7b7', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '700' }}>
                    Sincronización Total en Tiempo Real
                  </span>
                </div>
              </div>

              {/* Bento Illustration Canvas */}
              <div style={{ padding: isMobile ? '12px' : '20px', backgroundColor: '#FAF8F5' }}>
                <HeroBentoShowcaseSvg />
              </div>

              {/* Bottom 4 Feature Summary Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ padding: '14px 16px', borderRight: isMobile ? 'none' : '1px solid #e2e8f0', borderBottom: isMobile ? '1px solid #e2e8f0' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff7f7', color: '#0b3c3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: '800', color: '#0b3c3d' }}>Momento 1</div>
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Sitio con tu Marca</strong>
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderRight: isMobile ? 'none' : '1px solid #e2e8f0', borderBottom: isMobile ? '1px solid #e2e8f0' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff7f7', color: '#0b3c3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: '800', color: '#0b3c3d' }}>Momento 2</div>
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Tienda, Citas y Pagos</strong>
                  </div>
                </div>

                <div style={{ padding: '14px 16px', borderRight: isMobile ? 'none' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fff1f0', color: '#b51c12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Award size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: '800', color: '#b51c12' }}>Momento 3</div>
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Sellos y Puntos Móviles</strong>
                  </div>
                </div>

                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#002526', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: '800', color: '#002526' }}>Núcleo IA</div>
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>Vende y Atiende 24/7</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            TRUST STRIP
        ------------------------------------------------------------ */}
        <section style={{ padding: '24px 20px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '16px' : '40px',
            color: '#64748b',
            fontSize: '0.82rem',
            fontWeight: '600'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="#0b3c3d" />
              <span>1. Prospección: Sitio Web con tu Marca</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} color="#0b3c3d" />
              <span>2. Venta: Tienda, Reservas y Pagos Nativos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#b51c12" />
              <span>3. Fidelización: Sellos y Puntos Digitales</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} color="#0b3c3d" />
              <span>Potenciado con tu Modelo de IA Favorito</span>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECCIÓN ESTRELLA: LOS 3 MOMENTOS CLAVE DE LA VENTA
        ============================================================ */}
        <section id="tres-momentos" style={{
          padding: isMobile ? '60px 16px' : '96px 24px',
          backgroundColor: '#FAF8F5',
          borderBottom: '1px solid #e2e8f0',
          position: 'relative'
        }}>
          {/* Anclas de compatibilidad con enlaces anteriores */}
          <span id="superpoderes" style={{ position: 'absolute', top: 0, left: 0 }} />
          <span id="sitio-web" style={{ position: 'absolute', top: 0, left: 0 }} />
          <span id="tienda-citas" style={{ position: 'absolute', top: 0, left: 0 }} />
          <span id="club-fidelidad" style={{ position: 'absolute', top: 0, left: 0 }} />

          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            {/* Encabezado Principal de los 3 Momentos */}
            <div style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto 44px auto' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#0b3c3d',
                backgroundColor: '#eff7f7',
                padding: '5px 16px',
                borderRadius: '9999px',
                border: '1px solid #b0dcdc',
                display: 'inline-block',
                marginBottom: '14px'
              }}>
                Ciclo Comercial Completo
              </span>
              <h2 style={{
                fontSize: 'clamp(2rem, 4.2vw, 3.1rem)',
                fontWeight: '900',
                color: '#0f172a',
                letterSpacing: '-0.5px',
                margin: '0 0 16px 0',
                lineHeight: 1.18
              }}>
                Betico te Cubre en los 3 Momentos Cruciales de tu Venta
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                Sin herramientas dispersas en dólares ni dolores de cabeza técnicos. Una solución integrada que te acompaña desde el primer clic de un prospecto hasta convertirlo en un cliente frecuente.
              </p>
            </div>

            {/* Barra de Proceso Visual / Píldoras de Navegación Rápida */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '14px',
              marginBottom: '36px'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #0b3c3d',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(11, 60, 61, 0.08)'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  backgroundColor: '#0b3c3d', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '0.95rem'
                }}>1</div>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: '800', color: '#0b3c3d', letterSpacing: '0.06em' }}>Primer Momento</span>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>Prospección y Captación</strong>
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #0b3c3d',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(11, 60, 61, 0.08)'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  backgroundColor: '#0b3c3d', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '0.95rem'
                }}>2</div>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: '800', color: '#0b3c3d', letterSpacing: '0.06em' }}>Segundo Momento</span>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>La Venta y el Cierre</strong>
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                border: '2px solid #b51c12',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(181, 28, 18, 0.08)'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  backgroundColor: '#b51c12', color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '0.95rem'
                }}>3</div>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: '800', color: '#b51c12', letterSpacing: '0.06em' }}>Tercer Momento</span>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>Fidelización y Retención</strong>
                </div>
              </div>
            </div>

            {/* LAS 3 TARJETAS MAESTRAS DE LOS MOMENTOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* MOMENTO 1: PROSPECCIÓN Y CAPTACIÓN */}
              <article style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                padding: isMobile ? '24px' : '38px',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
                gap: isMobile ? '28px' : '44px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    backgroundColor: '#eff7f7',
                    color: '#0b3c3d',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: '1px solid #b0dcdc',
                    marginBottom: '14px'
                  }}>
                    <Target size={14} />
                    <span>Momento 1 • Prospección y Captación</span>
                  </div>

                  <h3 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: '900', color: '#0f172a', margin: '0 0 12px 0', lineHeight: 1.25 }}>
                    Sitio Web Personalizable con tu Línea y Marca
                  </h3>

                  <p style={{ color: '#64748b', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '22px' }}>
                    Para que no dependas exclusivamente de perfiles de redes sociales ni pagues costosos diseñadores web, Betico te entrega tu sitio web oficial listo para recibir visitantes y convertirlos en prospectos.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '26px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Tu Línea y Marca Propia:</strong> Sube tu logo para fondos claros u oscuros, elige colores corporativos y activa modo dividido o portada cover.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Enlace Web Oficial:</strong> Tu dirección lista (<span style={{ fontFamily: 'monospace', color: '#0b3c3d', fontWeight: '700' }}>betico.tech/sitio/tu-marca</span>) para colocar en tu biografía de Instagram, TikTok o perfil de Google.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Cero Gastos de Hosting:</strong> Carga ultrarrápida, certificado de seguridad SSL y 100% responsivo para cualquier celular o computadora.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700' }}>Logo Adaptable</span>
                    <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700' }}>Paleta de Colores</span>
                    <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#eff7f7', color: '#0b3c3d', fontWeight: '700' }}>✓ SSL y Hosting Incluido</span>
                  </div>
                </div>

                {/* Gráfico SVG Puro */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <CaptacionWebsiteSvg />
                </div>
              </article>

              {/* MOMENTO 2: LA VENTA Y EL CIERRE */}
              <article style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                padding: isMobile ? '24px' : '38px',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
                gap: isMobile ? '28px' : '44px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    backgroundColor: '#eff7f7',
                    color: '#0b3c3d',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: '1px solid #b0dcdc',
                    marginBottom: '14px'
                  }}>
                    <ShoppingBag size={14} />
                    <span>Momento 2 • La Venta y el Cierre</span>
                  </div>

                  <h3 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: '900', color: '#0f172a', margin: '0 0 12px 0', lineHeight: 1.25 }}>
                    Tienda Virtual, Reservas con Complementos y WhatsApp en Vivo
                  </h3>

                  <p style={{ color: '#64748b', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '22px' }}>
                    Toma el control total de tu proceso de venta. Ya sea que vendas productos físicos, alimentos, citas de servicios o alquiler de canchas, ofreces múltiples métodos de pago y contacto directo durante todo el pedido.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '26px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Tienda Digital Completa:</strong> Carrito de compras, cupones de descuento, cálculo de entregas por GPS y control de existencias en tiempo real.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Reservas con Múltiples Complementos:</strong> Agenda servicios con selección de especialista, duración, extras y cobro de señas para garantizar la cita.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Múltiples Formas de Pago Nativas:</strong> Acepta tarjetas <strong>Visa, Mastercard y AMEX</strong> (3D Secure) y <strong>SINPE Móvil</strong> con confirmación automática o manual.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>WhatsApp en Tiempo Real:</strong> Acompaña a tus clientes con notificaciones de confirmación, estatus de preparación y atención en vivo en cada paso.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#eff7f7', color: '#0b3c3d', fontWeight: '700' }}>Visa • MC • AMEX</span>
                    <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#eff7f7', color: '#0b3c3d', fontWeight: '700' }}>SINPE Móvil Inmediato</span>
                    <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700' }}>WhatsApp Multicanal</span>
                  </div>
                </div>

                {/* Gráfico SVG Puro */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <VentaProcesoPasoSvg />
                </div>
              </article>

              {/* MOMENTO 3: FIDELIZACIÓN Y RETENCIÓN */}
              <article style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                padding: isMobile ? '24px' : '38px',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
                gap: isMobile ? '28px' : '44px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    backgroundColor: '#fff1f0',
                    color: '#b51c12',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: '1px solid #ffc7c4',
                    marginBottom: '14px'
                  }}>
                    <Award size={14} />
                    <span>Momento 3 • Fidelización y Retención</span>
                  </div>

                  <h3 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', fontWeight: '900', color: '#0f172a', margin: '0 0 12px 0', lineHeight: 1.25 }}>
                    Tarjetas de Fidelización por Puntos o Sellos Digitales
                  </h3>

                  <p style={{ color: '#64748b', fontSize: '0.96rem', lineHeight: 1.6, marginBottom: '22px' }}>
                    Tener clientes nuevos es solo la mitad de la meta. Betico te ofrece un sistema de fidelización que te permite registrar a tus clientes más frecuentes y fomentar un vínculo genuino para que vuelvan siempre.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '26px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#b51c12" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Tarjetas de Sellos Móviles:</strong> Sustituye las tarjetas de cartón. Gamifica el consumo recurrente (ej. completa 8 sellos y el 9° es gratis) directamente en el celular.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#b51c12" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Monedero de Puntos y Cashback:</strong> Devuelve un porcentaje en colones por cada compra que tus clientes pueden canjear en caja o en la tienda.
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#b51c12" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                        <strong style={{ color: '#0f172a' }}>Registro sin Doble Esfuerzo:</strong> Se habilitan automáticamente desde los expedientes de citas y compras para que el cliente acceda con su cédula en <span style={{ fontFamily: 'monospace', color: '#b51c12', fontWeight: '700' }}>betico.tech/fidelidad</span> sin descargar apps.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#fff1f0', color: '#b51c12', fontWeight: '700' }}>Sellos Digitales</span>
                    <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#fff1f0', color: '#b51c12', fontWeight: '700' }}>Puntos en Colones</span>
                    <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700' }}>Sin Cartones que se Pierdan</span>
                  </div>
                </div>

                {/* Gráfico SVG Puro */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <FidelizacionSvg />
                </div>
              </article>

            </div>

          </div>
        </section>

        {/* ============================================================
            SECCIÓN TRANSVERSAL: POTENCIA CON TU IA FAVORITA
        ============================================================ */}
        <section id="cerebro-ia" style={{
          padding: isMobile ? '60px 16px' : '96px 24px',
          backgroundColor: '#002526',
          color: '#ffffff',
          borderBottom: '1px solid #134b4c',
          position: 'relative'
        }}>
          {/* Ancla de compatibilidad */}
          <span id="motor-ia" style={{ position: 'absolute', top: 0, left: 0 }} />

          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto 44px auto' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#34d399',
                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                padding: '5px 16px',
                borderRadius: '9999px',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                display: 'inline-block',
                marginBottom: '14px'
              }}>
                Inteligencia Artificial Operativa 24/7
              </span>
              <h2 style={{
                fontSize: 'clamp(2rem, 4.2vw, 3.1rem)',
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: '-0.5px',
                margin: '0 0 16px 0',
                lineHeight: 1.18
              }}>
                Potencia tu Herramienta con tu IA Favorita
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                Conecta tu modelo preferido para que <strong style={{ color: '#34d399' }}>venda, agende y atienda a tus clientes de forma automática</strong>, y <strong style={{ color: '#ffc7c4' }}>solo te refiera los mensajes que sean necesarios de tu atención</strong>.
              </p>
            </div>

            {/* Layout Gráfico SVG + 4 Pilares de Automatización */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? '32px' : '48px',
              alignItems: 'center'
            }}>
              {/* Columna SVG */}
              <div>
                <CerebroIaOrchestratorSvg />
              </div>

              {/* Columna de 4 Beneficios de Automatización */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '18px 22px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: '800', color: '#ffffff' }}>
                      1. Vende en Automático
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5 }}>
                      Consulta tu stock en 0 segundos, recomienda productos con variantes y envía el enlace de pago directo por WhatsApp.
                    </p>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '18px 22px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: '800', color: '#ffffff' }}>
                      2. Agenda Citas y Canchas en Vivo
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5 }}>
                      Verifica horarios en tiempo real, asigna al especialista o cancha correspondiente y registra la reserva sin cruce de agendas.
                    </p>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '18px 22px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: '800', color: '#ffffff' }}>
                      3. Atiende 24/7 y Entiende Notas de Voz
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5 }}>
                      Transcribe audios de voz al instante, comprende expresiones costarricenses y resuelve dudas frecuentes a cualquier hora de la noche.
                    </p>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(181, 28, 18, 0.18)',
                  border: '1px solid rgba(255, 199, 196, 0.3)',
                  borderRadius: '16px',
                  padding: '18px 22px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#b51c12', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.02rem', fontWeight: '800', color: '#ffffff' }}>
                      4. Derivación Humana Inteligente (Handoff)
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#ffc7c4', lineHeight: 1.5 }}>
                      Si el cliente pide un asesor o requiere atención especializada, la IA transfiere el chat a tu WhatsApp para que intervengas con un toque.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            NUEVA SECCIÓN: COMPARATIVA ESTRATÉGICA
        ------------------------------------------------------------ */}
        <section id="comparativa" style={{
          padding: isMobile ? '60px 16px' : '90px 24px',
          backgroundColor: '#FAF8F5',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 48px auto' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#b51c12',
                backgroundColor: '#fff1f0',
                padding: '4px 14px',
                borderRadius: '9999px',
                border: '1px solid #ffc7c4',
                display: 'inline-block',
                marginBottom: '12px'
              }}>
                Presencia Digital Estratégica
              </span>
              <h2 style={{
                fontSize: 'clamp(1.9rem, 4vw, 2.9rem)',
                fontWeight: '900',
                color: '#0f172a',
                letterSpacing: '-0.5px',
                margin: '0 0 16px 0',
                lineHeight: 1.2
              }}>
                La Integración que Todo Emprendimiento Necesita para Operar en Digital
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                Si intentas armar esta solución por tu cuenta necesitarías múltiples servicios en dólares, desarrolladores y semanas de ajustes técnicos. Compara el camino tradicional frente a la solución integrada de Betico:
              </p>
            </div>

            {/* Comparison Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '28px',
              alignItems: 'stretch'
            }}>
              
              {/* Card 1: Camino Tradicional */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: isMobile ? '24px' : '36px',
                border: '1px solid #fecaca',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: '1px solid #fee2e2',
                    marginBottom: '16px'
                  }}>
                    <XCircle size={14} />
                    <span>El Camino Tradicional (Fraccionado y Costoso)</span>
                  </div>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#991b1b', margin: '0 0 8px 0' }}>
                    5 o Más Servicios Separados
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.55, marginBottom: '22px' }}>
                    Contratar herramientas aisladas genera cobros sorpresa en dólares, problemas de sincronización y dependencia técnica constante.
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Hosting Web y Dominio:</strong>
                        <span style={{ color: '#64748b' }}> Pago mensual recurrente de $15 a $30 USD solo por mantener una página web encendida.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Diseñador o Creador Web:</strong>
                        <span style={{ color: '#64748b' }}> Inversión inicial de $300 a $800 USD, más cobros por cada cambio de fotos o precios.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Servidor Cloud (VPS) para el Bot:</strong>
                        <span style={{ color: '#64748b' }}> Alquilar un servidor en la nube ($20 a $50 USD/mes) y configurarlo para que el bot no se apague.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Construir y Programar el Bot de IA:</strong>
                        <span style={{ color: '#64748b' }}> Desarrollar los flujos, conectar APIs complejas y pagar consumo de tokens en dólares cada mes.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Ajustar Todo para que Funcione:</strong>
                        <span style={{ color: '#64748b' }}> Semanas de dolores de cabeza intentando que el bot sepa el stock de la tienda y la agenda de citas.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div style={{
                  marginTop: '26px',
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: '#fff5f5',
                  border: '1px solid #fed7d7',
                  fontSize: '0.82rem',
                  color: '#991b1b',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  Costo estimado: Más de $150 USD/mes + $500 USD de desarrollo inicial y semanas de configuración.
                </div>
              </div>

              {/* Card 2: La Solución Integrada Betico */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: isMobile ? '24px' : '36px',
                border: '2px solid #0b3c3d',
                boxShadow: '0 12px 36px rgba(11, 60, 61, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-13px',
                  right: '28px',
                  backgroundColor: '#0b3c3d',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  boxShadow: '0 2px 8px rgba(11, 60, 61, 0.25)'
                }}>
                  Solución Estratégica Todo en Uno
                </div>

                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    backgroundColor: '#eff7f7',
                    color: '#0b3c3d',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: '1px solid #b0dcdc',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle2 size={14} color="#0b3c3d" />
                    <span>Con Betico (Unificado, Simple y en Colones)</span>
                  </div>

                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0b3c3d', margin: '0 0 8px 0' }}>
                    Toda tu Infraestructura en una Sola Plataforma
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.55, marginBottom: '22px' }}>
                    Obtén toda tu presencia digital lista para operar en 15 minutos, sin programadores, sin hosting externo y con tarifa fija en colones.
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Sitio Web Oficial en Minutos:</strong>
                        <span style={{ color: '#475569' }}> Tu dirección propia (betico.tech/sitio/tu-marca) con hosting de alta velocidad y certificado SSL incluido.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Potencia tu Modelo de IA Favorito:</strong>
                        <span style={{ color: '#475569' }}> Conecta tu clave de API de Gemini, OpenAI o Claude en segundos. Prompts optimizados para sacarle la máxima utilidad a tus tokens con el menor costo operativo.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Tienda, Citas y Canchas Conectadas:</strong>
                        <span style={{ color: '#475569' }}> Todo integrado por defecto: si un cliente compra o agenda, el inventario y el calendario se sincronizan en 0s.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Pasarelas de Pago Nativas:</strong>
                        <span style={{ color: '#475569' }}> Acepta tarjetas Visa, Mastercard y AMEX con verificación directa y depósito en tu cuenta bancaria nacional.</span>
                      </div>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckCircle2 size={18} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#0f172a' }}>Club de Fidelidad y Sellos Digitales:</strong>
                        <span style={{ color: '#475569' }}> Monedero digital por cédula (betico.tech/fidelidad) para que tus clientes acumulen sellos y puntos recurrentes.</span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div style={{
                  marginTop: '26px',
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: '#eff7f7',
                  border: '1px solid #b0dcdc',
                  fontSize: '0.85rem',
                  color: '#0b3c3d',
                  fontWeight: '700',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Zap size={16} />
                  <span>Tarifa plana en colones: ₡55.000/mes • Sin comisiones • Listo en 15 minutos 🇨🇷</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            NUEVA SECCIÓN: SELECTOR POR GIRO DE NEGOCIO
        ------------------------------------------------------------ */}
        <section id="giros-negocio" style={{
          padding: isMobile ? '60px 16px' : '90px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px auto' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#0b3c3d',
                backgroundColor: '#eff7f7',
                padding: '4px 14px',
                borderRadius: '9999px',
                border: '1px solid #b0dcdc',
                display: 'inline-block',
                marginBottom: '12px'
              }}>
                Especializado por Industria
              </span>
              <h2 style={{
                fontSize: 'clamp(1.9rem, 4vw, 2.9rem)',
                fontWeight: '900',
                color: '#0f172a',
                letterSpacing: '-0.5px',
                margin: '0 0 16px 0',
                lineHeight: 1.2
              }}>
                Diseñado a la Medida de tu Giro de Negocio
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                Cada negocio tiene dinámicas operativas diferentes. Elige tu giro de negocio y conoce cómo Betico se adapta a tu día a día:
              </p>
            </div>

            {/* Industry Selector Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-start' : 'center',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '16px',
              marginBottom: '32px',
              scrollbarWidth: 'none'
            }}>
              {[
                { id: 'restaurantes', label: 'Restaurantes y Cafeterías', icon: Utensils },
                { id: 'servicios', label: 'Salones y Barberías', icon: Scissors },
                { id: 'canchas', label: 'Canchas Deportivas y Pádel', icon: Trophy },
                { id: 'retail', label: 'Tiendas y Boutiques', icon: ShoppingBag },
                { id: 'fidelidad', label: 'Club de Fidelización', icon: Award }
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeVertical === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveVertical(tab.id as any)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '14px',
                      border: isActive ? '2px solid #0b3c3d' : '1px solid #e2e8f0',
                      backgroundColor: isActive ? '#0b3c3d' : '#ffffff',
                      color: isActive ? '#ffffff' : '#475569',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: isActive ? '0 4px 14px rgba(11, 60, 61, 0.2)' : 'none',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    <IconComponent size={18} color={isActive ? '#ffffff' : '#0b3c3d'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Industry Showcase Card */}
            {(() => {
              const current = verticalData[activeVertical];
              return (
                <div style={{
                  backgroundColor: '#FAF8F5',
                  borderRadius: '24px',
                  padding: isMobile ? '24px' : '40px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b51c12', display: 'block', marginBottom: '4px' }}>
                        {current.badge}
                      </span>
                      <h3 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
                        {current.title}
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                        {current.subtitle}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlanForRegister('pro');
                        setShowRegisterModal(true);
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#0b3c3d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(11, 60, 61, 0.2)'
                      }}
                    >
                      <Zap size={16} />
                      <span>{current.ctaText}</span>
                    </button>
                  </div>

                  {/* 3 Key Features */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                    {current.features.map((feat, idx) => (
                      <div key={idx} style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <CheckCircle2 size={18} color="#0b3c3d" />
                          <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            {feat.title}
                          </h4>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
                          {feat.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Impact Bar */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '1px solid #b0dcdc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#0b3c3d',
                    fontSize: '0.88rem'
                  }}>
                    <Sparkles size={20} color="#b51c12" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: '#0f172a' }}>Impacto Comprobado: </strong>
                      <span>{current.impact}</span>
                    </div>
                  </div>

                </div>
              );
            })()}

          </div>
        </section>



        {/* ------------------------------------------------------------
            4. PASARELA DE TARJETAS Y RESPALDO BANCARIO 3D SECURE
        ------------------------------------------------------------ */}
        <section id="pagos-tarjeta" style={{ padding: isMobile ? '60px 16px' : '90px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', gap: isMobile ? '40px' : '60px', alignItems: 'center' }}>
              
              {/* Text y Features */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: '#fff1f0', color: '#b51c12', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', border: '1px solid #ffc7c4', marginBottom: '16px' }}>
                  <ShieldCheck size={16} />
                  <span>Nuevo Superpoder • Pasarela de Tarjetas Tilopay</span>
                </div>

                <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: '900', color: '#0f172a', lineHeight: 1.18, letterSpacing: '-0.5px', margin: '0 0 18px 0' }}>
                  Acepta <span style={{ color: '#0b3c3d' }}>Tarjetas de Crédito y Débito</span> con Respaldo Bancario 3D Secure
                </h2>

                <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.65, marginBottom: '24px' }}>
                  Multiplica tus ventas permitiendo que tus clientes paguen en segundos con tarjeta o SINPE Móvil. Integración directa y segura para recibir tus ingresos en tu propia cuenta bancaria en colones o dólares, con verificación automática e inmediata.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <ShieldCheck size={18} color="#0b3c3d" />
                      <span>Pagos Seguros y Verificados</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      Confirmación directa con el banco del cliente en segundos. Máxima tranquilidad para ti y para tu cliente.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Zap size={18} color="#0b3c3d" />
                      <span>Verificación Inmediata</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      El pago se aprueba al instante, el pedido pasa directo a preparación y tu cliente recibe la confirmación por WhatsApp.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Building2 size={18} color="#b51c12" />
                      <span>Directo a tu Cuenta</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      Sin intermediarios reteniendo tu dinero. Las ventas en colones o dólares se depositan en tu propia cuenta bancaria.
                    </p>
                  </div>

                  <div style={{ backgroundColor: '#FAF8F5', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginBottom: '4px' }}>
                      <Store size={18} color="#0b3c3d" />
                      <span>Todos los Métodos de Pago</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                      Tarjetas bancarias, SINPE Móvil (automático o con comprobante), transferencias y pago contra entrega.
                    </p>
                  </div>
                </div>

                {/* Supported Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: '700', color: '#334155' }}>Tarjetas y Redes Soportadas:</span>
                  <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontWeight: '700', color: '#0f172a', border: '1px solid #e2e8f0' }}>VISA</span>
                  <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontWeight: '700', color: '#0f172a', border: '1px solid #e2e8f0' }}>Mastercard</span>
                  <span style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontWeight: '700', color: '#0f172a', border: '1px solid #e2e8f0' }}>American Express</span>
                  <span style={{ padding: '4px 10px', backgroundColor: '#eff7f7', borderRadius: '6px', fontWeight: '700', color: '#0b3c3d', border: '1px solid #b0dcdc' }}>SINPE Móvil</span>
                </div>
              </div>

              {/* Graphic Card Visual Showcase */}
              <div>
                <div style={{
                  backgroundColor: '#002526',
                  color: 'white',
                  borderRadius: '24px',
                  padding: isMobile ? '20px' : '28px',
                  boxShadow: '0 25px 50px -12px rgba(0, 37, 38, 0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f04337' }} />
                      <span style={{ color: '#cbd5e1', fontWeight: '600' }}>Pasarela Segura Integrada</span>
                    </div>
                    <span style={{ backgroundColor: '#0b3c3d', color: '#b0dcdc', padding: '3px 10px', borderRadius: '9999px', fontFamily: 'monospace', fontSize: '0.72rem', border: '1px solid rgba(176,220,220,0.3)' }}>
                      Verificación Oficial
                    </span>
                  </div>

                  {/* Simulated Bank Card */}
                  <div style={{
                    marginTop: '20px',
                    background: 'linear-gradient(135deg, #0b3c3d 0%, #134b4c 60%, #072e2f 100%)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b0dcdc' }}>Pasarela Bancaria</span>
                        <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '0.95rem', letterSpacing: '2px' }}>•••• •••• •••• 4281</p>
                      </div>
                      <span style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px', color: '#ffc7c4' }}>VISA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#b0dcdc', display: 'block' }}>Titular</span>
                        <span style={{ fontWeight: '600', letterSpacing: '0.5px' }}>CLIENTE VERIFICADO</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#b0dcdc', display: 'block' }}>Vencimiento</span>
                        <span style={{ fontFamily: 'monospace' }}>12/28</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span>Orden Comercial:</span>
                      <strong style={{ color: 'white' }}>#ORD-104</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span>Monto Acreditado:</span>
                      <strong style={{ color: '#ffc7c4', fontSize: '0.92rem' }}>₡14.500</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <span>Estado del Pago:</span>
                      <span style={{ color: '#b0dcdc', backgroundColor: '#0b3c3d', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1a5f60' }}>
                        ✓ Cancelado con Tarjeta (Tilopay)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', paddingTop: '2px' }}>
                      <span>Impacto en Tienda:</span>
                      <span>📦 Stock Descontado en 0s</span>
                    </div>
                  </div>

                  {/* Conversion Tip */}
                  <div style={{ marginTop: '18px', backgroundColor: 'rgba(11,60,61,0.6)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(176,220,220,0.2)', fontSize: '0.76rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="#ffc7c4" style={{ flexShrink: 0 }} />
                    <span><strong>Dato de Conversión:</strong> Ofrecer tarjeta bancaria junto a SINPE reduce el abandono de carritos hasta un <strong>35%</strong>.</span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------
            5. CALCULADORA INTERACTIVA DE ROI
        ------------------------------------------------------------ */}
        <section id="calculadora-roi" style={{ padding: isMobile ? '60px 16px' : '100px 24px', backgroundColor: '#FAF8F5' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 48px auto' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0b3c3d', backgroundColor: '#eff7f7', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #b0dcdc', display: 'inline-block', marginBottom: '12px' }}>
                Calcula tu Retorno de Inversión
              </span>
              <h2 style={{ fontSize: 'clamp(1.9rem, 3.8vw, 2.8rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', margin: '0 0 12px 0' }}>
                ¿Cuánto Dinero y Horas Ahorrarás con Betico?
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.98rem', margin: 0 }}>
                Mueve los deslizadores según el volumen de mensajes y ticket promedio de tu negocio.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', padding: isMobile ? '24px' : '40px', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(0,0,0,0.04)' }}>
              
              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
                
                {/* Slider 1: Mensajes */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={18} color="#0b3c3d" />
                      <span>Mensajes recibidos al día:</span>
                    </label>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0b3c3d', fontFamily: 'monospace', backgroundColor: '#eff7f7', padding: '4px 12px', borderRadius: '8px', border: '1px solid #b0dcdc' }}>
                      {dailyMessages} msgs
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="800"
                    step="10"
                    value={dailyMessages}
                    onChange={(e) => setDailyMessages(parseInt(e.target.value))}
                    style={{ width: '100%', height: '8px', borderRadius: '6px', appearance: 'none', backgroundColor: '#e2e8f0', accentColor: '#0b3c3d', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px', fontFamily: 'monospace' }}>
                    <span>20 msgs/día</span>
                    <span>400 msgs/día</span>
                    <span>800 msgs/día</span>
                  </div>
                </div>

                {/* Slider 2: Ticket Promedio */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={18} color="#b51c12" />
                      <span>Ticket promedio de venta:</span>
                    </label>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#b51c12', fontFamily: 'monospace', backgroundColor: '#fff1f0', padding: '4px 12px', borderRadius: '8px', border: '1px solid #ffc7c4' }}>
                      {formatColones(avgTicket)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="60000"
                    step="500"
                    value={avgTicket}
                    onChange={(e) => setAvgTicket(parseInt(e.target.value))}
                    style={{ width: '100%', height: '8px', borderRadius: '6px', appearance: 'none', backgroundColor: '#e2e8f0', accentColor: '#b51c12', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px', fontFamily: 'monospace' }}>
                    <span>₡2.000</span>
                    <span>₡30.000</span>
                    <span>₡60.000</span>
                  </div>
                </div>

              </div>

              {/* Dynamic Results Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                
                {/* Hours Saved */}
                <div style={{ background: 'linear-gradient(135deg, #eff7f7 0%, #ffffff 100%)', padding: '24px', borderRadius: '16px', border: '1px solid #b0dcdc' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0b3c3d', display: 'block', marginBottom: '6px' }}>
                    Tiempo de Atención Ahorrado
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: '900', color: '#0b3c3d', letterSpacing: '-0.5px' }}>
                      {horasMes} Horas
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#072e2f', fontWeight: '600' }}>/ mes</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                    Equivalente a <strong style={{ color: '#0f172a' }}>{jornadas} jornadas laborales completas</strong> recuperadas.
                  </p>
                </div>

                {/* Recovered Revenue */}
                <div style={{ background: 'linear-gradient(135deg, #002526 0%, #0b3c3d 100%)', padding: '24px', borderRadius: '16px', border: '1px solid #072e2f', color: 'white' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ffc7c4', display: 'block', marginBottom: '6px' }}>
                    Ventas Estimadas Recuperadas
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: 'clamp(2rem, 3.5vw, 2.5rem)', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
                      {formatColones(ventasRecuperadas)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600' }}>/ mes</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Por respuestas inmediatas en menos de 2 segundos en horario nocturno y festivo.
                  </p>
                </div>

              </div>

              <div style={{ marginTop: '28px', textAlign: 'center' }}>
                <a
                  href="#precios"
                  onClick={(e) => { e.preventDefault(); scrollToSection('precios'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '700', color: '#0b3c3d', textDecoration: 'none' }}
                >
                  <span>Descubre cómo comenzar con Betico hoy</span>
                  <ArrowRight size={16} />
                </a>
              </div>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            6. PRECIOS Y PLANES EN COLONES
        ------------------------------------------------------------ */}
        <section id="precios" style={{ padding: isMobile ? '60px 16px' : '100px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 60px auto' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#b51c12', backgroundColor: '#fff1f0', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #ffc7c4', display: 'inline-block', marginBottom: '12px' }}>
                Precios Transparentes en Colones
              </span>
              <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', margin: '0 0 16px 0' }}>
                Planes Todo Incluido con 15 Días de Prueba Gratis
              </h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                Comienza a operar hoy mismo sin tarjeta de crédito. Paga en colones por SINPE Móvil o transferencia. Sin cobros sorpresa en dólares.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '30px', maxWidth: '1000px', margin: '0 auto', alignItems: 'stretch' }}>
              
              {/* Plan Betico Pro (Destacado) */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: isMobile ? '28px 20px' : '38px 30px',
                border: '2px solid #0b3c3d',
                boxShadow: '0 12px 36px rgba(11, 60, 61, 0.12)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  position: 'absolute', top: '-14px', left: '32px',
                  backgroundColor: '#b51c12', color: 'white', fontSize: '0.75rem', fontWeight: '800',
                  padding: '4px 14px', borderRadius: '9999px', letterSpacing: '0.06em', textTransform: 'uppercase',
                  boxShadow: '0 2px 6px rgba(181, 28, 18, 0.3)'
                }}>
                  15 Días de Prueba Gratis
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingTop: '4px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>Plan Betico Pro</h3>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Para todo comercio que busca vender y agendar en automático.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '20px 0' }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: '900', color: '#0b3c3d', letterSpacing: '-1px' }}>₡55.000</span>
                    <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: '600' }}>/ mes</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.88rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>1 Número de WhatsApp</strong> Conectado</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Potencia tu IA Favorita</strong> (Gemini, OpenAI, Claude con prompts optimizados para máximo ahorro de tokens)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Comprensión de Notas de Voz</strong> de WhatsApp</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Creador de Sitios Web Oficial</strong> (<span style={{ color: '#0b3c3d', fontFamily: 'monospace' }}>betico.tech/sitio/tu-marca</span>)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Tienda Online y Menú</strong> con pedidos a WhatsApp</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Pagos con Tarjeta Débito y Crédito</strong> (Visa, Mastercard, AMEX)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Agenda de Citas y Reservas 24/7</strong> con cobro en línea opcional</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#b51c12" /> <span><strong>Club de Fidelización y Sellos</strong> (Billetera web en betico.tech/fidelidad)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#b51c12" /> <span><strong>Verificación de SINPE Móvil</strong> (Automática y Manual)</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Modo Restaurante con Pantalla de Cocina (KDS) y Delivery por GPS</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Módulo de Canchas Deportivas con Tarifas de Día y Noche</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Portal para Especialistas, Colaboradores y Repartidores</span></li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanForRegister('pro');
                    setShowRegisterModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#0b3c3d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '1rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(11, 60, 61, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Zap size={18} />
                  <span>Comenzar Prueba Gratis (15 Días)</span>
                </button>
              </div>

              {/* Plan Betico Empresa */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                padding: isMobile ? '28px 20px' : '38px 30px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>Plan Betico Empresa</h3>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Para franquicias, cadenas y negocios con múltiples sucursales.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '20px 0' }}>
                    <span style={{ fontSize: '2.8rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>₡85.000</span>
                    <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: '600' }}>/ mes</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '0.88rem', color: '#334155' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Todo lo incluido en Plan Betico Pro</strong></span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Múltiples Sucursales o Sedes</strong></span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span><strong>Enrutamiento Inteligente de Pedidos por GPS</strong></span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Pantallas KDS y Repartidores Independientes por Sede</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Cuentas SINPE y Bancos Separados por Local</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#0b3c3d" /> <span>Acceso para Múltiples Administradores y Roles</span></li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><CheckCircle2 size={18} color="#b51c12" /> <span><strong>Soporte Prioritario VIP 24/7 por WhatsApp</strong></span></li>
                  </ul>
                </div>

                <a
                  href="https://wa.me/50688888888?text=Hola%20Betico,%20quiero%20conocer%20el%20Plan%20Empresa"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#002526',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '1rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxSizing: 'border-box'
                  }}
                >
                  <Building2 size={18} />
                  <span>Probar Plan Empresa Gratis</span>
                </a>
              </div>

            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            7. PREGUNTAS FRECUENTES (FAQ ACORDEÓN)
        ------------------------------------------------------------ */}
        <section style={{ padding: isMobile ? '60px 16px' : '100px 24px', backgroundColor: '#FAF8F5' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0b3c3d', backgroundColor: '#eff7f7', padding: '4px 14px', borderRadius: '9999px', border: '1px solid #b0dcdc', display: 'inline-block', marginBottom: '12px' }}>
                Despeja tus Dudas
              </span>
              <h2 style={{ fontSize: 'clamp(1.9rem, 3.8vw, 2.8rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', margin: 0 }}>
                Preguntas Frecuentes
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        padding: '18px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: isOpen ? '#0b3c3d' : '#0f172a',
                        transition: 'color 0.2s'
                      }}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        color={isOpen ? '#0b3c3d' : '#94a3b8'}
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s',
                          flexShrink: 0
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '0 24px 20px 24px',
                        fontSize: '0.88rem',
                        lineHeight: 1.65,
                        color: '#475569',
                        borderTop: '1px solid #f1f5f9'
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------
            8. PRE-FOOTER LLAMADA A LA ACCIÓN
        ------------------------------------------------------------ */}
        <section style={{
          padding: isMobile ? '60px 20px' : '80px 24px',
          backgroundColor: '#002526',
          color: 'white',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <span style={{ display: 'inline-block', padding: '4px 14px', backgroundColor: 'rgba(240, 67, 55, 0.2)', color: '#ffc7c4', fontSize: '0.78rem', fontWeight: '700', borderRadius: '9999px', border: '1px solid rgba(240, 67, 55, 0.3)', marginBottom: '16px' }}>
              Prueba Gratuita de 15 Días • Sin Compromiso
            </span>
            <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.9rem)', fontWeight: '900', letterSpacing: '-0.5px', margin: '0 0 16px 0' }}>
              Empieza a automatizar tu negocio hoy mismo
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '650px', margin: '0 auto 32px auto', fontWeight: 300 }}>
              Configura tu sitio web oficial, conecta tu WhatsApp, activa pagos con tarjeta y SINPE Móvil en menos de 15 minutos.
            </p>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
              <button
                onClick={() => {
                  setSelectedPlanForRegister('pro');
                  setShowRegisterModal(true);
                }}
                style={{
                  width: isMobile ? '100%' : 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#b51c12',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(181, 28, 18, 0.3)'
                }}
              >
                <span>Crear Cuenta Gratis</span>
                <ArrowRight size={16} />
              </button>
              <a
                href="https://wa.me/50688888888?text=Hola%20Betico,%20quiero%20hablar%20con%20un%20asesor"
                target="_blank"
                rel="noreferrer"
                style={{
                  width: isMobile ? '100%' : 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#0b3c3d',
                  color: 'white',
                  border: '1px solid #1a5f60',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  padding: '14px 26px',
                  borderRadius: '12px',
                  textDecoration: 'none'
                }}
              >
                <MessageSquare size={16} color="#ffc7c4" />
                <span>Hablar con un Asesor</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* ==============================================================
          9. FOOTER COMPLETO
      ============================================================== */}
      <footer style={{ backgroundColor: '#ffffff', color: '#475569', borderTop: '1px solid #e2e8f0', paddingTop: '60px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr 1fr 1.2fr', gap: isMobile ? '32px' : '40px', paddingBottom: '48px', borderBottom: '1px solid #e2e8f0' }}>
            
            {/* Logo y Resumen (Máximo Protagonismo) */}
            <div>
              <div style={{ marginBottom: '18px' }}>
                <img src="/logo.png" alt="Betico" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, maxWidth: '300px', margin: '0 0 16px 0' }}>
                La plataforma SaaS costarricense que une tu sitio web oficial, tienda digital, agenda de citas, canchas, fidelización e inteligencia artificial en WhatsApp.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff7f7', color: '#0b3c3d', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #b0dcdc' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0b3c3d' }} />
                <span>Sistema 100% Operativo</span>
              </div>
            </div>

            {/* 5 Superpoderes */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '14px' }}>
                5 Superpoderes
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <li><a onClick={() => scrollToSection('sitio-web')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Sitio Web Oficial</a></li>
                <li><a onClick={() => scrollToSection('motor-ia')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Tu Modelo IA Favorito</a></li>
                <li><a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Tienda Digital y Pagos</a></li>
                <li><a onClick={() => scrollToSection('tienda-citas')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Agenda de Citas y Reservas</a></li>
                <li><a onClick={() => scrollToSection('club-fidelidad')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Club de Fidelidad y Sellos</a></li>
                <li><a onClick={() => scrollToSection('pagos-tarjeta')} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Tarjetas y SINPE Móvil</a></li>
              </ul>
            </div>

            {/* Legal y Soporte */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '14px' }}>
                Legal y Soporte
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <li><a href="/legal/privacidad" style={{ color: '#64748b', textDecoration: 'none' }}>Política de Privacidad</a></li>
                <li><a href="/legal/terminos" style={{ color: '#64748b', textDecoration: 'none' }}>Términos de Servicio</a></li>
                <li><a href="/legal/seguridad" style={{ color: '#64748b', textDecoration: 'none' }}>Seguridad de Datos</a></li>
                <li><a onClick={onLoginClick} style={{ color: '#64748b', textDecoration: 'none', cursor: 'pointer' }}>Acceso al Panel</a></li>
              </ul>
            </div>

            {/* Ubicación y Contacto */}
            <div>
              <h4 style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a', marginBottom: '14px' }}>
                Atención y Contacto
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                San José, Costa Rica 🇨🇷<br />
                Soporte técnico directo vía WhatsApp y correo electrónico.
              </p>
              <div style={{ fontSize: '0.82rem' }}>
                <span style={{ color: '#94a3b8' }}>Email: </span>
                <a href="mailto:soporte@betico.tech" style={{ color: '#0b3c3d', fontWeight: '600', textDecoration: 'none' }}>
                  soporte@betico.tech
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div style={{ paddingTop: '28px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '0.78rem', color: '#94a3b8' }}>
            <p style={{ margin: 0 }}>© {new Date().getFullYear()} Betico.tech. Todos los derechos reservados.</p>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Desarrollado con orgullo en Costa Rica</span>
              <span style={{ fontSize: '1rem' }}>🇨🇷</span>
            </p>
          </div>

        </div>
      </footer>

      {/* ------------------------------------------------------------
          10. REGISTRATION MODAL
      ------------------------------------------------------------ */}
      {showRegisterModal && (
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          initialPlan={selectedPlanForRegister}
        />
      )}

    </div>
  );
}
