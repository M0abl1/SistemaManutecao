import { db } from '../config/firebase.js';
import { collection, query, orderBy, onSnapshot, doc, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { Logger } from '../infra/logger.js';

export class SupervisorController {
    constructor(viewsContainers) {
        this.containers = viewsContainers;
        this.todasDemandas = [];
        this.todasUnidades = [];
        this.termoBusca = "";
    }

    inicializarTempoReal() {
        // Escuta demandas ordenadas por protocolo
        const qDemandas = query(collection(db, "demandas"), orderBy("protocolo", "desc"));
        onSnapshot(qDemandas, (snapshot) => {
            this.todasDemandas = [];
            snapshot.forEach(doc => this.todasDemandas.push({ idDoc: doc.id, ...doc.data() }));
            this.filtrarERenderizar();
        }, error => Logger.error('SupervisorController', 'Erro ao ouvir demandas', error));

        // Escuta unidades ordenadas por código identificador ID
        const qUnidades = query(collection(db, "unidades"), orderBy("id_unidade", "asc"));
        onSnapshot(qUnidades, (snapshot) => {
            this.todasUnidades = [];
            snapshot.forEach(doc => this.todasUnidades.push({ idDoc: doc.id, ...doc.data() }));
            this.renderizarUnidades();
        }, error => Logger.error('SupervisorController', 'Erro ao ouvir unidades', error));
    }

    async cadastrarNovaDemanda(dados) {
        try {
            await runTransaction(db, async (transaction) => {
                const contadorRef = doc(db, "configuracoes", "contador_protocolo");
                const contadorDoc = await transaction.get(contadorRef);
                let novoProtocolo = 1000;
                if (contadorDoc.exists()) novoProtocolo = contadorDoc.data().ultimo_numero + 1;
                
                transaction.set(contadorRef, { ultimo_numero: novoProtocolo });
                transaction.set(doc(collection(db, "demandas")), {
                    protocolo: novoProtocolo,
                    ...dados,
                    status: 'Pendente',
                    observacao_tecnico: '',
                    criado_em: new Date().toISOString()
                });
            });
            alert('Demanda registrada com sucesso!');
        } catch (error) {
            Logger.error('SupervisorController', 'Erro transação demanda', error);
        }
    }

    async cadastrarNovaUnidade(nome, endereco) {
        try {
            await runTransaction(db, async (transaction) => {
                const contadorRef = doc(db, "configuracoes", "contador_unidades");
                const contadorDoc = await transaction.get(contadorRef);
                let novoNumeroId = 100;
                if (contadorDoc.exists()) novoNumeroId = contadorDoc.data().ultimo_numero + 1;
                
                transaction.set(contadorRef, { ultimo_numero: novoNumeroId });
                const idFormatado = `U${novoNumeroId}`;
                
                transaction.set(doc(collection(db, "unidades")), {
                    id_unidade: idFormatado,
                    nome: nome,
                    endereco: endereco,
                    criado_em: new Date().toISOString()
                });
            });
            alert('Unidade cadastrada com sucesso!');
        } catch (error) {
            Logger.error('SupervisorController', 'Erro transação unidade', error);
        }
    }

    definirTermoBusca(texto) {
        this.termoBusca = texto.toLowerCase().trim();
        this.filtrarERenderizar();
    }

    filtrarERenderizar() {
        const filtradas = this.todasDemandas.filter(d => {
            if (!this.termoBusca) return true;
            return (
                d.protocolo.toString().includes(this.termoBusca) ||
                (d.tipo_manutencao && d.tipo_manutencao.toLowerCase().includes(this.termoBusca)) ||
                (d.unidade_atendida && d.unidade_atendida.toLowerCase().includes(this.termoBusca)) ||
                (d.quem_atendido && d.quem_atendido.toLowerCase().includes(this.termoBusca))
            );
        });

        ['geral', 'pendentes', 'andamento', 'concluidas', 'canceladas'].forEach(k => {
            if (this.containers[k]) this.containers[k].innerHTML = '';
        });

        filtradas.forEach(d => {
            const linhaHtml = this.criarLinhaDemanda(d);
            if (this.containers.geral) this.containers.geral.innerHTML += linhaHtml;
            if (d.status === 'Pendente' && this.containers.pendentes) this.containers.pendentes.innerHTML += linhaHtml;
            if (d.status === 'Em Andamento' && this.containers.andamento) this.containers.andamento.innerHTML += linhaHtml;
            if (d.status === 'Concluído' && this.containers.concluidas) this.containers.concluidas.innerHTML += linhaHtml;
            if (d.status === 'Cancelado' && this.containers.canceladas) this.containers.canceladas.innerHTML += linhaHtml;
        });
    }

    renderizarUnidades() {
        if (this.containers.unidades) this.containers.unidades.innerHTML = '';
        if (this.containers.selectUnidadesDemanda) this.containers.selectUnidadesDemanda.innerHTML = '';

        this.todasUnidades.forEach(u => {
            if (this.containers.unidades) {
                this.containers.unidades.innerHTML += `
                    <tr>
                        <td data-label="ID" style="font-weight: 600; color: var(--primaria)">${u.id_unidade}</td>
                        <td data-label="Nome da Instituição"><b>${u.nome}</b></td>
                        <td data-label="Endereço Cadastrado" style="color: var(--texto-secundario)">${u.endereco}</td>
                    </tr>
                `;
            }
            if (this.containers.selectUnidadesDemanda) {
                this.containers.selectUnidadesDemanda.innerHTML += `<option value="${u.nome}">[${u.id_unidade}] ${u.nome}</option>`;
            }
        });
    }

    criarLinhaDemanda(d) {
    let cor = 'var(--status-pendente)';
    if (d.status === 'Em Andamento') cor = 'var(--status-andamento)';
    if (d.status === 'Concluído') cor = 'var(--status-concluido)';
    if (d.status === 'Cancelado') cor = 'var(--status-cancelado)';

    // Garante que se vier vazio do banco por qualquer motivo, exibe um texto padrão amigável
    const tipo = d.tipo_manutencao || 'Geral';
    const unidade = d.unidade_atendida || 'Não informada';
    const quem = d.quem_atendido || 'Não informado';

    return `
        <tr>
            <td data-label="Protocolo" style="font-weight: 600; color: var(--primaria)">#${d.protocolo}</td>
            <td data-label="Tipo / Unidade"><b>${tipo}</b><br><small style="color:var(--texto-secundario)">${unidade}</small></td>
            <td data-label="Atendido">${quem}</td>
            <td data-label="Status"><span class="badge" style="background: ${cor}">${d.status}</span></td>
        </tr>
    `;
}
}