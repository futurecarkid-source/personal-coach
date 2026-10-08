import { createMemoryStorage } from '../../context/storage';
import { NATIVE_TABS_KEY, evaluateNativeTabs, markNativeTabsHealthy, readNativeTabsState, resetNativeTabs } from '../nativeTabsGuard';

describe('native tabs boot guard', () => {
  it('enables on first launch and marks the boot as pending', async () => {
    const storage = createMemoryStorage();
    expect(await evaluateNativeTabs(storage)).toEqual({ enabled: true });
    expect(storage.dump()[NATIVE_TABS_KEY]).toBe('pending');
  });

  it('stays enabled after a healthy boot', async () => {
    const storage = createMemoryStorage();
    await evaluateNativeTabs(storage);
    await markNativeTabsHealthy(storage);
    expect(await evaluateNativeTabs(storage)).toEqual({ enabled: true });
  });

  it('disables itself if the previous boot never became healthy (crash loop)', async () => {
    const storage = createMemoryStorage();
    await evaluateNativeTabs(storage); // arranque 1: queda pendiente y la app se cierra
    expect(await evaluateNativeTabs(storage)).toEqual({ enabled: false });
    expect(await readNativeTabsState(storage)).toBe('disabled');
    // sigue desactivada en los siguientes arranques
    expect(await evaluateNativeTabs(storage)).toEqual({ enabled: false });
  });

  it('can be re-enabled', async () => {
    const storage = createMemoryStorage({ [NATIVE_TABS_KEY]: 'disabled' });
    await resetNativeTabs(storage);
    expect(await evaluateNativeTabs(storage)).toEqual({ enabled: true });
  });

  it('falls back safely when storage fails', async () => {
    const broken = { getItem: async () => { throw new Error('x'); }, setItem: async () => undefined, removeItem: async () => undefined };
    expect(await evaluateNativeTabs(broken)).toEqual({ enabled: false });
  });
});
