export type OrderOperation = 'create' | 'update';

export type OrderMutationPayload = {
  status?: string;
  customerName?: string;
  customerPhone?: string;
  product?: string;
  amount_tons?: number;
  address?: string;
};

export type ParsedOrderToolCall = {
  operation: OrderOperation;
  toolName: string;
  toolCallId?: string;
  payload: OrderMutationPayload;
};
