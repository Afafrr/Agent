import { isVapiSipDestination } from '../../integrations/vapi/vapi.utils';
import { answerCall } from './handlers/call-actions.handler';
import { transferCallToVapiAgent } from './handlers/call-transfer.handler';

export const handleTelnyxEvent = async (event: any) => {
  const eventType = event?.data?.event_type;
  const payload = event?.data?.payload;
  const callControlId = payload?.call_control_id;
  const direction = payload?.direction;
  const destination = payload?.to;
  const isVapiLeg = isVapiSipDestination(destination);
  const isInboundLeg = direction ? direction === 'incoming' : !isVapiLeg;

  if (!callControlId) {
    console.warn('TELNYX EVENT missing call_control_id:', eventType);
    return;
  }

  console.log('Telnyx event:', {
    eventType,
    callControlId,
    direction,
    destination,
  });

  if (eventType === 'call.initiated') {
    if (!isInboundLeg || isVapiLeg) {
      console.warn('Ignoring call.initiated for non-inbound or Vapi leg:', callControlId);
      return;
    }
    await answerCall(callControlId);
    return;
  }

  if (eventType === 'call.answered') {
    if (!isInboundLeg || isVapiLeg) {
      console.warn('Ignoring call.answered for non-inbound or Vapi leg:', callControlId);
      return;
    }
    await transferCallToVapiAgent(event.data, callControlId);
    return;
  }

  if (eventType === 'call.hangup') {
    console.log('Call ended:', callControlId);
    return;
  }

  console.log('TELNYX EVENT:', eventType);
};
