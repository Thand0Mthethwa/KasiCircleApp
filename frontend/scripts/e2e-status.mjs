import { loadE2EEnvironment, parseTestDatabase, testDatabaseSQL } from './e2e-database.mjs';
loadE2EEnvironment();
const database = parseTestDatabase(process.env.E2E_DATABASE_URL);
console.log(`Verified isolated target: ${database.host}:${database.port}/${database.name}`);
console.log(testDatabaseSQL("SELECT 'PostgreSQL ' || current_setting('server_version'); SELECT 'Flyway successful migrations: ' || count(*) FROM flyway_schema_history WHERE success; SELECT 'Users: ' || count(*) FROM users; SELECT 'Businesses: ' || count(*) FROM businesses; SELECT 'Business images: ' || count(*) FROM business_images; SELECT 'Worker profiles: ' || count(*) FROM worker_profiles; SELECT 'Jobs: ' || count(*) FROM jobs;"));
