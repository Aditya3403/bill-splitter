
import { Hono } from "hono";
import type { Env } from "../types";

import {
  createBill,
  getBills,
} from "../controller/bill.controller";

export const billRoutes = new Hono<{ Bindings: Env }>();

billRoutes.post("/:homeId/createBills", createBill);

billRoutes.get("/:homeId/getBills", getBills);
