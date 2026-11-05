const test=require('node:test'),assert=require('node:assert/strict');
const options=require('../config/database-options');
test('Neon: TLS verificado aun con sslmode=require en la URI',()=>{
 const x=options({DATABASE_URL:'postgresql://user:p%40ss@ep-example-pooler.aws.neon.tech/neondb?sslmode=require&channel_binding=require'});
 assert.equal(x.dialect,'postgres');assert.equal(x.password,'p@ss');assert.equal(x.dialectOptions.ssl.rejectUnauthorized,true);assert.equal(x.dialectOptions.enableChannelBinding,true);
 assert.equal(x.dialectOptions.connectionString,undefined);
});
test('migraciones usan URL directa y rechazan pooler',()=>{
 const e={DATABASE_URL:'postgresql://u:p@ep-test-pooler.aws.neon.tech/db?sslmode=require',NEXO_DB_DIRECT:'1'};
 assert.throws(()=>options(e),/DIRECT_DATABASE_URL/);
 assert.equal(options({...e,DIRECT_DATABASE_URL:'postgresql://u:p@ep-test.aws.neon.tech/db?sslmode=require'}).host,'ep-test.aws.neon.tech');
});
test('no permite desactivar TLS remoto; PostgreSQL local explícito y MariaDB siguen disponibles',()=>{
 assert.throws(()=>options({DATABASE_URL:'postgresql://u:p@ep-test.aws.neon.tech/db?sslmode=disable'}),/TLS/);
 assert.equal(options({DATABASE_URL:'postgresql://u:p@localhost/db?sslmode=disable'}).dialectOptions.ssl,false);
 assert.equal(options({DB_DIALECT:'mysql',DB_NAME:'inventario_nexo',DB_USER:'root'}).port,3307);
});
