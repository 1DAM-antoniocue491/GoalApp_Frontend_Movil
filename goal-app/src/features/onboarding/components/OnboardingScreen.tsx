import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { routes } from '@/src/shared/config/routes';
import { AppHeader } from '@/src/shared/components/layout/AppHeader';
import { QuickActionCard } from '@/src/features/onboarding/components/QuickActionCard';
import { LeagueFilterTabs } from '@/src/features/leagues/components/LeagueFilterTabs';
import { LeagueCard } from '@/src/features/leagues/components/LeagueCard';
import { EmptyLeaguesState } from '@/src/features/leagues/components/EmptyLeaguesState';
import { LeaguesSkeleton } from '@/src/features/leagues/components/LeaguesSkeleton';
import { ReactivateLeagueModal } from '@/src/features/leagues/components/ReactivateLeagueModal';
import { JoinLeagueModal } from '@/src/features/leagues/components/JoinLeagueModal';
import { CreateLeagueModal } from '@/src/features/leagues/components/CreateLeagueModal';

import { LeagueItem, LeagueFilter } from '@/src/shared/types/league';
import {
  getAllLeagues
} from '@/src/features/leagues/services/leagueService';
import { mockUsers } from '@/src/mocks/data';
import type { User } from '@/src/shared/types/user';
import { activeLeagueStore } from '@/src/state/activeLeague/activeLeagueStore';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

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

export default function OnboardingScreen() {
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

  const headerAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

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

    setLeagues((prev) =>
      prev.map((league) =>
        league.id === reactivateTarget.id
          ? { ...league, status: 'active', canReactivate: false }
          : league
      )
    );

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

  const handleClearSearch = useCallback(() => setSearchTerm(''), []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + theme.spacing.lg, theme.spacing.xl),
        }}
      >
        <View className="px-5">
          <AppHeader onNotificationPress={() => console.log('Notifications')} />

          {/* Greeting */}
          <Animated.View style={[{ marginTop: theme.spacing.md }, headerStyle]}>
            <View style={{ marginBottom: theme.spacing.xxl }}>
              <Text
                className="font-bold"
                style={{
                  color: Colors.text.primary,
                  fontSize: theme.fontSize.xxxl,
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
                  Primer acceso
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View style={[actionsStyle, { marginBottom: theme.spacing.xxl + 4 }]}>
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
                <View
                  className="flex-row items-center rounded-[18px] px-4 h-14 mb-5 border"
                  style={{
                    backgroundColor: Colors.bg.surface1,
                    borderColor: Colors.bg.surface2,
                  }}
                >
                  <Ionicons name="search" size={20} color={Colors.text.disabled} />
                  <TextInput
                    className="flex-1 text-white text-base ml-3"
                    placeholder="Buscar liga..."
                    placeholderTextColor={Colors.text.disabled}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                  {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={handleClearSearch}>
                      <Ionicons name="close-circle" size={20} color={Colors.text.disabled} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Tabs */}
                <LeagueFilterTabs
                  selectedFilter={selectedFilter}
                  onSelectFilter={setSelectedFilter}
                />

                {/* League List or Empty Filter State */}
                {filteredLeagues.length > 0 ? (
                  <View className="gap-5 mt-5">
                    {filteredLeagues.map((league) => (
                      <LeagueCard
                        key={league.id}
                        league={league}
                        isFavorite={league.isFavorite ?? false}
                        onToggleFavorite={() => handleToggleFavorite(league.id)}
                        onPress={() => handleEnterLeague(league)}
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

      <CreateLeagueModal
        visible={showCreateModal}
        onConfirm={handleCreateConfirm}
        onCancel={() => setShowCreateModal(false)}
      />
    </View >
  );
}