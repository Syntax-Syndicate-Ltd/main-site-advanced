/* ══════════════════════════════════════════════
   SYNTAX SYNDICATE — AUTH MODULE
   Register · Login · Session · Role Gates
   Roles: superadmin > team > institute_admin > premium > user
   ══════════════════════════════════════════════ */

const Auth = {
  currentUser: null,
  currentProfile: null,
  _listeners: [],
  _ready: false,

  /* ── Subscribe to auth state changes ── */
  onAuthChange(fn) {
    if (typeof fn !== 'function') return;
    this._listeners.push(fn);
    // If already hydrated, call immediately
    if (this._ready) fn(this.currentUser, this.currentProfile);
  },

  /* ── Accessors ── */
  getUser()    { return this.currentUser; },
  getProfile() { return this.currentProfile; },
  isLoggedIn() { return !!this.currentUser; },
  getRole()    { return this.currentProfile?.role || 'guest'; },

  isPremium()        { return ['premium','team','superadmin'].includes(this.getRole()); },
  isInstituteAdmin() { return ['institute_admin','team','superadmin'].includes(this.getRole()); },
  isAdmin()          { return ['superadmin','team'].includes(this.getRole()); },
  isSuperadmin()     { return this.getRole() === 'superadmin'; },

  /* ── REGISTER (Free User) ── */
  async register(email, password, profileData) {
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const uid = cred.user.uid;
      await db.collection('users').doc(uid).set({
        name: profileData.name || '',
        email: email,
        college: profileData.college || '',
        level: profileData.level || '',
        branch: profileData.branch || '',
        mobile: profileData.mobile || '',
        avatar_url: '',
        role: 'user',
        apply_clicks: 0,
        books_read: 0,
        projects_done: 0,
        portfolio_link: '',
        share_profile: false,
        is_active: true,
        badges: [],
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      SS.showToast('Account created successfully!', 'success');
      Auth.handlePostLogin(cred.user);
      return { success: true, uid };
    } catch (err) {
      const msg = Auth._parseError(err.code);
      SS.showToast(msg, 'error');
      return { success: false, error: msg };
    }
  },

  /* ── REGISTER INSTITUTE / COMPANY ── */
  async registerCompany(email, password, companyData) {
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const uid = cred.user.uid;
      await db.collection('users').doc(uid).set({
        name: companyData.name || '',
        email: email,
        domain: companyData.domain || '',
        description: companyData.description || '',
        avatar_url: '',
        role: 'institute_admin',
        resources_count: 0,
        is_verified: false,
        is_active: true,
        badges: [],
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      SS.showToast('Institute registered successfully!', 'success');
      Auth.handlePostLogin(cred.user);
      return { success: true, uid };
    } catch (err) {
      const msg = Auth._parseError(err.code);
      SS.showToast(msg, 'error');
      return { success: false, error: msg };
    }
  },

  /* ── LOGIN ── */
  async login(email, password) {
    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      SS.showToast('Welcome back!', 'success');
      Auth.handlePostLogin(cred.user);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err.code, err.message);
      const msg = Auth._parseError(err.code);
      SS.showToast(msg, 'error');
      return { success: false, error: msg };
    }
  },

  /* ── GOOGLE AUTH ── */
  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const cred = await auth.signInWithPopup(provider);
      const uid = cred.user.uid;
      const userRef = db.collection('users').doc(uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        await userRef.set({
          name: cred.user.displayName || '',
          email: cred.user.email,
          college: '',
          level: '',
          branch: '',
          mobile: cred.user.phoneNumber || '',
          role: 'user',
          apply_clicks: 0,
          books_read: 0,
          projects_done: 0,
          portfolio_link: '',
          share_profile: false,
          is_active: true,
          badges: [],
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        SS.showToast('Account created with Google!', 'success');
      } else {
        SS.showToast('Welcome back!', 'success');
      }

      Auth.handlePostLogin(cred.user);
      return { success: true, uid };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return { success: false, error: 'Popup closed' };
      const msg = Auth._parseError(err.code);
      SS.showToast(msg, 'error');
      return { success: false, error: msg };
    }
  },

  /* ── POST-LOGIN REDIRECT ── */
  async handlePostLogin(user) {
    if (!user) return;
    const doc = await db.collection('users').doc(user.uid).get();
    if (doc.exists) {
      const role = doc.data().role;
      if (role === 'superadmin' || role === 'team') {
        window.location.href = 'admin.html';
      } else if (role === 'institute_admin') {
        window.location.href = 'dashboard-company.html';
      } else {
        window.location.href = 'profile.html';
      }
    } else {
      window.location.href = 'profile.html';
    }
  },

  /* ── LOGOUT ── */
  async logout() {
    try {
      await auth.signOut();
      Auth.currentUser = null;
      Auth.currentProfile = null;
      SS.showToast('Logged out', 'info');
      window.location.href = 'index.html';
    } catch (err) {
      SS.showToast('Logout failed', 'error');
    }
  },

  /* ── PASSWORD RESET ── */
  async resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      SS.showToast('Password reset email sent!', 'success');
      return { success: true };
    } catch (err) {
      SS.showToast(Auth._parseError(err.code), 'error');
      return { success: false };
    }
  },

  /* ── PAGE GATES ── */
  requireAuth(allowedRoles = null) {
    return new Promise((resolve) => {
      const unsub = auth.onAuthStateChanged(async (user) => {
        unsub();
        if (!user) {
          window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
          return;
        }
        const doc = await db.collection('users').doc(user.uid).get();
        Auth.currentUser = user;
        Auth.currentProfile = doc.exists ? { id: doc.id, ...doc.data() } : null;

        if (allowedRoles) {
          const role = doc.exists ? doc.data().role : 'user';
          if (!allowedRoles.includes(role)) {
            SS.showToast('Access denied', 'error');
            window.location.href = 'index.html';
            return;
          }
        }
        resolve(user);
      });
    });
  },

  requirePremium()        { return Auth.requireAuth(['premium', 'superadmin', 'team']); },
  requireAdmin()          { return Auth.requireAuth(['superadmin', 'team']); },
  requireInstituteAdmin() { return Auth.requireAuth(['institute_admin', 'superadmin', 'team']); },

  /* ── ERROR PARSER ── */
  _parseError(code) {
    const map = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/invalid-login-credentials': 'Invalid email or password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Check your connection',
      'auth/popup-closed-by-user': 'Sign-in popup was closed',
      'auth/cancelled-popup-request': 'Only one popup request allowed at a time',
    };
    return map[code] || 'An error occurred (' + code + '). Please try again.';
  }
};

