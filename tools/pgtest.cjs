'use strict';
// tools/pgtest.cjs : THE WHOLE TEST SUITE ON A REAL POSTGRES, then `node server.js --check` against it.
// A throwaway cluster is made under /tmp (initdb), listening on a Unix socket only (listen_addresses = '': no TCP
// port is bound), and is stopped and deleted afterwards, whatever happened. Each test file makes a schema of its
// own (test/kit.cjs, TEST_DATABASE_URL), as the other games' tests do.
//   node tools/pgtest.cjs                 npm test, then --check
//   node tools/pgtest.cjs test/money.cjs  only these files, then --check
// PG_BIN names the folder with initdb/pg_ctl/createdb when it is not Homebrew's postgresql@16. Playwright (for
// test/browser.cjs) comes from NODE_PATH; the glyphh web checkout's is used when it is not set.
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const BIN = process.env.PG_BIN || ['/opt/homebrew/opt/postgresql@16/bin', '/opt/homebrew/Cellar/postgresql@16/16.11/bin', '/usr/local/opt/postgresql@16/bin'].find(function (d) { return fs.existsSync(path.join(d, 'initdb')); });
if (!BIN) { console.error('PGTEST STOPPED: no Postgres server binaries here (set PG_BIN)'); process.exit(2); }
const dir = fs.mkdtempSync('/tmp/sacpg-'), data = path.join(dir, 'data'), sock = dir, PORT = '54329', DB = 'sac_test';
const run = function (cmd, args, o) { return cp.spawnSync(cmd, args, Object.assign({ encoding: 'utf8', cwd: ROOT }, o)); };
const must = function (r, what) { if (r.status !== 0) throw new Error(what + ': ' + String(r.stderr || r.stdout || r.error).trim().slice(-600)); return r; };
let up = false, code = 1;
try {
  must(run(path.join(BIN, 'initdb'), ['-D', data, '-U', 'sac', '-A', 'trust', '-E', 'UTF8', '--no-sync']), 'initdb');
  must(run(path.join(BIN, 'pg_ctl'), ['-D', data, '-w', '-t', '30', '-l', path.join(dir, 'log'), '-o', "-c listen_addresses='' -c unix_socket_directories='" + sock + "' -c port=" + PORT + ' -c fsync=off -c max_connections=60', 'start']), 'pg_ctl start'); up = true;
  must(run(path.join(BIN, 'createdb'), ['-h', sock, '-p', PORT, '-U', 'sac', DB]), 'createdb');
  const url = 'postgresql://sac@/' + DB + '?host=' + encodeURIComponent(sock) + '&port=' + PORT;
  const psql = function (sql) { return must(run(path.join(BIN, 'psql'), ['-h', sock, '-p', PORT, '-U', 'sac', '-d', DB, '-At', '-c', sql]), 'psql').stdout.trim(); };
  console.log('Postgres ' + psql('SHOW server_version') + ' on a Unix socket in ' + sock + ' (listen_addresses "' + psql('SHOW listen_addresses') + '": no TCP port)');
  const env = Object.assign({}, process.env, { TEST_DATABASE_URL: url, NODE_PATH: process.env.NODE_PATH || '/Users/timmetim/development/glyphh/web/node_modules', NODE_NO_WARNINGS: '1' });
  ['DATABASE_URL', 'DB_SCHEMA'].forEach(function (k) { delete env[k]; });
  const files = process.argv.slice(2), t0 = Date.now(); let failed = 0;
  if (files.length) for (const f of files) { const r = cp.spawnSync(process.execPath, [f], { cwd: ROOT, env: env, stdio: 'inherit' }); if (r.status) failed++; }
  else { const r = cp.spawnSync('npm', ['test'], { cwd: ROOT, env: env, stdio: 'inherit' }); if (r.status) failed++; }
  console.log((failed ? 'FAIL  ' : 'ok    ') + (files.length ? files.join(' ') : 'npm test') + ' on Postgres (' + Math.round((Date.now() - t0) / 1000) + ' s)');
  const schemas = psql("SELECT nspname FROM pg_namespace WHERE nspname LIKE 'sac_test_%' ORDER BY 1").split('\n').filter(Boolean);
  console.log('      schemas the tests made (each test file its own): ' + (schemas.length ? schemas.length + ' (' + schemas.map(function (s) { return s.replace(/^sac_test_/, '').replace(/_\d+$/, ''); }).join(', ') + ')' : 'none'));
  // --check: against a schema of its own, twice (the first applies the schema to an empty database, the second finds it there)
  psql('CREATE SCHEMA sac_check');
  const cenv = Object.assign({}, env, { DATABASE_URL: url, DB_SCHEMA: 'sac_check', DATA_DIR: path.join(dir, 'nodata') }); delete cenv.TEST_DATABASE_URL;
  ['R2_ENDPOINT', 'R2_BUCKET', 'FLY_APP_NAME', 'CONFIG_OVERRIDE', 'CLIENT_DIR'].forEach(function (k) { cenv[k] = ''; });
  for (const n of [1, 2]) { const c = run(process.execPath, ['server.js', '--check'], { env: cenv }); console.log('--- node server.js --check, run ' + n + ' (exit ' + c.status + ') ---\n' + (c.stdout + c.stderr).trim()); if (c.status !== 0 || !/CHECK PASSED/.test(c.stdout) || !/against Postgres \(schema sac_check\)/.test(c.stdout)) failed++; }
  console.log('      tables in sac_check: ' + psql("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'sac_check'") + '; a SQLite file was made beside it: ' + fs.existsSync(path.join(dir, 'nodata')));
  code = failed ? 1 : 0; console.log(failed ? 'PGTEST FAILED' : 'PGTEST PASSED');
} catch (e) { console.error('PGTEST STOPPED: ' + e.message); try { console.error(fs.readFileSync(path.join(dir, 'log'), 'utf8').slice(-800)); } catch (e2) { /* no log */ } }
finally {
  if (up) run(path.join(BIN, 'pg_ctl'), ['-D', data, '-m', 'immediate', '-w', 'stop']);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('      the cluster is stopped and ' + dir + ' is ' + (fs.existsSync(dir) ? 'STILL THERE' : 'deleted'));
}
process.exit(code);
