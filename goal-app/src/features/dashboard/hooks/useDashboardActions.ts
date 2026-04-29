import { useAuth } from "@/src/providers/AuthProvider";
import { createLeagueFlow } from "../services/dashboardService";
import { useState } from "react";
import { LeagueRequest, LeagueResponse } from "../types/dashboard.actions.types";

export function useLeague() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [league, setLeague] = useState<LeagueResponse | null>(null);

  const createLeagueHandler = async (data: LeagueRequest, token: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await createLeagueFlow(data);

      if (!result.success) {
        setError(result.error || 'Error creando liga');
        return;
      }

      setLeague(result.league || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return {
    createLeague: createLeagueHandler,
    league,
    loading,
    error,
  };
}