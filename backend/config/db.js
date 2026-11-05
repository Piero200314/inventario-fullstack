require('./env');
const { Sequelize } = require('sequelize');
module.exports = new Sequelize(require('./database-options')());
