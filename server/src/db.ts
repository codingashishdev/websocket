import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  password: "***REMOVED***",
  host: "localhost",
  port: 5432,
  database: "postgres",
});

export default pool;
