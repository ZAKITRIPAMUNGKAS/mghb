const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(`${__dirname}/index.html`, 'utf8');
for (const [, script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script);
const start = html.indexOf('  function setDatabaseStatus(');
const end = html.indexOf('  async function testAndSaveDbConnection', start);
const code = html.slice(start, end);
async function check(error) {
  const elements = new Map();
  const context = vm.createContext({
    console: { warn() {} }, AbortSignal,
    localStorage: { getItem: () => null, setItem() {} },
    document: { getElementById(id) {
      if (!elements.has(id)) elements.set(id, { style: {}, dataset: {}, setAttribute() {} });
      return elements.get(id);
    } },
    window: { supabase: { createClient: () => ({ from: () => ({ select: () => ({ limit: () => ({ abortSignal: async () => ({ error }) }) }) }) }) } },
  });
  vm.runInContext(`const DEFAULT_SUPABASE_URL='https://example.supabase.co', DEFAULT_SUPABASE_KEY='test', SUPABASE_URL_KEY='url', SUPABASE_KEY_KEY='key'; let supabaseClient=null; ${code}`, context);
  await vm.runInContext('initSupabaseClient()', context);
  assert.equal(elements.get('workspace-db-status').dataset.state, error ? 'offline' : 'connected');
  assert.equal(vm.runInContext('supabaseClient !== null', context), !error);
}
(async () => {
  await check(null);
  await check({ message: 'Network unavailable' });
  assert(html.includes('await databaseReady'));
  assert(!html.includes('user-scalable=no'));
  console.log('PASS: inline syntax, verified DB connection, offline state, initialization, zoom accessibility');
})().catch(error => { console.error(error); process.exitCode = 1; });
