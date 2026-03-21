import { Request, Response } from 'express';
import { createTelnyxClient } from '../providers/telnyx';
import { requireVapiStreamUrl } from '../providers/vapi';

export const telnyxWebhook = async (req: Request, res: Response) => {
  const event = req.body;
  const eventType = event?.data?.event_type;
  const callControlId = event?.data?.payload?.call_control_id;

  // Ack first so Telnyx does not retry while we process call-control actions.
  res.sendStatus(200);

  if (!callControlId) {
    console.warn('TELNYX EVENT missing call_control_id:', eventType);
    return;
  }

  try {
    console.log('Event data', event.data?.payload);

    if (eventType === 'call.initiated') {
      const client = createTelnyxClient();

      await client.calls.actions.answer(callControlId, {});
      console.log('Answered call:', callControlId);
      return;
    }

    if (eventType === 'call.answered') {
      const client = createTelnyxClient();
      const streamUrl = requireVapiStreamUrl();

      await client.calls.actions.startStreaming(callControlId, {
        stream_url: streamUrl,
        stream_track: 'inbound_track',
      });

      console.log('Started streaming call to Vapi:', callControlId);
      return;
    }

    if (eventType === 'call.hangup') {
      console.log('Call ended:', callControlId);
      return;
    }

    console.log('TELNYX EVENT:', eventType);
  } catch (error) {
    console.error('Telnyx webhook action failed:', error);
  }
};
