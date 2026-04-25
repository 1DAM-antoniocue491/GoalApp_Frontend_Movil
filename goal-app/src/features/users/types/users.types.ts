/**
 * Tipos del dominio de usuarios y roles dentro de una liga.
 */

export type UserRole = 'admin' | 'coach' | 'player' | 'delegate' | 'observer';
export type UserStatus = 'active' | 'pending';

export interface LeagueUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  teamId?: string;
  teamName?: string;
  // Solo para jugadores
  jersey?: number;
  position?: string;
  isCaptain?: boolean;
}

export interface InviteUserFormData {
  email: string;
  role: UserRole | '';
  teamId: string;
  playerType: string;
  jersey: string;
  position: string;
}

export interface ManageUserFormData {
  role: UserRole | '';
  teamId: string;
  jersey: string;
  position: string;
  isCaptain: boolean;
}

/** Etiquetas legibles por rol */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  player: 'Jugador',
  delegate: 'Delegado',
  observer: 'Observador',
};
