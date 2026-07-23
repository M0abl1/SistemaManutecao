import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCNGjgWUVyjnglM57IiRkhbTyH3BsQVo-w",
  // No Hosting, mantenha o helper OAuth na mesma origem para evitar que
  // navegadores bloqueiem o retorno da autenticação por armazenamento externo.
  authDomain: window.location.hostname === "manutencaoseduc-33d37.web.app"
    ? "manutencaoseduc-33d37.web.app"
    : "manutencaoseduc-33d37.firebaseapp.com",
  projectId: "manutencaoseduc-33d37",
  storageBucket: "manutencaoseduc-33d37.firebasestorage.app",
  messagingSenderId: "818235006427",
  appId: "1:818235006427:web:a9ea93ea0bd0dcf1741bfe",
  measurementId: "G-99YVZE30RF"
};

// 3. INICIALIZAÇÃO DO APP (Apenas uma vez)
const app = initializeApp(firebaseConfig);

// 4. EXPORTAÇÕES DOS MÓDULOS PARA OS CONTROLLERS/MODELS
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
