import Link from "next/link";
import RegisterForm from "./registerForm";
import InlineStatus from "@/app/ui/inlineStatus";
import type { ReactElement } from "react";
import { FiArrowLeft, FiShield } from "react-icons/fi";

interface RegisterPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function RegisterPage(
  props: RegisterPageProps,
): Promise<ReactElement> {
  const params = await props.searchParams;
  const token = params.token ?? null;
  if (!token) {
    return (
      <section className="w-full max-w-md border rounded-lg bg-card shadow-card p-4">
        <h1 className="inline-flex items-center gap-1">
          <FiShield aria-hidden="true" />
          <span>Invalid invite link</span>
        </h1>
        <InlineStatus
          tone="error"
          message="This invite link is missing a token. Request a new invitation to continue."
        />
        <Link
          href="/auth"
          className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:text-primary/80"
        >
          <span className="inline-flex items-center gap-1">
            <FiArrowLeft aria-hidden="true" />
            <span>Return to login</span>
          </span>
        </Link>
      </section>
    );
  }

  return (
    <section className="w-full max-w-md border rounded-lg bg-card shadow-card p-4">
      <h1 className="inline-flex items-center gap-1">
        <FiShield aria-hidden="true" />
        <span>Complete your account setup</span>
      </h1>
      <p className="mt-1 text-muted-foreground text-sm">
        Add your details to activate your workspace access.
      </p>
      <RegisterForm token={token} />
    </section>
  );
}
