import { redirect } from "next/navigation";

/** Keep old URL working */
export default function GenerateTokenRedirect() {
  redirect("/dashboard");
}
