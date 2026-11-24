
import type { Context } from "hono";
import type { Env } from "../types";

type AppContext = Context<{ Bindings: Env }>;

interface AddMemberBody {
  name: string;
  email: string;
}

export async function addMember(c: AppContext) {
  const homeId = Number(c.req.param("homeId"));

  if (!Number.isSafeInteger(homeId) || homeId <= 0) {
    return c.json({ error: "Invalid home ID." }, 400);
  }

  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("name" in body) ||
    !("email" in body) ||
    typeof body.name !== "string" ||
    typeof body.email !== "string"
  ) {
    return c.json(
      { error: "Member name and email are required." },
      400
    );
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();

  if (name.length < 1 || name.length > 100) {
    return c.json({ error: "Invalid member name." }, 422);
  }

  if (
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return c.json({ error: "Invalid member email." }, 422);
  }

  try {
    const home = await c.env.DB
      .prepare("SELECT id FROM homes WHERE id = ?")
      .bind(homeId)
      .first();

    if (!home) {
      return c.json({ error: "Home not found." }, 404);
    }

    const existingMember = await c.env.DB
      .prepare(`
        SELECT id
        FROM members
        WHERE home_id = ?
          AND (
            LOWER(name) = LOWER(?)
            OR LOWER(email) = LOWER(?)
          )
      `)
      .bind(homeId, name, email)
      .first();

    if (existingMember) {
      return c.json(
        { error: "A member with this name or email already exists." },
        409
      );
    }

    const result = await c.env.DB
      .prepare(`
        INSERT INTO members (home_id, name, email)
        VALUES (?, ?, ?)
      `)
      .bind(homeId, name, email)
      .run();

    return c.json(
      {
        id: result.meta.last_row_id,
        homeId,
        name,
        email,
      },
      201
    );
  } catch (error) {
    console.error("Add member:", error);

    return c.json({ error: "Unable to add member." }, 500);
  }
}

export async function getMembers(c: AppContext) {
  const homeId = Number(c.req.param("homeId"));

  if (!Number.isSafeInteger(homeId) || homeId <= 0) {
    return c.json({ error: "Invalid home ID." }, 400);
  }

  try {
    const home = await c.env.DB
      .prepare("SELECT id FROM homes WHERE id = ?")
      .bind(homeId)
      .first();

    if (!home) {
      return c.json({ error: "Home not found." }, 404);
    }

    const result = await c.env.DB
      .prepare(`
        SELECT
          id,
          home_id AS homeId,
          name,
          email
        FROM members
        WHERE home_id = ?
        ORDER BY id ASC
      `)
      .bind(homeId)
      .all();

    return c.json({
      members: result.results,
    });
  } catch (error) {
    console.error("Get members:", error);

    return c.json(
      { error: "Unable to retrieve members." },
      500
    );
  }
}
