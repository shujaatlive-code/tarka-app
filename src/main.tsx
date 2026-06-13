import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
} from '@tanstack/react-router';
import './index.css';

// Import route components
import RootLayout from './routes/__root.tsx';
import FeedRouteComponent from './routes/index.tsx';
import MatcherRouteComponent from './routes/matcher.tsx';
import DegchiRouteComponent from './routes/degchi.tsx';
import RecipeDetailRouteComponent from './routes/recipes.$recipeId.tsx';

// 1. Create Route Trees
const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: FeedRouteComponent,
});

const matcherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/matcher',
  component: MatcherRouteComponent,
});

const degchiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/degchi',
  component: DegchiRouteComponent,
});

const recipeDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recipes/$recipeId',
  component: RecipeDetailRouteComponent,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  matcherRoute,
  degchiRoute,
  recipeDetailRoute,
]);

// 2. Instantiate Router
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// 3. Render DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
