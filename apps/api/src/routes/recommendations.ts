import { recommendationIdSchema } from "@points-exchange/shared";
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../lib/auth.js";
import { loadValuationCatalog } from "../lib/valuation-catalog.js";
import {
  getDashboardForUser,
  getRecommendationContext,
  getRecommendationDetailForUser,
} from "../lib/recommendations-service.js";
import { createAnonSupabase, createUserSupabase } from "../lib/supabase.js";

export const recommendationsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAuth);

  app.get("/recommendations/dashboard", async (request, reply) => {
    const supabase = createUserSupabase(request.accessToken!);
    const anon = createAnonSupabase();

    try {
      const [catalog, { balances, goal }] = await Promise.all([
        loadValuationCatalog(anon),
        getRecommendationContext(supabase, request.userId!),
      ]);
      const dashboard = getDashboardForUser(catalog, balances, goal);
      return { dashboard };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not build dashboard recommendations.",
      });
    }
  });

  app.get<{ Params: { id: string } }>(
    "/recommendations/:id",
    async (request, reply) => {
      const parsed = recommendationIdSchema.safeParse(request.params.id);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "validation_failed",
          message: "Invalid recommendation id.",
        });
      }

      const supabase = createUserSupabase(request.accessToken!);
      const anon = createAnonSupabase();

      try {
        const [catalog, { balances, goal }] = await Promise.all([
          loadValuationCatalog(anon),
          getRecommendationContext(supabase, request.userId!),
        ]);
        const detail = getRecommendationDetailForUser(
          catalog,
          parsed.data,
          balances,
          goal,
        );
        if (!detail) {
          return reply.status(404).send({
            error: "not_found",
            message: "Recommendation not found.",
          });
        }
        return { detail };
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: "internal_error",
          message: "Could not load recommendation detail.",
        });
      }
    },
  );
};
