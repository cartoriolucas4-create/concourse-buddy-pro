import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();
  // GitHub Pages is a static host and does not rewrite deep URLs to index.html.
  // Hash history keeps client-side routes working without server-side rewrites.
  const history = createHashHistory();

  return createRouter({
    routeTree,
    history,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
};
