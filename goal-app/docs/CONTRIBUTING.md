Pega esto como `CONTRIBUTING.md` en la raíz del proyecto:

````md
# Contributing to GoalApp

Gracias por contribuir a GoalApp.

Este proyecto sigue una arquitectura y unas reglas de implementación pensadas para que el código sea:

- escalable
- consistente
- fácil de mantener
- preparado para pasar de mocks a API real
- alineado con la lógica funcional del producto

Este documento define cómo trabajar en el proyecto, dónde debe ir cada cosa y qué reglas deben seguirse para evitar deuda técnica y errores de arquitectura.

---

## 1. Principios del proyecto

GoalApp es una aplicación móvil de gestión de ligas deportivas con:

- acceso público
- onboarding de ligas
- dashboard según rol
- módulos internos
- permisos y flujos condicionados por rol

### Principios obligatorios

1. **La lógica funcional de producto no se pierde al adaptar pantallas**
2. **La versión móvil no copia la web tal cual**
3. **La arquitectura manda más que la solución rápida**
4. **No se duplica código si ya existe una pieza reusable**
5. **No se mezclan responsabilidades**
6. **Toda solución debe prepararse para backend/API real**

---

## 2. Stack técnico

El proyecto usa:

- React Native
- Expo
- Expo Router
- TypeScript
- TailwindCSS / NativeWind

---

## 3. Arquitectura del proyecto

La estructura objetivo del proyecto se basa en capas y dominios:

```txt
src
├── app
├── features
├── shared
├── state
├── mocks
├── providers
└── index.ts
````

### 3.1 `app/`

Contiene únicamente:

* rutas
* layouts
* file-based routing de Expo Router

No debe contener:

* lógica de negocio compleja
* fetchs grandes
* helpers de dominio
* componentes grandes de negocio

La capa `app/` debe ser fina.

Ejemplo correcto:

```tsx
import { OnboardingScreen } from '@/src/features/onboarding/components/OnboardingScreen';

