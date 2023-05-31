import config from "./index.js";
import Knex from "knex";

export const knex = Knex({
  client: "mysql2",
  connection: {
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mainDB,
  },
});

