
import { Hono } from "hono";
import type { Env } from "../types";

import {
  addMember,
  getMembers,
} from "../controller/member.controller";

import { getBalances } from "../controller/balance.controller";

export const memberRoutes = new Hono<{ Bindings: Env }>();

memberRoutes.post("/:homeId/addMembers", addMember);

memberRoutes.get("/:homeId/getMembers", getMembers);

memberRoutes.get("/:homeId/getBalances", getBalances);
