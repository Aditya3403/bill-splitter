
import type { Context } from "hono";
import type { Env } from "../types";
import { splitAmount } from "../utils/split.utils";
import { getAuthenticatedUser } from "../utils/auth.utils";

type AppContext = Context<{ Bindings: Env }>;

interface MemberRow {
  id: number;
  name: string;
  email: string | null;
}

interface SharedMember {
  name: string;
  email: string;
}

interface BillRow {
  id: number;
  homeId: number;
  title: string;
  totalCents: number;
  createdBy: number;
  sharedWith: string;
  createdAt: string;
}

interface ShareRow {
  id: number;
  billId: number;
  memberId: number;
  memberName: string;
  amountCents: number;
  paidAt: string | null;
}

export async function createBill(c: AppContext) {
  const user = await getAuthenticatedUser(c);

  if (!user) {
    return c.json({ error: "Unauthorized. Please log in." }, 401);
  }

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
    !("title" in body) ||
    !("totalCents" in body) ||
    typeof body.title !== "string" ||
    typeof body.totalCents !== "number"
  ) {
    return c.json({ error: "Invalid bill details." }, 400);
  }

  const title = body.title.trim();
  const totalCents = body.totalCents;

  if (title.length < 1 || title.length > 150) {
    return c.json({ error: "Invalid bill title." }, 422);
  }

  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    return c.json(
      { error: "totalCents must be a positive whole number." },
      422
    );
  }

  try {
    const home = await c.env.DB
      .prepare(`
        SELECT id
        FROM homes
        WHERE id = ? AND user_id = ?
      `)
      .bind(homeId, user.id)
      .first();

    if (!home) {
      return c.json(
        { error: "Home not found or you do not own this home." },
        404
      );
    }

    const memberResult = await c.env.DB
      .prepare(`
        SELECT id, name, email
        FROM members
        WHERE home_id = ?
        ORDER BY id ASC
      `)
      .bind(homeId)
      .all<MemberRow>();

    const members = memberResult.results.filter(
      (member) =>
        !member.email ||
        member.email.toLowerCase() !== user.email.toLowerCase()
    );

    if (members.length === 0) {
      return c.json(
        { error: "Add at least one other member before creating a bill." },
        422
      );
    }

    const memberWithoutEmail = members.find(
      (member) => !member.email?.trim()
    );

    if (memberWithoutEmail) {
      return c.json(
        {
          error: `Please add an email address for ${memberWithoutEmail.name}.`
        },
        422
      );
    }

    const sharedWith: SharedMember[] = members.map((member) => ({
      name: member.name,
      email: member.email!.trim().toLowerCase()
    }));

    const amounts = splitAmount(totalCents, members.length);
    const creationKey = crypto.randomUUID();

    const statements = [
      c.env.DB
        .prepare(`
          INSERT INTO bills (
            home_id,
            title,
            total_cents,
            creation_key,
            created_by,
            shared_with
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(
          homeId,
          title,
          totalCents,
          creationKey,
          user.id,
          JSON.stringify(sharedWith)
        ),

      ...members.map((member, index) =>
        c.env.DB
          .prepare(`
            INSERT INTO shares (
              bill_id,
              home_id,
              member_id,
              amount_cents
            )
            SELECT id, ?, ?, ?
            FROM bills
            WHERE creation_key = ?
          `)
          .bind(
            homeId,
            member.id,
            amounts[index],
            creationKey
          )
      )
    ];

    await c.env.DB.batch(statements);

    const bill = await c.env.DB
      .prepare(`
        SELECT
          id,
          home_id AS homeId,
          title,
          total_cents AS totalCents,
          created_by AS createdBy,
          shared_with AS sharedWith,
          created_at AS createdAt
        FROM bills
        WHERE creation_key = ?
      `)
      .bind(creationKey)
      .first<BillRow>();

    if (!bill) {
      return c.json({ error: "Unable to retrieve bill." }, 500);
    }

    const shareResult = await c.env.DB
      .prepare(`
        SELECT
          s.id,
          s.member_id AS memberId,
          m.name AS memberName,
          s.amount_cents AS amountCents,
          s.paid_at AS paidAt
        FROM shares s
        JOIN members m
          ON m.id = s.member_id
          AND m.home_id = s.home_id
        WHERE s.bill_id = ?
        ORDER BY s.member_id ASC
      `)
      .bind(bill.id)
      .all<ShareRow>();

    return c.json(
      {
        ...bill,
        sharedWith: JSON.parse(bill.sharedWith),
        shares: shareResult.results
      },
      201
    );
  } catch (error) {
    console.error("Create bill:", error);

    return c.json({ error: "Unable to create bill." }, 500);
  }
}

export async function getBills(c: AppContext) {
  const user = await getAuthenticatedUser(c);

  if (!user) {
    return c.json({ error: "Unauthorized. Please log in." }, 401);
  }

  try {
    const billsResult = await c.env.DB
      .prepare(`
        SELECT
          b.id,
          b.home_id AS homeId,
          b.title,
          b.total_cents AS totalCents,
          b.created_by AS createdBy,
          b.shared_with AS sharedWith,
          b.created_at AS createdAt
        FROM bills b
        WHERE b.created_by = ?
           OR EXISTS (
             SELECT 1
             FROM json_each(b.shared_with) AS member
             WHERE LOWER(json_extract(member.value, '$.email')) = LOWER(?)
           )
        ORDER BY b.id DESC
      `)
      .bind(user.id, user.email)
      .all<BillRow>();

    const bills = billsResult.results;

    if (bills.length === 0) {
      return c.json({ bills: [] });
    }

    const billIds = bills.map((bill) => bill.id);

    const placeholders = billIds.map(() => "?").join(",");

    const sharesResult = await c.env.DB
      .prepare(`
        SELECT
          s.id,
          s.bill_id AS billId,
          s.member_id AS memberId,
          m.name AS memberName,
          s.amount_cents AS amountCents,
          s.paid_at AS paidAt
        FROM shares s
        JOIN members m
          ON m.id = s.member_id
          AND m.home_id = s.home_id
        WHERE s.bill_id IN (${placeholders})
        ORDER BY s.member_id ASC
      `)
      .bind(...billIds)
      .all<ShareRow>();

    const sharesByBill = new Map<number, ShareRow[]>();

    for (const share of sharesResult.results) {
      const existing = sharesByBill.get(share.billId) ?? [];
      existing.push(share);
      sharesByBill.set(share.billId, existing);
    }

    const result = bills.map((bill) => ({
      id: bill.id,
      homeId: bill.homeId,
      title: bill.title,
      totalCents: bill.totalCents,
      createdBy: bill.createdBy,
      sharedWith: JSON.parse(bill.sharedWith) as SharedMember[],
      createdAt: bill.createdAt,
      shares: (sharesByBill.get(bill.id) ?? []).map((share) => ({
        id: share.id,
        memberId: share.memberId,
        memberName: share.memberName,
        amountCents: share.amountCents,
        paidAt: share.paidAt
      }))
    }));

    return c.json({ bills: result });
  } catch (error) {
    console.error("Get bills:", error);

    return c.json(
      { error: "Unable to retrieve bills." },
      500
    );
  }
}
