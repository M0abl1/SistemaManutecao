import { escapeHtml as escapar } from './demandas.js';

// Tipos de serviço exclusivos das demandas de TI. Uma demanda pode ter vários.
// Gravados em `servicos_ti` (lista), somente quando tipo_manutencao === 'TI'.

export const SERVICOS_TI = ['Corretiva', 'Preventiva', 'Instalação', 'Configuração', 'Outros'];

// Lista válida e na ordem padrão, ignorando valores desconhecidos.
export const servicosTiDe = demanda => {
    const lista = Array.isArray(demanda?.servicos_ti) ? demanda.servicos_ti : [];
    return SERVICOS_TI.filter(servico => lista.includes(servico));
};

export const textoServicosTi = demanda => servicosTiDe(demanda).join(', ');

// Caixas de seleção. O nome do serviço vai em CSS (data-rotulo) para não poluir
// a busca por texto dos cards; o resumo legível fica em textoServicosTi.
export function htmlServicosTi(selecionados = [], visivel = true) {
    const opcoes = SERVICOS_TI.map(servico => `<label class="opcao-servico-ti"><input type="checkbox" data-servico-ti value="${escapar(servico)}" aria-label="${escapar(servico)}" ${selecionados.includes(servico) ? 'checked' : ''}><span data-rotulo="${escapar(servico)}"></span></label>`).join('');
    return `<fieldset class="servicos-ti" data-servicos-ti ${visivel ? '' : 'hidden'}><legend>Tipo de serviço de TI <small>(marque um ou mais)</small></legend><div class="opcoes-servicos-ti">${opcoes}</div></fieldset>`;
}

export function lerServicosTi(escopo) {
    const marcados = Array.from(escopo.querySelectorAll('[data-servico-ti]:checked')).map(caixa => caixa.value);
    return SERVICOS_TI.filter(servico => marcados.includes(servico));
}

const escopoDe = elemento => elemento.closest('form, [data-demanda-card]');

// Mostra o grupo de serviços apenas quando o tipo de OS selecionado é TI.
export function sincronizarServicosTi(escopo) {
    const seletor = escopo?.querySelector('#tipoManutencao, [data-campo="tipo_manutencao"]');
    const grupo = escopo?.querySelector('[data-servicos-ti]');
    if (seletor && grupo) grupo.hidden = seletor.value !== 'TI';
}

export function ativarServicosTi() {
    if (document.__servicosTiAtivo) return;
    document.__servicosTiAtivo = true;
    const estilo = document.createElement('style');
    estilo.textContent = `
        .servicos-ti { border: 1px solid var(--borda, #d0d5dd); border-radius: 8px; padding: 8px 12px 10px; margin: 10px 0; min-width: 0; }
        .servicos-ti[hidden] { display: none; }
        .servicos-ti legend { font-weight: 600; padding: 0 4px; }
        .servicos-ti legend small { font-weight: 400; opacity: .75; }
        .opcoes-servicos-ti { display: flex; flex-wrap: wrap; gap: 8px 16px; }
        .opcao-servico-ti { display: inline-flex !important; align-items: center; gap: 6px; cursor: pointer; font-weight: 400; margin: 0; }
        .opcao-servico-ti input { width: 18px !important; height: 18px; margin: 0; flex: none; }
        .opcao-servico-ti span::after { content: attr(data-rotulo); }
    `;
    document.head.appendChild(estilo);
    document.addEventListener('change', evento => {
        if (evento.target.matches('#tipoManutencao, [data-campo="tipo_manutencao"]')) sincronizarServicosTi(escopoDe(evento.target));
    });
    document.addEventListener('reset', evento => setTimeout(() => sincronizarServicosTi(evento.target)));
}
