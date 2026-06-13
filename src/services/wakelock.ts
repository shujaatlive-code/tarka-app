export const WebWakeLock = {
  sentinel: null as any,
  active: false,

  async request(onStateChange?: (active: boolean, isFallback?: boolean) => void) {
    if ('wakeLock' in navigator) {
      try {
        this.sentinel = await (navigator as any).wakeLock.request('screen');
        this.active = true;
        console.log('⚡ [Wake Lock] Screen Wake Lock acquired.');
        if (onStateChange) onStateChange(true, false);
      } catch (err) {
        console.warn('❌ [Wake Lock] Failed to acquire screen wake lock:', err);
        this.active = true; // Fallback mock active
        if (onStateChange) onStateChange(true, true);
      }
    } else {
      console.log('💤 [Wake Lock] API not supported. Simulating awake lock.');
      this.active = true;
      if (onStateChange) onStateChange(true, true);
    }
  },

  async release(onStateChange?: (active: boolean) => void) {
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch (e) {
        console.warn('Failed release', e);
      }
      this.sentinel = null;
    }
    this.active = false;
    console.log('💤 [Wake Lock] Screen Wake Lock released.');
    if (onStateChange) onStateChange(false);
  }
};
