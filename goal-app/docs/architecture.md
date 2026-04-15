# GoalApp — Architecture

Este documento define la arquitectura objetivo del proyecto GoalApp, las responsabilidades de cada capa y las reglas que deben seguirse para mantener el código escalable, consistente y preparado para evolucionar desde mocks a API real.

---

## 1. Objetivo de la arquitectura

La arquitectura de GoalApp debe permitir:

- crecer por módulos sin degradar la estructura
- separar claramente rutas, UI, lógica, estado y datos
- evitar duplicidad de componentes, tipos y lógica
- facilitar el paso de mocks a backend real
- mantener consistencia entre web y móvil a nivel funcional
- adaptar correctamente la UX a móvil sin copiar escritorio tal cual

---

## 2. Principios de arquitectura

### 2.1 Separación de responsabilidades
Cada carpeta y cada archivo deben tener una responsabilidad clara.

### 2.2 Organización por dominio
La app debe crecer por **features** reales del producto, no solo por tipo de archivo.

### 2.3 Reutilización real
Solo debe moverse a `shared/` lo que se reutiliza de verdad entre múltiples módulos.

### 2.4 Estado global mínimo
El estado global debe ser pequeño y estar muy controlado.

### 2.5 Server state separado del app state
Los datos remotos no deben gestionarse como estado global salvo casos excepcionales.

### 2.6 Móvil como producto adaptado
La lógica funcional de web se conserva, pero la experiencia móvil puede reorganizar:
- navegación
- jerarquía
- densidad
- accesos
- patrones de interacción

### 2.7 Preparación para backend real
La app móvil no debe estructurarse pensando en PostgreSQL directamente, sino en contratos de API.

Arquitectura correcta:

```txt
App móvil → API / Backend → PostgreSQL
````

---

## 3. Estructura objetivo del proyecto

La estructura objetivo recomendada es esta:

```txt
src
├── app
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── (public)
│   │   ├── index.tsx
│   │   └── auth
│   │       ├── _layout.tsx
│   │       ├── login.tsx
│   │       ├── register.tsx
│   │       └── forgot-password.tsx
│   ├── (private)
│   │   ├── onboarding
│   │   │   └── index.tsx
│   │   ├── matches
│   │   │   ├── all_finished
│   │   │   │   └── index.tsx
│   │   │   └── all_programmed
│   │   │       └── index.tsx
│   │   ├── modals
│   │   │   └── index.tsx
│   │   └── (tabs)
│   │       ├── _layout.tsx
│   │       ├── index.tsx
│   │       ├── calendar.tsx
│   │       ├── matches.tsx
│   │       └── profile.tsx
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
│   │   ├── feedback
│   │   ├── layout
│   │   └── ui
│   ├── config
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
│   ├── users
│   └── notifications
│
├── providers
│   ├── QueryProvider.tsx
│   ├── SessionProvider.tsx
│   └── ThemeProvider.tsx
│
└── index.ts
```

---

## 4. Reglas de arquitectura

Estas son las reglas más importantes del proyecto.

### Regla 1 — `app/` es solo para rutas y layouts de Expo Router

`app/` contiene únicamente:

* rutas
* layouts
* file-based routing
* pantallas contenedoras muy finas

`app/` **no debe** concentrar:

* lógica de negocio
* componentes complejos de dominio
* fetch pesado
* helpers de negocio
* validaciones de dominio
* mapping complejo de datos

Ejemplo correcto:

```tsx
import { OnboardingScreen } from '@/src/features/onboarding/components/OnboardingScreen';

