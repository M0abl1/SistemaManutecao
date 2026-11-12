// Busca tolerante: ignora acentos, maiúsculas, pontuação, espaços extras e ordem das palavras.
// Ex.: "angelo", "ANGELO MAGALHAES", "magalhães ângelo" e "ang mag" encontram "Ângelo Magalhães".

export const normalizar = valor => String(valor ?? '')
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`´]/g, '')
    .replace(/[^a-z0-9/\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Verdadeiro quando todas as palavras digitadas aparecem no texto, em qualquer ordem.
export function correspondeBusca(texto, termo) {
    const palavras = normalizar(termo).split(' ').filter(Boolean);
    if (!palavras.length) return true;
    const alvo = normalizar(texto);
    return palavras.every(palavra => alvo.includes(palavra));
}

// Substitui a lista de sugestões nativa (<datalist>), que diferencia acentos,
// por uma lista própria que usa correspondeBusca. Vale para todos os campos com
// atributo list="...", inclusive os criados ou alterados depois.
export function ativarSugestoesSemAcento(raiz = document) {
    if (raiz.__sugestoesSemAcento) return;
    raiz.__sugestoesSemAcento = true;

    const estilo = document.createElement('style');
    estilo.textContent = `
        .sugestoes-busca { position: absolute; z-index: 10000; max-height: 260px; overflow-y: auto; margin: 0; padding: 4px 0; list-style: none;
            background: var(--bg-card, #fff); color: var(--texto-principal, #222); border: 1px solid var(--borda, #ccc);
            border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,.18); font-size: 15px; }
        .sugestoes-busca li { padding: 9px 12px; cursor: pointer; }
        .sugestoes-busca li[aria-selected="true"], .sugestoes-busca li:hover { background: rgba(37, 99, 235, .14); }
    `;
    document.head.appendChild(estilo);

    const painel = document.createElement('ul');
    painel.className = 'sugestoes-busca';
    painel.setAttribute('role', 'listbox');
    painel.hidden = true;
    document.body.appendChild(painel);

    let campoAtual = null;
    let indiceAtivo = -1;

    const converterCampo = campo => {
        if (!(campo instanceof HTMLInputElement) || !campo.hasAttribute('list')) return;
        const idLista = campo.getAttribute('list');
        campo.removeAttribute('list');
        if (idLista) campo.dataset.lista = idLista; else delete campo.dataset.lista;
        campo.setAttribute('autocomplete', 'off');
    };
    raiz.querySelectorAll('input[list]').forEach(converterCampo);
    new MutationObserver(mudancas => mudancas.forEach(mudanca => {
        if (mudanca.type === 'attributes') converterCampo(mudanca.target);
        else mudanca.addedNodes.forEach(no => {
            if (no.nodeType !== 1) return;
            converterCampo(no);
            no.querySelectorAll?.('input[list]').forEach(converterCampo);
        });
    })).observe(raiz.documentElement || raiz, { subtree: true, childList: true, attributes: true, attributeFilter: ['list'] });

    const fechar = () => { painel.hidden = true; painel.innerHTML = ''; indiceAtivo = -1; campoAtual = null; };

    const marcar = indice => {
        const itens = painel.children;
        if (!itens.length) return;
        indiceAtivo = (indice + itens.length) % itens.length;
        Array.from(itens).forEach((item, i) => item.setAttribute('aria-selected', String(i === indiceAtivo)));
        itens[indiceAtivo].scrollIntoView({ block: 'nearest' });
    };

    const escolher = valor => {
        const campo = campoAtual;
        if (!campo) return;
        campo.value = valor;
        fechar();
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const abrir = campo => {
        const lista = campo.dataset.lista && document.getElementById(campo.dataset.lista);
        if (!lista || campo.hidden || campo.disabled || campo.readOnly) return fechar();
        const termo = campo.value;
        const vistos = new Set();
        const opcoes = Array.from(lista.querySelectorAll('option'))
            .map(opcao => ({ valor: opcao.value, rotulo: opcao.label && opcao.label !== opcao.value ? `${opcao.value} — ${opcao.label}` : opcao.value }))
            .filter(opcao => opcao.valor && !vistos.has(opcao.valor) && vistos.add(opcao.valor))
            .filter(opcao => correspondeBusca(opcao.rotulo, termo));
        if (!opcoes.length || (opcoes.length === 1 && opcoes[0].valor === termo)) return fechar();

        campoAtual = campo;
        indiceAtivo = -1;
        painel.innerHTML = '';
        opcoes.slice(0, 80).forEach(opcao => {
            const item = document.createElement('li');
            item.setAttribute('role', 'option');
            item.textContent = opcao.rotulo;
            item.dataset.valor = opcao.valor;
            item.addEventListener('pointerdown', evento => { evento.preventDefault(); escolher(opcao.valor); });
            painel.appendChild(item);
        });
        const caixa = campo.getBoundingClientRect();
        painel.style.left = `${caixa.left + window.scrollX}px`;
        painel.style.top = `${caixa.bottom + window.scrollY + 2}px`;
        painel.style.width = `${Math.max(caixa.width, 220)}px`;
        painel.hidden = false;
    };

    raiz.addEventListener('input', evento => {
        if (evento.isTrusted && evento.target.dataset?.lista) abrir(evento.target);
    });
    raiz.addEventListener('focusin', evento => {
        if (evento.target.dataset?.lista) abrir(evento.target);
    });
    raiz.addEventListener('focusout', evento => {
        if (evento.target === campoAtual) fechar();
    });
    raiz.addEventListener('keydown', evento => {
        if (evento.target !== campoAtual || painel.hidden) {
            if (evento.key === 'ArrowDown' && evento.target.dataset?.lista) abrir(evento.target);
            return;
        }
        if (evento.key === 'ArrowDown') { evento.preventDefault(); marcar(indiceAtivo + 1); }
        else if (evento.key === 'ArrowUp') { evento.preventDefault(); marcar(indiceAtivo - 1); }
        else if (evento.key === 'Enter' && indiceAtivo >= 0) {
            evento.preventDefault();
            escolher(painel.children[indiceAtivo].dataset.valor);
        } else if (evento.key === 'Escape') fechar();
    });
    window.addEventListener('resize', fechar);
    document.addEventListener('scroll', evento => { if (!painel.contains(evento.target)) fechar(); }, true);
}
