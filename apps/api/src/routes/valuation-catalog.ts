import type { FastifyPluginAsync } from "fastify";
import { loadValuationCatalog } from "../lib/valuation-catalog.js";
import { createAnonSupabase } from "../lib/supabase.js";

export const valuationCatalogRoutes: FastifyPluginAsync = async (app) => {
  app.get("/valuation-catalog", async (request, reply) => {
    const supabase = createAnonSupabase();
    try {
      const catalog = await loadValuationCatalog(supabase);
      return { catalog };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not load valuation catalog.",
      });
    }
  });
};
