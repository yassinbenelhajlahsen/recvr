"use client";

import Link from "next/link";
import { AppleIcon } from "@/components/ui/icons";

export default function MobilePageClient() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
      <AppleIcon className="w-20 h-20 shrink-0 text-primary" />
      <h1 className="mt-20 text-2xl font-semibold text-primary">
        Mobile app coming soon
      </h1>

      <p className="mt-3 max-w-sm text-secondary">
        We&apos;re building a native mobile experience. For now, please use
        Recvr on a desktop or laptop browser.
      </p>

      <Link
        href="/"
        className="mt-10 text-sm text-accent underline underline-offset-4 hover:opacity-80"
      >
        Back to home
      </Link>
    </div>
  );
}