export default function Page() {
  return <OnboardingScreen />;
}
```

---

### 3.2 `features/`

Contiene lógica y UI específica por dominio.

Ejemplos de dominios:

* auth
* onboarding
* dashboard
* leagues
* matches
* teams
* statistics
* notifications
* users
* profile

Dentro de una feature pueden existir carpetas como:

* `components`
* `hooks`
* `services`
* `store`
* `types`
* `utils`
* `api`
* `schemas`
* `mappers`

Regla:

> Si una pieza pertenece claramente a un dominio concreto, debe vivir en su feature.

---

### 3.3 `shared/`

Contiene solo piezas reutilizables entre múltiples módulos.

Ejemplos:

* `Button`
* `FormField`
* `PasswordField`
* `Screen`
* `Loader`
* `AppHeader` si realmente se reutiliza entre pantallas diferentes
* constantes globales
* estilos compartidos
* utilidades genéricas
* tipos transversales
* cliente API común

Regla:

> Un componente no va a `shared` solo porque “podría reutilizarse algún día”.
> Debe ser realmente transversal.

---

### 3.4 `state/`

Contiene el estado global real de la app.

Permitido:

* sesión
* usuario autenticado
* liga activa
* UI global
* preferencias persistentes

No permitido:

* listas remotas de ligas
* partidos
* estadísticas
* notificaciones
* equipos

Eso es **server state**, no app state.

---

### 3.5 `mocks/`

Contiene:

* datos simulados
* fixtures
* escenarios de prueba
* datos fake por dominio

No debe contener:

* lógica de UI
* lógica de navegación
* componentes
* lógica mezclada con pantallas

---

### 3.6 `providers/`

Contiene providers globales de aplicación, por ejemplo:

* SessionProvider
* QueryProvider
* ThemeProvider

---

## 4. Reglas de ubicación de archivos

### Componentes

* globales y reutilizables → `shared/components`
* específicos de una feature → `features/<feature>/components`

### Hooks

* genéricos → `shared/hooks`
* específicos de feature → `features/<feature>/hooks`

### Utilidades

* genéricas → `shared/utils`
* específicas de feature → `features/<feature>/utils`

### Tipos

* globales / compartidos → `shared/types`
* de dominio → `features/<feature>/types`

### Servicios

* de red o acceso común → `shared/api`
* de dominio → `features/<feature>/services` o `features/<feature>/api`

### Estado

* global → `state/`
* específico y realmente local → dentro de la feature

---

## 5. Reglas de naming

### Archivos

* componentes React: `PascalCase.tsx`
* hooks: `useSomething.ts`
* stores: `something.store.ts`
* servicios API: `something.api.ts`
* mocks: `something.mock.ts`
* utilidades: `something.ts`
* rutas semánticas: `routes.ts`
* tipos: `something.types.ts` o `something.ts`

### Componentes

Usar nombres explícitos.

Correcto:

* `InviteUserScreen`
* `LeagueCard`
* `UsersSummaryCard`
* `MatchesLiveList`

Incorrecto:

* `Card2`
* `MainBlock`
* `Box`
* `UserItem2`

### Funciones

Nombrar según intención:

* `getLeagueById`
* `mapLeagueDtoToModel`
* `validateInviteUserForm`
* `buildMatchDetailRoute`

---

## 6. Reglas de UI y diseño

### 6.1 Design system

Antes de añadir nuevos estilos:

* revisar `constants/colors.ts`
* revisar `styles/index.ts`
* revisar componentes base ya existentes

### 6.2 Colores

No hardcodear colores repetidos si ya existen en el sistema de diseño.

### 6.3 Estilos

No repetir combinaciones de clases si ya existe una utilidad reusable.

### 6.4 Adaptación móvil

La versión móvil:

* respeta la lógica funcional de web
* respeta permisos y reglas de negocio
* **no copia** la disposición de escritorio

La jerarquía visual en móvil debe adaptarse a:

* pantalla pequeña
* uso táctil
* scroll vertical
* acciones primarias claras
* menor densidad

### 6.5 Patrones móviles recomendados

Usar cuando tenga sentido:

* pantallas fullscreen para formularios complejos
* bottom sheets para acciones rápidas
* action sheets para acciones secundarias
* menús contextuales
* secciones colapsables
* tabs internas si realmente mejoran la navegación

### 6.6 Estados visuales obligatorios

Toda pantalla que cargue datos debe considerar, si aplica:

* loading
* empty state
* error
* success / loaded

---

## 7. Navegación y rutas

### 7.1 Fuente real de rutas

Expo Router es la fuente real de rutas.

### 7.2 Rutas semánticas

Debe existir un archivo como:

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

### 7.4 Tabs

No todo acceso debe ser una tab.

Regla importante:

> Un botón de acción global, como `+`, no es una tab real si no representa una pantalla.
> Debe abrir un bottom sheet, action sheet o flujo contextual.

---

## 8. Datos, API y persistencia

### 8.1 Base de datos

La app móvil **no se conecta directamente a PostgreSQL**.

Arquitectura correcta:

```txt
App móvil → API / Backend → PostgreSQL
```

### 8.2 Contratos de datos

Separar siempre que tenga sentido:

* DTO del backend
* modelo de dominio del frontend
* mapper DTO → modelo

### 8.3 Server state

Los datos remotos deben gestionarse como server state.

Recomendación:

* TanStack Query

### 8.4 App state

El store global debe reservarse para:

* sesión
* liga activa
* UI global
* preferencias persistentes

### 8.5 Persistencia local

Recomendación:

* `expo-secure-store` para tokens y datos sensibles
* `AsyncStorage` para preferencias no sensibles

---

## 9. Reglas por roles y negocio

GoalApp tiene reglas de negocio condicionadas por rol.
Toda contribución debe respetarlas.

Roles principales:

* `admin`
* `coach`
* `player`
* `field_delegate`
* `observer` cuando aplique

### Regla crítica

No basta con esconder botones.
Las diferencias por rol son funcionales, no solo visuales.

Ejemplos:

* solo ciertos roles pueden iniciar/finalizar partidos
* solo ciertos roles pueden invitar usuarios
* solo admin reactiva ligas finalizadas
* el onboarding cambia según acceso y permisos
* algunas vistas muestran bloques extra solo para ciertos roles

---

## 10. Regla de no duplicación

Antes de crear algo nuevo, revisar si ya existe:

* componente reusable
* utilidad similar
* tipo similar
* store similar
* patrón de layout
* helper de navegación
* mock equivalente

No se debe duplicar:

* filtros
* validaciones
* componentes base
* tipos de dominio
* clientes de red
* lógica de mapping

---

## 11. Regla para formularios

Todo formulario debe definirse con claridad:

* qué campos son comunes
* qué campos cambian según rol o estado
* qué validaciones tiene
* qué CTA principal tiene
* qué estados maneja
* si necesita footer sticky en móvil

En móvil, formularios complejos deben ir preferiblemente en:

* pantalla completa
* modal fullscreen

No en popups pequeños tipo web.

---

## 12. Regla para pantallas adaptadas desde web

Cuando una pantalla existe primero en web y luego se adapta a móvil:

### Debe conservar

* objetivo funcional
* reglas de negocio
* permisos
* flujo principal

### Puede cambiar

* layout
* jerarquía
* agrupación de acciones
* accesos secundarios
* densidad de información

### No debe hacerse

* copiar escritorio en versión comprimida
* mantener demasiadas acciones visibles a la vez
* usar tablas anchas sin adaptación

---

## 13. Reglas de calidad de código

Toda contribución debe cumplir:

* TypeScript fuerte
* componentes pequeños y claros
* separación razonable entre UI y lógica
* imports limpios
* sin código muerto
* sin mocks dentro de pantallas
* sin hex codes repetidos por todo el proyecto
* sin lógica de negocio dispersa

### Evitar

* archivos gigantes
* `any` innecesario
* refactors a medias
* nombres ambiguos
* soluciones rápidas que rompan la arquitectura

---

## 14. Checklist antes de enviar cambios

Antes de abrir PR o entregar cambios:

### Arquitectura

* [ ] El código está en la carpeta correcta
* [ ] No se rompió la separación entre `app`, `features`, `shared`, `state`, `mocks`
* [ ] No se metió lógica compleja en `app/`

### Reutilización

* [ ] No se duplicaron componentes ni utilidades
* [ ] Se reutilizaron tokens y estilos existentes

### UI

* [ ] Se respetó el design system
* [ ] La solución se ve bien en móvil
* [ ] Se contemplaron estados visuales si aplica

### Datos

* [ ] No se usó store global para server state sin justificación
* [ ] Los mocks, si existen, están en el lugar correcto
* [ ] Los tipos no están duplicados

### Navegación

* [ ] No hay rutas hardcodeadas repetidas sin necesidad
* [ ] Se respetó Expo Router
* [ ] No se rompió la navegación actual

### Negocio

* [ ] Se respetaron roles y permisos
* [ ] No se alteraron reglas funcionales sin justificarlo

---

## 15. Flujo recomendado para contribuciones

### Para cambios pequeños

* localizar feature o módulo
* revisar si hay piezas reutilizables
* implementar en la capa correcta
* validar navegación y estados

### Para cambios medianos o grandes

1. entender objetivo funcional
2. identificar rol o roles
3. revisar arquitectura actual
4. decidir qué se reutiliza
5. decidir qué se refactoriza
6. implementar
7. validar consistencia con diseño y negocio

---

## 16. Uso de IA en el proyecto

La IA puede ayudar, pero no debe introducir caos arquitectónico.

### 16.1 Qué contexto hay que darle a la IA

Siempre que la IA vaya a tocar una pantalla o módulo, debe recibir:

#### Contexto funcional

* nombre de la pantalla
* objetivo
* rol o roles
* reglas de negocio
* acciones clave
* qué no puede perderse

#### Contexto visual

* captura de referencia
* diseño web si existe
* idea móvil si aplica
* style guide

#### Contexto técnico

* stack
* estructura del proyecto
* archivos implicados
* tipos implicados
* rutas implicadas
* stores implicados

#### Contexto de arquitectura

* dónde debe ir el código
* qué carpetas puede tocar
* qué no debe tocar
* si debe refactorizar o solo implementar

---

### 16.2 Qué material debe proporcionarse a la IA

#### Para adaptar web a móvil

Proporcionar:

* captura web
* explicación funcional
* rol que usa la pantalla
* acciones importantes
* restricciones del flujo
* idea de cómo debería verse en móvil

#### Para generar código

Además de lo anterior:

* archivo actual
* componentes existentes relacionados
* tipos existentes
* stores implicados
* mocks o contrato de API si aplica

#### Para mejorar visualmente una pantalla existente

Proporcionar:

* captura actual móvil
* referencia objetivo
* restricciones visuales
* qué bloques deben mantenerse

---

### 16.3 Reglas que la IA debe seguir

Cuando una IA trabaje sobre este proyecto debe:

1. no rehacer desde cero sin motivo
2. analizar primero la arquitectura actual
3. respetar la separación de capas
4. no meter lógica fuerte en `app/`
5. no duplicar piezas reusables
6. no hardcodear colores si ya existen tokens
7. no copiar web tal cual en móvil
8. conservar reglas de negocio y permisos
9. señalar inconsistencias antes de proponer código
10. devolver código modular y mantenible

### 16.4 Qué debe devolver la IA

Idealmente debe devolver:

* diagnóstico breve
* archivos afectados
* propuesta de estructura
* código por archivo
* imports actualizados si aplica
* decisiones clave
* riesgos o inconsistencias detectadas

---

## 17. Qué no hacer

No está permitido:

* meter lógica de dominio compleja dentro de `app/`
* crear componentes genéricos sin saber si realmente son compartidos
* duplicar tipos de ligas, partidos, usuarios, etc.
* guardar listas remotas en store global sin motivo
* dejar mocks dentro de pantallas o componentes
* hardcodear rutas repetidas
* copiar web a móvil sin rediseñar la jerarquía
* romper permisos por rol
* hacer refactors grandes sin justificar estructura y alcance

---

## 18. Definition of Done

Un cambio se considera bien hecho cuando:

* cumple el objetivo funcional
* respeta roles y permisos
* está en la carpeta correcta
* no rompe arquitectura
* no duplica código
* usa design system
* considera estados de datos
* se integra bien con navegación
* está preparado para evolucionar hacia API real

---

## 19. En caso de duda

Ante una duda sobre dónde poner algo, seguir esta prioridad:

1. ¿Es ruta? → `app/`
2. ¿Es una pieza específica de un dominio? → `features/<feature>/`
3. ¿Es reusable en varias zonas? → `shared/`
4. ¿Es estado global real? → `state/`
5. ¿Es dato simulado? → `mocks/`

Si aún hay duda, **no improvisar**: documentar la decisión o proponer refactor antes de añadir más deuda.

---

## 20. Resumen final

Este proyecto debe crecer con:

* arquitectura clara
* separación por responsabilidades
* diseño consistente
* navegación limpia
* respeto total a roles y reglas de negocio
* preparación para backend y API real

Toda contribución debe ayudar a que GoalApp sea:

* más mantenible
* más consistente
* más escalable
* más robusta

