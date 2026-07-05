import { createFileRoute } from "@tanstack/react-router";
import BaseballGame from "~/lib/game/Game";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <BaseballGame />;
}