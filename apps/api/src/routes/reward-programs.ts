import type { FastifyPluginAsync } from "fastify";
import { listRewardPrograms } from "../lib/reward-accounts.js";
import { createAnonSupabase, isSupabaseConfigured } from "../lib/supabase.js";

export const rewardProgramsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/reward-programs", async (_request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.status(503).send({
        error: "service_unavailable",
        message: "Supabase is not configured on the API server.",
      });
    }

    try {
      const supabase = createAnonSupabase();
      const programs = await listRewardPrograms(supabase);
      return { programs };
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not load reward programs.",
      });
    }
  });
};
