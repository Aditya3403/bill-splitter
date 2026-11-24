
import type { Context } from "hono";
import type { Env } from "../types";

type AppContext = Context<{ Bindings: Env }>;

export async function getBalances(c: AppContext) {
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
      .prepare(
        `SELECT
          m.id AS memberId,
          m.name,
          COALESCE(
            SUM(
              CASE
                WHEN s.paid_at IS NULL
                THEN s.amount_cents
                ELSE 0
              END
            ),
            0
          ) AS outstandingCents
         FROM members m
         LEFT JOIN shares s
           ON s.member_id = m.id
           AND s.home_id = m.home_id
         WHERE m.home_id = ?
         GROUP BY m.id, m.name
         ORDER BY m.id ASC`,
      )
      .bind(homeId)
      .all();

    return c.json({
      balances: result.results,
    });
  } catch (error) {
    console.error("Get balances:", error);

    return c.json({ error: "Unable to retrieve balances." }, 500);
  }
}
