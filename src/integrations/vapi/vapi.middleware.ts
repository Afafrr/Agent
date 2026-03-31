import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../../config/env';

export const verifyVapiWebhookSignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawBody = req.body.toString();
    const signature = req.headers['x-signature'] as string;
    console.log({ signature });
    if (!signature) {
      return res.sendStatus(403);
    }

    const expected = createHmac('sha256', env.VAPI_WEBHOOK_SECRET).update(rawBody).digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (sigBuffer.length !== expectedBuffer.length) {
      return res.sendStatus(403);
    }

    if (!timingSafeEqual(sigBuffer, expectedBuffer)) {
      return res.sendStatus(403);
    }

    req.body = JSON.parse(rawBody);
    next();
  } catch (error) {
    console.error('VAPI webhook signature verification failed:', error);
    res.sendStatus(403);
  }
};
