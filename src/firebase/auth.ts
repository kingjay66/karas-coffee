import { auth } from './index';
import { onAuthStateChanged, Unsubscribe, User } from 'firebase/auth';
/**
 * Gets a user instance once and unsubscribes from future changes.
 */
export function getUserOnce(): Promise<User | null> {
  return new Promise((resolve) => {
    let unsubscribe: Unsubscribe;
    unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      return resolve(user);
    });
  });
}
