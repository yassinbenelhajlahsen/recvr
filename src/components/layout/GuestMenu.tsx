"use client";

import { useRouter } from "next/navigation";
import type { RefObject } from "react";
import { useTheme } from "./ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuDivider,
} from "@/components/ui/DropdownMenu";
import { SunIcon, MoonIcon, UserIcon } from "@/components/ui/icons";

interface GuestMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
}

export function GuestMenu({ open, onClose, anchorRef }: GuestMenuProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <DropdownMenu open={open} onClose={onClose} anchorRef={anchorRef}>
      <DropdownMenuItem onClick={toggleTheme}>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </DropdownMenuItem>

      <DropdownMenuDivider />

      <DropdownMenuItem
        onClick={() => {
          onClose();
          router.push("/auth/signin");
        }}
      >
        <UserIcon />
        Log in
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
