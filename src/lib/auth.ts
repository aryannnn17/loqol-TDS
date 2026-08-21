import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { APP_SECRET } from "@/lib/security";

const SESSION_COOKIE = "loqol_agent_session";
const SESSION_TTL = 60 * 60 * 24 * 7;
const secret = new TextEncoder().encode(APP_SECRET);

type AgentJwt = {
  sub: string;
  email: string;
  name: string;
};

export async function authenticateAgent(email: string, password: string) {
  const agent = await prisma.agentUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!agent) {
    return null;
  }

  const isValid = await bcrypt.compare(password, agent.passwordHash);

  if (!isValid) {
    return null;
  }

  return agent;
}

export async function createAgentSession(agent: {
  id: string;
  email: string;
  name: string;
}) {
  const token = await new SignJWT({
    email: agent.email,
    name: agent.name,
  } satisfies Omit<AgentJwt, "sub">)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(agent.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export async function clearAgentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAgentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as Partial<AgentJwt>;

    if (!payload.sub) {
      return null;
    }

    return {
      agentId: payload.sub,
      email: payload.email ?? "",
      name: payload.name ?? "",
    };
  } catch {
    return null;
  }
}

export async function requireAgent() {
  const session = await getAgentSession();

  if (!session?.agentId) {
    redirect("/login");
  }

  const agent = await prisma.agentUser.findUnique({
    where: { id: session.agentId },
  });

  if (!agent) {
    redirect("/login");
  }

  return agent;
}

