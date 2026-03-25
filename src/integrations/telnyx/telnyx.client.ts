import Telnyx from 'telnyx';

export const createTelnyxClient = () => {
  const apiKey = process.env.TELNYX_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing Telnyx API key. Set TELNYX_API_KEY (preferred) or TELNYX_KEY in .env',
    );
  }

  return new Telnyx({ apiKey });
};