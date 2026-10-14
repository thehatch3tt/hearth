/**
 * The app lock: Face ID, Touch ID or a fingerprint, falling back to the phone's passcode. Not on the
 * web. (Face ID needs a development build: in Expo Go on an iPhone it asks for the passcode instead.)
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';

export const canLock = Platform.OS !== 'web';

/** What the phone calls its lock ("Face ID", "Touch ID", "Fingerprint"), for labels. */
export async function lockName() {
  if (!canLock) return 'Face ID';
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync().catch((): LocalAuthentication.AuthenticationType[] => []);
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  return 'Passcode';
}

/** Asks the phone to confirm it's them. */
export async function unlock(promptMessage = 'Open Left in Love') {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel: 'Cancel' }).catch(() => ({ success: false }));
  return result.success;
}

/** Before turning the lock on: checks the phone can do it, then asks once so they know it works. */
export async function confirmLock() {
  if (!canLock) return false;
  const [hardware, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
  if (!hardware || !enrolled) {
    Alert.alert('Set up Face ID first', 'Turn on Face ID, Touch ID or a fingerprint in your phone’s Settings, then come back and try again.');
    return false;
  }
  return unlock('Turn on the lock for Left in Love');
}