export default function Page() {
  return <OnboardingScreen />;
}
```

---

### Regla 2 — `features/` contiene la lógica y UI específica de cada dominio

Aquí vive todo lo específico del módulo.

Ejemplos de features:

* auth
* onboarding
* dashboard
* matches
* teams
* statistics
* notifications
* users
* profile
* leagues

Dentro de una feature pueden existir:

* `components`
* `hooks`
* `services`
* `api`
* `store`
* `types`
* `utils`
* `schemas`
* `mappers`

Si una pieza pertenece claramente a un dominio, debe vivir en su feature.

---

### Regla 3 — `shared/` es solo para piezas realmente reutilizables

`shared/` contiene elementos que se usan en varias features o a nivel de app.

Ejemplos:

* `Button`
* `FormField`
* `PasswordField`
* `Screen`
* `AppHeader`
* `Loader`
* `EmptyState` genérico
* `routes.ts`
* `colors.ts`
* `theme.ts`
* `validators.ts`
* `client.ts`

No debe usarse `shared/` como cajón de sastre.

Regla:

> Un componente no va a `shared` porque “podría reutilizarse”; solo va ahí si realmente es transversal.

---

### Regla 4 — `state/` es solo para estado global real

Permitido:

* sesión
* liga activa
* UI global
* preferencias
* estado persistente de alcance global

No permitido:

* listas remotas de ligas
* partidos
* notificaciones
* estadísticas
* equipos
* usuarios remotos

Eso es **server state**.

---

### Regla 5 — `mocks/` contiene solo datos simulados y fixtures

Permitido:

* arrays mock
* objetos fake
* escenarios de prueba
* fixtures por módulo

No permitido:

* lógica de UI
* lógica de navegación
* lógica compleja de negocio mezclada
* componentes
* código de render

---

### Regla 6 — `shared/api/` contiene infraestructura común de red

Debe contener:

* cliente HTTP
* interceptores
* helpers de fetch
* endpoints comunes
* configuración base de API

No debe contener lógica de dominio fuerte.

La lógica de dominio que consuma API debe vivir en:

* `features/<feature>/api`
* `features/<feature>/services`

---

### Regla 7 — los tipos compartidos no se duplican

Los tipos compartidos deben vivir en:

* `shared/types`
* o dentro de la feature correspondiente si son específicos

No se deben duplicar tipos del mismo dominio en varias carpetas.

Ejemplos incorrectos:

* definir `LeagueItem` en `shared/types`, `features/onboarding/types` y `mocks` con pequeñas variaciones sin justificación
* redefinir tipos de usuario o partido por conveniencia local

---

## 5. Responsabilidad de cada capa

### 5.1 `app/`

Responsabilidad:

* definir rutas
* agrupar navegación pública/privada
* conectar layouts
* renderizar pantallas feature-based

No debe contener:

* lógica compleja
* fetch directo con transformación compleja
* árboles de UI enormes

---

### 5.2 `features/`

Responsabilidad:

* agrupar cada dominio del producto
* centralizar UI, lógica y tipos del módulo
* encapsular reglas funcionales del dominio

Ejemplo:
`features/users/` debe contener todo lo necesario para:

* listado de miembros
* invitar usuario
* gestionar usuario
* filtros, validaciones y formularios de esa feature

---

### 5.3 `shared/`

Responsabilidad:

* servir como librería interna del proyecto
* alojar lo reutilizable de verdad
* evitar duplicación transversal

---

### 5.4 `state/`

Responsabilidad:

* almacenar solo el estado global que debe sobrevivir entre pantallas o afectar varias áreas

Ejemplos:

* sesión autenticada
* liga activa
* estado global de UI

---

### 5.5 `mocks/`

Responsabilidad:

* simular datos y escenarios del backend

Debe facilitar:

* desarrollo sin backend
* pruebas visuales
* testing de estados y casos edge

---

### 5.6 `providers/`

Responsabilidad:

* inicializar dependencias globales
* envolver la app con providers de contexto, query, theme, session, etc.

---

## 6. Organización interna de una feature

La estructura interna de una feature puede variar, pero debe responder a la responsabilidad real del módulo.

Ejemplo recomendado:

```txt
features/users
├── api
├── components
├── hooks
├── services
├── store
├── types
├── utils
├── schemas
└── mappers
```

### Qué suele ir en cada subcarpeta

#### `components`

UI específica de la feature.

#### `hooks`

Hooks del dominio:

* lectura de datos
* acciones del módulo
* composición de comportamiento

#### `services`

Lógica de aplicación o integración del dominio.

#### `api`

Funciones que consumen endpoints de esa feature.

#### `types`

Tipos del dominio local.

#### `utils`

Helpers específicos del módulo.

#### `schemas`

Validaciones de formularios o payloads.

#### `mappers`

Transformaciones entre DTO y modelo de frontend.

---

## 7. Navegación y rutas

### 7.1 Fuente real de rutas

La fuente real de rutas es **Expo Router** y la estructura de `app/`.

### 7.2 Rutas semánticas

Además debe existir:

```txt
src/shared/config/routes.ts
```

para:

* evitar strings hardcodeados
* centralizar nombres semánticos
* construir rutas dinámicas
* facilitar refactors

### 7.3 Regla de uso

Preferir:

```ts
router.push(routes.private.onboarding)
```

en vez de:

```ts
router.push('/onboarding')
```

### 7.4 Importante

`routes.ts` no reemplaza a Expo Router.
Es una capa semántica por encima.

---

## 8. Server state vs app state

### App state

Debe ir a `state/` solo si es global y persistente o transversal.

Ejemplos:

* usuario autenticado
* liga activa
* preferencias
* modales globales si existen

### Server state

Debe tratarse como estado remoto:

* ligas
* partidos
* equipos
* estadísticas
* usuarios de la liga
* notificaciones

### Recomendación

Usar **TanStack Query** para:

* fetching
* cache
* invalidación
* refetch
* loading/error/success states

---

## 9. Datos, modelos y mappers

Conviene separar tres niveles cuando empiece la API real:

### 9.1 DTO

Forma en la que llega el dato desde backend.

### 9.2 Modelo de dominio

Forma en la que el frontend quiere trabajar ese dato.

### 9.3 Mapper

Transformación DTO → modelo de dominio.

Esto permite:

* desacoplar UI del backend
* cambiar endpoints sin romper toda la app
* tener modelos más ergonómicos en frontend

---

## 10. Persistencia

### Persistencia local

Usar para:

* sesión
* tokens
* última liga activa
* preferencias del usuario

### Recomendación

* `expo-secure-store` para datos sensibles
* `AsyncStorage` para preferencias no sensibles

### Persistencia remota

Todo lo demás debe venir del backend/API.

---

## 11. Reglas de escalabilidad

Para que el proyecto escale correctamente, cualquier cambio debe seguir estas reglas.

### 11.1 No crecer por acumulación desordenada

No añadir archivos “porque sí” en carpetas genéricas.

### 11.2 No mover todo a `shared`

Lo genérico excesivo también rompe la arquitectura.

### 11.3 No convertir `app/` en una carpeta de pantallas gordas

La lógica fuerte pertenece a `features/`.

### 11.4 No usar store global como sustituto de una API/cache

Server state y app state deben seguir separados.

### 11.5 No duplicar mocks, tipos o filtros

Si algo ya existe, se reutiliza o se refactoriza.

---

## 12. Reglas de colocación rápidas

### Si una pieza es ruta

→ `app/`

### Si una pieza es específica de un dominio

→ `features/<feature>/`

### Si una pieza se usa en muchas features

→ `shared/`

### Si es estado global

→ `state/`

### Si es dato simulado

→ `mocks/`

### Si es infraestructura de red

→ `shared/api/`

---

## 13. Reglas de arquitectura para UI móvil

La documentación funcional web es la fuente de reglas de negocio, pero móvil debe adaptar la experiencia.

### Regla 1

La app móvil debe conservar:

* reglas de negocio
* permisos por rol
* flujos esenciales
* lógica funcional

### Regla 2

La app móvil no debe copiar la web tal cual.

### Regla 3

En móvil puede cambiar:

* la jerarquía visual
* el orden de bloques
* el acceso a acciones
* el patrón de interacción

### Regla 4

Patrones móviles válidos:

* pantallas fullscreen para formularios complejos
* bottom sheets para acciones rápidas
* menús contextuales
* scroll vertical
* sticky footers en formularios largos

---

## 14. Responsabilidades por navegación inferior

Dado el contexto de GoalApp móvil, la barra de tabs debe priorizar accesos frecuentes, no todo el árbol funcional de web.

### Recomendación de tabs móviles

* Inicio
* Calendario
* `+` como acción global, no tab real
* Partidos
* Perfil

### Regla importante

El botón `+`:

* no es una pantalla principal
* no debe marcarse como tab activa
* debe abrir acciones rápidas contextuales

Ejemplos:

* Crear liga
* Unirme a una liga
* Invitar usuario
* Nuevo partido
* Nuevo equipo

---

## 15. Reglas para evolución desde la estructura actual

La migración hacia esta arquitectura debe hacerse por fases.

### Fase 1

Crear:

* `features`
* `shared`
* `state`
* `mocks`

### Fase 2

Mover lo transversal a `shared`:

* componentes base
* constants
* styles
* utils comunes
* types compartidos

### Fase 3

Mover la lógica de dominio a `features`:

* onboarding
* dashboard
* matches
* users
* notifications
* etc.

### Fase 4

Sustituir `data/` por `mocks/` y separar servicios

### Fase 5

Consolidar `shared/api/` y preparar backend real

---

## 16. Reglas de revisión arquitectónica

Antes de aceptar una contribución, revisar:

* si está en la carpeta correcta
* si respeta la separación de capas
* si evita duplicación
* si mezcla responsabilidades
* si prepara bien el paso a API real
* si trata correctamente server state vs app state
* si mantiene la coherencia móvil del producto

---

## 17. Antipatrones a evitar

No hacer esto:

* poner lógica compleja en `app/`
* meter componentes de negocio en `shared` sin necesidad
* duplicar tipos del mismo dominio
* guardar listas remotas en stores globales
* mezclar mocks con UI
* hardcodear rutas repetidas
* copiar web a móvil sin rediseñar la jerarquía
* tratar el botón `+` como tab si es una acción
* crear carpetas genéricas ambiguas que acumulen de todo

---

## 18. Regla de decisión en caso de duda

Si no está claro dónde debe ir algo, seguir este orden:

1. ¿Es ruta? → `app/`
2. ¿Es una pieza específica del dominio? → `features/<feature>/`
3. ¿Es realmente compartida? → `shared/`
4. ¿Es estado global? → `state/`
5. ¿Es mock o fixture? → `mocks/`

Si sigue habiendo duda, no improvisar:

* documentar la decisión
* o plantear un pequeño refactor antes de seguir

---

## 19. Resultado esperado de esta arquitectura

Si se sigue correctamente esta arquitectura, GoalApp debe poder:

* crecer por módulos sin romper consistencia
* soportar más reglas por rol sin caos
* migrar de mocks a backend real sin reescritura total
* mantener una experiencia móvil coherente con el producto web
* facilitar el trabajo de varias personas o IA sobre el mismo repositorio
* reducir errores por mala ubicación del código

---

## 20. Resumen ejecutivo

La arquitectura de GoalApp debe apoyarse en estas capas:

* `app/` → rutas
* `features/` → dominios
* `shared/` → reutilizable global
* `state/` → estado global real
* `mocks/` → datos simulados
* `shared/api/` → infraestructura de red
* `providers/` → bootstrap global

Las reglas más importantes son:

* no mezclar responsabilidades
* no duplicar tipos ni lógica
* no usar store global para server state
* no copiar la web tal cual en móvil
* preparar siempre el frontend para API real

