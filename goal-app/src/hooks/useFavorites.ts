/**
 * useFavorites - Hook para manejar estado de favoritos
 *
 * Hook reutilizable que gestiona el estado de ligas favoritas
 * usando datos mock. En producción, esto se conectaría con
 * el contexto de autenticación y backend real.
 *
 * @example
 * const { favorites, toggleFavorite, isFavorite } = useFavorites();
 *
 * @example
 * const { favorites, toggleFavorite, isFavorite } = useFavorites(user);
 */

import { useState, useCallback } from 'react';
import {
  toggleFavoriteLeague,
  isLeagueFavorite,
  type User,
} from '../data/data';

interface UseFavoritesReturn {
  /** IDs de ligas favoritas */
  favorites: string[];
  /** Verifica si una liga es favorita */
  isFavorite: (leagueId: string) => boolean;
  /** Alterna el estado de favorito */
  toggleFavorite: (leagueId: string) => void;
  /** Usuario actual */
  user: User;
}

/**
 * Hook para manejar favoritos con usuario específico
 */
export function useFavorites(user: User): UseFavoritesReturn {
  const [currentUser, setCurrentUser] = useState<User>(user);

  const toggleFavorite = useCallback((leagueId: string) => {
    setCurrentUser((prevUser) => toggleFavoriteLeague(prevUser, leagueId));
  }, []);

  const isFavorite = useCallback(
    (leagueId: string) => isLeagueFavorite(currentUser, leagueId),
    [currentUser]
  );

  return {
    favorites: currentUser.favoriteLeagues,
    isFavorite,
    toggleFavorite,
    user: currentUser,
  };
}

/**
 * Hook simplificado solo para estado booleano
 * Útil cuando solo necesitas saber si un ID es favorito
 */
export function useFavoriteState(initialFavorites: string[] = []) {
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(initialFavorites)
  );

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.has(id),
    [favorites]
  );

  return { favorites: Array.from(favorites), toggleFavorite, isFavorite };
}
