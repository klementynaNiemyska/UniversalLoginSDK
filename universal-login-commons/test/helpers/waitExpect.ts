import Assertion = Chai.Assertion;
import {sleep} from '../../lib';

export async function waitExpect(callback: () => void | Promise<void> | Assertion, timeout = 1000, tick = 5) {
  let elapsed = 0;
  let lastError;
  while (elapsed < timeout) {
    try {
      await callback();
      return;
    } catch (e) {
      await sleep(tick);
      elapsed += tick;
      lastError = e;
    }
  }
  throw lastError;
}
