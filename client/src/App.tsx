
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import { LandingPage } from "./routes/LandingPage";
import { HomePage } from "./routes/HomePage";

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/homes/$homeId",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
