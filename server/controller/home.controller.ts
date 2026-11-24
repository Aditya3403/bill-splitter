
import type { Context } from "hono";
import type { Env } from "../types";

type AppContext = Context<{ Bindings: Env }>;

export async function createHome(c: AppContext) {
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
    typeof body.name !== "string"
  ) {
    return c.json({ error: "Home name is required." }, 400);
  }

  const name = body.name.trim();

  if (name.length < 1 || name.length > 100) {
    return c.json({ error: "Invalid home name." }, 422);
  }

  try {
    const result = await c.env.DB
      .prepare("INSERT INTO homes (name) VALUES (?)")
      .bind(name)
      .run();

    return c.json(
      {
        id: result.meta.last_row_id,
        name,
      },
      201,
    );
  } catch (error) {
    console.error("Create home:", error);

    return c.json({ error: "Unable to create home." }, 500);
  }
}

export async function getHome(c: AppContext) {
  const homeId = Number(c.req.param("homeId"));

  if (!Number.isSafeInteger(homeId) || homeId <= 0) {
    return c.json({ error: "Invalid home ID." }, 400);
  }

  try {
    const home = await c.env.DB
      .prepare(
        "SELECT id, name FROM homes WHERE id = ?",
      )
      .bind(homeId)
      .first();

    if (!home) {
      return c.json({ error: "Home not found." }, 404);
    }

    return c.json(home);
  } catch (error) {
    console.error("Get home:", error);

    return c.json({ error: "Unable to retrieve home." }, 500);
  }
}
