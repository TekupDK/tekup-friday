import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // In development mode without OAuth, use the owner account
    if (!ENV.isProduction && ENV.ownerOpenId) {
      try {
        user = await db.getUserByOpenId(ENV.ownerOpenId);
        if (user) {
          console.log("[Dev Mode] Using owner account:", user.name || user.email);
        }
      } catch (dbError) {
        console.error("[Dev Mode] Failed to get owner user:", dbError);
      }
    }
    // Authentication is optional for public procedures.
    if (!user) {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
