import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET environment variable is not set");
}
export function generateJWT(email: string): string {
  return jwt.sign(email, secret ? secret : "default_secret", {
    expiresIn: "7d",
  });
}

export function verifyJWT(token: string): string | null {
  try {
    const decoded = jwt.verify(token, secret ? secret : "default_secret");
    if (typeof decoded === "string") {
      return decoded;
    }
    return null;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}
