/**
 * TeamsScreen.tsx
 *
 * Pantalla de listado de equipos de la liga activa.
 *
 * RESPONSABILIDADES:
 * - Leer la liga activa y el rol del usuario desde activeLeagueStore
 * - Cargar equipos via useTeamsByLeague
 * - Mostrar skeleton mientras carga
 * - Mostrar empty state si la liga no tiene equipos
 * - Mostrar cards premium de equipos
 * - Mostrar botón "Crear equipo" solo para rol admin
 *
 * NAVEGACIÓN:
 * - Tocar una card → TeamDetailScreen (pendiente de implementar routing)
 * - Botón crear → CreateTeamModal
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useTeamsByLeague } from '../hooks/useTeams';
import { TeamCard } from './TeamCard';
import { CreateTeamModal } from './modals/CreateTeamModal';
import { Colors } from '@/src/shared/constants/colors';

// ---------------------------------------------------------------------------
// Skeleton loader — muestra 4 placeholders mientras carga
// ---------------------------------------------------------------------------

function TeamCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.circle} />
      <View style={skeletonStyles.lines}>
        <View style={skeletonStyles.lineWide} />
        <View style={skeletonStyles.lineShort} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TeamsScreen
// ---------------------------------------------------------------------------

interface TeamsScreenProps {
  /** Si es true, no renderiza el header propio (usado al embeber en otra pantalla) */
  embedded?: boolean;
}

export function TeamsScreen({ embedded = false }: TeamsScreenProps) {
  const { session } = useActiveLeague();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // leagueId viene como string desde el store; la API espera number
  const ligaId = session?.leagueId ? Number(session.leagueId) : 0;
  const isAdmin = session?.role === 'admin';

  const { data: teams, isLoading, isError, refetch } = useTeamsByLeague(ligaId);

  // Sin liga activa — no debería ocurrir en flujo normal
  if (!session || ligaId <= 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Sin liga activa</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={embedded ? [] : ['top']}>
      {/* Header — oculto en modo embebido */}
      {!embedded && (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Equipos</Text>
            <Text style={styles.headerSubtitle}>{session.leagueName}</Text>
          </View>

          {/* Botón crear — solo admin */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>+ Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Botón crear flotante en modo embebido — solo admin */}
      {embedded && isAdmin && (
        <View style={styles.embeddedCreateRow}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>+ Nuevo equipo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contenido */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={Colors.brand.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Estado cargando */}
        {isLoading && (
          <>
            {[1, 2, 3, 4].map((i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </>
        )}

        {/* Estado error */}
        {!isLoading && isError && (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No se pudieron cargar los equipos</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state — liga sin equipos */}
        {!isLoading && !isError && teams.length === 0 && (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>🏟</Text>
            <Text style={styles.emptyTitle}>Sin equipos aún</Text>
            <Text style={styles.emptySubtitle}>
              {isAdmin
                ? 'Crea el primer equipo de la liga.'
                : 'Aún no hay equipos en esta liga.'}
            </Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.emptyCreateButton}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.createButtonText}>Crear equipo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Lista de equipos */}
        {!isLoading && !isError && teams.length > 0 && (
          <>
            <Text style={styles.countLabel}>
              {teams.length} {teams.length === 1 ? 'equipo' : 'equipos'}
            </Text>
            {teams.map((team) => (
              <TeamCard
                key={team.id_equipo}
                team={team}
                onPress={(teamId) => router.push(`/league/team?teamId=${teamId}`)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal crear equipo */}
      {isAdmin && (
        <CreateTeamModal
          visible={showCreateModal}
          ligaId={ligaId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  createButton: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: Colors.bg.base,
    fontSize: 13,
    fontWeight: '700',
  },
  embeddedCreateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCreateButton: {
    marginTop: 16,
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  retryText: {
    color: Colors.brand.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  countLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
  },
});

// ---------------------------------------------------------------------------
// Skeleton styles
// ---------------------------------------------------------------------------

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface1,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    gap: 12,
    opacity: 0.5,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bg.surface2,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
  lineWide: {
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.bg.surface2,
    width: '65%',
  },
  lineShort: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.bg.surface2,
    width: '35%',
  },
});
