import cors from "cors";
import express from "express";
import { handleSnipeFeed, handleValidateKey } from "./routes/snipez";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.post("/api/auth/validate-key", handleValidateKey);
  app.get("/api/snipes/feed", handleSnipeFeed);

  return app;
}