/* ── OPPORTUNITY CATEGORY CONFIG ── */
Auth.CATEGORY_CONFIG = {
  ss_jobs:        { label:'Job',        icon:'bi-briefcase-fill',   badgeClass:'badge-jobs',        emoji:'🏢', color:'#1847c2', bg:'#edf1ff' },
  ss_internships: { label:'Internship', icon:'bi-mortarboard-fill', badgeClass:'badge-internships',  emoji:'📚', color:'#0c7abf', bg:'#e8f6fd' },
  ss_hackathons:  { label:'Hackathon',  icon:'bi-lightning-fill',   badgeClass:'badge-hackathons',   emoji:'⚡', color:'#c41f1f', bg:'#fdf0f0' },
  ss_techEvents:  { label:'Tech Event', icon:'bi-cpu-fill',         badgeClass:'badge-techEvents',   emoji:'💡', color:'#b45309', bg:'#fef8ec' },
  ss_seminars:    { label:'Seminar',    icon:'bi-mic-fill',         badgeClass:'badge-seminars',     emoji:'🎤', color:'#6d28d9', bg:'#f4f0ff' },
  ss_courses:     { label:'Course',     icon:'bi-book-fill',        badgeClass:'badge-courses',      emoji:'🎒', color:'#047857', bg:'#ecfdf5' }
};

/* ── Global access ── */
window.Auth = Auth;

/* ── GLOBAL AUTH STATE OBSERVER ──
   This fires on every page load and recovers the session.
   Once the profile is fetched, it notifies all subscribers (navbar, etc.) */
firebase.auth().onAuthStateChanged(async (user) => {
  Auth.currentUser = user;
  if (user) {
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      Auth.currentProfile = doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (e) {
      console.error('Profile fetch error:', e);
      Auth.currentProfile = null;
    }
  } else {
    Auth.currentProfile = null;
  }
  Auth._ready = true;
  // Notify all listeners (navbar, etc.)
  Auth._listeners.forEach(fn => {
    try { fn(user, Auth.currentProfile); } catch(e) { console.error('Auth listener error:', e); }
  });
});
