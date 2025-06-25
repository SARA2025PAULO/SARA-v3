
import { AppLayout } from '@/components/layout/AppLayout';

export default function CalendarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
