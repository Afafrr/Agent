import express from 'express';
import { verifyVapiWebhookSignature } from '../../integrations/vapi/vapi.middleware';
import { vapiWebhook } from '../calls/vapi-webhook.controller';
import { orderToolWebhook } from '../orders/order-tool.controller';
import { getPromptConfig } from '../tenants/tenant-prompt-config.controller';

export const agentRouter = express.Router();
// Apply Vapi HMAC signature verification middleware to all routes in this router.
agentRouter.use(verifyVapiWebhookSignature);
agentRouter.post('/webhook', vapiWebhook);

const toolRoutes = express.Router();
agentRouter.use('/tools', toolRoutes);
//group tool related routes under /agent/tools
toolRoutes.post('/order', orderToolWebhook);
toolRoutes.post('/agent-prompt', getPromptConfig);
