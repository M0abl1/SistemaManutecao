import { AuthModel } from '../models/authModel.js';
import { Logger } from '../infra/logger.js';

export class LoginController {
    constructor(view) {
        this.view = view;
        this.authModel = new AuthModel();
    }

    // Quem já entrou neste aparelho vai direto para o painel, sem ver a tela de login.
    // O painel de destino valida o cargo de novo, por isso o perfil pode vir do cache local.
    async retomarSessao() {
        try {
            const usuario = await this.authModel.obterUsuarioDaSessao();
            if (usuario) {
                const perfil = await this.authModel.obterPerfilSalvo(usuario.uid);
                const cargoNormalizado = this.normalizarCargo(perfil?.cargo);
                if (cargoNormalizado) {
                    Logger.info('LoginController.retomarSessao', 'Sessão existente encontrada');
                    this.redirecionarPorCargo(cargoNormalizado);
                    return;
                }
            }
        } catch (error) {
            Logger.error('LoginController.retomarSessao', 'Não foi possível retomar a sessão', error);
        }
        this.view.limparMensagens();
        this.view.exibirTelaLogin();
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
            if (cargoNormalizado) {
                this.redirecionarPorCargo(cargoNormalizado);
                return;
            }

            this.view.exibirMensagemErro("Seu perfil não possui um cargo válido.");

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
        // replace: o botão Voltar do celular não deve retornar à tela de login.
        if (cargo === 'supervisor') window.location.replace('views/supervisor.html');
        else window.location.replace('views/tecnico.html');
    }
}
