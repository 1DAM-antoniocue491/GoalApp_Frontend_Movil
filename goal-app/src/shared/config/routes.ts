export const routes = {
  public: {
    landing: "/",

    // Estructura nueva
    auth: {
      login: "/auth/components/login",
      register: "/auth/components/register",
      forgotPassword: "/auth/components/forgot-password",
      checkEmail: "/auth/components/check-email",
      resetPassword: "/auth/components/reset-password",
    },
  },

  private: {
    onboarding: "/onboarding",

    // Compatibilidad antigua
    dashboard: "/(tabs)",
    calendar: "/(tabs)/calendar",
    matches: "/(tabs)/matches",
    profile: "/(tabs)/profile",
    settings: "/(tabs)/settings",
    add: "/(tabs)/add",

    // Estructura nueva
    tabs: {
      home: "/(tabs)",
      calendar: "/(tabs)/calendar",
      statistics: "/(tabs)/statistics",
      profile: "/(tabs)/profile",
      add: "/(tabs)/add",
    },

    league: {
      classification: "/league/classification",
      match: "/league/match",
      teams: "/league/teams",
      users: "/league/users",

      team: {
        information: "/league/teams/information",
        squad: "/league/teams/squad",
        detail: "/league/teams/team",
      },
    },

    matchRoutes: {
      index: "/matches",

      live: {
        index: "/matches/live",
        detail: (matchId: string) => `/matches/live/${matchId}`,
        squad: (matchId: string) => `/matches/live/${matchId}/squad`,
      },

      programmed: {
        index: "/matches/programmed",
        detail: (matchId: string) => `/matches/programmed/${matchId}`,
        squad: (matchId: string) => `/matches/programmed/${matchId}/squad`,
        previousMeetings: (matchId: string) => `/matches/programmed/${matchId}/previous-meetings`,
      },

      finished: {
        index: "/matches/finished",
        detail: (matchId: string) => `/matches/finished/${matchId}`,
        alignment: (matchId: string) => `/matches/finished/${matchId}/alignment`,
        statistics: (matchId: string) => `/matches/finished/${matchId}/statistics`,
      },
    },

    profileRoutes: {
      edit: "/profile/editProfile",
    },

    notifications: "/notifications",
    modal: "/modal",
  },

  league: {
    index: "/league",
    information: "/league/teams/information",
    classification: "/league/classification",
    players: "/league/teams/squad",
    teams: "/league/teams",
    template: "/league/teams/team",
  },

  // Alias de conveniencia — apuntan a las mismas rutas que private.matchRoutes
  matches: {
    index: "/matches",
    live: "/matches/live",
    programmed: "/matches/programmed",
    finished: "/matches/finished",
  },

  modal: "/modal",
  notFound: "/not-found",
} as const;
