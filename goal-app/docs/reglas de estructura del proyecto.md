# Tarea: Reorganizar la estructura de GoalApp para que sea entendible, escalable y preparada para API real

## Contexto del proyecto

Estoy trabajando en una app móvil con:

- React Native
- Expo
- Expo Router
- TailwindCSS + NativeWind

La app es **mobile-first**.  
No quiero una arquitectura pensada para web: quiero una estructura clara para móvil, compatible con Expo Router y preparada para crecer.

---

## Objetivo principal

Quiero que reorganices la estructura del proyecto para que:

1. sea más fácil de entender,
2. sea escalable,
3. sea mantenible a largo plazo,
4. no mezcle navegación con lógica de negocio,
5. no mezcle componentes globales con componentes específicos de módulo,
6. quede preparada para sustituir mocks por API real,
7. mantenga compatibilidad razonable con el proyecto actual,
8. no rompa rutas ni navegación existentes.

---

## Regla técnica clave

La app móvil **no debe hablar directamente con PostgreSQL**.

La arquitectura real debe pensarse así:

```txt
App móvil → API / Backend → PostgreSQL
````

Por tanto, la parte visual debe prepararse para:

* endpoints
* DTOs
* mappers
* cache
* invalidación
* server state
* autenticación
* persistencia local de sesión

No quiero una estructura pensada en tablas SQL ni en acceso directo a base de datos.

---

## Cómo quiero organizar el proyecto

Quiero una arquitectura híbrida con estas capas:

* `app/` → rutas reales y layouts de Expo Router
* `features/` → lógica y UI específica por dominio
* `shared/` → piezas reutilizables globales
* `state/` → estado global real
* `mocks/` → datos simulados
* `providers/` → providers globales

### Principio

`app/` debe ser una capa fina.
No debe concentrar toda la lógica de negocio.

---

## Estructura objetivo recomendada

Usa esta estructura como referencia principal:

```txt
src
├── app
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   │
│   ├── (public)
│   │   ├── index.tsx
│   │   └── auth
│   │       ├── _layout.tsx
│   │       ├── login.tsx
│   │       ├── register.tsx
│   │       └── forgot-password.tsx
│   │
│   ├── (private)
│   │   ├── onboarding
│   │   │   └── index.tsx
│   │   │
│   │   ├── league
│   │   │   ├── index.tsx
│   │   │   ├── information.tsx
│   │   │   ├── classification.tsx
│   │   │   ├── players.tsx
│   │   │   ├── teams.tsx
│   │   │   └── template.tsx
│   │   │
│   │   ├── matches
│   │   │   ├── all_finished
│   │   │   │   ├── index.tsx
│   │   │   │   ├── alignment.tsx
│   │   │   │   ├── live.tsx
│   │   │   │   └── statistics.tsx
│   │   │   └── all_programmed
│   │   │       ├── index.tsx
│   │   │       ├── previousMeetings.tsx
│   │   │       ├── programmed.tsx
│   │   │       ├── squad.tsx
│   │   │       ├── finished.tsx
│   │   │       └── live.tsx
│   │   │
│   │   ├── modal
│   │   │   └── index.tsx
│   │   │
│   │   └── (tabs)
│   │       ├── _layout.tsx
│   │       ├── index.tsx
│   │       ├── league.tsx
│   │       ├── matches.tsx
│   │       ├── profile.tsx
│   │       └── settings.tsx
│
├── features
│   ├── auth
│   ├── onboarding
│   ├── dashboard
│   ├── leagues
│   ├── matches
│   ├── teams
│   ├── statistics
│   ├── notifications
│   ├── users
│   └── profile
│
├── shared
│   ├── api
│   ├── components
│   │   ├── ui
│   │   ├── layout
│   │   └── feedback
│   ├── config
│   │   ├── env.ts
│   │   └── routes.ts
│   ├── constants
│   ├── hooks
│   ├── styles
│   ├── types
│   └── utils
│
├── state
│   ├── session
│   ├── activeLeague
│   └── ui
│
├── mocks
│   ├── auth
│   ├── leagues
│   ├── matches
│   ├── teams
│   ├── notifications
│   └── index.ts
│
├── providers
│   └── AppProviders.tsx
│
└── index.ts
```

---

## Reglas de arquitectura que debes respetar

### 1. `app/` = rutas reales

`app/` sigue siendo la fuente real de navegación porque uso Expo Router.

Aquí deben vivir:

* layouts
* grupos de rutas
* pantallas navegables
* modales
* tabs

Pero la lógica de negocio debe salir de ahí.

### 2. `features/` = módulos del producto

Cada módulo de negocio debe organizarse por dominio.

Ejemplos:

* onboarding
* dashboard
* matches
* leagues
* teams
* statistics
* notifications
* users
* profile

Dentro de cada feature puedes crear:

* `components`
* `hooks`
* `services`
* `store`
* `types`
* `utils`
* `api`
* `schemas`
* `mappers`

### 3. `shared/` = reutilizable global

Aquí solo quiero lo que de verdad se reutiliza entre múltiples módulos.

Ejemplos:

* `Button`
* `FormField`
* `PasswordField`
* `AppLogo`
* `Screen`
* `Loader`
* `Header`
* `AppHeader` solo si de verdad es reutilizable

### 4. `state/` = estado global real

Solo debe usarse para:

* sesión
* liga activa
* UI global
* preferencias persistentes

No quiero usar store global para listas remotas como ligas, partidos o notificaciones.

### 5. `mocks/` = datos simulados

Aquí deben vivir únicamente:

* arrays mock
* escenarios mock
* datos de testing

No quiero que `mocks/` mezcle servicios, hooks y lógica de UI.

---

## Qué quiero que detectes y corrijas en la estructura actual

### Problema 1: mezcla de navegación y lógica

Hay pantallas dentro de `app/` que hoy hacen demasiado.

Quiero que las pantallas de `app/` pasen a ser wrappers finos.

### Problema 2: componentes de negocio dentro de `components/ui`

Ahora mismo hay componentes que no son realmente UI genérica y deberían ir dentro de una feature.

Ejemplos típicos:

* `LeagueCard`
* `LeagueFilterTabs`
* `QuickActionCard`
* dashboards por rol
* componentes de matches

### Problema 3: `data/` es ambiguo

No quiero mantener una carpeta central llamada `data` si mezcla:

* mocks
* helpers
* servicios
* tipos

Quiero una separación más clara.

### Problema 4: estado global artesanal

Hay un store de liga activa que debe reorganizarse dentro de una capa `state/`.

### Problema 5: rutas con strings dispersos

Quiero centralizar rutas semánticas en `routes.ts`.

---

## Qué quiero que hagas con `routes.ts`

### Sí quiero `routes.ts`

Quiero centralizar rutas en:

```txt
src/shared/config/routes.ts
```

### Pero con esta regla

Expo Router sigue siendo la fuente real de rutas.
`routes.ts` es una capa semántica y mantenible por encima.

### Quiero que `routes.ts` sirva para:

* evitar strings hardcodeados
* centralizar nombres semánticos
* construir rutas con parámetros
* mejorar legibilidad
* facilitar refactors

### No quiero que `routes.ts`:

* duplique la navegación de Expo Router
* invente rutas desconectadas de `app/`
* se convierta en una segunda fuente de verdad

---

## Ejemplo esperado de `routes.ts`

```ts
export const routes = {
  public: {
    landing: '/',
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
  },

  private: {
    onboarding: '/onboarding',
    dashboard: '/(tabs)',
    league: '/(tabs)/league',
    matches: '/(tabs)/matches',
    profile: '/(tabs)/profile',
    settings: '/(tabs)/settings',
  },

  league: {
    index: '/league',
    information: '/league/information',
    classification: '/league/classification',
    players: '/league/players',
    teams: '/league/teams',
    template: '/league/template',
  },

  matches: {
    allFinished: '/matches/all_finished',
    allFinishedAlignment: '/matches/all_finished/alignment',
    allFinishedLive: '/matches/all_finished/live',
    allFinishedStatistics: '/matches/all_finished/statistics',
    allProgrammed: '/matches/all_programmed',
    allProgrammedPreviousMeetings: '/matches/all_programmed/previousMeetings',
    allProgrammedProgrammed: '/matches/all_programmed/programmed',
    allProgrammedSquad: '/matches/all_programmed/squad',
    allProgrammedFinished: '/matches/all_programmed/finished',
    allProgrammedLive: '/matches/all_programmed/live',
  },
} as const;
```

---

## Qué hacer con los componentes actuales

### Deben ir a `shared/components/ui`

Solo lo realmente global:

* Button
* FormField
* PasswordField
* FavoriteStar
* AppLogo
* AuthTabs
* AuthScreenLayout
* TeamBadge si de verdad es shared

### Deben ir a `shared/components/layout`

* Screen
* Header
* AppHeader solo si se reutiliza de verdad en varias zonas

### Deben ir a `shared/components/feedback`

* Loader
* EmptyState genérico
* Skeleton genérico

### Deben ir a `features/onboarding/components`

* LeagueCard
* LeagueFilterTabs
* QuickActionCard
* EmptyLeaguesState
* LeaguesSkeleton
* OnboardingScreen

### Deben ir a `features/dashboard/components`

* AdminDashboard
* CoachDashboard
* FieldDelegateDashboard
* PlayerDashboard

### Deben ir a `features/matches/components`

* MatchesLive
* MatchesProgrammed
* MatchesTabs

---

## Qué hacer con el estado

Quiero separar claramente:

### Estado global real

En `state/`

* sesión
* liga activa
* UI global

### Server state

No quiero meterlo en store global.

Quiero que prepares la arquitectura para usar:

* **TanStack Query** para datos remotos
* cache
* refetch
* invalidación
* estado de carga y error

---

## Qué hacer con API y PostgreSQL

Quiero que prepares el frontend para que después pueda hablar con una API real.

### Crear una capa clara en:

```txt
src/shared/api
```

### Ahí quiero:

* `client.ts`
* `http.ts`
* `interceptors.ts`
* `endpoints.ts`

### Además:

* DTOs separados de modelos de UI
* mappers cuando haga falta
* estructura preparada para autenticación y server state

---

## Restricciones importantes

1. No rehagas todo de golpe sin criterio.
2. No rompas Expo Router.
3. No cambies nombres públicos sin justificarlo.
4. No dupliques tipos ni componentes.
5. No dejes componentes de negocio dentro de `shared` por comodidad.
6. No dejes pantallas con demasiada lógica en `app/`.
7. No mezcles mocks con servicios reales.
8. No uses store global para datos remotos.
9. No hardcodees rutas en strings cuando ya exista `routes.ts`.
10. No hardcodees colores si ya existe `constants/colors.ts`.
11. No hardcodees estilos repetidos si ya existe `styles/index.ts`.

---

## Quiero que trabajes por fases

No quiero una migración caótica.

### Fase 1

Propón la nueva estructura final.

### Fase 2

Mapea archivo actual → nueva ubicación.

### Fase 3

Crea primero carpetas base:

* `features`
* `shared`
* `state`
* `mocks`

### Fase 4

Mueve:

* `constants` → `shared/constants`
* `styles` → `shared/styles`
* `types` → `shared/types`
* `utils` → `shared/utils` o feature utils
* `store` → `state`
* `data` → `mocks`

### Fase 5

Extrae componentes de negocio fuera de `components/ui`.

### Fase 6

Crea `shared/config/routes.ts` y actualiza navegación.

### Fase 7

Deja `app/` como capa fina.

### Fase 8

Prepara `shared/api` para backend real.

---

## Qué entrega quiero exactamente

No me des teoría vaga.
Quiero esta entrega exacta:

1. **Diagnóstico breve de la estructura actual**
2. **Nueva estructura final recomendada**
3. **Mapa de migración archivo por archivo**
4. **Qué mover a `features`, qué mover a `shared`, qué mover a `state`, qué mover a `mocks`**
5. **Código inicial de `src/shared/config/routes.ts`**
6. **Propuesta de reorganización mínima de `app/` para Expo Router**
7. **Riesgos de migración y cómo evitarlos**
8. **Orden exacto recomendado de ejecución**
9. **Código final de los archivos que haya que crear primero**
10. **No hagas todo en un único bloque imposible de revisar**

---

## Criterio de calidad

Tu solución debe quedar:

* entendible
* mobile-first
* compatible con Expo Router
* escalable
* preparada para backend real
* fácil de mantener
* modular
* sin romper la app actual

Quiero criterio de arquitectura real, no solo mover carpetas.
