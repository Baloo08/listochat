import React from 'react';
import { Bot, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyView() {
  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f8fafc', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#131c2e', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#10b981', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '24px' }}>
          <ArrowLeft size={16} /> Volver al Inicio
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <ShieldCheck size={32} color="#10b981" />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Política de Privacidad y Protección de Datos</h1>
        </div>

        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '30px' }}>
          Última actualización: 28 de Agosto de 2026 • Conforme a la <strong>Ley N° 8968 de Costa Rica</strong> (Protección de la Persona frente al Tratamiento de sus Datos Personales).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.7' }}>
          
          <section>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>1. Identificación del Responsable</h2>
            <p>
              <strong>Betico.tech</strong> (en adelante, "la Plataforma" o "el Proveedor") es una solución tecnológica de software como servicio (SaaS) con sede en San José, Costa Rica, destinada a la automatización de atención al cliente, reservas, comercio digital y verificación de pagos por WhatsApp mediante Inteligencia Artificial.
            </p>
          </section>

          <section>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>2. Información que Recopilamos</h2>
            <p>
              La Plataforma recopila únicamente la información estrictamente necesaria para la prestación del servicio:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li><strong>Datos de Administradores y Comercios:</strong> Nombre comercial, correo electrónico, credenciales de acceso, número de WhatsApp para notificaciones y parámetros de configuración.</li>
              <li><strong>Datos de Clientes Finales del Comercio:</strong> Nombre, número telefónico de WhatsApp, historial de interacción para contexto de IA, dirección de entrega física o coordenadas GPS (en pedidos a domicilio) y datos de comprobantes de pago (número de referencia SINPE y monto).</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>3. Finalidad del Tratamiento</h2>
            <p>Los datos son utilizados exclusivamente para:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li>Procesar conversaciones y solicitudes de compra o agendamiento por WhatsApp a través de modelos de IA.</li>
              <li>Validar comprobantes de transferencia SINPE Móvil y emitir confirmaciones al comercio y al cliente.</li>
              <li>Calcular tarifas y rutas de entrega para repartidores locales y servicios postales (Correos de Costa Rica).</li>
              <li>Mantener registros de auditoría de seguridad y prevenir accesos no autorizados.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>4. Seguridad y Cifrado de la Información</h2>
            <p>
              Implementamos rigurosas medidas de seguridad técnicas y organizativas:
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '6px' }}>
              <li><strong>Cifrado AES-256-GCM:</strong> Todas las claves de API y tokens de conexión están cifrados en reposo.</li>
              <li><strong>Aislamiento Multi-Inquilino:</strong> La información de cada empresa está estrictamente aislada por identificador de inquilino (Tenant ID).</li>
              <li><strong>Comunicaciones Seguras:</strong> Todo el tráfico viaja mediante protocolo HTTPS/TLS 1.3.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>5. Derechos del Titular (Derechos ARCO)</h2>
            <p>
              Conforme a la legislación costarricense, cualquier titular de datos tiene derecho a ejercer sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición</strong>. Para ejercer estos derechos, puede comunicarse directamente a nuestro canal de soporte en <strong>privacidad@betico.tech</strong>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
