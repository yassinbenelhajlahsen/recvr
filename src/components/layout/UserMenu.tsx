"use client";

import { useTheme } from "./ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuDivider,
} from "@/components/ui/DropdownMenu";
import { SunIcon, MoonIcon, SettingsIcon, SignOutIcon } from "@/components/ui/icons";
import type { UserMenuProps } from "@/types/ui";

export function UserMenu({
  open,
  onClose,
  anchorRef,
  user,
  onOpenSettings,
  onSignOut,
  onboarding,
}: UserMenuProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <DropdownMenu open={open} onClose={onClose} anchorRef={anchorRef}>
      {/* Email header */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <p className="text-xs text-muted truncate max-w-[180px]">
          {user.email}
        </p>
      </div>

      {/* Theme toggle */}
      <DropdownMenuItem onClick={toggleTheme}>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </DropdownMenuItem>

      {/* Settings — hidden during onboarding */}
      {!onboarding && (
        <DropdownMenuItem
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
        >
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
      )}

      <DropdownMenuDivider />

      {/* Sign out */}
      <DropdownMenuItem
        danger
        onClick={() => {
          onSignOut();
          onClose();
        }}
      >
        <SignOutIcon />
        Sign out
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
