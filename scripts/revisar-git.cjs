const { execFileSync } = require('node:child_process');
try {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const blocked = files.filter(file => {
    const base = file.split('/').pop();
    if (base === '.env.example' || /^\.env\..+\.example$/.test(base)) return false;
    return /^\.env($|\.)/.test(base) || /(^|\/)(backups|certs|node_modules|dist)(\/|$)/i.test(file)
      || /(^|\/)backend\/uploads(\/|$)/i.test(file) || /\.(pem|key|p12|pfx)$/i.test(file);
  });
  if (blocked.length) {
    console.error('NO HAGAS COMMIT: Git incluye archivos privados o generados:');
    for (const file of blocked) console.error(' - ' + file);
    console.error('Quitalos del indice con git rm --cached (sin borrar tu copia local), revisa y vuelve a ejecutar esta comprobacion.');
    process.exitCode = 1;
  } else console.log('Revision de rutas correcta: no hay .env privados, certificados, respaldos, uploads, node_modules ni dist en el indice de Git. Esta comprobacion no sustituye revisar el contenido del commit.');
} catch (error) {
  console.error('No se pudo revisar Git. Ejecuta desde la carpeta inventario-fullstack.');
  process.exitCode = 1;
}
