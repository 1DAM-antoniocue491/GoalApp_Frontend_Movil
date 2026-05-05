/**
 * TeamDetailScreen.tsx
 *
 * Detalle premium de un equipo.
 * Carga en paralelo: detalle, plantilla, próximos partidos, últimos partidos y goleadores.
 * Solo el detalle base es crítico.
 *
 * Header: volver | escudo + nombre | menú ...
 * Tabs: Información | Plantilla
 *
 * El menú ... (admin) abre action sheet con Editar / Eliminar.
 * Eliminar → confirmación → DELETE /equipos/{id} → router.back()
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTeamDetailFull, useDeleteTeam } from '../hooks/useTeams';
import { TeamInformationTab } from './TeamInformationTab';
import { TeamSquadTab } from './TeamSquadTab';
import { EditTeamModal } from './modals/EditTeamModal';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { getTeamName, getTeamColor } from '../types/teams.types';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';

type Tab = 'info' | 'squad';

function getTeamShield(detail: any): string | null {
  return detail?.escudo ?? detail?.logo_url ?? detail?.logoUrl ?? null;
}

export function TeamDetailScreen() {
  const router = useRouter();
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { session } = useActiveLeague();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const isAdmin = session?.role === 'admin';
  const id = teamId ? Number(teamId) : 0;

  const {
    detail,
    squad,
    upcomingMatches,
    lastMatches,
    topScorers,
    isLoading,
    isError,
    error,
    refetch,
  } = useTeamDetailFull(id);

  const { mutate: deleteTeamMutate, isLoading: isDeleting } = useDeleteTeam();

  const teamColor = getTeamColor(detail);
  const teamName = getTeamName(detail);
  const shieldUri = getTeamShield(detail);
  const initials = teamName.charAt(0).toUpperCase();
  const squadSource = squad.length > 0 ? squad : (detail?.jugadores ?? []);

  // Sin teamId en params
  if (!teamId || id <= 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={42} color={Colors.text.disabled} />
          <Text style={styles.errorText}>Equipo no especificado</Text>
        </View>
      </SafeAreaView>
    );
  }

  function handleDelete() {
    setShowMenu(false);
    Alert.alert(
      'Eliminar equipo',
      `¿Seguro que quieres eliminar "${teamName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteTeamMutate(id);
            if (ok) {
              router.back();
            } else {
              Alert.alert('Error', 'No se pudo eliminar el equipo.');
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header premium ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
          activeOpacity={0.82}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {isLoading ? (
            <>
              <View style={styles.headerShieldSkeleton} />
              <View style={styles.headerTextSkeleton} />
            </>
          ) : (
            <>
              <View style={[styles.headerShield, { borderColor: teamColor }]}>
                {shieldUri ? (
                  <Image source={{ uri: shieldUri }} style={styles.headerShieldImage} resizeMode="cover" />
                ) : (
                  <Text style={[styles.headerInitial, { color: teamColor }]}>{initials}</Text>
                )}
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerName} numberOfLines={1}>{teamName}</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {session?.leagueName ?? 'Detalle del equipo'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Menú ... — solo admin */}
        {isAdmin && !isLoading ? (
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.82}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerIconButtonPlaceholder} />
        )}
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          {(['info', 'squad'] as Tab[]).map((tab) => {
            const label = tab === 'info' ? 'Información' : 'Plantilla';
            const icon: keyof typeof Ionicons.glyphMap = tab === 'info' ? 'analytics-outline' : 'people-outline';
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.78}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={active ? Colors.bg.base : Colors.text.secondary}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      

      {/* ── Contenido ── */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brand.primary} />
          <Text style={styles.loadingText}>Cargando equipo...</Text>
        </View>
      )}

      {isError && !isLoading && (
        <View style={styles.centered}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="cloud-offline-outline" size={38} color={Colors.text.secondary} />
          </View>
          <Text style={styles.errorText}>{error ?? 'No se pudo cargar el equipo'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.82}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && detail && (
        <>
          {activeTab === 'info' && (
            <TeamInformationTab
              detail={detail}
              upcomingMatches={upcomingMatches}
              lastMatches={lastMatches}
              topScorers={topScorers}
            />
          )}
          {activeTab === 'squad' && (
            <TeamSquadTab
              // Prioridad: endpoint plantilla > jugadores del detalle.
              jugadores={squadSource}
            />
          )}
        </>
      )}

      {/* ── Menú ... (action sheet) ── */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowMenu(false)}>
          <Pressable>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <Text style={styles.sheetTitle} numberOfLines={1}>{teamName}</Text>
              <Text style={styles.sheetSubtitle}>Acciones del equipo</Text>

              <TouchableOpacity
                style={styles.sheetAction}
                onPress={() => { setShowMenu(false); setShowEditModal(true); }}
                activeOpacity={0.82}
              >
                <View style={styles.sheetActionIcon}>
                  <Ionicons name="create-outline" size={20} color={Colors.text.primary} />
                </View>
                <Text style={styles.sheetActionText}>Editar equipo</Text>
              </TouchableOpacity>

              <View style={styles.sheetDivider} />

              <TouchableOpacity
                style={styles.sheetAction}
                onPress={handleDelete}
                disabled={isDeleting}
                activeOpacity={0.82}
              >
                <View style={[styles.sheetActionIcon, styles.sheetDangerIcon]}>
                  <Ionicons name="trash-outline" size={20} color={Colors.semantic.error} />
                </View>
                <Text style={[styles.sheetActionText, styles.sheetDangerText]}>
                  {isDeleting ? 'Eliminando...' : 'Eliminar equipo'}
                </Text>
              </TouchableOpacity>

              <View style={styles.sheetDivider} />

              <TouchableOpacity
                style={[styles.sheetAction, styles.sheetCancelAction]}
                onPress={() => setShowMenu(false)}
                activeOpacity={0.82}
              >
                <Text style={styles.sheetCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal editar */}
      {detail && showEditModal && (
        <EditTeamModal
          visible={showEditModal}
          team={{
            id_equipo: detail.id_equipo,
            nombre: detail.nombre,
            escudo: detail.escudo ?? (detail as any).logo_url ?? null,
            colores: detail.colores ?? (detail as any).color_primario ?? null,
            id_liga: (detail as any).id_liga,
            id_entrenador: (detail as any).id_entrenador,
            id_delegado: (detail as any).id_delegado,
            ciudad: (detail as any).ciudad,
            estadio: detail.estadio,
          } as any}
          onClose={() => setShowEditModal(false)}
          onEdited={() => {
            setShowEditModal(false);
            refetch();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface1,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.surface1,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
  },
  headerIconButtonPlaceholder: { width: 42, height: 42 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: theme.spacing.md,
  },
  headerShield: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.surface2,
  },
  headerShieldImage: { width: '100%', height: '100%' },
  headerInitial: { fontSize: theme.fontSize.lg, fontWeight: '900' },
  headerTextGroup: { flex: 1, minWidth: 0, gap: 2 },
  headerName: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  headerShieldSkeleton: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.full,
    backgroundColor: Colors.bg.surface2,
    opacity: 0.6,
  },
  headerTextSkeleton: {
    flex: 1,
    height: 18,
    borderRadius: theme.borderRadius.md,
    backgroundColor: Colors.bg.surface2,
    opacity: 0.6,
  },
  tabBarWrapper: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: Colors.bg.surface1,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  tabItemActive: { backgroundColor: Colors.brand.primary },
  tabLabel: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '800',
  },
  tabLabelActive: { color: Colors.bg.base },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyIconBox: {
    width: 74,
    height: 74,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.surface1,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
  },
  loadingText: { color: Colors.text.secondary, fontSize: theme.fontSize.sm, fontWeight: '600' },
  errorText: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.bg.surface1,
  },
  retryText: { color: Colors.brand.primary, fontSize: theme.fontSize.sm, fontWeight: '800' },
  overlay: {
    flex: 1,
    backgroundColor: Colors.bg.base + 'CC',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    backgroundColor: Colors.bg.surface1,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: Colors.bg.surface2,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  sheetTitle: {
    color: Colors.text.primary,
    fontSize: theme.fontSize.md,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  sheetSubtitle: {
    color: Colors.text.secondary,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  sheetActionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.surface2,
  },
  sheetDangerIcon: {
    borderWidth: 1,
    borderColor: Colors.semantic.error + '55',
  },
  sheetActionText: { color: Colors.text.primary, fontSize: theme.fontSize.md, fontWeight: '700' },
  sheetDangerText: { color: Colors.semantic.error },
  sheetCancelAction: { justifyContent: 'center' },
  sheetCancelText: { color: Colors.text.secondary, fontSize: theme.fontSize.md, fontWeight: '800' },
  sheetDivider: { height: 1, backgroundColor: Colors.bg.surface2, marginHorizontal: theme.spacing.xl },
});
