import express from 'express';
import { telnyxWebhook } from './modules/calls/telnyx-webhook.controller';
import { verifyWebhookSignature } from './integrations/telnyx/telnyx.middleware';
import { agentRouter } from './modules/router/agent.router';

const app = express();
app.get('/', (_, res) => {
  res.send('Server running');
});

// Raw body required for signature verification
const rawBody = express.Router();
rawBody.use(express.raw({ type: 'application/json' }));

rawBody.post('/webhooks/telnyx', verifyWebhookSignature, telnyxWebhook); //route for telephony webhooks
rawBody.use('/agent', agentRouter); //route for agent related endpoints

app.use(rawBody);

app.use(express.json());

app.listen(3000, () => {
  console.log('http://localhost:3000');
});
