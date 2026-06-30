import type { FastifyReply, FastifyRequest } from "fastify";
import { createAnonSupabase, isSupabaseConfigured } from "./supabase.js";

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    reply.status(503).send({
      error: "service_unavailable",
      message: "Supabase is not configured on the API server.",
    });
    return;
  }

  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    reply.status(401).send({ error: "unauthorized", message: "Missing bearer token." });
    return;
  }

  const accessToken = header.slice("Bearer ".length).trim();
  if (!accessToken) {
    reply.status(401).send({ error: "unauthorized", message: "Missing bearer token." });
    return;
  }

  const supabase = createAnonSupabase();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    reply.status(401).send({ error: "unauthorized", message: "Invalid or expired session." });
    return;
  }

  request.userId = data.user.id;
  request.accessToken = accessToken;
}
