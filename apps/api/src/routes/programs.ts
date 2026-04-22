import {
  createManualProgramInputSchema,
  manualProgramEntrySchema,
  type ManualProgramEntry,
} from "@points-exchange/shared";
import { randomUUID } from "node:crypto";
import type { FastifyPluginAsync } from "fastify";

/** In-memory store until you add PostgreSQL + user accounts. */
const store = new Map<string, ManualProgramEntry>();

export const programsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/programs", async () => ({
    programs: [...store.values()],
  }));

  app.post<{ Body: unknown }>("/programs", async (request, reply) => {
    const parsed = createManualProgramInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const now = new Date().toISOString();
    const entry: ManualProgramEntry = {
      id: randomUUID(),
      ...parsed.data,
      updatedAt: now,
    };

    const valid = manualProgramEntrySchema.safeParse(entry);
    if (!valid.success) {
      return reply.status(500).send({ error: "internal_validation_failed" });
    }

    store.set(entry.id, valid.data);
    return reply.status(201).send({ program: valid.data });
  });

  app.delete<{ Params: { id: string } }>(
    "/programs/:id",
    async (request, reply) => {
      const { id } = request.params;
      if (!store.has(id)) {
        return reply.status(404).send({ error: "not_found" });
      }
      store.delete(id);
      return reply.status(204).send();
    },
  );
};
