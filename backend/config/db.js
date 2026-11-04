const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
    dialectOptions:
      process.env.DB_SSL === "true"
        ? {
            ssl: {
              rejectUnauthorized: true,
              ...(process.env.DB_SSL_CA_FILE
                ? {
                    ca: require("node:fs").readFileSync(
                      process.env.DB_SSL_CA_FILE,
                      "utf8",
                    ),
                  }
                : {}),
            },
          }
        : {},
  },
);

module.exports = sequelize;
