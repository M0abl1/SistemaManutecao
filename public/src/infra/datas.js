// Converte as datas das demandas para Date.
// Aceita Timestamp do Firestore, ISO 8601 e o formato legado
// "Solicitado em: dd/mm/aaaa, hh:mm:ss", que new Date() não entende.
export function converterDataDemanda(valor) {
    if (!valor) return null;
    if (typeof valor.toDate === 'function') return valor.toDate();
    if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
    const texto = String(valor).replace('Solicitado em:', '').trim();
    const brasileiro = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (brasileiro) {
        const [, dia, mes, ano, hora = 0, minuto = 0, segundo = 0] = brasileiro;
        const data = new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto), Number(segundo));
        return Number.isNaN(data.getTime()) ? null : data;
    }
    const data = new Date(texto);
    return Number.isNaN(data.getTime()) ? null : data;
}

// Data de abertura da demanda (criado_em ou, nas telas atuais, prazo_limite).
export function dataAberturaDemanda(demanda) {
    return converterDataDemanda(demanda?.criado_em) || converterDataDemanda(demanda?.prazo_limite);
}

// aaaa-mm-dd no fuso local, sem o deslocamento de toISOString().
export function dataIsoLocal(data) {
    if (!data) return '';
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}
