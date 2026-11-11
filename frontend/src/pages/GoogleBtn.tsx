import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

export default function GoogleBtn({ clientId, onToken, onError }: { clientId: string; onToken: (t: string) => void; onError: () => void }) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin width="320" onSuccess={(r) => r.credential ? onToken(r.credential) : onError()} onError={onError} />
    </GoogleOAuthProvider>
  );
}
