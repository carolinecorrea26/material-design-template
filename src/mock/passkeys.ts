import { mockRequest } from './client';
const decode = (value: string): ArrayBuffer => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)).buffer;
const encode = (value: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const supportsPasskeys = () => window.isSecureContext && typeof PublicKeyCredential !== 'undefined' && !!navigator.credentials;
type Descriptor = { type: 'public-key'; id: string };
type Options = { challenge: string; user?: { id: string; name: string; displayName: string }; excludeCredentials?: Descriptor[]; allowCredentials?: Descriptor[] };
export async function performPasskey(register: boolean, label?: string) {
  if (!supportsPasskeys()) throw new Error('Passkeys require a supported browser on HTTPS or localhost. Use an authenticator app instead.');
  if (window.location.hostname === '127.0.0.1') throw new Error('Open the preview at http://localhost:' + window.location.port + window.location.pathname + ' and sign in again to use passkeys.');
  const operation = register ? 'register' : 'authenticate';
  const options = await mockRequest<Options>(`/auth/passkeys/${operation}/options`, {});
  const descriptors = (items: Descriptor[] | undefined) => items?.map(item => ({ ...item, id: decode(item.id) }));
  let credential: PublicKeyCredential | null;
  try {
    credential = await (register ? navigator.credentials.create({ publicKey: { ...options, challenge: decode(options.challenge), user: { ...options.user!, id: decode(options.user!.id) }, excludeCredentials: descriptors(options.excludeCredentials) } as PublicKeyCredentialCreationOptions }) : navigator.credentials.get({ publicKey: { ...options, challenge: decode(options.challenge), allowCredentials: descriptors(options.allowCredentials) } as PublicKeyCredentialRequestOptions })) as PublicKeyCredential | null;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'SecurityError') throw new Error('This browser could not use the passkey domain. Open the localhost preview in Safari or Chrome and try again.');
    if (error instanceof DOMException && error.name === 'NotAllowedError') throw new Error('Passkey request cancelled or timed out. Try again or use another method.');
    throw error;
  }
  if (!credential) throw new Error('No passkey was returned. Try another sign-in method.');
  const response = credential.response;
  const serialized = response instanceof AuthenticatorAttestationResponse ? { clientDataJSON: encode(response.clientDataJSON), attestationObject: encode(response.attestationObject) } : { clientDataJSON: encode(response.clientDataJSON), authenticatorData: encode((response as AuthenticatorAssertionResponse).authenticatorData), signature: encode((response as AuthenticatorAssertionResponse).signature), userHandle: (response as AuthenticatorAssertionResponse).userHandle ? encode((response as AuthenticatorAssertionResponse).userHandle!) : null };
  return mockRequest<{ recoveryCodes?: string[] }>(`/auth/passkeys/${operation}/verify`, { credential: { id: credential.id, rawId: encode(credential.rawId), type: credential.type, response: serialized }, ...(register ? { label } : {}) });
}
