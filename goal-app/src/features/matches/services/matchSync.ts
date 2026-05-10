/**
 * matchSync.ts
 *
 * Bus mínimo en memoria para sincronizar pantallas montadas.
 * No sustituye al refetch de cada pantalla: solo evita que dashboard,
 * calendario y partidos queden visualmente desfasados tras una acción.
 */

type MatchSyncListener = () => void;

const listeners = new Set<MatchSyncListener>();

export function emitMatchDataChanged() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Un listener no debe romper el resto de pantallas suscritas.
    }
  });
}

export function subscribeMatchDataChanged(listener: MatchSyncListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
