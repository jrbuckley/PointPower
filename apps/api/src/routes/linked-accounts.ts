import {
  mockLinkConnectInputSchema,
  type LinkedAccountsStatus,
  type MockLinkConnectResponse,
} from "@points-exchange/shared";
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../lib/auth.js";

/** In-memory mock connections per user until real OAuth is built. */
const mockConnections = new Map<string, LinkedAccountsStatus["connections"]>();

const mockPreviewBalances = [
  {
    programCode: "chase_ur" as const,
    programName: "Chase Ultimate Rewards",
    balance: 84_200,
  },
  {
    programCode: "amex_mr" as const,
    programName: "Amex Membership Rewards",
    balance: 41_500,
  },
] as const;

export const linkedAccountsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/linked-accounts", { preHandler: requireAuth }, async (request) => {
    const connections = mockConnections.get(request.userId!) ?? [];
    const status: LinkedAccountsStatus = {
      featureStatus: "mock_preview",
      connections,
    };
    return status;
  });

  app.post("/linked-accounts/mock-connect", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = mockLinkConnectInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const now = new Date().toISOString();
    const connection = {
      provider: parsed.data.provider,
      externalId: `mock_${request.userId!.slice(0, 8)}`,
      linkedAt: now,
      status: "active" as const,
    };

    const existing = mockConnections.get(request.userId!) ?? [];
    mockConnections.set(request.userId!, [...existing, connection]);

    const response: MockLinkConnectResponse = {
      connection,
      message:
        "This is a preview of account linking. Confirm import to add these balances to your profile.",
      previewAccounts: [...mockPreviewBalances],
    };

    return reply.status(200).send(response);
  });

  app.post(
    "/linked-accounts/mock-connect/apply",
    { preHandler: requireAuth },
    async (request, reply) => {
      const connections = mockConnections.get(request.userId!);
      if (!connections?.length) {
        return reply.status(400).send({
          error: "no_connection",
          message: "Connect an account first using mock-connect.",
        });
      }

      return reply.status(200).send({
        message:
          "In production, linked balances would be saved automatically. Use reward-accounts sync with the preview data for now.",
        accounts: mockPreviewBalances.map((row) => ({
          programCode: row.programCode,
          balance: row.balance,
          source: "linked_mock" as const,
        })),
      });
    },
  );
};
