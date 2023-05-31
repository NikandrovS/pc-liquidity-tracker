import dotenv from "dotenv";
dotenv.config();

const app = {
  mainDB: process.env.MYSQL_DATABASE || "liquidity_tracker",
};

const mysql = {
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.NODE_ENV === "test" ? "root" : process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "my-password",
  multipleStatements: process.env.MYSQL_MULTIPLE_STATEMENTS === "true",
};

export default {
  ...app,
  mysql,
};
