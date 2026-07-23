import { AuthModel } from '../models/authModel.js';
import { Logger } from '../infra/logger.js';

export class LoginController {
    constructor(view) {
        this.view = view;
        this.authModel = new AuthModel();
    }

    async iniciarFluxoLogin() {
        this.view.limparMensagens();
        Logger.info('LoginController.iniciarFluxoLogin', 'Clique de login detectado');

        try {
            const usuarioLogado = await this.authModel.autenticarComGoogle();
            let perfil = await this.authModel.obterPerfilUsuario(usuarioLogado.uid);

            // 1. SE O PERFIL NÃO EXISTIR (Conta nova do outro aparelho):
            if (!perfil) {
                Logger.info('LoginController.iniciarFluxoLogin', 'Usuário novo detectado. Criando perfil direto como técnico...');
                
                // Dados básicos para o auto-cadastro
                const dadosNovos = {
                    uid: usuarioLogado.uid,
                    nome: usuarioLogado.displayName || "Novo Técnico",
                    email: usuarioLogado.email,
                    cargo: "tecnico" // 🟢 MUDADO AQUI: Entra direto como técnico, sem ficar pendente
                };

                // Cadastra no Firestore
                await this.authModel.autoCadastrarUsuario(dadosNovos);
                
                // Atualiza a variável local para o fluxo seguir adiante
                perfil = { cargo: "tecnico" };
            }

            // 2. REDIRECIONAMENTO IMEDIATO
            const cargoNormalizado = this.normalizarCargo(perfil?.cargo);
            if (cargoNormalizado === 'supervisor' || cargoNormalizado === 'tecnico' || cargoNormalizado === 'ti') {
                this.redirecionarPorCargo(cargoNormalizado);
                return;
            }

            // 3. FLUXO DE SEGURANÇA (Se ainda houver contas antigas marcadas como 'pendente' no banco)
            if (cargoNormalizado === 'pendente') {
                this.view.bloquearBotaoLogin();
                this.view.exibirMensagemEspera("Sua conta está em análise! Aguardando a supervisão liberar o seu acesso...");

                this.authModel.escutarMudancaCargo(usuarioLogado.uid, (perfilAtualizado) => {
                    Logger.info('LoginController', 'Atualização de cargo capturada em tempo real', { cargo: perfilAtualizado.cargo });
                    const novoCargo = this.normalizarCargo(perfilAtualizado.cargo);
                    if (novoCargo === 'supervisor' || novoCargo === 'tecnico' || novoCargo === 'ti') {
                        this.redirecionarPorCargo(novoCargo);
                    }
                });
                return;
            }

            this.view.exibirMensagemErro("Seu perfil possui um cargo inválido. Solicite ao supervisor que use supervisor, tecnico ou ti.");

        } catch (error) {
            Logger.error('LoginController.iniciarFluxoLogin', 'Interrupção no fluxo de login', error);
            const codigo = error?.code ? ` (${error.code})` : '';
            this.view.exibirMensagemErro(`Não foi possível concluir o login${codigo}. Tente novamente.`);
        }
    }

    normalizarCargo(cargo) {
        return String(cargo || '')
            .trim()
            .toLocaleLowerCase('pt-BR')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    redirecionarPorCargo(cargo) {
        Logger.info('LoginController.redirecionarPorCargo', `Redirecionando usuário para tela de ${cargo}`);
        if (cargo === 'supervisor') window.location.href = 'views/supervisor.html';
        if (cargo === 'tecnico' || cargo === 'ti') window.location.href = 'views/tecnico.html';
    }
}
