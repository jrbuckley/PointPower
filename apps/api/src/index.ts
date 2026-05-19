import "./load-env.js";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { linkedAccountsRoutes } from "./routes/linked-accounts.js";
import { profileRoutes } from "./routes/profile.js";
import { savedOffersRoutes } from "./routes/saved-offers.js";
import { programsRoutes } from "./routes/programs.js";
import { rewardAccountsRoutes } from "./routes/reward-accounts.js";
import { rewardProgramsRoutes } from "./routes/reward-programs.js";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

app.get("/health", async () => ({ ok: true as const }));

await app.register(programsRoutes, { prefix: "/api/v1" });
await app.register(rewardProgramsRoutes, { prefix: "/api/v1" });
await app.register(rewardAccountsRoutes, { prefix: "/api/v1" });
await app.register(profileRoutes, { prefix: "/api/v1" });
await app.register(savedOffersRoutes, { prefix: "/api/v1" });
await app.register(linkedAccountsRoutes, { prefix: "/api/v1" });

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
