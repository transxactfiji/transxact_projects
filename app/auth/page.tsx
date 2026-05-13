"use client";

import { useState } from "react";
import EnterCodeForm from "./enterCodeForm";
import { toast } from "sonner";
import { requestLoginCode } from "@/services/auth.service";

export default function AuthPage() {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  if (showCodeInput) {
    return <EnterCodeForm email={email} />;
  }

  return (
    <div>
      <form
        action={async () => {
          if (!email) {
            toast.error("Please enter your email");
            return;
          }
          await requestLoginCode(email);
          setShowCodeInput(true);
          toast.success("Login code sent to your email");
        }}
      >
        <input
          type="email"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit">Request Login Code</button>
      </form>
    </div>
  );
}
