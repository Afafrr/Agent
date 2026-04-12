import { findCallByControlId } from '../calls/call.repository';
import { createOrderRecord, type CreateOrderRecordInput } from './order.repository';
type SaveOrderArguments = Pick<CreateOrderRecordInput, 'product' | 'amount_tons' | 'address'>;

const parseToolCallArguments = (data: unknown): SaveOrderArguments | null => {
  // Vapi sends function arguments as a JSON string, so ignore anything already coerced into a different shape.
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
      return data as SaveOrderArguments;
    } catch (error) {
      console.warn('Failed to parse save_order arguments:', error);
      return null;
    }
  }

  return null;
};

export const handleOrderToolCalls = async (callControlId: string, message: any): Promise<void> => {
  const messages = Array.isArray(message?.messages) ? message.messages : undefined;
  // Tool calls are nested under conversational messages; use the first tool-bearing entry for now.
  const firstMessageWithToolCalls = messages?.find((item: any) => Array.isArray(item?.toolCalls) && item.toolCalls.length > 0);
  const toolCalls = firstMessageWithToolCalls?.toolCalls;

  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    return;
  }
  const firstToolCall = toolCalls[0];
  if (!firstToolCall || !firstToolCall.function) {
    return;
  }

  const functionName = firstToolCall.function.name;

  if (functionName !== 'save_order') {
    // Ignore unrelated tools here so this handler stays narrowly responsible for order persistence.
    return;
  }

  const call = await findCallByControlId(callControlId);
  if (!call) {
    console.warn('No call record found for VAPI event with call_control_id:', callControlId);
    return;
  }

  let data = parseToolCallArguments(firstToolCall.function.arguments);
  if (!data) {
    console.warn('Invalid save_order payload for call_control_id:', callControlId);
    return;
  }

  console.log('TOOL CALL', data);
  // Orders are attached to the call row rather than trusted directly from Vapi metadata so tenant ownership
  // always comes from our own routing decision.
  await createOrderRecord(call.id, call.tenantId, data as CreateOrderRecordInput);
};
