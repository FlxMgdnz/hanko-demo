import { register } from '@teamhanko/hanko-elements';
import { de } from '@teamhanko/hanko-elements/i18n/de';
import { en } from '@teamhanko/hanko-elements/i18n/en';
import './style.css';

const app = document.querySelector('#app');
let hanko;
let renderId = 0;
let notice = '';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function go(route) {
  if (location.hash === `#${route}`) render();
  else location.hash = route;
}

function shell(content, signedIn = false) {
  app.innerHTML = `<header class="topbar"><div class="bar-inner">
    <a class="brand" href="#/${signedIn ? 'dashboard' : 'login'}"><span class="brand-mark" aria-hidden="true">m.</span>Mein Portal</a>
    ${signedIn ? `<details class="account"><summary>Mein Konto <svg class="account-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></summary>
      <nav class="dropdown" aria-label="Kontomenü"><a href="#/profil">Profil</a><button type="button" id="logout">Ausloggen</button></nav>
    </details>` : '<span class="demo-label">Hanko Demo</span>'}
    </div></header><main id="main" tabindex="-1">${notice ? `<p class="notice" role="status">${escapeHtml(notice)}</p>` : ''}${content}</main>`;
  document.querySelector('#logout')?.addEventListener('click', logout);
}

function showError(message) {
  shell(`<section class="card"><h1>Das hat leider nicht geklappt.</h1><p>${escapeHtml(message)}</p><button class="button" id="retry">Erneut versuchen</button></section>`);
  document.querySelector('#retry').addEventListener('click', () => hanko ? render() : location.reload());
}

function authPage(registration) {
  document.title = `${registration ? 'Registrieren' : 'Anmelden'} · Mein Portal`;
  shell(`<div class="auth-layout"><section class="intro">
    <span class="eyebrow">Dein persönlicher Bereich</span><h1>Alles an einem Ort.</h1>
    <p class="muted">Deine Anträge im Blick. Dein Profil in deiner Hand.</p>
    <p class="intro-note muted">Ein einfacher Zugang zu deinem Portal.<br>Anmeldung mit Hanko.</p>
    </section><section class="card auth-card" aria-label="${registration ? 'Registrierung' : 'Anmeldung'}">
    ${registration ? '<hanko-registration lang="de"></hanko-registration>' : '<hanko-login lang="de"></hanko-login>'}
    <p class="auth-switch">${registration ? 'Schon ein Konto? <a href="#/login">Zum Login</a>' : 'Noch kein Konto? <a href="#/registrieren">Registrieren</a>'}</p></section></div>`);
}

function dashboard(user) {
  const name = user.username?.username || user.emails?.find((email) => email.is_primary)?.address || user.emails?.[0]?.address || 'schön, dass du da bist';
  document.title = 'Dashboard · Mein Portal';
  shell(`<span class="eyebrow">Deine Übersicht</span><h1>Willkommen, ${escapeHtml(name)}</h1>
    <p class="muted">Hier findest du eine Übersicht deiner Anträge.</p>
    <section aria-labelledby="applications-title"><div class="section-heading"><h2 id="applications-title">Deine Anträge</h2><span class="count">3 Anträge</span></div>
    <ul class="applications">${[
      ['Lorem ipsum dolor sit amet', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', 'In Bearbeitung', 'pending'],
      ['Duis aute irure dolor', 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.', 'Eingegangen', ''],
      ['Excepteur sint occaecat', 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 'Abgeschlossen', 'done'],
    ].map(([title, description, status, className], index) => `<li class="application"><span class="document-icon" aria-hidden="true"><svg width="20" height="24" viewBox="0 0 20 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 2h8l4 4v16H4zM12 2v5h4M7 12h6M7 16h6"/></svg></span><div class="application-body"><h3>${title}</h3><p>${description}</p><p>AN-2026-00${index + 1}</p></div><span class="status ${className}">${status}</span></li>`).join('')}</ul>
    <p class="footnote">Diese Anträge sind Beispieldaten.</p></section>`, true);
}

function profile() {
  document.title = 'Profil · Mein Portal';
  shell(`<a class="back" href="#/dashboard">← Zurück zum Dashboard</a><br><span class="eyebrow">Dein Konto</span>
    <h1>Dein Profil</h1><p class="muted">Verwalte deine Anmeldedaten und Sicherheitseinstellungen.</p>
    <section class="card profile-card" aria-label="Profileinstellungen"><hanko-profile lang="de"></hanko-profile></section>`, true);
}

async function render() {
  const id = ++renderId;
  const route = location.hash.slice(1) || '/';
  shell('<p role="status">Deine Sitzung wird geprüft …</p>');
  try {
    const { is_valid: signedIn } = await hanko.validateSession();
    if (id !== renderId) return;
    if (route === '/') return go(signedIn ? '/dashboard' : '/login');
    if (!['/login', '/registrieren', '/dashboard', '/profil'].includes(route)) {
      document.title = 'Seite nicht gefunden · Mein Portal';
      shell('<h1>Seite nicht gefunden.</h1><p><a href="#/">Zur Startseite</a></p>', signedIn);
      return;
    }
    const protectedRoute = ['/dashboard', '/profil'].includes(route);
    if (protectedRoute && !signedIn) return go('/login');
    if (!protectedRoute && signedIn) return go('/dashboard');
    if (route === '/dashboard') {
      const user = await hanko.getCurrentUser();
      if (id !== renderId) return;
      dashboard(user);
    } else if (route === '/profil') profile();
    else authPage(route === '/registrieren');
  } catch {
    if (id === renderId) showError(`Die Verbindung zu Hanko konnte nicht hergestellt werden. Prüfe deine Internetverbindung. Für diese Demo muss außerdem ${location.origin} im Hanko-Projekt als erlaubte Origin eingetragen sein.`);
  }
}

async function logout() {
  const button = document.querySelector('#logout');
  button.disabled = true;
  button.textContent = 'Wird ausgeloggt …';
  try {
    await hanko.logout();
    notice = 'Du wurdest ausgeloggt.';
    go('/login');
  } catch {
    showError('Das Ausloggen konnte nicht vollständig bestätigt werden. Bitte versuche es erneut.');
  }
}

document.addEventListener('click', (event) => {
  const menu = document.querySelector('.account');
  if (menu && !menu.contains(event.target)) menu.open = false;
});
document.addEventListener('keydown', (event) => {
  const menu = document.querySelector('.account');
  if (event.key === 'Escape' && menu?.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  document.querySelector('#main').focus();
});

async function start() {
  try {
    const apiUrl = import.meta.env.VITE_HANKO_API_URL;
    if (!apiUrl) throw new Error('Missing Hanko API URL');
    ({ hanko } = await register(apiUrl, { translations: { de, en }, fallbackLanguage: 'de' }));
    hanko.setLang('de');
    hanko.onSessionCreated(() => {
      notice = '';
      // The SDK also emits this event on reload; preserve protected deep links.
      if (['', '#/', '#/login', '#/registrieren'].includes(location.hash)) go('/dashboard');
    });
    hanko.onSessionExpired(() => {
      notice = 'Bitte melde dich erneut an.';
      go('/login');
    });
    hanko.onUserDeleted(() => { notice = 'Dein Konto wurde gelöscht.'; go('/login'); });
    hanko.onUserLoggedOut(() => { notice = 'Du wurdest ausgeloggt.'; go('/login'); });
    window.addEventListener('hashchange', render);
    await render();
  } catch {
    showError('Die Anmeldung konnte nicht initialisiert werden. Bitte prüfe die Hanko-Konfiguration.');
  }
}

start();
