from pathlib import Path
import os,secrets,socket,subprocess
root=Path(__file__).resolve().parents[2]
base=root/'backend/target/e2e-postgres'
envfile=root/'frontend/.env.e2e.local'
if base.exists() or envfile.exists(): raise SystemExit('Refusing to overwrite an existing E2E cluster or environment file.')
probe=socket.socket(); probe.bind(('127.0.0.1',55432)); probe.close()
base.mkdir(mode=0o700); data=base/'data'; sock=base/'socket'; sock.mkdir(mode=0o700)
password=secrets.token_urlsafe(36); pwfile=base/'bootstrap-password'
pwfile.write_text(password+'\n');pwfile.chmod(0o600)
bin='/usr/lib/postgresql/18/bin/'
def run(args,env=None):
 r=subprocess.run(args,env=env,capture_output=True,text=True)
 with (base/'setup.log').open('a') as log:log.write(r.stdout+r.stderr)
 if r.returncode:raise SystemExit('Isolated cluster setup failed; inspect the private setup log locally.')
 return r.stdout.strip()
run([bin+'initdb','-D',str(data),'-U','kasicircle_e2e_owner','--auth-local=scram-sha-256','--auth-host=scram-sha-256','--pwfile='+str(pwfile),'--encoding=UTF8','--locale=C.UTF-8'])
pwfile.unlink()
run([bin+'pg_ctl','-D',str(data),'-l',str(base/'server.log'),'-o',f'-h 127.0.0.1 -p 55432 -k {sock}','-w','start'])
pg={**os.environ,'PGHOST':'127.0.0.1','PGPORT':'55432','PGUSER':'kasicircle_e2e_owner','PGPASSWORD':password,'PGDATABASE':'postgres','PGCONNECT_TIMEOUT':'5'}
def sql(command):return run([bin+'psql','-X','-At','-v','ON_ERROR_STOP=1','-c',command],pg)
if sql('SELECT current_database()')!='postgres':raise SystemExit('Maintenance database identity mismatch; refusing creation.')
run([bin+'createdb','--template=template0','kasicircle_qa'],pg)
pg['PGDATABASE']='kasicircle_qa'
if sql('SELECT current_database()')!='kasicircle_qa':raise SystemExit('Test database identity mismatch; refusing fixture setup.')
sql("CREATE SCHEMA e2e_guard; CREATE TABLE e2e_guard.identity (purpose text PRIMARY KEY); INSERT INTO e2e_guard.identity VALUES ('kasicircle-isolated-e2e-v1');")
fd=os.open(envfile,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'w') as f:
 f.write('# Dedicated cluster on port 55432. Never use the development database.\n')
 f.write('E2E_DATABASE_URL=postgresql://kasicircle_e2e_owner:'+password+'@127.0.0.1:55432/kasicircle_qa\n')
 f.write('E2E_PSQL_PATH=/usr/lib/postgresql/18/bin/psql\nE2E_CHROME_PATH=/usr/bin/google-chrome\n')
print('Created and verified isolated PostgreSQL cluster at 127.0.0.1:55432, database kasicircle_qa.')
print('Credentials saved only to ignored frontend/.env.e2e.local with mode 0600; values omitted.')
