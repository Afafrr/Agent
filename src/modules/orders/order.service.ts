import { findCallByControlId } from '../calls/call.repository';
import { createOrderRecord, type CreateOrderRecordInput } from './order.repository';
type SaveOrderArguments = Pick<CreateOrderRecordInput, 'product' | 'amount_tons' | 'address'>;

const parseToolCallArguments = (data: unknown): SaveOrderArguments | null => {
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
  const firstMessageWithToolCalls = messages?.find((item: any) => Array.isArray(item?.toolCalls) && item.toolCalls.length > 0);
  const toolCalls = firstMessageWithToolCalls?.toolCalls;

  console.log({ toolCalls });
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    return;
  }
  const firstToolCall = toolCalls[0];
  if (!firstToolCall || !firstToolCall.function) {
    return;
  }

  const functionName = firstToolCall.function.name;
  console.log({ firstToolCall, functionName });

  if (functionName !== 'save_order') {
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
  await createOrderRecord(call.id, call.tenantId, data as CreateOrderRecordInput);
};
