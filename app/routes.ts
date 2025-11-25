import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("chat", "routes/chat.jsx"),
  route("reports", "routes/reports.jsx"),
  route("sse/stream", "routes/sse.stream.ts"),
] satisfies RouteConfig;
