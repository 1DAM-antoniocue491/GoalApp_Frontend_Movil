import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { routes } from '@/src/shared/config/routes';
import { QuickActionCard } from '@/src/features/onboarding/components/QuickActionCard';
import { LeagueFilterTabs } from '@/src/features/leagues/components/LeagueFilterTabs';

import { SearchInput } from '@/src/shared/components/ui/SearchInput';
import { LeagueCard } from '@/src/features/leagues/components/LeagueCard';
import { EmptyLeaguesState } from '@/src/features/leagues/components/EmptyLeaguesState';
import { LeaguesSkeleton } from '@/src/features/leagues/components/LeaguesSkeleton';
import { ReactivateLeagueModal } from '@/src/features/leagues/components/ReactivateLeagueModal';
import { JoinLeagueModal } from '@/src/features/leagues/components/JoinLeagueModal';
import { CreateLeagueModal, type CreateLeagueForm } from '@/src/features/leagues/components/CreateLeagueModal';

import { LeagueItem, LeagueFilter } from '@/src/shared/types/league';
import {
  getAllLeagues,
  reactivateLeague,
} from '@/src/features/leagues/services/leagueService';
import { mockUsers } from '@/src/mocks/data';
import type { User } from '@/src/shared/types/user';
import { activeLeagueStore } from '@/src/state/activeLeague/activeLeagueStore';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';
import { ScrollEdgeButton } from '@/src/shared/components/navigation/ScrollEdgeButton';

// Import ProtectedRoute para proteger esta pantalla
import { ProtectedRoute } from '@/src/components/ProtectedRoute';

const COPY = {
  sectionTitle: 'Mis ligas',
  emptyFilterText: 'No se encontraron ligas con los filtros actuales',
  createLeagueTitle: 'Crear nueva liga',
  createLeagueDescription: 'Configura tu competición y empieza a gestionarla',
  createLeagueCta: 'Crear liga',
  joinLeagueTitle: 'Unirme a una liga',
  joinLeagueDescription: 'Únete con un código de invitación y accede al instante',
  joinLeagueCta: 'Unirme',
};

function useFadeUpStyle(animatedValue: Animated.Value) {
  return useMemo(
    () => ({
      opacity: animatedValue,
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 0],
          }),
        },
      ],
    }),
    [animatedValue]
  );
}

function OnboardingScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser] = useState<User>(mockUsers[0]);
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<LeagueFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [reactivateTarget, setReactivateTarget] = useState<LeagueItem | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  /**
   * Liga seleccionada para edición.
   * Cuando es distinto de null, se abre CreateLeagueModal en modo 'edit'.
   * La apertura se controla desde LeagueCard → onPressSettings (solo admins).
   */
  const [editTarget, setEditTarget] = useState<LeagueItem | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Ref del ScrollView para que ScrollEdgeButton pueda llamar a scrollTo
  const scrollRef = useRef<ScrollView>(null);
  // Posición vertical actual del scroll (actualizada en onScroll)
  const [scrollY, setScrollY] = useState(0);
  // Altura total del contenido renderizado (actualizada en onContentSizeChange)
  const [contentHeight, setContentHeight] = useState(0);
  // Altura visible del ScrollView (actualizada en onLayout)
  const [viewportHeight, setViewportHeight] = useState(0);

  const headerStyle = useFadeUpStyle(headerAnim);
  const actionsStyle = useFadeUpStyle(actionsAnim);
  const contentStyle = useFadeUpStyle(contentAnim);

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(actionsAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      setLeagues(getAllLeagues());
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [actionsAnim, contentAnim, headerAnim]);

  const firstName = useMemo(
    () => currentUser.name.split(' ')[0] ?? currentUser.name,
    [currentUser.name]
  );

  const filteredLeagues = useMemo(() => {
    let result = leagues;

    switch (selectedFilter) {
      case 'active':
        result = result.filter((league) => league.status === 'active');
        break;
      case 'finished':
        result = result.filter((league) => league.status === 'finished');
        break;
      case 'favorites':
        result = result.filter((league) => league.isFavorite);
        break;
      default:
        break;
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (normalizedSearch) {
      result = result.filter(
        (league) =>
          league.name.toLowerCase().includes(normalizedSearch) ||
          league.season.toLowerCase().includes(normalizedSearch)
      );
    }

    return result;
  }, [leagues, searchTerm, selectedFilter]);

  // Toggle favorite – updates immediately in state
  const handleToggleFavorite = useCallback((leagueId: string) => {
    setLeagues((prev) =>
      prev.map((league) =>
        league.id === leagueId
          ? { ...league, isFavorite: !league.isFavorite }
          : league
      )
    );
  }, []);

  const handleEnterLeague = useCallback(
    (league: LeagueItem) => {
      activeLeagueStore.setSession({
        leagueId: league.id,
        leagueName: league.name,
        role: league.role,
        userName: '',
        teamName: undefined
      });
      router.push(routes.private.dashboard);
    },
    [router]
  );

  // Reactivate flow
  const handleReactivatePress = useCallback((league: LeagueItem) => {
    setReactivateTarget(league);
  }, []);

  const handleConfirmReactivate = useCallback(() => {
    if (!reactivateTarget) return;
    // reactivateLeague preserva todos los datos de la liga —
    // solo cambia status a 'active' y desactiva canReactivate.
    // Sustituir aquí por llamada al backend cuando esté disponible.
    setLeagues((prev) => reactivateLeague(reactivateTarget.id, prev));
    setReactivateTarget(null);
  }, [reactivateTarget]);

  const handleCancelReactivate = useCallback(() => {
    setReactivateTarget(null);
  }, []);

  // Join league flow
  const handleJoinConfirm = useCallback((code: string) => {
    setShowJoinModal(false);
    Alert.alert('¡Solicitud enviada!', `Código introducido: ${code}. Pronto recibirás acceso a la liga.`);
  }, []);

  // Create league flow
  const handleCreateConfirm = useCallback((data: any) => {
    setShowCreateModal(false);
    Alert.alert('¡Liga creada!', `La liga "${data.name}" ha sido creada correctamente.`);
  }, []);

  /**
   * Abre el modal de edición con la liga seleccionada.
   * Solo llega aquí si el rol es admin (la card ya lo filtra visualmente).
   */
  const handlePressSettings = useCallback((league: LeagueItem) => {
    setEditTarget(league);
  }, []);

  /**
   * Valores iniciales para el modal de edición.
   * Mapeamos los campos disponibles en LeagueItem → CreateLeagueForm.
   * Los campos sin equivalente (category, steppers) quedan en sus defaults.
   */
  const editInitialValues = useMemo<Partial<CreateLeagueForm>>(() => {
    if (!editTarget) return {};
    // La temporada llega como "2025/26" → extraemos el año de inicio
    const seasonStartYear = parseInt(editTarget.season.split('/')[0], 10) || new Date().getFullYear();
    return {
      name: editTarget.name,
      seasonStartYear,
      logoUrl: editTarget.crestUrl ?? null,
    };
  }, [editTarget]);

  /**
   * Confirma la edición: actualiza el nombre, temporada y logo en el listado local.
   * En producción, aquí se llamará al servicio real de actualización.
   */
  const handleEditConfirm = useCallback((data: CreateLeagueForm) => {
    if (!editTarget) return;
    setLeagues((prev) =>
      prev.map((l) =>
        l.id === editTarget.id
          ? {
            ...l,
            name: data.name,
            season: `${data.seasonStartYear}/${String(data.seasonStartYear + 1).slice(2)}`,
            // Priorizamos URI local (recién seleccionada), luego URL remota
            crestUrl: data.logoUri ?? data.logoUrl ?? l.crestUrl,
          }
          : l
      )
    );
    setEditTarget(null);
  }, [editTarget]);

  const handleClearSearch = useCallback(() => setSearchTerm(''), []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + theme.spacing.lg, theme.spacing.xl),
        }}
        // scrollEventThrottle=16 garantiza actualizaciones ~60fps sin saturar el bridge
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        // Capturamos la altura total del contenido para saber cuándo hay scroll real
        onContentSizeChange={(_, h) => setContentHeight(h)}
        // Capturamos la altura del área visible para calcular el surplus scrollable
        onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
      >
        <View className="px-5">
          {/*
            Encabezado del onboarding.
            No incluye notificaciones porque en este punto el usuario aún no
            está dentro de ninguna liga activa — las notificaciones son
            contextuales a una liga concreta y pertenecen al dashboard.
            Sí incluye acceso al perfil, que es global y siempre disponible.
          */}
          <Animated.View
            style={[
              headerStyle,
              {
                paddingTop: insets.top + theme.spacing.md,
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.xxl,
              },
            ]}
          >
            {/* Saludo + contexto */}
            <View style={{ flex: 1 }}>
              <Text
                className="font-bold"
                style={{
                  color: Colors.text.primary,
                  fontSize: theme.fontSize.xxl,
                  lineHeight: 36,
                }}
              >
                Hola, {firstName}
              </Text>

              <View className="mt-2 flex-row items-center">
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={Colors.brand.primary}
                  style={{ marginRight: theme.spacing.sm - 2 }}
                />
                <Text
                  style={{
                    color: Colors.text.secondary,
                    fontSize: theme.fontSize.md,
                    lineHeight: 22,
                    fontWeight: '500',
                  }}
                >
                  Tus ligas
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View style={[actionsStyle, { marginBottom: theme.spacing.xxl }]}>
            <View className="gap-4">
              <QuickActionCard
                iconName="add"
                iconColor={Colors.brand.primary}
                title={COPY.createLeagueTitle}
                description={COPY.createLeagueDescription}
                ctaText={COPY.createLeagueCta}
                onPress={() => setShowCreateModal(true)}
              />

              <QuickActionCard
                iconName="link"
                iconColor={Colors.brand.secondary}
                title={COPY.joinLeagueTitle}
                description={COPY.joinLeagueDescription}
                ctaText={COPY.joinLeagueCta}
                onPress={() => setShowJoinModal(true)}
              />
            </View>
          </Animated.View>

          {/* Leagues Section */}
          <Animated.View style={contentStyle}>
            {isLoading ? (
              <>
                <Text
                  className="font-semibold mb-4"
                  style={{
                    color: Colors.text.primary,
                    fontSize: theme.fontSize.lg,
                    lineHeight: 24,
                  }}
                >
                  {COPY.sectionTitle}
                </Text>
                <LeaguesSkeleton count={3} />
              </>
            ) : leagues.length === 0 ? (
              <EmptyLeaguesState />
            ) : (
              <>
                <Text
                  className="font-semibold mb-5"
                  style={{
                    color: Colors.text.primary,
                    fontSize: theme.fontSize.lg,
                    lineHeight: 24,
                  }}
                >
                  {COPY.sectionTitle}
                </Text>

                {/* Search Bar */}
                <View className="mb-5">
                  <SearchInput
                    value={searchTerm}
                    placeholder="Buscar liga..."
                    onChangeText={setSearchTerm}
                    onClear={handleClearSearch}
                  />
                </View>

                {/* Filter Tabs */}
                <LeagueFilterTabs
                  selectedFilter={selectedFilter}
                  onSelectFilter={setSelectedFilter}
                />

                {/* League List or Empty Filter State */}
                {filteredLeagues.length > 0 ? (
                  <View className="gap-5 mt-5">
                    {/* onPressSettings solo es visible para admins — LeagueCard ya lo filtra por rol */}
                    {filteredLeagues.map((league) => (
                      <LeagueCard
                        key={league.id}
                        league={league}
                        onToggleFavorite={() => handleToggleFavorite(league.id)}
                        onPress={() =>
                          // Liga finalizada + admin → abre modal de reactivación.
                          // Cualquier otro caso → entra en la liga.
                          league.status === 'finished' && league.canReactivate
                            ? handleReactivatePress(league)
                            : handleEnterLeague(league)
                        }
                        onPressSettings={handlePressSettings}
                      />
                    ))}
                  </View>
                ) : (
                  <View className="py-10 items-center">
                    <View
                      className="h-16 w-16 rounded-full items-center justify-center"
                      style={{ backgroundColor: Colors.bg.surface1 }}
                    >
                      <Ionicons name="filter-outline" size={28} color={Colors.text.disabled} />
                    </View>
                    <Text
                      style={{
                        color: Colors.text.secondary,
                        fontSize: theme.fontSize.sm,
                        lineHeight: 20,
                        textAlign: 'center',
                        marginTop: theme.spacing.md + 2,
                      }}
                    >
                      {COPY.emptyFilterText}
                    </Text>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </View>
      </ScrollView >

      {/*
        ScrollEdgeButton flota fuera del ScrollView para que su position:absolute
        se resuelva respecto al View padre (flex:1) y no quede enterrado dentro
        del contenido scrollable.
      */}
      <ScrollEdgeButton
        scrollRef={scrollRef}
        scrollY={scrollY}
        contentHeight={contentHeight}
        viewportHeight={viewportHeight}
      />

      {/* Modals */}
      < ReactivateLeagueModal
        visible={reactivateTarget !== null
        }
        leagueName={reactivateTarget?.name ?? ''}
        onConfirm={handleConfirmReactivate}
        onCancel={handleCancelReactivate}
      />

      <JoinLeagueModal
        visible={showJoinModal}
        onConfirm={handleJoinConfirm}
        onCancel={() => setShowJoinModal(false)}
      />

      {/* Modal crear liga — modo 'create' por defecto */}
      <CreateLeagueModal
        visible={showCreateModal}
        onConfirm={handleCreateConfirm}
        onCancel={() => setShowCreateModal(false)}
      />

      {/**
       * Modal editar liga — reutiliza CreateLeagueModal en modo 'edit'.
       * Se abre desde LeagueCard → onPressSettings (solo admins).
       * initialValues precarga nombre, temporada y logo de la liga seleccionada.
       */}
      <CreateLeagueModal
        mode="edit"
        visible={editTarget !== null}
        initialValues={editInitialValues}
        onConfirm={handleEditConfirm}
        onCancel={() => setEditTarget(null)}
      />
    </View >
  );
}

// Export default con ProtectedRoute wrapper
export default function OnboardingScreen() {
  return (
    <ProtectedRoute>
      <OnboardingScreenContent />
    </ProtectedRoute>
  );
}
