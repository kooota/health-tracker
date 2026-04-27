import { getSession } from "@/lib/session";
import { getHealthPlanetAuthUrl } from "@/lib/healthplanet";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const url = getHealthPlanetAuthUrl();
  redirect(url);
}

