
import { Hono } from "hono";
import type { Env } from "../types";

import {
  createHome,
  getHome,
} from "../controller/home.controller";

export const homeRoutes = new Hono<{ Bindings: Env }>();

homeRoutes.post("/", createHome);
homeRoutes.get("/:homeId", getHome);
