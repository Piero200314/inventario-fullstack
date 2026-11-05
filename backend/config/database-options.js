const fs = require('node:fs');
function options(env = process.env) {
  const dialect = env.DB_DIALECT || (env.DATABASE_URL ? 'postgres' : 'mysql');
  const common = {dialect, logging:false, pool:{max:5,min:0,idle:10000,acquire:60000}};
  const certificate = env.DB_SSL_CA_FILE ? {ca:fs.readFileSync(env.DB_SSL_CA_FILE,'utf8')} : {};
  if (dialect === 'mysql') return {...common,database:env.DB_NAME,username:env.DB_USER,password:env.DB_PASS || '',host:env.DB_HOST || '127.0.0.1',port:Number(env.DB_PORT || 3307),dialectOptions:env.DB_SSL === 'true' ? {ssl:{rejectUnauthorized:true,...certificate}} : {}};
  if (dialect !== 'postgres') throw Error('DB_DIALECT debe ser mysql o postgres.');
  const raw = env.NEXO_DB_DIRECT === '1' ? (env.DIRECT_DATABASE_URL || env.DATABASE_URL) : env.DATABASE_URL;
  let url;
  try {url = new URL(raw);} catch {throw Error('Configura una DATABASE_URL PostgreSQL válida en backend/.env.');}
  if (!['postgres:','postgresql:'].includes(url.protocol) || !url.hostname || !url.username || url.pathname.length < 2) throw Error('DATABASE_URL debe incluir usuario, servidor y base PostgreSQL.');
  if (env.NEXO_DB_DIRECT === '1' && url.hostname.includes('-pooler.')) throw Error('Para migrar/importar usa DIRECT_DATABASE_URL sin -pooler en el servidor.');
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  const disabled = env.DB_SSL === 'false' || url.searchParams.get('sslmode') === 'disable';
  if (disabled && !local) throw Error('Las conexiones PostgreSQL remotas requieren TLS verificado.');
  // Parse credentials separately: pg must not replace the verified SSL object.
  return {...common,database:decodeURIComponent(url.pathname.slice(1)),username:decodeURIComponent(url.username),password:decodeURIComponent(url.password),host:url.hostname,port:Number(url.port || 5432),dialectOptions:{ssl:local && disabled ? false : {rejectUnauthorized:true,...certificate},enableChannelBinding:url.searchParams.get('channel_binding') !== 'disable',connectionTimeoutMillis:30000,application_name:'nexo-inventario'}};
}
module.exports = options;
