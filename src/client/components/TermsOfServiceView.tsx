import React from 'react';
import { Bot, FileText, ArrowLeft } from 'lucide-react';

export default function TermsOfServiceView() {
  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f8fafc', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#131c2e', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#10b981', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '24px' }}>
          <ArrowLeft size={16} /> Volver al Inicio
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <FileText size={32} color="#10b981" />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Términos y Condiciones de Uso</h1>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '30px' }}>
          Última actualización: 28 de Agosto de 2026 • Betico.tech
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.7' }}>
          
          <section>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>1. Aceptación de los Términos</h2>
            <p>
              Al registrarse, acceder o utilizar la plataforma Betico.tech, usted acepta vincularse legalmente por estos Términos y Condiciones. Si no está de acuerdo con alguno de los términos, no debe utilizar el servicio.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>2. Descripción del Servicio</h2>
            <p>
              Betico.tech proporciona herramientas de software en la nube para la gestión de mensajería empresarial en WhatsApp, catálogos en línea, sistemas de pantallas de cocina (KDS), validación asistida por visión artificial de transferencias SINPE Móvil y herramientas de fidelización de clientes.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>3. Uso Aceptable y Cumplimiento con WhatsApp</h2>
            <p>
              El usuario se compromete a utilizar la plataforma conforme a la legislación aplicable y a las Políticas de Mensajería Comercial de Meta/WhatsApp. Queda estrictamente prohibido el envío de spam, contenido fraudulento, ilícito o que vulnere la privacidad de terceros. Betico implementa controles de cadencia (anti-spam) para proteger la reputación de los números de los clientes.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>4. Disponibilidad y Soporte Técnico</h2>
            <p>
              Nos esforzamos por ofrecer una disponibilidad del 99.9% en nuestros servidores. Los mantenimientos programados se notificarán con antelación.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
