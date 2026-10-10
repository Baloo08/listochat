import { Router } from 'express';
import { query } from '../db.js';
import { requireSuperAdmin, AuthenticatedRequest, logAdminAction } from '../auth.js';
import { encrypt, decrypt } from '../encryption.js';

const router = Router();
router.use(requireSuperAdmin);

// 1. Get Platform Configuration (Masked)
router.get('/settings', async (req, res) => {
  try {
    const result = await query(`SELECT key, value, value_encrypted FROM platform_settings`);
    const settings: Record<string, string> = {};

    for (const r of result.rows) {
      if (r.value_encrypted) {
        settings[r.key] = decrypt(r.value_encrypted);
      } else {
        settings[r.key] = r.value || '';
      }
    }

    const appUrl = (process.env.MAIN_APP_URL || 'https://betico.tech').replace(/\/$/, '');
    const tilopayKey = settings.tilopay_api_key || process.env.TILOPAY_PLATFORM_KEY || '';
    const masterAiKey = settings.master_ai_key || process.env.GEMINI_API_KEY || '';

    res.json({
      masterAiProvider: settings.master_ai_provider || 'gemini',
      masterAiModel: settings.master_ai_model || 'gemini-2.5-flash',
      masterAiKeyMasked: masterAiKey.length > 8 ? `••••••••${masterAiKey.slice(-4)}` : (masterAiKey ? '••••••••' : ''),
      isMasterAiConfigured: Boolean(masterAiKey),

      tilopayApiKeyMasked: tilopayKey.length > 8 ? `••••••••${tilopayKey.slice(-4)}` : (tilopayKey ? '••••••••' : ''),
      tilopayApiUser: settings.tilopay_api_user || process.env.TILOPAY_PLATFORM_USER || '',
      tilopayEnvironment: settings.tilopay_environment || (process.env.TILOPAY_PLATFORM_ENV === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION'),
      tilopayIsEnabled: settings.tilopay_is_enabled !== 'false',
      isTilopayConfigured: Boolean(tilopayKey && (settings.tilopay_api_user || process.env.TILOPAY_PLATFORM_USER)),

      superadminNotifyPhone: settings.superadmin_notify_phone || '',
      webhookUrl: `${appUrl}/api/webhooks/tilopay`
    });
  } catch (error: any) {
    console.error('[Platform Settings] Error:', error);
    res.status(500).json({ error: 'Error al consultar configuración de plataforma' });
  }
});

// 2. Save Platform Configuration
router.post('/settings', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      masterAiKey,
      masterAiModel = 'gemini-2.5-flash',
      masterAiProvider = 'gemini',
      tilopayApiKey,
      tilopayApiUser,
      tilopayApiPassword,
      tilopayEnvironment = 'PRODUCTION',
      tilopayIsEnabled = true,
      superadminNotifyPhone
    } = req.body;

    const upsertSetting = async (key: string, value: string, isSecret = false) => {
      if (isSecret && value) {
        const encrypted = encrypt(value);
        await query(
          `INSERT INTO platform_settings (key, value, value_encrypted, updated_at)
           VALUES ($1, NULL, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = NULL, value_encrypted = EXCLUDED.value_encrypted, updated_at = CURRENT_TIMESTAMP`,
          [key, encrypted]
        );
      } else if (!isSecret && value !== undefined) {
        await query(
          `INSERT INTO platform_settings (key, value, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
          [key, value]
        );
      }
    };

    if (masterAiKey && !masterAiKey.includes('••••')) {
      await upsertSetting('master_ai_key', masterAiKey.trim(), true);
    }
    if (masterAiModel) await upsertSetting('master_ai_model', masterAiModel.trim());
    if (masterAiProvider) await upsertSetting('master_ai_provider', masterAiProvider.trim());

    if (tilopayApiKey && !tilopayApiKey.includes('••••')) {
      await upsertSetting('tilopay_api_key', tilopayApiKey.trim(), true);
    }
    if (tilopayApiUser !== undefined) await upsertSetting('tilopay_api_user', tilopayApiUser.trim());
    if (tilopayApiPassword && !tilopayApiPassword.includes('••••')) {
      await upsertSetting('tilopay_api_password', tilopayApiPassword.trim(), true);
    }
    if (tilopayEnvironment) await upsertSetting('tilopay_environment', tilopayEnvironment);
    if (tilopayIsEnabled !== undefined) await upsertSetting('tilopay_is_enabled', String(tilopayIsEnabled));

    if (superadminNotifyPhone !== undefined) {
      await upsertSetting('superadmin_notify_phone', superadminNotifyPhone.trim());
    }

    await logAdminAction(req.user!.userId, 'update_platform_settings', 'platform', 'settings', {}, req);

    res.json({
      success: true,
      message: 'Ajustes de plataforma (Tilopay, IA Maestra y Alertas) guardados con éxito'
    });
  } catch (error: any) {
    console.error('[Platform Settings Save] Error:', error);
    res.status(500).json({ error: 'Error al guardar configuración de plataforma' });
  }
});

// 3. Test Tilopay Live Connection
router.post('/test-tilopay', async (req, res) => {
  const startTime = Date.now();
  try {
    const { apiKey, apiUser, apiPassword } = req.body;

    let testKey = apiKey;
    let testUser = apiUser;
    let testPass = apiPassword;

    // Use stored credentials if placeholder is sent
    if (!testKey || testKey.includes('••••') || !testPass || testPass.includes('••••')) {
      const dbRes = await query(`SELECT key, value, value_encrypted FROM platform_settings WHERE key LIKE 'tilopay_%'`);
      for (const r of dbRes.rows) {
        const val = r.value_encrypted ? decrypt(r.value_encrypted) : r.value;
        if (r.key === 'tilopay_api_key' && (!testKey || testKey.includes('••••'))) testKey = val;
        if (r.key === 'tilopay_api_user' && !testUser) testUser = val;
        if (r.key === 'tilopay_api_password' && (!testPass || testPass.includes('••••'))) testPass = val;
      }
    }

    // Fallback to env
    testKey = testKey || process.env.TILOPAY_PLATFORM_KEY || '';
    testUser = testUser || process.env.TILOPAY_PLATFORM_USER || '';
    testPass = testPass || process.env.TILOPAY_PLATFORM_PASSWORD || '';

    if (!testKey || !testUser || !testPass) {
      res.status(400).json({
        success: false,
        error: 'Credenciales de Tilopay incompletas. Debes proveer API Key, Usuario y Contraseña.'
      });
      return;
    }

    const baseUrl = 'https://app.tilopay.com/api/v1';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.trim(),
        password: testPass.trim()
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;
    const loginData = (await loginRes.json().catch(() => ({}))) as any;

    if (loginRes.ok && loginData.access_token) {
      res.json({
        success: true,
        latencyMs,
        message: `Conexión exitosa con Tilopay (${latencyMs}ms). Token de pasarela emitido correctamente.`
      });
    } else {
      res.status(400).json({
        success: false,
        latencyMs,
        error: loginData.message || loginData.error || `Tilopay respondió con error HTTP ${loginRes.status}`
      });
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      latencyMs,
      error: `Error al conectar con el servidor de Tilopay: ${error.message || 'Timeout'}`
    });
  }
});

export default router;
