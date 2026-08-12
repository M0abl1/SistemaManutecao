import { collection, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const escapeHtml = valor => String(valor ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const normalizar = valor => String(valor || '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function inicializarMateriaisOs({ db, auth, obterPerfil, mostrarErro }) {
    let produtos = [];
    let consumos = [];

    function atualizarListaProdutos() {
        let datalist = document.getElementById('listaProdutosEstoqueOs');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'listaProdutosEstoqueOs';
            document.body.appendChild(datalist);
        }
        datalist.innerHTML = produtos.filter(p => p.ativo !== false && p.quantidade > 0).map(p =>
            `<option value="${escapeHtml(p.nome)}" data-id="${p.id}">${escapeHtml(p.codigo)} · saldo ${p.quantidade}</option>`
        ).join('');
    }

    function renderizarConsumos() {
        document.querySelectorAll('[data-materiais-demanda]').forEach(container => {
            const demandaId = container.dataset.materiaisDemanda;
            const itens = consumos.filter(item => item.demanda_id === demandaId);
            container.innerHTML = itens.map(item => `<div class="material-usado-item"><span>${escapeHtml(item.produto_nome)} — ${item.quantidade} un.</span><button type="button" data-remover-material="${item.id}">Remover</button></div>`).join('') || '<small>Nenhum material registrado.</small>';
        });
    }

    onSnapshot(query(collection(db, 'produtos_estoque'), orderBy('nome')), snapshot => {
        produtos = snapshot.docs.map(item => ({ id:item.id, ...item.data() }));
        atualizarListaProdutos();
    }, error => mostrarErro?.(`Falha ao carregar estoque: ${error.code}`));
    onSnapshot(query(collection(db, 'consumos_os'), orderBy('criado_em', 'desc')), snapshot => {
        consumos = snapshot.docs.map(item => ({ id:item.id, ...item.data() }));
        renderizarConsumos();
    }, error => mostrarErro?.(`Falha ao carregar materiais das OS: ${error.code}`));

    document.addEventListener('demandas-renderizadas', renderizarConsumos);
    document.addEventListener('click', async event => {
        const adicionar = event.target.closest('[data-adicionar-material]');
        if (adicionar) {
            const card = adicionar.closest('[data-demanda-card]');
            const demandaId = card?.dataset.demandaCard;
            const protocolo = Number(card?.dataset.protocolo);
            const input = card?.querySelector('[data-produto-os]');
            const quantidadeInput = card?.querySelector('[data-quantidade-os]');
            const produto = produtos.find(p => normalizar(p.nome) === normalizar(input?.value));
            const quantidade = Number(quantidadeInput?.value);
            if (!produto) return alert('Selecione um produto existente na lista.');
            if (!Number.isSafeInteger(quantidade) || quantidade <= 0) return alert('Informe uma quantidade inteira positiva.');
            const perfil = obterPerfil();
            const consumoId = `${demandaId}_${produto.id}`;
            const consumoRef = doc(db, 'consumos_os', consumoId);
            const produtoRef = doc(db, 'produtos_estoque', produto.id);
            try {
                await runTransaction(db, async tx => {
                    const produtoAtual = await tx.get(produtoRef);
                    const consumoAtual = await tx.get(consumoRef);
                    if (!produtoAtual.exists() || produtoAtual.data().ativo === false) throw new Error('Produto indisponível.');
                    if (produtoAtual.data().quantidade < quantidade) throw new Error(`Saldo insuficiente. Disponível: ${produtoAtual.data().quantidade}.`);
                    const quantidadeAnterior = consumoAtual.exists() ? consumoAtual.data().quantidade : 0;
                    tx.update(produtoRef, { quantidade:produtoAtual.data().quantidade-quantidade, ultima_operacao_id:consumoId, atualizado_em:serverTimestamp() });
                    tx.set(consumoRef, { demanda_id:demandaId, protocolo, produto_id:produto.id, produto_nome:produto.nome, quantidade:quantidadeAnterior+quantidade, responsavel:{uid:auth.currentUser.uid,nome:perfil.nome,cargo:perfil.cargo}, criado_em:serverTimestamp() });
                });
                input.value='';quantidadeInput.value='1';
            } catch (error) {
                alert(`Falha ao registrar material: ${error.message || error.code}`);
            }
            return;
        }
        const remover = event.target.closest('[data-remover-material]');
        if (!remover) return;
        const consumo = consumos.find(item => item.id === remover.dataset.removerMaterial);
        if (!consumo || !confirm(`Remover ${consumo.quantidade} unidade(s) de ${consumo.produto_nome} e devolver ao estoque?`)) return;
        const consumoRef = doc(db, 'consumos_os', consumo.id);
        const produtoRef = doc(db, 'produtos_estoque', consumo.produto_id);
        try {
            await runTransaction(db, async tx => {
                const produtoAtual = await tx.get(produtoRef);
                const consumoAtual = await tx.get(consumoRef);
                if (!produtoAtual.exists() || !consumoAtual.exists()) throw new Error('Registro não encontrado.');
                tx.update(produtoRef, { quantidade:produtoAtual.data().quantidade+consumoAtual.data().quantidade, ultima_operacao_id:consumo.id, atualizado_em:serverTimestamp() });
                tx.delete(consumoRef);
            });
        } catch (error) {
            alert(`Falha ao remover material: ${error.message || error.code}`);
        }
    });
}
