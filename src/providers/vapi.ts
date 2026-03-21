export const requireVapiStreamUrl = () => {
  const streamUrl = process.env.VAPI_STREAM_WEBSOCKET_URL?.trim();

  if (!streamUrl) {
    throw new Error('Missing VAPI_STREAM_WEBSOCKET_URL');
  }

  return streamUrl;
};
