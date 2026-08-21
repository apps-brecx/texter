import "server-only";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getActiveMembership, getCurrentUser, RANK } from "@/lib/auth";

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** Resolves the caller's workspace context or throws an HttpError. */
export async function apiContext(minRole: Role = "MEMBER") {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sign in to continue.");

  const membership = await getActiveMembership();
  if (!membership) throw new HttpError(403, "You are not in a workspace yet.");
  if (RANK[membership.role] < RANK[minRole]) {
    throw new HttpError(403, "You need admin access for that.");
  }

  return { user, membership, workspace: membership.workspace, role: membership.role };
}

/** Wraps a route handler so thrown HttpErrors become clean JSON responses. */
export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      const message = error instanceof Error ? error.message : "Something went wrong.";
      console.error("[texter]", error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
