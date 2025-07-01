
'use client';

import { InvitationManager } from '@/components/admin/InvitationManager';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bienvenido, {currentUser?.displayName || 'Admin'}!</h2>
      <p className="text-muted-foreground">
        Desde este panel puedes gestionar las invitaciones y supervisar la actividad de la plataforma.
      </p>
      
      {/* El componente para gestionar invitaciones se insertará aquí */}
      <InvitationManager />
      
    </div>
  );
}
