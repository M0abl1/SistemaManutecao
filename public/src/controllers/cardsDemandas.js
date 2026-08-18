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
}

export function inicializarCardsMinimizaveis() {
    document.addEventListener('click', event => {
        const botao = event.target.closest('[data-minimizar-demanda]');
        if (!botao) return;
        const demandaId = botao.dataset.minimizarDemanda;
        if (demandasMinimizadas.has(demandaId)) demandasMinimizadas.delete(demandaId);
        else demandasMinimizadas.add(demandaId);
        aplicarEstado(demandaId);
    });
    document.addEventListener('demandas-renderizadas', () => {
        demandasMinimizadas.forEach(aplicarEstado);
    });
}
