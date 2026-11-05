const { DataTypes } = require('sequelize');
const db = require('../config/db');
// Compatibility with the original SQL tables, which may have no timestamps.
// Missing historical dates stay NULL; they are never replaced with today's date.
module.exports = async function fechasLegacy() {
  const qi = db.getQueryInterface(), quote = x => qi.queryGenerator.quoteIdentifier(x);
  for (const table of ['productos', 'usuarios']) {
    const columns = await qi.describeTable(table);
    for (const [field, oldField] of [['createdAt','created_at'],['updatedAt','updated_at']]) {
      if (!columns[field]) {
        await qi.addColumn(table, field, {type:DataTypes.DATE, allowNull:true});
        if (columns[oldField]) await db.query(`UPDATE ${quote(table)} SET ${quote(field)} = ${quote(oldField)}`);
        console.log(`Compatibilidad: ${table}.${field} añadida; ${columns[oldField] ? 'fecha anterior conservada' : 'fechas anteriores desconocidas = NULL'}.`);
      } else if (db.getDialect() === 'postgres' && !columns[field].allowNull) {
        await db.query(`ALTER TABLE ${quote(table)} ALTER COLUMN ${quote(field)} DROP NOT NULL`);
      }
    }
  }
};
