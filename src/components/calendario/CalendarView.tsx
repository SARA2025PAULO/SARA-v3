
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
    type: 'payment' | 'contract' | 'adjustment' | 'common_expenses' | 'utilities'; // Added new types
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
    case 'common_expenses': // New color for common expenses
      backgroundColor = '#6c757d'; // Gray
      break;
    case 'utilities': // New color for utilities
      backgroundColor = '#007bff'; // Blue
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
  const [currentDate, setCurrentDate] = useState(new Date()); // State to control current date
  const [currentView, setCurrentView] = useState(Views.MONTH); // State to control current view

  useEffect(() => {
    console.log('CalendarView: useEffect triggered. currentUser:', currentUser);
    if (!currentUser) {
      setLoading(false);
      setEvents([]); // Ensure events are empty if no user
      return;
    }

    const fetchCalendarData = async () => {
      setLoading(true);
      try {
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
        const today = moment();

        contracts.forEach(contract => {
          if (!contract.startDate || !contract.endDate) return;

          const contractStartMoment = moment(contract.startDate);
          const contractEndMoment = moment(contract.endDate);

          // Generate events from 6 months before today up to 12 months from now,
          // ensuring they are within the actual contract start and end dates.
          let loopStart = moment.max(contractStartMoment, today.clone().subtract(6, 'months'));
          let loopEnd = moment.min(contractEndMoment, today.clone().add(12, 'months'));

          if (loopStart.isAfter(loopEnd)) return; // No relevant period to show

          let currentMonth = loopStart.clone().startOf('month');

          while (currentMonth.isSameOrBefore(loopEnd)) {
            // 1. Evento de fin de contrato (solo si es el mes del fin de contrato y aún no ha pasado)
            if (currentMonth.isSame(contractEndMoment, 'month') && currentMonth.isSameOrBefore(contractEndMoment)) {
              generatedEvents.push({
                title: `Fin Contrato: ${contract.propertyName}`,
                start: contractEndMoment.toDate(),
                end: contractEndMoment.toDate(),
                allDay: true,
                resource: {
                  type: 'contract',
                  status: 'pending',
                  contractId: contract.id,
                  propertyId: contract.propertyId,
                  propertyName: contract.propertyName,
                },
              });
            }

            // 2. Eventos de pago de arriendo
            const rentPaymentDay = contract.rentPaymentDay || 5;
            const rentDate = currentMonth.clone().date(rentPaymentDay);
            if (rentDate.isSameOrAfter(contractStartMoment) && rentDate.isSameOrBefore(contractEndMoment)) {
              generatedEvents.push({
                title: `Pago Arriendo: ${contract.propertyName}`,
                start: rentDate.toDate(),
                end: rentDate.toDate(),
                allDay: true,
                resource: {
                  type: 'payment',
                  status: 'pending', // Placeholder status
                  contractId: contract.id,
                  propertyId: contract.propertyId,
                  propertyName: contract.propertyName,
                },
              });
            }

            // 3. Eventos de pago de gastos comunes (si no están incluidos y se especifica un día)
            if (contract.commonExpensesIncluded === 'no incluidos' && contract.commonExpensesPaymentDay) {
              const commonExpensesDate = currentMonth.clone().date(contract.commonExpensesPaymentDay);
              if (commonExpensesDate.isSameOrAfter(contractStartMoment) && commonExpensesDate.isSameOrBefore(contractEndMoment)) {
                generatedEvents.push({
                  title: `Pago G. Comunes: ${contract.propertyName}`,
                  start: commonExpensesDate.toDate(),
                  end: commonExpensesDate.toDate(),
                  allDay: true,
                  resource: {
                    type: 'common_expenses',
                    status: 'pending',
                    contractId: contract.id,
                    propertyId: contract.propertyId,
                    propertyName: contract.propertyName,
                  },
                });
              }
            }

            // 4. Eventos de pago de cuentas de servicios (si se especifica un día)
            if (contract.utilitiesPaymentDay) {
              const utilitiesDate = currentMonth.clone().date(contract.utilitiesPaymentDay);
              if (utilitiesDate.isSameOrAfter(contractStartMoment) && utilitiesDate.isSameOrBefore(contractEndMoment)) {
                generatedEvents.push({
                  title: `Pago Cuentas: ${contract.propertyName}`,
                  start: utilitiesDate.toDate(),
                  end: utilitiesDate.toDate(),
                  allDay: true,
                  resource: {
                    type: 'utilities',
                    status: 'pending',
                    contractId: contract.id,
                    propertyId: contract.propertyId,
                    propertyName: contract.propertyName,
                  },
                });
              }
            }

            currentMonth.add(1, 'month');
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
    <div style={{ height: 700, width: '100%' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
        date={currentDate} // Controlled date
        onNavigate={setCurrentDate} // Navigate handler
        view={currentView} // Controlled view
        onView={setCurrentView} // View handler
        defaultDate={new Date()} // Kept for initial load logic if needed by library
        defaultView={Views.MONTH} 
        toolbar={true}
        selectable
        onSelectEvent={event => console.log("Event selected:", event)}
        onSelectSlot={slotInfo => console.log("Slot selected:", slotInfo)}
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
