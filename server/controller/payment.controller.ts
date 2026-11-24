
import type { Context } from "hono";
import type { Env } from "../types";

type AppContext = Context<{ Bindings: Env }>;

interface PaymentRow {
  id: number;
  memberId: number;
  amountCents: number;
  paidAt: string | null;
  idempotencyKey: string | null;
}

export async function payShare(c: AppContext) {
  const billId = Number(c.req.param("billId"));
  const shareId = Number(c.req.param("shareId"));

  if (
    !Number.isSafeInteger(billId) ||
    billId <= 0 ||
    !Number.isSafeInteger(shareId) ||
    shareId <= 0
  ) {
    return c.json({ error: "Invalid bill or share ID." }, 400);
  }

  const idempotencyKey = c.req.header("Idempotency-Key")?.trim();

  if (!idempotencyKey) {
    return c.json(
      { error: "Idempotency-Key header is required." },
      400,
    );
  }

  if (idempotencyKey.length > 255) {
    return c.json({ error: "Idempotency key is too long." }, 400);
  }

  try {
    const share = await c.env.DB
      .prepare(
        `SELECT
          id,
          member_id AS memberId,
          amount_cents AS amountCents,
          paid_at AS paidAt,
          idempotency_key AS idempotencyKey
         FROM shares
         WHERE id = ? AND bill_id = ?`,
      )
      .bind(shareId, billId)
      .first<PaymentRow>();

    if (!share) {
      return c.json({ error: "Bill or share not found." }, 404);
    }

    const paidAt = new Date().toISOString();

    const updated = await c.env.DB
      .prepare(
        `UPDATE shares
         SET paid_at = ?, idempotency_key = ?
         WHERE id = ?
           AND bill_id = ?
           AND paid_at IS NULL
         RETURNING
           id,
           member_id AS memberId,
           amount_cents AS amountCents,
           paid_at AS paidAt,
           idempotency_key AS idempotencyKey`,
      )
      .bind(paidAt, idempotencyKey, shareId, billId)
      .first<PaymentRow>();

    if (updated) {
      return c.json({
        id: updated.id,
        memberId: updated.memberId,
        amountCents: updated.amountCents,
        paidAt: updated.paidAt,
      });
    }

    const current = await c.env.DB
      .prepare(
        `SELECT
          id,
          member_id AS memberId,
          amount_cents AS amountCents,
          paid_at AS paidAt,
          idempotency_key AS idempotencyKey
         FROM shares
         WHERE id = ? AND bill_id = ?`,
      )
      .bind(shareId, billId)
      .first<PaymentRow>();

    if (!current) {
      return c.json({ error: "Bill or share not found." }, 404);
    }

    if (
      current.paidAt !== null &&
      current.idempotencyKey === idempotencyKey
    ) {
      return c.json({
        id: current.id,
        memberId: current.memberId,
        amountCents: current.amountCents,
        paidAt: current.paidAt,
      });
    }

    if (current.paidAt !== null) {
      return c.json(
        { error: "Share has already been paid." },
        409,
      );
    }

    return c.json(
      { error: "Payment could not be completed. Please retry." },
      409,
    );
  } catch (error) {
    console.error("Payment error:", error);

    return c.json({ error: "Unable to process payment." }, 500);
  }
}
