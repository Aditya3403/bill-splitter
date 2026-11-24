
import type { Context } from "hono";
import type { Env } from "../types";
import { jwtVerify } from "jose";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
}

export async function getAuthenticatedUser(
  c: Context<{ Bindings: Env }>
): Promise<AuthenticatedUser | null> {
  const authorization = c.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);

    const userId = Number(payload.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return null;
    }

    const user = await c.env.DB
      .prepare(`
        SELECT id, name, email
        FROM users
        WHERE id = ?
      `)
      .bind(userId)
      .first<AuthenticatedUser>();

    return user ?? null;
  } catch {
    return null;
  }
}
