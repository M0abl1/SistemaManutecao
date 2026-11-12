// Testes das regras do Firestore (firestore.rules) no emulador local.
// Execução: npm run test:rules   (requer Java instalado; o emulador sobe e desce sozinho)
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
    collection, deleteField, doc, getDoc, getDocs, limit, orderBy, query,
    serverTimestamp, setDoc, updateDoc, where, writeBatch
} from 'firebase/firestore';

const PROJETO = 'demo-sistema-manutencao';
let ambiente;

const PERFIS = {
    supervisor: { nome: 'Sup Teste', email: 'sup@teste.com', cargo: 'supervisor', criado_em: '2026-01-01T00:00:00.000Z' },
    tecnico: { nome: 'Tec Teste', email: 'tec@teste.com', cargo: 'tecnico', criado_em: '2026-01-01T00:00:00.000Z' },
    ti: { nome: 'TI Teste', email: 'ti@teste.com', cargo: 'ti', criado_em: '2026-01-01T00:00:00.000Z' }
};

const ator = uid => ({ uid, nome: PERFIS[uid].nome, cargo: PERFIS[uid].cargo });
const bancoDe = uid => ambiente.authenticatedContext(uid, { email: PERFIS[uid]?.email }).firestore();

// Demanda como as telas gravam hoje (criado_em no lugar do antigo prazo_limite).
const novaDemanda = (uid, extras = {}) => ({
    tipo_manutencao: 'Elétrica',
    unidade_atendida: 'Escola Municipal Ângelo Magalhães',
    quem_atendido: '',
    prioridade: 'Normal',
    descricao: 'Tomada sem energia',
    status: 'Pendente',
    criado_em: new Date().toISOString(),
    observacao_tecnico: '',
    status_alterado_por: ator(uid),
    status_alterado_em: serverTimestamp(),
    ...extras
});

// Reserva o próximo protocolo e cria a demanda na mesma escrita, como faz a transação das telas.
async function abrirDemanda(db, dados, protocolo = 1001) {
    const lote = writeBatch(db);
    lote.set(doc(db, 'configuracoes', 'contador_protocolo'), { ultimo_numero: protocolo });
    lote.set(doc(db, 'demandas', `d${protocolo}`), { ...dados, protocolo });
    return lote.commit();
}

async function semearDemanda(id, dados) {
    await ambiente.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'demandas', id), dados));
}

const demandaSalva = (extras = {}) => ({
    ...novaDemanda('tecnico'),
    status_alterado_em: new Date('2026-01-02T00:00:00Z'),
    protocolo: 1000,
    ...extras
});

before(async () => {
    const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
    ambiente = await initializeTestEnvironment({
        projectId: PROJETO,
        firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) }
    });
});

after(async () => { await ambiente?.cleanup(); });

beforeEach(async () => {
    await ambiente.clearFirestore();
    await ambiente.withSecurityRulesDisabled(async ctx => {
        const db = ctx.firestore();
        for (const [uid, perfil] of Object.entries(PERFIS)) await setDoc(doc(db, 'usuarios', uid), perfil);
        await setDoc(doc(db, 'configuracoes', 'contador_protocolo'), { ultimo_numero: 1000 });
    });
});

describe('leitura de demandas', () => {
    test('visitante sem login não lê demandas', async () => {
        await semearDemanda('d1000', demandaSalva());
        await assertFails(getDoc(doc(ambiente.unauthenticatedContext().firestore(), 'demandas', 'd1000')));
    });

    test('usuário logado sem perfil não lê demandas', async () => {
        await semearDemanda('d1000', demandaSalva());
        await assertFails(getDoc(doc(ambiente.authenticatedContext('intruso').firestore(), 'demandas', 'd1000')));
    });

    test('perfis operacionais executam as consultas usadas pelas telas', async () => {
        await semearDemanda('d1000', demandaSalva());
        const db = bancoDe('tecnico');
        const demandas = collection(db, 'demandas');
        await assertSucceeds(getDocs(query(demandas, where('status', 'in', ['Pendente', 'Em Andamento']))));
        await assertSucceeds(getDocs(query(demandas, orderBy('concluido_em', 'desc'), limit(150))));
        await assertSucceeds(getDocs(query(demandas, orderBy('protocolo', 'desc'), limit(150))));
    });
});

describe('abertura de demandas', () => {
    test('técnico abre demanda com criado_em e protocolo sequencial', async () => {
        await assertSucceeds(abrirDemanda(bancoDe('tecnico'), novaDemanda('tecnico')));
    });

    test('demanda antiga com prazo_limite continua aceita', async () => {
        const { criado_em, ...dados } = novaDemanda('tecnico');
        await assertSucceeds(abrirDemanda(bancoDe('tecnico'), { ...dados, prazo_limite: criado_em }));
    });

    test('recusa protocolo fora da sequência do contador', async () => {
        const db = bancoDe('tecnico');
        const lote = writeBatch(db);
        lote.set(doc(db, 'configuracoes', 'contador_protocolo'), { ultimo_numero: 1001 });
        lote.set(doc(db, 'demandas', 'x'), { ...novaDemanda('tecnico'), protocolo: 1005 });
        await assertFails(lote.commit());
    });

    test('recusa auditoria em nome de outra pessoa', async () => {
        await assertFails(abrirDemanda(bancoDe('tecnico'), novaDemanda('tecnico', { status_alterado_por: ator('supervisor') })));
    });
});

