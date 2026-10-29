// Service worker do PWA. Altere VERSAO ao mudar a lista de arquivos pré-carregados.
const VERSAO = 'v2';
const CACHE_APP = `manutencao-app-${VERSAO}`;
const CACHE_SDK = 'manutencao-firebase-sdk';

// Telas e recursos necessários para abrir o app sem rede.
const ARQUIVOS_APP = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/css/login.css',
  '/css/supervisor.css',
  '/css/tecnico.css',
  '/assets/cabecalho-educacao-santo-estevao.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/views/emprestimos.html',
  '/views/estoque.html',
  '/views/relatorios.html',
  '/views/supervisor.html',
  '/views/tecnico.html',
  '/src/config/firebase.js',
  '/src/controllers/cardsDemandas.js',
  '/src/controllers/loginController.js',
  '/src/controllers/materiaisOs.js',
  '/src/controllers/supervisorController.js',
  '/src/infra/datas.js',
  '/src/infra/logger.js',
  '/src/infra/pwa.js',
  '/src/models/authModel.js'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_APP)
      .then((cache) => cache.addAll(ARQUIVOS_APP))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes
          .filter((nome) => nome.startsWith('manutencao-app-') && nome !== CACHE_APP)
          .map((nome) => caches.delete(nome))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // O SDK do Firebase é versionado na URL, então a cópia em cache nunca fica desatualizada.
  if (url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    evento.respondWith(primeiroCache(request));
    return;
  }

  // Firestore, Auth e o helper OAuth (/__/auth) sempre vão direto para a rede.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/__/')) return;

  evento.respondWith(primeiroRede(request));
});

// Arquivos do próprio app: busca a versão nova e usa o cache só quando não há rede.
async function primeiroRede(request) {
  const cache = await caches.open(CACHE_APP);
  try {
    // no-cache: revalida com o servidor para que uma publicação nova chegue na hora.
    const resposta = await fetch(request, { cache: 'no-cache' });
    if (resposta.ok) cache.put(request, resposta.clone());
    return resposta;
  } catch (erro) {
    const salvo = await cache.match(request, { ignoreSearch: true });
    if (salvo) return salvo;
    if (request.mode === 'navigate') return cache.match('/index.html');
    throw erro;
  }
}

async function primeiroCache(request) {
  const cache = await caches.open(CACHE_SDK);
  const salvo = await cache.match(request);
  if (salvo) return salvo;
  const resposta = await fetch(request);
  if (resposta.ok) cache.put(request, resposta.clone());
  return resposta;
}
