import { createFileRoute } from "@tanstack/react-router";
import { GarageApp } from "@/components/garage/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <GarageApp />;
}
