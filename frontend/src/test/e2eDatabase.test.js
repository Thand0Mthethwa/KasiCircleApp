import { describe, it, expect } from 'vitest';
import { parseTestDatabase, pgEnvironment, verifyIdentity } from '../../scripts/e2e-database.mjs';

const valid = 'postgresql://qa:fixture-only@127.0.0.1:55432/kasicircle_qa';
describe('E2E PostgreSQL isolation guard', () => {
  it.each([
    undefined, '', 'not-a-url',
    'postgresql://qa:fixture-only@127.0.0.1/kasicircle',
    'postgresql://qa:fixture-only@db.example.test/kasicircle_qa',
    'https://qa:fixture-only@127.0.0.1/kasicircle_qa',
    'postgresql://127.0.0.1/kasicircle_qa',
    `${valid}?options=-csearch_path=public`, `${valid}#fragment`,
  ])('rejects unsafe or ambiguous targets (%#)', (url) => {
    expect(() => parseTestDatabase(url)).toThrow();
  });
  it('checks actual database name, server port and dedicated isolation marker', () => {
    const database = parseTestDatabase(valid);
    expect(() => verifyIdentity('kasicircle_qa|55432|kasicircle-isolated-e2e-v1\n', database)).not.toThrow();
    for (const output of ['kasicircle|55432|kasicircle-isolated-e2e-v1', 'kasicircle_qa|5432|kasicircle-isolated-e2e-v1', 'kasicircle_qa|55432|', '']) {
      expect(() => verifyIdentity(output, database)).toThrow();
    }
  });
  it('pins libpq to loopback and passes credentials through the environment', () => {
    const env = pgEnvironment(parseTestDatabase(valid));
    expect(env.PGDATABASE).toBe('kasicircle_qa');
    expect(env.PGHOSTADDR).toBe('127.0.0.1');
    expect(env.PGPORT).toBe('55432');
    expect(env.PGSERVICE).toBeUndefined();
    expect(env.PGOPTIONS).toBe('');
  });
});
