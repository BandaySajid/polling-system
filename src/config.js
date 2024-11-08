export default {
  environment: process.env.NODE_ENV || "development",

  server: {
    host: process.env.host || "localhost",
    port: Number(process.env.port) || 9090,
  },

  websocket: {
    host: process.env.ws_host || "localhost",
    port: Number(process.env.ws_port) || 9091,
  },

  database: {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  },
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: [...process.env.KAFKA_BROKERS.split(",")],
    groupId: process.env.KAFKA_GROUP_ID,
  },
};
