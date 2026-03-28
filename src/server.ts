import express from 'express';
import { telnyxWebhook } from './modules/calls/telnyx-webhook.controller';
import { handleTelnyxEvent } from './modules/calls/call.service';
import { verifyWebhookSignature } from './integrations/telnyx/telnyx.middleware';

const app = express();
app.get('/', (_, res) => {
  res.send('Server running');
});

// Raw body required for signature verification
app.post('/webhooks/telnyx', express.raw({ type: 'application/json' }), verifyWebhookSignature, telnyxWebhook);

if (process.env.NODE_ENV !== 'production') {
  // Local testing route that bypasses Telnyx signature verification.
  app.post('/webhooks/telnyx/dev', express.json(), async (req, res) => {
    try {
      await handleTelnyxEvent(req.body);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Dev Telnyx webhook failed:', error);
      res.status(500).json({ ok: false });
    }
  });
}

app.use(express.json());

app.listen(3000, () => {
  console.log('http://localhost:3000');
});
