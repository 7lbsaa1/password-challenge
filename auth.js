import { db, ref, set, get, onValue } from './firebase.js';

class AuthSystem {
  constructor() {
    this.userId = localStorage.getItem('pc_user_id');
    this.userName = localStorage.getItem('pc_user_name');
    this.initBlockGuard();
  }

  async registerUser(username) {
    const cleanName = username.trim();
    if (!cleanName) throw new Error("يرجى كتابة اسم صحيح");

    const userId = "user_" + Math.random().toString(36).substring(2, 10);
    const userRef = ref(db, `users/${userId}`);
    
    const userData = {
      id: userId,
      name: cleanName,
      createdAt: Date.now(),
      blocked: false
    };

    await set(userRef, userData);
    localStorage.setItem('pc_user_id', userId);
    localStorage.setItem('pc_user_name', cleanName);
    this.userId = userId;
    this.userName = cleanName;
    
    return userData;
  }

  // حارس عام يعمل في جميع الصفحات لمنع المستخدم المحظور من التجاوز
  initBlockGuard() {
    if (!this.userId) return;

    const userRef = ref(db, `users/${this.userId}`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.blocked === true) {
        if (!window.location.pathname.includes('/block')) {
          window.location.href = '/block';
        }
      }
    });
  }

  requireAuth() {
    if (!this.userId || !this.userName) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.endsWith('index.html')) {
        window.location.href = '/login';
      }
    }
  }
}

export const auth = new AuthSystem();
