export const routes = {
  public: {
    landing: "/",

    // Compatibilidad antigua
    login: "/auth/login",
    register: "/auth/register",

    // Estructura nueva
    auth: {
      login: "/auth/login",
      register: "/auth/register",
      forgotPassword: "/auth/forgot-password",
      checkEmail: "/auth/check-email",
      resetPassword: "/auth/reset-password",
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
      live: "/matches/Live",
      finished: "/matches/Finished",
      programmed: "/matches/Programmed",

      allFinished: {
        alignment: "/matches/all_finished/alignment",
        live: "/matches/all_finished/live",
        statistics: "/matches/all_finished/statistics",
      },

      allProgrammed: {
        previousMeetings: "/matches/all_programmed/previousMeetings",
        programmed: "/matches/all_programmed/programmed",
        squad: "/matches/all_programmed/squad",
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

  matches: {
    live: "/matches/Live",
    finished: "/matches/Finished",
    programmed: "/matches/Programmed",
    allFinishedAlignment: "/matches/all_finished/alignment",
    allFinishedLive: "/matches/all_finished/live",
    allFinishedStatistics: "/matches/all_finished/statistics",
    allProgrammedPreviousMeetings: "/matches/all_programmed/previousMeetings",
    allProgrammedProgrammed: "/matches/all_programmed/programmed",
    allProgrammedSquad: "/matches/all_programmed/squad",
  },

  modal: "/modal",
  notFound: "/not-found",
} as const;
