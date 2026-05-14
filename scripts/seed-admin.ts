import "dotenv/config";
import { eq } from "drizzle-orm";
import db, { ensureDbSchema } from "../db/connection";
import { user } from "../db/schema";

const ADMIN_NAME = "Taia Tiniyara";
const ADMIN_EMAIL = "taiatiniyara@gmail.com";

async function seedAdminUser(): Promise<void> {
  await ensureDbSchema();

  const nowIso = new Date().toISOString();
  const existingRows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, ADMIN_EMAIL))
    .limit(1);

  if (existingRows.length > 0) {
    await db
      .update(user)
      .set({
        name: ADMIN_NAME,
        role: "admin",
        status: "active",
        updatedAt: nowIso,
      })
      .where(eq(user.id, existingRows[0].id));

    console.log(
      `Updated existing user as admin: ${ADMIN_NAME} <${ADMIN_EMAIL}> (id=${existingRows[0].id})`,
    );
    return;
  }

  const createdRows = await db
    .insert(user)
    .values({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: "admin",
      status: "active",
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .returning({ id: user.id });

  if (createdRows.length === 0) {
    throw new Error("Failed to create admin user.");
  }

  console.log(
    `Created admin user: ${ADMIN_NAME} <${ADMIN_EMAIL}> (id=${createdRows[0].id})`,
  );
}

seedAdminUser().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Admin seed failed: ${message}`);
  process.exitCode = 1;
});
