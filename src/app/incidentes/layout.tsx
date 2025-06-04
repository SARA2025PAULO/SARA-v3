
"use client";
import { AppLayout } from "@/components/layout/AppLayout";

export default function IncidentesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
