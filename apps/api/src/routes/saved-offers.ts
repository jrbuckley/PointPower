import { createSavedOfferInputSchema } from "@points-exchange/shared";
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../lib/auth.js";
import {
  createSavedOffer,
  deleteSavedOffer,
  listSavedOffers,
} from "../lib/saved-offers.js";
import { createUserSupabase } from "../lib/supabase.js";

export const savedOffersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAuth);

  app.get("/saved-offers", async (request, reply) => {
    const supabase = createUserSupabase(request.accessToken!);
    try {
      const saved = await listSavedOffers(supabase, request.userId!);
      return { saved };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not load saved offers.",
      });
    }
  });

  app.post("/saved-offers", async (request, reply) => {
    const parsed = createSavedOfferInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const supabase = createUserSupabase(request.accessToken!);
    try {
      const saved = await createSavedOffer(
        supabase,
        request.userId!,
        parsed.data,
      );
      return reply.status(201).send({ saved });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not save offer.",
      });
    }
  });

  app.delete<{ Params: { id: string } }>(
    "/saved-offers/:id",
    async (request, reply) => {
      const supabase = createUserSupabase(request.accessToken!);
      try {
        const deleted = await deleteSavedOffer(
          supabase,
          request.userId!,
          request.params.id,
        );
        if (!deleted) {
          return reply.status(404).send({
            error: "not_found",
            message: "Saved offer not found.",
          });
        }
        return reply.status(204).send();
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          error: "internal_error",
          message: "Could not remove saved offer.",
        });
      }
    },
  );
};
