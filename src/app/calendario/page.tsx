
import CalendarView from '@/components/calendario/CalendarView';
import { AppLayout } from '@/components/layout/AppLayout';

export default function CalendarioPage() {
  return (
    <AppLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Calendario de Cumplimiento</h1>
        <CalendarView />
      </div>
    </AppLayout>
  );
}
