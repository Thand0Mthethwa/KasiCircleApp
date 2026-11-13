import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export function loadE2EEnvironment() {
  const filename = fileURLToPath(new URL('../.env.e2e.local', import.meta.url));
  if (existsSync(filename)) process.loadEnvFile(filename);
}

export function parseTestDatabase(value) {
  let database;
  try { database = new URL(value); } catch { throw new Error('A valid isolated E2E_DATABASE_URL is required; credentials are omitted.'); }
  if (!['postgres:', 'postgresql:'].includes(database.protocol)
    || !['localhost', '127.0.0.1'].includes(database.hostname)
    || database.pathname !== '/kasicircle_qa'
    || database.search || database.hash || !database.username || !database.password) {
    throw new Error('E2E database must be a credentialed loopback PostgreSQL database named kasicircle_qa, without URL options.');
  }
  try {
    return { host: database.hostname, port: database.port || '5432', name: 'kasicircle_qa',
      username: decodeURIComponent(database.username), password: decodeURIComponent(database.password) };
  } catch { throw new Error('Invalid E2E database credential encoding; values are omitted.'); }
}

export function pgEnvironment(database) {
  const env = { ...process.env, PGHOST: database.host, PGHOSTADDR: '127.0.0.1', PGPORT: database.port,
    PGDATABASE: database.name, PGUSER: database.username, PGPASSWORD: database.password,
    PGCONNECT_TIMEOUT: '5', PGOPTIONS: '', PGSERVICEFILE: '/dev/null' };
  delete env.PGSERVICE;
  return env;
}

export function verifyIdentity(output, database) {
  if (output.trim() !== `${database.name}|${database.port}|kasicircle-isolated-e2e-v1`) {
    throw new Error('E2E database identity/port/isolation marker mismatch; refusing migrations and fixture writes.');
  }
}

export function testDatabaseSQL(sql) {
  const database = parseTestDatabase(process.env.E2E_DATABASE_URL);
  const binary = process.env.E2E_PSQL_PATH || 'psql';
  const args = ['-X', '-At', '-v', 'ON_ERROR_STOP=1'];
  const options = { env: pgEnvironment(database), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] };
  try {
    const identity = execFileSync(binary, args, { ...options,
      input: "SELECT current_database(), current_setting('port'), purpose FROM e2e_guard.identity;\n" });
    verifyIdentity(identity, database);
    return sql ? execFileSync(binary, args, { ...options, input: sql }) : identity;
  } catch {
    // Never include psql's command, environment, connection URL or stderr in test output.
    throw new Error('Isolated E2E database preflight/SQL failed; no credentials are included. Check local connectivity and the isolation marker.');
  }
}
