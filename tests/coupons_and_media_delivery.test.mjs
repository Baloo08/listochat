import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper replicas of server functions for pure unit testing
function normalizeSearchString(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function extractProductImageUrls(product) {
  if (!product) return [];
  const urls = [];

  const addValidUrl = (url) => {
    if (typeof url === 'string') {
      const trimmed = url.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/uploads/')) {
        urls.push(trimmed);
      }
    }
  };

  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      if (typeof img === 'string') {
        try {
          const parsed = JSON.parse(img);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => typeof p === 'string' ? addValidUrl(p) : (p?.url && addValidUrl(p.url)));
          } else if (typeof parsed === 'object' && parsed?.url) {
            addValidUrl(parsed.url);
          } else {
            addValidUrl(img);
          }
        } catch {
          addValidUrl(img);
        }
      } else if (typeof img === 'object' && img !== null) {
        if (img.url) addValidUrl(img.url);
      }
    }
  } else if (typeof product.images === 'string') {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        parsed.forEach(p => typeof p === 'string' ? addValidUrl(p) : (p?.url && addValidUrl(p.url)));
      } else if (typeof parsed === 'object' && parsed?.url) {
        addValidUrl(parsed.url);
      } else {
        addValidUrl(product.images);
      }
    } catch {
      addValidUrl(product.images);
    }
  }

  if (typeof product.imageUrl === 'string') addValidUrl(product.imageUrl);
  if (typeof product.image === 'string') addValidUrl(product.image);

  return [...new Set(urls)];
}

function calculateDiscount(coupon, subtotal) {
  if (!coupon || !coupon.active) {
    return { valid: false, message: 'Cupón no activo' };
  }
  if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
    return { valid: false, message: 'Cupón vencido' };
  }
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    return { valid: false, message: `El pedido mínimo para este cupón es de ₡${Number(coupon.minOrderAmount).toLocaleString()}` };
  }
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return { valid: false, message: 'Este cupón ha alcanzado el límite de usos' };
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round(subtotal * (Number(coupon.discountValue) / 100));
    if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
      discount = Number(coupon.maxDiscountAmount);
    }
  } else {
    discount = Math.min(subtotal, Number(coupon.discountValue));
  }

  return {
    valid: true,
    code: coupon.code,
    discountAmount: discount,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue
  };
}

