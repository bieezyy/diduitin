/**
 * Utilitas Haptic Feedback getar ringan untuk kenyamanan input di HP
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof window === 'undefined' || !window.navigator) return;

  try {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(12);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'success':
          navigator.vibrate([15, 40, 25]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
        default:
          navigator.vibrate(12);
      }
    }
  } catch {
    // Ignore error jika browser membatasi haptic
  }
}
