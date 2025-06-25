
'use client';

import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { Contract } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// Set moment to Spanish for calendar messages
import 'moment/locale/es';
moment.locale('es');

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    type: 'payment' | 'contract' | 'adjustment';
    status: 'completed' | 'pending';
    contractId: string;
    propertyId: string;
    propertyName: string;
  };
}

const eventStyleGetter = (event: CalendarEvent) => {
  let backgroundColor = '#3174ad'; // Default color

  switch (event.resource.type) {
    case 'payment':
      backgroundColor = event.resource.status === 'completed' ? '#5cb85c' : '#f0ad4e';
      break;
    case 'contract':
      backgroundColor = '#d9534f';
      break;
    case 'adjustment':
      backgroundColor = '#5bc0de';
      break;
    default:
      backgroundColor = '#3174ad';
  }

  const style = {
    backgroundColor,
    borderRadius: '5px',
    opacity: 0.8,
    color: 'white',
    border: '0px',
    display: 'block',
  };
  return {
    style: style,
  };
};

export default function CalendarView() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('CalendarView: useEffect triggered. currentUser:', currentUser);
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        // --- CORRECTED: Query for contracts with lowercase statuses ---
        const userContractsQuery = query(
          collection(db, 'contracts'),
          where(currentUser.role === 'Arrendador' ? 'landlordId' : 'tenantId', '==', currentUser.uid),
          where('status', 'in', ['activo', 'pendiente'])
        );

        const querySnapshot = await getDocs(userContractsQuery);
        console.log(`CalendarView: Firestore query returned ${querySnapshot.docs.length} active or pending contracts.`);

        const contracts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
        console.log('CalendarView: Mapped contracts:', contracts);

        const generatedEvents: CalendarEvent[] = [];
        
        contracts.forEach(contract => {
          if (!contract.startDate || !contract.endDate) return;

          // 1. Evento de fin de contrato
          generatedEvents.push({
            title: `Fin Contrato: ${contract.propertyName}`,
            start: moment(contract.endDate).toDate(),
            end: moment(contract.endDate).toDate(),
            allDay: true,
            resource: {
              type: 'contract',
              status: 'pending',
              contractId: contract.id,
              propertyId: contract.propertyId,
              propertyName: contract.propertyName,
            },
          });

          // 2. Eventos de pago
          const paymentDay = contract.rentPaymentDay || 5;
          const start = moment(contract.startDate);
          const end = moment(contract.endDate);
          let current = start.clone();

          while (current.isBefore(end)) {
            generatedEvents.push({
              title: `Pago Arriendo: ${contract.propertyName}`,
              start: current.clone().date(paymentDay).toDate(),
              end: current.clone().date(paymentDay).toDate(),
              allDay: true,
              resource: {
                type: 'payment',
                status: 'pending', // Placeholder status
                contractId: contract.id,
                propertyId: contract.propertyId,
                propertyName: contract.propertyName,
              },
            });
            current.add(1, 'month');
          }
        });
        
        console.log('CalendarView: Total generated events:', generatedEvents.length, generatedEvents);
        setEvents(generatedEvents);

      } catch (error) {
        console.error("CalendarView: Error fetching calendar data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [currentUser]);
  
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div style={{ height: 700 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        messages={{
          next: "Siguiente",
          previous: "Anterior",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
          date: "Fecha",
          time: "Hora",
          event: "Evento",
          showMore: total => `+${total} más`,
        }}
      />
    </div>
  );
}
