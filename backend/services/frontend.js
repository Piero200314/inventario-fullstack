const express = require('express');
const fs = require('node:fs');
const path = require('node:path');

module.exports = function serveFrontend(app) {
  if (process.env.SERVE_FRONTEND !== 'true') return;
  const dist = path.resolve(__dirname, '../../frontend/dist');
  const index = path.join(dist, 'index.html');
  if (!fs.existsSync(index)) throw Error('Falta frontend/dist. Ejecuta node backend/scripts/build-render.js desde la raiz del proyecto.');
  const pages = new Set(['/', '/resumen', '/productos', '/stock-bajo', '/proveedores', '/movimientos', '/reportes']);
  app.use((req, res, next) => {
    // /productos is also a legacy JSON API. Only an explicit HTML navigation
    // goes to React; curl, Axios and Postman keep their API authentication.
    if (!['GET', 'HEAD'].includes(req.method) || !pages.has(req.path.replace(/\/$/, '') || '/')) return next();
    res.vary('Accept');
    if (!(req.headers.accept || '').toLowerCase().includes('text/html')) return next();
    res.set('Cache-Control', 'no-store');
    return res.sendFile(index);
  });
  app.use(express.static(dist, {
    index: false,
    dotfiles: 'deny',
    setHeaders(res, file) {
      res.set('Cache-Control', file.includes(path.sep + 'assets' + path.sep)
        ? 'public, max-age=31536000, immutable' : 'no-cache');
    },
  }));
};
