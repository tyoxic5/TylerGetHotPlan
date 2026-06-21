// ============================================================
// FIREBASE INIT & SYNC
// Loaded as a module. Bridges to the classic app.js script via
// window.TPW (exposed by app.js) and window.cloudSync (exposed
// here). This file owns: auth screen show/hide, sign in/up/out,
// and pushing/pulling the Firestore document.
// ============================================================

import { firebaseConfig } from './firebase-config.js';

const SDK_VERSION = '11.0.2'; // bump if Firebase ships a newer major version — see README

const isConfigured = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');

const authScreen = document.getElementById('auth-screen');
const mainApp = document.getElementById('main-app');
const cloudBanner = document.getElementById('cloud-banner');
const signoutBtn = document.getElementById('btn-signout');

function showApp() {
  authScreen.style.display = 'none';
  mainApp.style.display = '';
  if (window.TPW && window.TPW.initApp) window.TPW.initApp();
}

function setSyncStatus(text, state) {
  const el = document.getElementById('sync-status-text');
  if (!el) return;
  el.textContent = text;
  el.parentElement.classList.remove('synced', 'unsynced');
  if (state) el.parentElement.classList.add(state);
}

// ---------- LOCAL-ONLY FALLBACK ----------
// If firebase-config.js still has placeholder values, skip auth
// entirely and just run the app off localStorage, same as before.

if (!isConfigured) {
  cloudBanner.style.display = 'block';
  cloudBanner.textContent = 'Cloud sync isn\u2019t configured yet \u2014 running in local-only mode. See README.md to set up Firebase.';
  showApp();
  setSyncStatus('Local only \u2014 cloud sync not configured', 'unsynced');
  window.cloudSync = {
    ready: false,
    syncTraining: async () => {},
    syncAll: async () => {},
  };
} else {
  // ---------- FULL FIREBASE FLOW ----------
  initFirebase();
}

async function initFirebase() {
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`);
  const {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword,
    createUserWithEmailAndPassword, signOut
  } = await import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`);
  const {
    getFirestore, doc, getDoc, setDoc
  } = await import(`https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let currentUid = null;

  function userDocRef(uid) {
    return doc(db, 'users', uid, 'data', 'main');
  }

  async function pullFromCloud(uid) {
    setSyncStatus('Pulling your data\u2026');
    try {
      const snap = await getDoc(userDocRef(uid));
      if (snap.exists()) {
        const cloud = snap.data();
        window.TPW.applyFullState(cloud);
        setSyncStatus('Synced \u2014 ' + new Date().toLocaleTimeString(), 'synced');
      } else {
        setSyncStatus('No cloud data yet \u2014 hit End Day to create your first backup', 'unsynced');
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('Could not reach the cloud \u2014 working locally', 'unsynced');
    }
  }

  async function syncTraining(date, sessionObj) {
    if (!currentUid) return;
    setSyncStatus('Syncing workout\u2026');
    try {
      await setDoc(userDocRef(currentUid), {
        training: { [date]: sessionObj }
      }, { merge: true });
      setSyncStatus('Workout synced \u2014 ' + new Date().toLocaleTimeString(), 'synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('Sync failed \u2014 saved locally only', 'unsynced');
    }
  }

  async function syncAll(fullState) {
    if (!currentUid) return;
    setSyncStatus('Syncing everything\u2026');
    try {
      await setDoc(userDocRef(currentUid), fullState, { merge: true });
      setSyncStatus('All synced \u2014 ' + new Date().toLocaleTimeString(), 'synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('Sync failed \u2014 saved locally only', 'unsynced');
    }
  }

  window.cloudSync = {
    ready: true,
    syncTraining,
    syncAll,
  };

  // ---------- AUTH UI WIRING ----------

  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-password');
  const errorEl = document.getElementById('auth-error');

  document.getElementById('btn-auth-signin').addEventListener('click', async () => {
    errorEl.textContent = '';
    try {
      await signInWithEmailAndPassword(auth, emailInput.value.trim(), passInput.value);
    } catch (err) {
      errorEl.textContent = friendlyError(err);
    }
  });

  document.getElementById('btn-auth-signup').addEventListener('click', async () => {
    errorEl.textContent = '';
    try {
      await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passInput.value);
    } catch (err) {
      errorEl.textContent = friendlyError(err);
    }
  });

  signoutBtn.addEventListener('click', async () => {
    await signOut(auth);
  });

  function friendlyError(err) {
    const code = err.code || '';
    if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Incorrect email or password.';
    if (code.includes('user-not-found')) return 'No account with that email \u2014 try Create Account.';
    if (code.includes('email-already-in-use')) return 'That email already has an account \u2014 try Sign In instead.';
    if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
    if (code.includes('invalid-email')) return 'That email address doesn\u2019t look right.';
    return 'Something went wrong \u2014 try again.';
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUid = user.uid;
      signoutBtn.style.display = '';
      showApp();
      await pullFromCloud(user.uid);
    } else {
      currentUid = null;
      signoutBtn.style.display = 'none';
      authScreen.style.display = 'flex';
      mainApp.style.display = 'none';
    }
  });
}
