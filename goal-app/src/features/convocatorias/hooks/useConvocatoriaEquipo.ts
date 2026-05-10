import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ConvocatoriaEquipoData, ConvocatoriaPlayer, ConvocatoriaPlayerState } from '../types/convocatoria.types';
import { getConvocatoriaEquipoService, saveConvocatoriaEquipoService } from '../services/convocatoriaService';

interface UseConvocatoriaEquipoOptions {
  partidoId?: number | null;
  equipoId?: number | null;
  readonly?: boolean;
}

export function useConvocatoriaEquipo({ partidoId, equipoId, readonly }: UseConvocatoriaEquipoOptions) {
  const [data, setData] = useState<ConvocatoriaEquipoData | null>(null);
  const [players, setPlayers] = useState<ConvocatoriaPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!partidoId || !equipoId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getConvocatoriaEquipoService(partidoId, equipoId);
      setData(result);
      setPlayers(result.jugadores);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la convocatoria.');
    } finally {
      setLoading(false);
    }
  }, [partidoId, equipoId]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const titulares = players.filter(p => p.estado === 'titular').length;
    const suplentes = players.filter(p => p.estado === 'suplente').length;
    return { titulares, suplentes, total: titulares + suplentes };
  }, [players]);

  const canEdit = !readonly && !data?.locked;

  const setPlayerState = useCallback((playerId: number, nextState: ConvocatoriaPlayerState) => {
    if (!canEdit || saving || loading) return;
    setPlayers(prev => prev.map(player => player.id_jugador === playerId ? { ...player, estado: nextState } : player));
  }, [canEdit, saving, loading]);

  const save = useCallback(async (options?: { allowUnderMin?: boolean }) => {
    if (!partidoId || !data || !canEdit || saving || loading) return false;
    setSaving(true);
    setError(null);
    try {
      const result = await saveConvocatoriaEquipoService(partidoId, players, data.limits, options);
      if (!result.success) {
        setError(result.error ?? 'No se pudo guardar la convocatoria.');
        return false;
      }
      await load();
      return true;
    } finally {
      setSaving(false);
    }
  }, [partidoId, data, canEdit, saving, loading, players, load]);

  return { data, players, counts, limits: data?.limits, locked: Boolean(data?.locked), lockReason: data?.lockReason, canEdit, loading, saving, error, refresh: load, setPlayerState, save };
}
