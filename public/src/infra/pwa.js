// Registra o service worker que permite instalar o sistema como app e abri-lo sem rede.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((erro) => {
      console.warn('Service worker não registrado:', erro);
    });
  });
}
