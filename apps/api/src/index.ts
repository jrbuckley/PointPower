import cors from "@fastify/cors";
import Fastify from "fastify";
import { programsRoutes } from "./routes/programs.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

app.get("/health", async () => ({ ok: true as const }));

await app.register(programsRoutes, { prefix: "/api/v1" });

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
