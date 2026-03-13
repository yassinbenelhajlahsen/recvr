import type { Metadata } from "next";
import MobilePageClient from "./MobilePageClient";

export const metadata: Metadata = {
  title: "Recvr — Mobile App Coming Soon",
};

export default function MobilePage() {
  return <MobilePageClient />;
}
