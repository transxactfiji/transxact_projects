"use server";

import { sendEmail } from "./email.service";
import db from "@/db/connection";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setCookie, deleteCookie } from "./cookies.service";
import { generateJWT } from "./jwt.service";

async function sendLoginCode(email: string) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  // Send the code to the user's email
  await sendEmail({
    to: email,
    subject: "Your Transxact Login Code",
    text: `Your login code is: ${code}`,
  });
}

export async function requestLoginCode(email: string) {
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existingUser.length > 0) {
    await db
      .update(user)
      .set({ code: Math.random().toString(36).substring(2, 8).toUpperCase() })
      .where(eq(user.email, email));
  } else {
    await db.insert(user).values({
      name: "New User",
      email,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await sendLoginCode(email);
}

export async function login(email: string, code: string): Promise<string> {
  const validCode = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!validCode) {
    throw new Error("Invalid email or code");
  }

  if (validCode[0].code !== code) {
    throw new Error("Invalid email or code");
  }

  const jwt = generateJWT(email);
  await setCookie("transxact_project_auth_token", jwt);
  return jwt;
}

export async function logout() {
  await deleteCookie("transxact_project_auth_token");
}
