import { Request, Response } from 'express';
import { handleVapiEvent } from './vapi-call.service';

export const vapiWebhook = async (req: Request, res: Response) => {
  // Acknowledge first so Vapi does not retry while downstream work is still running.
  res.json({ success: true });

  try {
    await handleVapiEvent(req.body);
  } catch (error) {
    console.error('Vapi webhook action failed:', error);
  }
};
