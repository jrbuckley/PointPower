import { updateUserProfileInputSchema } from "@points-exchange/shared";
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../lib/auth.js";
import { getUserProfile, updateUserGoalPreference } from "../lib/profiles.js";
import { createUserSupabase } from "../lib/supabase.js";

export const profileRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAuth);

  app.get("/profile", async (request, reply) => {
    const supabase = createUserSupabase(request.accessToken!);
    try {
      const profile = await getUserProfile(supabase, request.userId!);
      return { profile };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not load profile.",
      });
    }
  });

  app.patch("/profile", async (request, reply) => {
    const parsed = updateUserProfileInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const supabase = createUserSupabase(request.accessToken!);
    try {
      const profile = await updateUserGoalPreference(
        supabase,
        request.userId!,
        parsed.data.goalPreference,
      );
      return { profile };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not update profile.",
      });
    }
  });
};
