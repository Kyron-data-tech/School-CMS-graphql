import { getAuthContext } from "@/lib/auth/context";
import { redirect } from "next/navigation";
import { GraphQLStudioClient } from "@/components/graphql/GraphQLStudioClient";

export default async function GraphQLStudioPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  return <GraphQLStudioClient />;
}
