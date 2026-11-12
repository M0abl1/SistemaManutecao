// Constantes, utilitários e carregamento de demandas compartilhados entre as telas.
import { collection, onSnapshot, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export const STATUS_DEMANDA = ['Pendente', 'Em Andamento', 'Concluído', 'Cancelado'];
export const STATUS_ABERTOS = ['Pendente', 'Em Andamento'];
export const STATUS_PERMITIDOS = new Set(STATUS_DEMANDA);
export const TIPOS_OS = ['Elétrica', 'Hidráulica', 'Patrimônio', 'Capina', "Limpeza de Caixa d'água", 'Marcenaria', 'Alvenaria',
    'Cobertura (Telhados)', 'Serralheria', 'Montagem de Mobiliário e Equipamentos', 'Geral', 'Outros', 'TI'];
export const PRIORIDADES = ['Normal', 'Alta', 'Crítico'];
export const ORDEM_PRIORIDADE = { 'Crítico': 0, 'Alta': 1, 'Normal': 2, 'Média': 2, 'Baixa': 2 };

export const escapeHtml = valor => String(valor ?? '').replace(/[&<>'"]/g, caractere => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[caractere]));

// Comparação simples sem acento/maiúsculas (para igualdade). Para pesquisa use busca.js.
export const normalizar = valor => String(valor || '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Valores legados: prioridades Baixa/Média viraram Normal e o tipo Limpeza virou Capina.
export const prioridadeAtual = valor => valor === 'Baixa' || valor === 'Média' ? 'Normal' : valor || 'Normal';
export const tipoOsAtual = valor => valor === 'Limpeza' ? 'Capina' : valor || 'Geral';

export const classeCorDemanda = demanda => {
    if (demanda.status === 'Concluído') return 'demanda-concluida';
    if (demanda.prioridade === 'Crítico') return 'prioridade-critico';
    if (demanda.prioridade === 'Alta' || demanda.prioridade === 'Grave') return 'prioridade-grave';
    return 'prioridade-normal';
};

// Abertas primeiro (mais antigas no topo); finalizadas depois (mais recentes no topo).
export const grupoStatus = status => status === 'Pendente' || status === 'Em Andamento' ? 0
    : status === 'Concluído' ? 1 : status === 'Cancelado' ? 2 : 3;

/**
 * Escuta as demandas sem baixar a coleção inteira:
 *  - todas as abertas (Pendente / Em Andamento), que são as de trabalho;
 *  - as `lote` finalizadas mais recentemente (por concluido_em);
 *  - os `lote` protocolos mais recentes (cobre registros antigos sem concluido_em).
 * `carregarMais()` amplia as duas últimas janelas. Nenhuma consulta exige índice composto.
 */
export function assinarDemandas(db, { aoAtualizar, aoErro, lote = 150 }) {
    const fontes = { abertas: new Map(), finalizadas: new Map(), recentes: new Map() };
    const cancelar = {};
    const prontas = new Set();
    let limiteAtual = lote;
    let temMais = false;

    const emitir = () => {
        if (prontas.size < 3) return;
        const todas = new Map([...fontes.recentes, ...fontes.finalizadas, ...fontes.abertas]);
        const lista = [...todas.values()].sort((a, b) => Number(b.protocolo || 0) - Number(a.protocolo || 0));
        aoAtualizar(lista, { temMais, limite: limiteAtual });
    };

    const escutar = (chave, consulta, aoReceber) => {
        cancelar[chave]?.();
        cancelar[chave] = onSnapshot(consulta, snapshot => {
            fontes[chave] = new Map(snapshot.docs.map(item => [item.id, { id: item.id, ...item.data() }]));
            prontas.add(chave);
            aoReceber?.(snapshot);
            emitir();
        }, aoErro);
    };

    const colecao = collection(db, 'demandas');
    escutar('abertas', query(colecao, where('status', 'in', STATUS_ABERTOS)));
    const escutarJanelas = () => {
        escutar('finalizadas', query(colecao, orderBy('concluido_em', 'desc'), limit(limiteAtual)));
        escutar('recentes', query(colecao, orderBy('protocolo', 'desc'), limit(limiteAtual)), snapshot => {
            temMais = snapshot.size >= limiteAtual;
        });
    };
    escutarJanelas();

    return {
        carregarMais() {
            limiteAtual += lote;
            escutarJanelas();
        },
        encerrar() { Object.values(cancelar).forEach(fn => fn?.()); }
    };
}

// Rodapé com o botão "Carregar mais" das listas de demandas.
export function htmlCarregarMais({ temMais, limite }) {
    if (!temMais) return '';
    return `<div class="carregar-mais-demandas" style="text-align:center; margin:16px 0;">
        <small style="display:block; margin-bottom:8px; opacity:.75;">Exibindo todas as demandas abertas e as ${limite} finalizadas mais recentes.</small>
        <button type="button" data-carregar-mais-demandas class="btn-acao" style="background:#475569; width:auto; padding:8px 16px;">Carregar demandas mais antigas</button>
    </div>`;
}
