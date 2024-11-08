import express from "express";
import * as db from "./db/db_connection.js";
import router from "./routes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.port || 8888;

const server = express();
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(express.static(path.join(__dirname, "static")));
await db.init();

server.use(router);

server.use((err, req, res, next) => {
  console.log("Error with route", req.url, err);
  if (!res.headersSent) {
    return res
      .status(500)
      .json({ status: "error", description: "internal server error" });
  }

  return next(err);
});

// for (const error of processErrors) {
//   process.on(error, (error) => {
//     console.error("[INTERNAL SERVER ERROR]:", error);
//   });
// }

server.listen(PORT, () => {
  console.log("server is up on port:", PORT);
});
