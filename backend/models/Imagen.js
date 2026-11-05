const {DataTypes:D} = require('sequelize');
const db = require('../config/db');
module.exports = db.define('Imagen', {
  nombre:{type:D.STRING(80),primaryKey:true},mime:{type:D.STRING(40),allowNull:false},
  sha256:{type:D.STRING(64),allowNull:false},datos:{type:db.getDialect()==='postgres'?D.BLOB:D.BLOB('long'),allowNull:false},
}, {tableName:'nexo_imagenes',timestamps:true});
