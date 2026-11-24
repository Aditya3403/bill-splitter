
import { Hono } from "hono";
import type { Env } from "../types";

import { payShare } from "../controller/payment.controller";

export const paymentRoutes = new Hono<{ Bindings: Env }>();

paymentRoutes.post(
  "/bills/:billId/shares/:shareId/pay",
  payShare,
);
