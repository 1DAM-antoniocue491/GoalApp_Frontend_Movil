/**
 * TeamsScreen.tsx
 *
 * Lista de equipos de la liga activa.
 * - Click → detalle del equipo
 * - Long press (admin) → action sheet: Editar / Eliminar
 * - Botón crear (admin) → CreateTeamModal
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useTeamsByLeague, useDeleteTeam } from '../hooks/useTeams';
import { TeamCard } from './TeamCard';
import { CreateTeamModal } from './modals/CreateTeamModal';
import { EditTeamModal } from './modals/EditTeamModal';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { getTeamName } from '../types/teams.types';
import type { EquipoResponse } from '../types/teams.types';

// ---------------------------------------------------------------------------
// Skeleton loader
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
  embedded?: boolean;
}

export function TeamsScreen({ embedded = false }: TeamsScreenProps) {
  const { session } = useActiveLeague();
  const router = useRouter();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionTeam, setActionTeam] = useState<EquipoResponse | null>(null);
  const [editTeam, setEditTeam] = useState<EquipoResponse | null>(null);

  const ligaId = session?.leagueId ? Number(session.leagueId) : 0;
  const isAdmin = session?.role === 'admin';

  const { data: teams, isLoading, isError, refetch } = useTeamsByLeague(ligaId);
  const { mutate: deleteTeamMutate, isLoading: isDeleting } = useDeleteTeam();

  const handleLongPress = useCallback((team: EquipoResponse) => {
    if (!isAdmin) return;
    setActionTeam(team);
  }, [isAdmin]);

  const handleDeleteConfirm = useCallback(async (team: EquipoResponse) => {
    setActionTeam(null);
    Alert.alert(
      'Eliminar equipo',
      `¿Seguro que quieres eliminar "${getTeamName(team)}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteTeamMutate(team.id_equipo);
            if (ok) {
              refetch();
            } else {
              Alert.alert('Error', 'No se pudo eliminar el equipo. Inténtalo de nuevo.');
            }
          },
        },
      ],
    );
  }, [deleteTeamMutate, refetch]);

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
      {/* Header */}
      {!embedded && (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Equipos</Text>
            <Text style={styles.headerSubtitle}>{session.leagueName}</Text>
          </View>
          {/* Nuevo equipo gestionado desde el menú ··· del calendario */}
        </View>
      )}

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
        {isLoading && [1, 2, 3, 4].map((i) => <TeamCardSkeleton key={i} />)}

        {!isLoading && isError && (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No se pudieron cargar los equipos</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && teams.length === 0 && (
          <View style={styles.centered}>
            <Ionicons name="shield-outline" size={48} color={Colors.text.disabled} />
            <Text style={styles.emptyTitle}>Sin equipos aún</Text>
            <Text style={styles.emptySubtitle}>
              {isAdmin ? 'Crea el primer equipo de la liga.' : 'Aún no hay equipos en esta liga.'}
            </Text>
            {isAdmin && (
              <Text style={styles.emptyHint}>Usa el menú ··· del calendario para crear equipos</Text>
            )}
          </View>
        )}

        {!isLoading && !isError && teams.length > 0 && (
          <>
            <Text style={styles.countLabel}>
              {teams.length} {teams.length === 1 ? 'equipo' : 'equipos'}
              {isAdmin && (
                <Text style={styles.hintText}> · Mantén pulsado para editar</Text>
              )}
            </Text>
            {teams.map((team) => (
              <TeamCard
                key={team.id_equipo}
                team={team}
                onPress={(id) => router.push(`/league/team?teamId=${id}` as any)}
                onLongPress={isAdmin ? handleLongPress : undefined}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Action Sheet — long press */}
      <Modal
        visible={!!actionTeam}
        transparent
        animationType="slide"
        onRequestClose={() => setActionTeam(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setActionTeam(null)}>
          <Pressable>
            <View style={styles.sheet}>
              {/* Handle */}
              <View style={styles.sheetHandle} />

              {/* Nombre del equipo */}
              {actionTeam && (
                <Text style={styles.sheetTeamName} numberOfLines={1}>
                  {getTeamName(actionTeam)}
                </Text>
              )}

              {/* Editar */}
              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => {
                  const t = actionTeam;
                  setActionTeam(null);
                  setEditTeam(t);
                }}
              >
                <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
                <Text style={styles.sheetActionText}>Editar equipo</Text>
              </TouchableOpacity>

              <View style={styles.sheetDivider} />

              {/* Eliminar */}
              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => actionTeam && handleDeleteConfirm(actionTeam)}
                disabled={isDeleting}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.semantic.error} />
                <Text style={[styles.sheetActionText, { color: Colors.semantic.error }]}>
                  Eliminar equipo
                </Text>
              </TouchableOpacity>

              <View style={styles.sheetDivider} />

              {/* Cancelar */}
              <TouchableOpacity
                style={[styles.sheetAction, { justifyContent: 'center' }]}
                onPress={() => setActionTeam(null)}
              >
                <Text style={[styles.sheetActionText, { color: Colors.text.secondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal crear equipo */}
      {isAdmin && (
        <CreateTeamModal
          visible={showCreateModal}
          ligaId={ligaId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); refetch(); }}
        />
      )}

      {/* Modal editar equipo */}
      {isAdmin && editTeam && (
        <EditTeamModal
          visible={!!editTeam}
          team={editTeam}
          onClose={() => setEditTeam(null)}
          onEdited={() => { setEditTeam(null); refetch(); }}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: { color: Colors.text.primary, fontSize: 22, fontWeight: '700', letterSpacing: 0.3 },
  headerSubtitle: { color: Colors.text.secondary, fontSize: 13, marginTop: 2 },
  createButton: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: { color: Colors.bg.base, fontSize: 13, fontWeight: '700' },
  embeddedCreateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32, flexGrow: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: { color: Colors.text.primary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { color: Colors.text.secondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  retryText: { color: Colors.brand.primary, fontSize: 14, fontWeight: '600' },
  countLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
  },
  hintText: { color: Colors.text.disabled, fontSize: 11 },
  emptyHint: { color: Colors.text.disabled, fontSize: 12, textAlign: 'center', marginTop: 8 },
  // Action sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg.surface1,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: 32,
    paddingTop: theme.spacing.md,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bg.surface2,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  sheetTeamName: {
    color: Colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: 24,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sheetActionText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.bg.surface2,
    marginHorizontal: 24,
  },
});

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
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bg.surface2 },
  lines: { flex: 1, gap: 8 },
  lineWide: { height: 12, borderRadius: 6, backgroundColor: Colors.bg.surface2, width: '65%' },
  lineShort: { height: 10, borderRadius: 5, backgroundColor: Colors.bg.surface2, width: '35%' },
});
