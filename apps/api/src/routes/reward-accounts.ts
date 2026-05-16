import {
  createRewardAccountInputSchema,
  syncRewardAccountsInputSchema,
  updateRewardAccountInputSchema,
} from "@points-exchange/shared";
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../lib/auth.js";
import {
  createUserRewardAccount,
  deleteUserRewardAccount,
  listUserRewardAccounts,
  syncUserRewardAccounts,
  updateUserRewardAccount,
} from "../lib/reward-accounts.js";
import { createUserSupabase } from "../lib/supabase.js";

export const rewardAccountsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAuth);

  app.get("/reward-accounts", async (request, reply) => {
    const supabase = createUserSupabase(request.accessToken!);
    try {
      const accounts = await listUserRewardAccounts(supabase, request.userId!);
      return { accounts };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not load reward accounts.",
      });
    }
  });

  app.post("/reward-accounts", async (request, reply) => {
    const parsed = createRewardAccountInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const supabase = createUserSupabase(request.accessToken!);
    try {
      const account = await createUserRewardAccount(supabase, request.userId!, {
        programCode: parsed.data.programCode,
        balance: parsed.data.balance,
      });
      return reply.status(201).send({ account });
    } catch (err) {
      if (err instanceof Error && err.message === "program_not_found") {
        return reply.status(404).send({
          error: "program_not_found",
          message: "That rewards program is not available.",
        });
      }
      if (err instanceof Error && err.message === "account_exists") {
        return reply.status(409).send({
          error: "account_exists",
          message: "You already have a balance for this program. Use update instead.",
        });
      }
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not create reward account.",
      });
    }
  });

  app.put("/reward-accounts/sync", async (request, reply) => {
    const parsed = syncRewardAccountsInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const supabase = createUserSupabase(request.accessToken!);
    try {
      const accounts = await syncUserRewardAccounts(
        supabase,
        request.userId!,
        parsed.data.accounts,
      );
      return { accounts };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not sync reward accounts.",
      });
    }
  });

  app.patch<{ Params: { id: string } }>("/reward-accounts/:id", async (request, reply) => {
    const parsed = updateRewardAccountInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const supabase = createUserSupabase(request.accessToken!);
    try {
      const account = await updateUserRewardAccount(
        supabase,
        request.userId!,
        request.params.id,
        parsed.data.balance,
      );
      if (!account) {
        return reply.status(404).send({
          error: "not_found",
          message: "Reward account not found.",
        });
      }
      return { account };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not update reward account.",
      });
    }
  });

  app.delete<{ Params: { id: string } }>("/reward-accounts/:id", async (request, reply) => {
    const supabase = createUserSupabase(request.accessToken!);
    try {
      const deleted = await deleteUserRewardAccount(
        supabase,
        request.userId!,
        request.params.id,
      );
      if (!deleted) {
        return reply.status(404).send({
          error: "not_found",
          message: "Reward account not found.",
        });
      }
      return reply.status(204).send();
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        error: "internal_error",
        message: "Could not delete reward account.",
      });
    }
  });
};