describe('serviços de TI (servicos_ti)', () => {
    test('demanda de TI aceita vários serviços', async () => {
        await assertSucceeds(abrirDemanda(bancoDe('ti'), novaDemanda('ti', {
            tipo_manutencao: 'TI', servicos_ti: ['Corretiva', 'Instalação', 'Configuração']
        })));
    });

    test('recusa servicos_ti em demanda que não é de TI', async () => {
        await assertFails(abrirDemanda(bancoDe('ti'), novaDemanda('ti', { servicos_ti: ['Corretiva'] })));
    });

    test('recusa serviço desconhecido', async () => {
        await assertFails(abrirDemanda(bancoDe('ti'), novaDemanda('ti', { tipo_manutencao: 'TI', servicos_ti: ['Formatação'] })));
    });

    test('recusa lista vazia ou com repetição', async () => {
        await assertFails(abrirDemanda(bancoDe('ti'), novaDemanda('ti', { tipo_manutencao: 'TI', servicos_ti: [] })));
        await assertFails(abrirDemanda(bancoDe('ti'), novaDemanda('ti', { tipo_manutencao: 'TI', servicos_ti: ['Corretiva', 'Corretiva'] })));
    });

    test('técnico marca serviços ao editar uma demanda de TI antiga', async () => {
        await semearDemanda('d1000', demandaSalva({ tipo_manutencao: 'TI' }));
        await assertSucceeds(updateDoc(doc(bancoDe('ti'), 'demandas', 'd1000'), {
            servicos_ti: ['Preventiva', 'Outros'], status_alterado_por: ator('ti'), status_alterado_em: serverTimestamp()
        }));
    });

    test('ao trocar TI por outro tipo, os serviços precisam ser removidos', async () => {
        await semearDemanda('d1000', demandaSalva({ tipo_manutencao: 'TI', servicos_ti: ['Corretiva'] }));
        const ref = doc(bancoDe('tecnico'), 'demandas', 'd1000');
        const auditoria = { status_alterado_por: ator('tecnico'), status_alterado_em: serverTimestamp() };
        await assertFails(updateDoc(ref, { tipo_manutencao: 'Elétrica', ...auditoria }));
        await assertSucceeds(updateDoc(ref, { tipo_manutencao: 'Elétrica', servicos_ti: deleteField(), ...auditoria }));
    });
});

describe('edição e status', () => {
    const auditoria = uid => ({ status_alterado_por: ator(uid), status_alterado_em: serverTimestamp() });

    test('concluir exige parecer técnico e data de conclusão', async () => {
        await semearDemanda('d1000', demandaSalva());
        const ref = doc(bancoDe('tecnico'), 'demandas', 'd1000');
        await assertFails(updateDoc(ref, { status: 'Concluído', concluido_em: new Date().toISOString(), ...auditoria('tecnico') }));
        await assertFails(updateDoc(ref, { status: 'Concluído', observacao_tecnico: 'Trocada a tomada', ...auditoria('tecnico') }));
        await assertSucceeds(updateDoc(ref, {
            status: 'Concluído', observacao_tecnico: 'Trocada a tomada', concluido_em: new Date().toISOString(), ...auditoria('tecnico')
        }));
    });

    test('só o supervisor altera o relato original', async () => {
        await semearDemanda('d1000', demandaSalva());
        await assertFails(updateDoc(doc(bancoDe('tecnico'), 'demandas', 'd1000'), { descricao: 'Outro texto', ...auditoria('tecnico') }));
        await assertSucceeds(updateDoc(doc(bancoDe('supervisor'), 'demandas', 'd1000'), { descricao: 'Outro texto', ...auditoria('supervisor') }));
    });

    test('protocolo não pode ser alterado', async () => {
        await semearDemanda('d1000', demandaSalva());
        await assertFails(updateDoc(doc(bancoDe('supervisor'), 'demandas', 'd1000'), { protocolo: 2000, ...auditoria('supervisor') }));
    });
});

describe('usuários', () => {
    test('novo cadastro só pode nascer como técnico', async () => {
        const db = ambiente.authenticatedContext('novo', { email: 'novo@teste.com' }).firestore();
        const base = { nome: 'Novo', email: 'novo@teste.com', criado_em: '2026-01-01T00:00:00.000Z' };
        await assertFails(setDoc(doc(db, 'usuarios', 'novo'), { ...base, cargo: 'supervisor' }));
        await assertSucceeds(setDoc(doc(db, 'usuarios', 'novo'), { ...base, cargo: 'tecnico' }));
    });
});
