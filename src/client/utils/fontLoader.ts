// Google Fonts Universal Loader & Utility
export interface CuratedFont {
  name: string;
  category: 'sans-serif' | 'serif' | 'display';
  description: string;
}

export const CURATED_FONTS: CuratedFont[] = [
  { name: 'Inter', category: 'sans-serif', description: 'Limpia, moderna y neutral' },
  { name: 'Plus Jakarta Sans', category: 'sans-serif', description: 'Moderna, tecnológica y SaaS' },
  { name: 'Poppins', category: 'sans-serif', description: 'Geométrica, dinámica y amigable' },
  { name: 'Montserrat', category: 'sans-serif', description: 'Elegante, estructurada y de negocios' },
  { name: 'Roboto', category: 'sans-serif', description: 'Clásica, ultra estructurada y legible' },
  { name: 'Playfair Display', category: 'serif', description: 'Elegante, gourmet, lujo y editorial' },
  { name: 'Outfit', category: 'sans-serif', description: 'Minimalista, vanguardista y fresca' },
  { name: 'Lora', category: 'serif', description: 'Serif cálida, literaria y sofisticada' },
  { name: 'DM Sans', category: 'sans-serif', description: 'Geométrica suave y contemporánea' }
];

export function cleanFontName(fontName?: string): string {
  if (!fontName) return 'Inter';
  const firstPart = fontName.split(',')[0];
  return firstPart.replace(/['"]/g, '').trim();
}

export function getFontFamilyCss(fontName?: string): string {
  const clean = cleanFontName(fontName);
  const serifFonts = ['Playfair Display', 'Lora', 'Merriweather', 'Cinzel', 'Baskerville', 'Georgia'];
  const isSerif = serifFonts.includes(clean);
  return `'${clean}', ${isSerif ? 'serif' : 'sans-serif'}`;
}

export function loadGoogleFont(fontName?: string): void {
  if (typeof document === 'undefined') return;
  const clean = cleanFontName(fontName);
  if (!clean || clean === 'system-ui' || clean === 'sans-serif') return;

  const fontId = `gfont-${clean.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (document.getElementById(fontId)) return;

  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${clean.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;
  document.head.appendChild(link);
}
