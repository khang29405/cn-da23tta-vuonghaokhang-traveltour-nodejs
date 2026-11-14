import sql from 'mssql';

// DB_SERVER có thể là "localhost" hoặc "localhost\SQLEXPRESS" (có tên instance)
const [server, instanceName] = (process.env.DB_SERVER || 'localhost').split('\\');

const dbConfig = {
  server,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    instanceName,
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let poolPromise = null;

// Trả về pool kết nối dùng chung; chỉ kết nối ở lần gọi đầu tiên
const getPool = () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig).connect().catch((err) => {
      poolPromise = null; // cho phép thử kết nối lại ở lần gọi sau
      throw err;
    });
  }
  return poolPromise;
};

export { sql, getPool };
