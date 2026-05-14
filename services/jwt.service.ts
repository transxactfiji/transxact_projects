import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { type UserRole } from "@/db/schema";

const secret = process.env.JWT_SECRET;

function jwtSecret(): string {
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return secret;
}

const DEFAULT_TOKEN_TTL: SignOptions["expiresIn"] = "24h";

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

interface DecodedAuthToken extends JwtPayload {
  email?: string;
  role?: UserRole;
}

export function generateJWT(
  payload: AuthTokenPayload,
  expiresIn: SignOptions["expiresIn"] = DEFAULT_TOKEN_TTL,
): string {
  return jwt.sign(
    {
      email: payload.email,
      role: payload.role,
    },
    jwtSecret(),
    {
      subject: String(payload.userId),
      expiresIn,
    },
  );
}

export function verifyJWT(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, jwtSecret());

  if (typeof decoded === "string") {
    throw new Error("Invalid JWT payload format");
  }

  const parsed = decoded as DecodedAuthToken;
  const userId = Number(parsed.sub);
  if (Number.isNaN(userId)) {
    throw new Error("Invalid JWT subject");
  }

  if (!parsed.email) {
    throw new Error("JWT email claim is missing");
  }

  if (parsed.role !== "admin" && parsed.role !== "member") {
    throw new Error("JWT role claim is invalid");
  }

  return {
    userId,
    email: parsed.email,
    role: parsed.role,
  };
}
