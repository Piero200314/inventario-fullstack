const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
// Vite variables are public. Use this deployment's own origin, never a
// developer's localhost URL accidentally left in a local frontend .env file.
const env = { ...process.env, VITE_API_URL: '' };
function npm(dir, args) {
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', ['npm.cmd', ...args].join(' ')], { cwd: path.join(root, dir), env, stdio: 'inherit' })
    : spawnSync('npm', args, { cwd: path.join(root, dir), env, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw Error('No se completo la compilacion en ' + dir);
}
try {
  npm('backend', ['ci', '--omit=dev']);
  npm('frontend', ['ci', '--include=dev']);
  npm('frontend', ['run', 'build']);
  console.log('NEXO compilado. Inicio: node backend/index.js');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
