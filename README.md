# Informe: Estructura del Proyecto Móvil de Fútbol (React Native + TypeScript)

## 1. Objetivo

Definir una estructura profesional, modular y escalable para un proyecto móvil de fútbol que permita:

- Separación clara de responsabilidades.
- Escalabilidad para nuevos features.
- Reutilización de componentes y lógica.
- Integración de estado global y llamadas a API.
- Adaptación a la navegación móvil (stacks, tabs).

---

## 2. Estructura de Carpetas

``` txt
my-football-app/  
├─ android/                    # Proyecto nativo Android  
├─ ios/                        # Proyecto nativo iOS  
├─ src/  
│  ├─ assets/                 # Imágenes, íconos, fuentes  
│  ├─ components/             # Componentes reutilizables (Botón, Card, Modal)  
│  │   ├─ Button.tsx  
│  │   ├─ Card.tsx  
│  │   └─ Modal.tsx  
│  ├─ features/               # Funcionalidades o dominios  
│  │   ├─ auth/  
│  │   │   ├─ screens/  
│  │   │   │   ├─ LoginScreen.tsx  
│  │   │   │   ├─ RegisterScreen.tsx  
│  │   │   │   └─ ForgotPasswordScreen.tsx  
│  │   │   ├─ hooks/  
│  │   │   │   └─ useAuth.ts  
│  │   │   └─ services/  
│  │   │       └─ authApi.ts  
│  │   ├─ users/  
│  │   │   ├─ screens/  
│  │   │   │   ├─ UsersListScreen.tsx  
│  │   │   │   ├─ UserDetailScreen.tsx  
│  │   │   │   └─ UserFormScreen.tsx   # Admin / gestión interna  
│  │   │   ├─ components/  
│  │   │   │   ├─ UserCard.tsx  
│  │   │   │   └─ UserAvatar.tsx  
│  │   │   ├─ hooks/  
│  │   │   │   └─ useUsers.ts  
│  │   │   └─ services/  
│  │   │       └─ usersApi.ts  
│  │   ├─ players/  
│  │   │   ├─ screens/  
│  │   │   │   ├─ PlayersScreen.tsx  
│  │   │   │   └─ PlayerDetailScreen.tsx  
│  │   │   ├─ components/  
│  │   │   │   ├─ PlayerCard.tsx  
│  │   │   │   └─ PlayerList.tsx  
│  │   │   ├─ hooks/  
│  │   │   │   └─ usePlayers.ts  
│  │   │   └─ services/  
│  │   │       └─ playersApi.ts  
│  │   └─ teams/               # Otro feature ejemplo  
│  │       ├─ screens/  
│  │       ├─ components/  
│  │       ├─ hooks/  
│  │       └─ services/  
│  ├─ hooks/                   # Hooks globales reutilizables  
│  │   ├─ useFetch.ts  
│  │   └─ useDebounce.ts  
│  ├─ navigation/              # React Navigation  
│  │   ├─ AppNavigator.tsx     # Stack/Tab principal  
│  │   └─ navigationHelpers.ts  
│  ├─ services/                # Servicios globales  
│  │   └─ apiClient.ts         # Cliente Axios global con token/interceptors  
│  ├─ store/                   # Estado global  
│  │   ├─ index.ts  
│  │   └─ rootReducer.ts  
│  ├─ styles/                  # Estilos globales  
│  │   ├─ variables.ts  
│  │   └─ globalStyles.ts  
│  ├─ utils/                   # Funciones auxiliares  
│  └─ App.tsx  
├─ package.json  
├─ tsconfig.json  
└─ metro.config.js             # Configuración de React Native
```

---

## 3. Descripción de cada carpeta

|Carpeta|Contenido / Función|
|---|---|
|`android/`, `ios/`|Proyectos nativos para cada plataforma.|
|`assets/`|Recursos gráficos, íconos y fuentes.|
|`components/`|Componentes reutilizables en toda la app.|
|`features/`|Cada feature o dominio (auth, users, players, teams).|
|`features/<feature>/screens`|Pantallas completas del feature.|
|`features/<feature>/components`|Componentes internos del feature.|
|`features/<feature>/hooks`|Hooks específicos del feature.|
|`features/<feature>/services`|Llamadas API o lógica de negocio del feature.|
|`hooks/`|Hooks globales reutilizables (useAuth, useDebounce).|
|`navigation/`|Navegación de la app con stacks, tabs y helpers.|
|`services/`|Cliente global Axios y funciones compartidas.|
|`store/`|Estado global (Redux, Zustand, etc.).|
|`styles/`|Estilos globales y variables.|
|`utils/`|Funciones auxiliares, helpers.|

---

## 4. Reglas y Buenas Prácticas

1. **Screens**: solo vistas completas del feature.
    
2. **Components**: UI reutilizable dentro del feature o global.
    
3. **Hooks**: lógica de negocio y estado encapsulado.
    
4. **Services**: separar entre feature-local y global.
    
5. **Estado**: Redux Toolkit o Zustand recomendado.
    
6. **Estilos**: `StyleSheet` o librerías como Tailwind RN / Styled Components.
    
7. **Navegación**: React Navigation, separar stacks por feature si es necesario.
    
8. **Tipado**: TypeScript obligatorio para consistencia y mantenimiento.