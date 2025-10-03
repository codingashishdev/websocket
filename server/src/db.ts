import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "websocket-chat",
  password: "",
  port: 5433,
});

export default pool;
