import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  password: "***REMOVED***",
  host: "localhost",
  port: 5433,
  database: "postgres",
});

export default pool;
