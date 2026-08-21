"use server";

import { redirect } from "next/navigation";
import { authenticateAgent, createAgentSession } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const agent = await authenticateAgent(email, password);

  if (!agent) {
    redirect("/login?error=invalid");
  }

  await createAgentSession(agent);
  redirect("/agent");
}

