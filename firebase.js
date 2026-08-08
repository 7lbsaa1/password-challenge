import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  onValue, 
  child, 
  push 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBWTSFTecq2_QeDyg90mM1hPNytwPXYyZ0",
  authDomain: "admin-37e09.firebaseapp.com",
  databaseURL: "https://admin-37e09-default-rtdb.firebaseio.com",
  projectId: "admin-37e09",
  storageBucket: "admin-37e09.firebasestorage.app",
  messagingSenderId: "637953105703",
  appId: "1:637953105703:web:db22cf323186b157de5302",
  measurementId: "G-GQDLTK8FY6"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, get, update, onValue, child, push };
