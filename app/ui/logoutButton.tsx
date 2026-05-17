"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { FiLogOut } from "react-icons/fi";
import { Button } from "@/components/ui/button";

export default function LogoutButton(): ReactElement {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      window.location.assign("/auth");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void handleLogout()}
      disabled={isLoggingOut}
    >
      <FiLogOut aria-hidden="true" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
}
