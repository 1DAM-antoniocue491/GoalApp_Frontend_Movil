/**
 * Tipos del sistema de notificaciones de GoalApp.
 *
 * NotificationResponse: contrato real del backend.
 *   - Usa `id_notificacion`, NO `id`
 *   - Usa `leida`, NO `leido`
 *   - Usa `created_at`, NO `fecha_creacion`
 *   - Usa `tipo` para clasificar, NO `tipo_referencia`
 *
 * NotificationCategory: categorías derivadas del campo `tipo` del backend.
 *   'all' es solo un valor de filtro UI — ninguna notificación real tiene category === 'all'.
 */

// ─── Contrato backend ────────────────────────────────────────────────────────

export type NotificationType =
  | 'partido_programado'
  | 'partido_en_juego'
  | 'partido_finalizado'
  | 'partido_cancelado'
  | 'convocatoria'
  | 'convocatoria_actualizada'
  | 'convocatoria_eliminada'
  | 'resultado'
  | 'clasificacion'
  | 'jugador_nuevo'
  | 'liga_actualizacion'
  | 'tarjeta'
  | 'gol'
  | 'rol_asignado'
  | 'rol_revocado'
  | string;

export interface NotificationResponse {
  /** Identificador único — campo correcto del backend */
  id_notificacion: number;
  id_usuario?: number;
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  /** IMPORTANTE: campo correcto es `leida`, nunca `leido` */
  leida: boolean;
  id_referencia: number | null;
  tipo_referencia: string | null;
  created_at: string;
  updated_at?: string;
}

// ─── Tipos de UI ─────────────────────────────────────────────────────────────

/**
 * Categorías derivadas del campo `tipo` del backend.
 * 'all' solo existe como valor de filtro UI — ninguna lógica de negocio depende de él.
 */
export type NotificationCategory =
  | 'all'
  | 'live'
  | 'results'
  | 'teams'
  | 'stats';

/** Alias de categoría para filtros de UI */
export type NotificationCategoryFilter = NotificationCategory;

/** Alias — en UI ambos se usan igual */
export type NotificationFilter = NotificationCategory;

/** Filtro de estado de lectura — independiente de los chips de categoría */
export type NotificationReadFilter = 'all' | 'read' | 'unread';

export interface AppNotification {
  /** String derivado de id_notificacion */
  id: string;
  /** Valor numérico original para llamadas API */
  rawId: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  referenceId: number | null;
  referenceType: string | null;
  category: NotificationCategoryFilter;
  /** Ruta de Expo Router a la que navegar al pulsar la tarjeta */
  targetRoute?: string;
  /** Parámetros opcionales para la ruta destino */
  targetParams?: Record<string, string | number>;
}
