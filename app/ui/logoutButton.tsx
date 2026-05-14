"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { FiLogOut } from "react-icons/fi";
import AppButton from "./appButton";

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
    <AppButton
      variant="ghost"
      onClick={() => void handleLogout()}
      isLoading={isLoggingOut}
      loadingLabel="Logging out..."
      startIcon={<FiLogOut aria-hidden="true" />}
    >
      Logout
    </AppButton>
  );
}
