if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA Service Worker terpasang:', reg.scope))
      .catch(err => console.log('PWA SW gagal:', err));
  });
}
