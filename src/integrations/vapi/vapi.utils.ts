
const VAPI_SIP_DOMAIN = '@sip.vapi.ai';

export const isVapiSipDestination = (destination?: string) => Boolean(destination && destination.toLowerCase().includes(VAPI_SIP_DOMAIN));