describe('Coupons & Media Delivery Hardening Tests (ISO/IEC 25010)', () => {
  describe('1. Accent-Insensitive Search & Product Photo Matching', () => {
    it('should strip accents and diacritics correctly', () => {
      assert.equal(normalizeSearchString('Café'), 'cafe');
      assert.equal(normalizeSearchString('CAFÉ EXPLORADOR'), 'cafe explorador');
      assert.equal(normalizeSearchString('Canción de cuna'), 'cancion de cuna');
      assert.equal(normalizeSearchString('Plátano maduro'), 'platano maduro');
    });

    it('should match "cafe" to "Café explorador" reliably', () => {
      const userQuery = 'tienen fotos del cafe?';
      const normalizedQuery = normalizeSearchString(userQuery);
      const product = { name: 'Café explorador', price: 6500 };
      const normalizedProductName = normalizeSearchString(product.name);

      const words = normalizedProductName.split(/\s+/).filter(w => w.length > 2);
      const matches = words.some(w => normalizedQuery.includes(w));
      assert.equal(matches, true, 'User query for "cafe" must match "Café explorador"');
    });

    it('should extract product images from strings, objects, and JSON arrays', () => {
      // Single URL in images array
      const p1 = { images: ['/uploads/photo1.jpeg'] };
      assert.deepEqual(extractProductImageUrls(p1), ['/uploads/photo1.jpeg']);

      // JSON encoded array of strings
      const p2 = { images: JSON.stringify(['https://betico.tech/uploads/727afa17.jpeg']) };
      assert.deepEqual(extractProductImageUrls(p2), ['https://betico.tech/uploads/727afa17.jpeg']);

      // Objects with .url
      const p3 = { images: [{ url: '/uploads/obj1.jpeg' }, { url: '/uploads/obj2.png' }] };
      assert.deepEqual(extractProductImageUrls(p3), ['/uploads/obj1.jpeg', '/uploads/obj2.png']);

      // Deduplication
      const p4 = { images: ['/uploads/dup.jpeg'], imageUrl: '/uploads/dup.jpeg' };
      assert.deepEqual(extractProductImageUrls(p4), ['/uploads/dup.jpeg']);
    });
  });

  describe('2. Discount Coupons Validation & Calculation', () => {
    it('should calculate percentage discount correctly', () => {
      const coupon = {
        code: 'VERANO10',
        active: true,
        discountType: 'percentage',
        discountValue: 10
      };
      const result = calculateDiscount(coupon, 15000);
      assert.equal(result.valid, true);
      assert.equal(result.discountAmount, 1500);
    });

    it('should respect maxDiscountAmount cap on percentage discounts', () => {
      const coupon = {
        code: 'GRAN20',
        active: true,
        discountType: 'percentage',
        discountValue: 20,
        maxDiscountAmount: 3000
      };
      // 20% of 25,000 is 5,000, but cap is 3,000
      const result = calculateDiscount(coupon, 25000);
      assert.equal(result.valid, true);
      assert.equal(result.discountAmount, 3000);
    });

    it('should calculate fixed amount discount correctly', () => {
      const coupon = {
        code: 'BIENVENIDO2K',
        active: true,
        discountType: 'fixed',
        discountValue: 2000
      };
      const result = calculateDiscount(coupon, 8000);
      assert.equal(result.valid, true);
      assert.equal(result.discountAmount, 2000);
    });

    it('should not allow fixed discount to exceed subtotal', () => {
      const coupon = {
        code: 'REGALO5K',
        active: true,
        discountType: 'fixed',
        discountValue: 5000
      };
      const result = calculateDiscount(coupon, 3500);
      assert.equal(result.valid, true);
      assert.equal(result.discountAmount, 3500); // capped at subtotal
    });

    it('should reject inactive coupons', () => {
      const coupon = {
        code: 'PAUSADO',
        active: false,
        discountType: 'percentage',
        discountValue: 15
      };
      const result = calculateDiscount(coupon, 10000);
      assert.equal(result.valid, false);
      assert.match(result.message, /no activo/i);
    });

    it('should reject expired coupons', () => {
      const coupon = {
        code: 'VIEJO',
        active: true,
        discountType: 'percentage',
        discountValue: 15,
        validUntil: '2020-01-01T00:00:00Z'
      };
      const result = calculateDiscount(coupon, 10000);
      assert.equal(result.valid, false);
      assert.match(result.message, /vencido/i);
    });

    it('should reject when order subtotal is below minOrderAmount', () => {
      const coupon = {
        code: 'VIP50',
        active: true,
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 20000
      };
      const result = calculateDiscount(coupon, 12000);
      assert.equal(result.valid, false);
      assert.match(result.message, /mínimo/i);
    });

    it('should reject when usageLimit is exhausted', () => {
      const coupon = {
        code: 'AGOTADO',
        active: true,
        discountType: 'percentage',
        discountValue: 10,
        usageLimit: 5,
        usedCount: 5
      };
      const result = calculateDiscount(coupon, 15000);
      assert.equal(result.valid, false);
      assert.match(result.message, /límite de usos/i);
    });
  });

  describe('3. File & PDF Media Routing Logic', () => {
    it('should detect PDF documents and set mediatype to document', () => {
      const isPdf = (url) => url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?');
      assert.equal(isPdf('https://betico.tech/docs/catalogo_2026.pdf'), true);
      assert.equal(isPdf('/uploads/menu.pdf'), true);
      assert.equal(isPdf('https://betico.tech/uploads/cafe.jpeg'), false);
    });
  });
});
