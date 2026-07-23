import { db, auth, googleProvider } from '../config/firebase.js';
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { Logger } from '../infra/logger.js';

export class AuthModel {
    async autenticarComGoogle() {
        try {
            Logger.info('AuthModel.autenticarComGoogle', 'Iniciando popup do Google');
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            Logger.error('AuthModel.autenticarComGoogle', 'Falha no popup de autenticação', error);
            throw error;
        }
    }

    // 🟢 FUNÇÃO NOMEADA CORRETAMENTE (Sem o "n" do espanhol)
    async obterPerfilUsuario(uid) {
        try {
            const userDocRef = doc(db, "usuarios", uid);
            const userDoc = await getDoc(userDocRef);
            return userDoc.exists() ? userDoc.data() : null;
        } catch (error) {
            Logger.error('AuthModel.obterPerfilUsuario', `Erro ao buscar perfil do UID: ${uid}`, error);
            throw error;
        }
    }

    // 🟢 Aceita o objeto enviado pelo Controller
    async autoCadastrarUsuario(dadosUsuario) {
        try {
            const userDocRef = doc(db, "usuarios", dadosUsuario.uid);
            
            const dados = {
                nome: dadosUsuario.nome,
                email: dadosUsuario.email,
                cargo: dadosUsuario.cargo || "tecnico", 
                criado_em: new Date().toISOString()
            };
            
            await setDoc(userDocRef, dados);
            Logger.info('AuthModel.autoCadastrarUsuario', `Novo usuário registrado com sucesso: ${dados.email} como ${dados.cargo}`, { uid: dadosUsuario.uid });
            return dados;
        } catch (error) {
            Logger.error('AuthModel.autoCadastrarUsuario', 'Erro ao persistir novo usuário', error);
            throw error;
        }
    }

    escutarMudancaCargo(uid, callback) {
        const userDocRef = doc(db, "usuarios", uid);
        return onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            }
        }, (error) => {
            Logger.error('AuthModel.escutarMudancaCargo', 'Erro no listener em tempo real do cargo', error);
        });
    }
}