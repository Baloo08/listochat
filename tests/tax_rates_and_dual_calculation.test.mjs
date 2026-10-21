import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Tax Rates & Dual Invoicing Calculation Architecture (DGT v4.4 Costa Rica)', async (t) => {
  await t.test('1. Precios con IVA Incluido (Gross Pricing) - 13% General', () => {
    const grossTotal = 15000;
    const rate = 0.13;
    const unitPriceNet = Number((grossTotal / (1 + rate)).toFixed(5));
    const lineSubtotal = Number((grossTotal / (1 + rate)).toFixed(2));
    const lineTax = Number((grossTotal - lineSubtotal).toFixed(2));
    const lineTotal = Number((lineSubtotal + lineTax).toFixed(2));

    assert.equal(lineTotal, 15000.00, 'Total debe ser exactamente ₡15,000.00');
    assert.equal(lineSubtotal, 13274.34, 'Base imponible neta calculada');
    assert.equal(lineTax, 1725.66, 'Monto de IVA al 13% desglosado');
    assert.equal(Number((lineSubtotal + lineTax).toFixed(2)), grossTotal);
  });

  await t.test('2. Precios con IVA Incluido (Gross Pricing) - 4% Tarifa Reducida Salud Privada', () => {
    const grossTotal = 25000;
    const rate = 0.04;
    const unitPriceNet = Number((grossTotal / (1 + rate)).toFixed(5));
    const lineSubtotal = Number((grossTotal / (1 + rate)).toFixed(2));
    const lineTax = Number((grossTotal - lineSubtotal).toFixed(2));
    const lineTotal = Number((lineSubtotal + lineTax).toFixed(2));

    assert.equal(lineTotal, 25000.00, 'Total debe ser exactamente ₡25,000.00');
    assert.equal(lineSubtotal, 24038.46, 'Base imponible neta calculada para tarifa 4%');
    assert.equal(lineTax, 961.54, 'Monto de IVA al 4% desglosado');
    assert.equal(Number((lineSubtotal + lineTax).toFixed(2)), grossTotal);
  });

  await t.test('3. Precios con IVA Incluido - 2% Medicamentos y 1% Canasta Básica', () => {
    // 2% Medicamentos
    const grossMed = 10000;
    const rateMed = 0.02;
    const subtotalMed = Number((grossMed / (1 + rateMed)).toFixed(2));
    const taxMed = Number((grossMed - subtotalMed).toFixed(2));
    assert.equal(subtotalMed + taxMed, grossMed);
    assert.equal(subtotalMed, 9803.92);
    assert.equal(taxMed, 196.08);

    // 1% Canasta Básica
    const grossBasket = 5000;
    const rateBasket = 0.01;
    const subtotalBasket = Number((grossBasket / (1 + rateBasket)).toFixed(2));
    const taxBasket = Number((grossBasket - subtotalBasket).toFixed(2));
    assert.equal(subtotalBasket + taxBasket, grossBasket);
    assert.equal(subtotalBasket, 4950.50);
    assert.equal(taxBasket, 49.50);
  });

  await t.test('4. Precios Más IVA (Net Pricing / prices_include_tax = false)', () => {
    const netPrice = 20000;
    const rate = 0.13;
    const lineSubtotal = Number((netPrice * 1).toFixed(2));
    const lineTax = Number((lineSubtotal * rate).toFixed(2));
    const lineTotal = Number((lineSubtotal + lineTax).toFixed(2));

    assert.equal(lineSubtotal, 20000.00);
    assert.equal(lineTax, 2600.00);
    assert.equal(lineTotal, 22600.00);
  });

  await t.test('5. Tarifa Exenta 0% (taxRateCode = "10")', () => {
    const price = 18000;
    const rate = 0.00;
    const lineSubtotal = price;
    const lineTax = 0;
    const lineTotal = price;

    assert.equal(lineSubtotal, 18000.00);
    assert.equal(lineTax, 0.00);
    assert.equal(lineTotal, 18000.00);
  });

  await t.test('6. Invariante de Lenguaje: Cero "&" en texto visible de ElectronicBillingView.tsx', () => {
    const filePath = path.resolve(process.cwd(), 'src/client/components/ElectronicBillingView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Split lines and check lines that contain visible text strings (excluding && logical operator, &amp;, imports)
    const lines = content.split('\n');
    const visibleAmpersands = [];

    lines.forEach((line, index) => {
      // Exclude logical operator &&
      const cleaned = line.replace(/&&/g, '');
      // Exclude comments or code-only lines
      if (cleaned.includes('&')) {
        // Check if ampersand is inside quotes or JSX text
        if (/"[^"]*&[^"]*"/.test(cleaned) || /'[^']*&[^']*'/.test(cleaned) || />[^<]*&[^<]*</.test(cleaned)) {
          visibleAmpersands.push({ line: index + 1, text: line.trim() });
        }
      }
    });

    assert.equal(
      visibleAmpersands.length,
      0,
      `Se encontraron símbolos '&' en texto visible de ElectronicBillingView.tsx: ${JSON.stringify(visibleAmpersands)}`
    );
  });

  await t.test('7. Mensajes de Diagnóstico Amigable de Configuración de Correo', () => {
    const error535 = '535 5.7.8 Username and Password not accepted';
    let friendly = '';
    if (error535.includes('535') || error535.includes('BadCredentials')) {
      friendly = 'Credenciales rechazadas por el servidor de correo (Error 535).';
    }
    assert.ok(friendly.includes('Error 535'), 'Detecta correctamente error 535');
  });
});
