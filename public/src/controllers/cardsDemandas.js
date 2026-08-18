const demandasMinimizadas = new Set();

function aplicarEstado(demandaId) {
    const minimizada = demandasMinimizadas.has(demandaId);
    document.querySelectorAll(`[data-demanda-card="${CSS.escape(demandaId)}"]`).forEach(card => {
        card.classList.toggle('minimizada', minimizada);
        const botao = card.querySelector('[data-minimizar-demanda]');
        if (!botao) return;
        botao.textContent = minimizada ? 'Expandir' : 'Minimizar';
        botao.setAttribute('aria-expanded', String(!minimizada));
        botao.setAttribute('aria-label', `${minimizada ? 'Expandir' : 'Minimizar'} demanda ${card.dataset.protocolo || ''}`.trim());
    });
    atualizarControlesGlobais();
}

function obterCardsVisiveis() {
    return [...document.querySelectorAll('[data-demanda-card]')]
        .filter(card => !card.hidden && getComputedStyle(card).display !== 'none');
}

function atualizarControlesGlobais() {
    const cards = obterCardsVisiveis();
    const todosMinimizados = cards.length > 0 && cards.every(card => card.classList.contains('minimizada'));
    document.querySelectorAll('[data-alternar-todas-demandas]').forEach(botao => {
        botao.textContent = todosMinimizados ? 'Expandir todas' : 'Minimizar todas';
        botao.setAttribute('aria-expanded', String(!todosMinimizados));
    });
}

function alternarTodas() {
    const cards = obterCardsVisiveis();
    const deveExpandir = cards.length > 0 && cards.every(card => card.classList.contains('minimizada'));
    cards.forEach(card => {
        const demandaId = card.dataset.demandaCard;
        if (deveExpandir) demandasMinimizadas.delete(demandaId);
        else demandasMinimizadas.add(demandaId);
        aplicarEstado(demandaId);
    });
    atualizarControlesGlobais();
}

export function inicializarCardsMinimizaveis() {
    document.addEventListener('click', event => {
        const controleGlobal = event.target.closest('[data-alternar-todas-demandas]');
        if (controleGlobal) {
            alternarTodas();
            return;
        }
        const botao = event.target.closest('[data-minimizar-demanda]');
        if (botao) {
            const demandaId = botao.dataset.minimizarDemanda;
            if (demandasMinimizadas.has(demandaId)) demandasMinimizadas.delete(demandaId);
            else demandasMinimizadas.add(demandaId);
            aplicarEstado(demandaId);
            return;
        }
        const card = event.target.closest('[data-demanda-card].minimizada');
        if (!card) return;
        demandasMinimizadas.delete(card.dataset.demandaCard);
        aplicarEstado(card.dataset.demandaCard);
    });
    document.addEventListener('demandas-renderizadas', () => {
        demandasMinimizadas.forEach(aplicarEstado);
        atualizarControlesGlobais();
    });
    document.querySelectorAll('#listaOrdens, #listaGeral, #listaPendentes, #listaAndamento, #listaConcluidas, #listaCanceladas')
        .forEach(lista => new MutationObserver(atualizarControlesGlobais).observe(lista, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'hidden']
        }));
}
