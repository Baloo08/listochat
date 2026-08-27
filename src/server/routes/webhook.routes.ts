import { Router } from 'express';

const router = Router();

// Handle Evolution API Webhooks
const handleWebhook = async (req: any, res: any) => {
  // Return 200 immediately to acknowledge receipt
  res.status(200).send('OK');

  try {
    const { instanceName, body } = req.body;
    
    // Asynchronous processing:
    // 1. Look up tenant by instanceName
    // 2. Load agent config & data
    // 3. AI Processing
    // 4. Send reply via Evolution API
    // 5. Check tags (COMMAND_BOOKING, COMMAND_ORDER)
    // 6. Save messages to DB
    
    console.log(`Processing message for instance: ${instanceName}`);
  } catch (error) {
    console.error('Webhook error:', error);
  }
};

router.post('/', handleWebhook);
router.post('/evolution', handleWebhook);

export default router;
