import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the real router with a minimal DOM and a mocked Hanko boundary.
// These tests never create users or contact the live Hanko project.
const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '')
  .replace('import.meta.env.VITE_HANKO_API_URL', '"https://example.hanko.io"')
  .replace(/start\(\);\s*$/, '');

function setup(hash, sdk) {
  const app = { innerHTML: '' };
  const element = { addEventListener() {}, focus() {} };
  const context = vm.createContext({
    document: { querySelector: (selector) => selector === '#app' ? app : element, addEventListener() {}, title: '' },
    location: { hash, origin: 'http://localhost:5173' },
    window: { addEventListener() {} },
    sdk,
    register: async () => ({ hanko: sdk }),
    de: {},
    en: {},
  });
  vm.runInContext(`${source}\nhanko = sdk;`, context);
  return { context, app, render: () => vm.runInContext('render()', context) };
}

test('anonymous visitors cannot open dashboard or profile', async () => {
  for (const route of ['#/dashboard', '#/profil']) {
    const { context, app, render } = setup(route, { validateSession: async () => ({ is_valid: false }) });
    await render();
    assert.equal(context.location.hash, '/login');
    assert.doesNotMatch(app.innerHTML, /hanko-profile|Deine Anträge/);
  }
});

test('login and registration use separate German Hanko elements', async () => {
  for (const [route, tag] of [['#/login', 'hanko-login'], ['#/registrieren', 'hanko-registration']]) {
    const { app, render } = setup(route, { validateSession: async () => ({ is_valid: false }) });
    await render();
    assert.ok(app.innerHTML.includes(`<${tag} lang="de">`));
  }
});

test('authenticated login redirects to dashboard', async () => {
  const { context, render } = setup('#/login', { validateSession: async () => ({ is_valid: true }) });
  await render();
  assert.equal(context.location.hash, '/dashboard');
});

test('dashboard escapes untrusted user names and renders three sample applications', async () => {
  const { app, render } = setup('#/dashboard', {
    validateSession: async () => ({ is_valid: true }),
    getCurrentUser: async () => ({ username: { username: '<img src=x onerror=alert(1)>' } }),
  });
  await render();
  assert.ok(app.innerHTML.includes('&lt;img'));
  assert.ok(!app.innerHTML.includes('<img'));
  assert.equal((app.innerHTML.match(/class="application"/g) || []).length, 3);
});

test('failed session checks never expose protected content', async () => {
  const { app, render } = setup('#/profil', { validateSession: async () => { throw new Error('offline'); } });
  await render();
  assert.ok(app.innerHTML.includes('erlaubte Origin'));
  assert.ok(!app.innerHTML.includes('<hanko-profile'));
});

test('slow dashboard response cannot overwrite a newer profile navigation', async () => {
  let resolveUser;
  const pendingUser = new Promise((resolve) => { resolveUser = resolve; });
  const { context, app, render } = setup('#/dashboard', {
    validateSession: async () => ({ is_valid: true }),
    getCurrentUser: () => pendingUser,
  });
  const first = render();
  await Promise.resolve();
  context.location.hash = '#/profil';
  await render();
  resolveUser({ username: { username: 'Anna' } });
  await first;
  assert.ok(app.innerHTML.includes('<hanko-profile'));
  assert.ok(!app.innerHTML.includes('Willkommen'));
});

test('session-created event on reload preserves the profile route', async () => {
  let onCreated;
  const { context, app } = setup('#/profil', {
    validateSession: async () => ({ is_valid: true }),
    setLang() {}, onSessionCreated(callback) { onCreated = callback; },
    onSessionExpired() {}, onUserDeleted() {}, onUserLoggedOut() {},
  });
  await vm.runInContext('start()', context);
  onCreated();
  assert.equal(context.location.hash, '#/profil');
  assert.ok(app.innerHTML.includes('<hanko-profile'));
});
