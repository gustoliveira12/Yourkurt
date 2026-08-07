import { redirect } from "next/navigation";

export default function LegacySuperAdminRoute() {
  redirect("/gerenciamento-usuarios");
}
