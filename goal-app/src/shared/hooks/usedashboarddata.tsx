/**
 * useDashboardData.ts
 *
 * Hook principal de datos del dashboard.
 *
 * RESPONSABILIDAD:
 * Centraliza todo el acceso a datos que necesita el dashboard.
 * Los componentes NO acceden a mocks directamente; siempre pasan por este hook.
 *
 * EVOLUCIÓN HACIA API REAL:
 * Hoy: devuelve datos mock (mockDashboardData).
 * Mañana: sustituir el bloque de datos por una llamada a TanStack Query:
 *
 *   const { data, isLoading, isError } = useQuery({
 *     queryKey: ['dashboard', leagueId],
 *     queryFn: () => fetchDashboardData(leagueId),
 *   });
 *
 * La interfaz de retorno (DashboardHookResult) no cambia,
 * por lo que los componentes no necesitan modificarse.
 *
 * PATRÓN:
 * hooks/ → lógica de negocio y acceso a datos
 * components/ → solo renderizado, sin lógica de fetch
 */

import { useState, useEffect } from 'react';
import type { DashboardData } from '@/src/shared/types/dashboard.types';
import { mockDashboardData } from '@/src/mocks/dashboard.mocks';

// ---------------------------------------------------------------------------
// Contrato del hook
// ---------------------------------------------------------------------------

export interface DashboardHookResult {
    data: DashboardData | null;
    isLoading: boolean;
    isError: boolean;
    /** Permite refrescar los datos manualmente (pull-to-refresh, etc.) */
    refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useDashboardData
 *
 * @param leagueId - ID de la liga activa. Se usará como queryKey cuando
 *                   se migre a TanStack Query.
 */
export function useDashboardData(leagueId: string): DashboardHookResult {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    /**
     * loadData simula el fetch. Cuando se integre la API real, este bloque
     * se reemplaza por la llamada a TanStack Query fuera del useEffect,
     * y este hook puede eliminarse en favor del hook de react-query directo.
     */
    const loadData = () => {
        setIsLoading(true);
        setIsError(false);

        // Simulación de latencia de red — eliminar en producción
        const timer = setTimeout(() => {
            try {
                setData(mockDashboardData);
            } catch {
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    };

    useEffect(() => {
        const cleanup = loadData();
        return cleanup;
    }, [leagueId]);

    return {
        data,
        isLoading,
        isError,
        refetch: loadData,
    };
}