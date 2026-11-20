import { Home } from "@/components/studio/home";
import { database, ready, services } from "@/lib/server/core";
export const dynamic = "force-dynamic";
export default async function Page() {
  const db = database();
  await ready(db);
  return <Home menu={await services(db)} />;
}
