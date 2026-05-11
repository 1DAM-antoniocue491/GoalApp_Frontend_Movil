# 📱 GoalApp Frontend Móvil

El frontend móvil de GoalApp es una aplicación nativa de alto rendimiento diseñada para ofrecer una experiencia deportiva fluida, resiliente y optimizada para dispositivos móviles. Construida con el ecosistema de Expo, la app permite a los usuarios gestionar ligas, seguir partidos en tiempo real y analizar estadísticas desde cualquier lugar.

## 🛠️ Stack Tecnológico

- **Core**: Expo SDK `~54.0.33` / React Native `0.81.5` / React `19.1.0`
- **Lenguaje**: TypeScript `~5.9.2`
- **Navegación**: Expo Router `~6.0.23` (Sistemas de rutas basado en archivos)
- **Estilos**: NativeWind `^5.0.0` (Tailwind CSS para React Native)
- **Seguridad**: `expo-secure-store` (Almacenamiento cifrado de tokens)
- **Feedback**: `expo-haptics` (Soporte táctil) y `react-native-reanimated` (Animaciones fluidas)

---

## 🏗️ Arquitectura del Proyecto

La aplicación sigue una arquitectura orientada a **Features**, separando la lógica de negocio de la infraestructura compartida para garantizar la mantenibilidad y escalabilidad.

### Organización Modular
El código se organiza en dominios funcionales dentro de `src/features/` (ej. `calendar`, `leagues`, `profile`, `statistics`):
- `api/`: Definiciones de endpoints y llamadas al backend.
- `services/`: Lógica de negocio y orquestación de datos.
- `hooks/`: Gestión de estado y efectos específicos de la funcionalidad.
- `components/`: UI exclusiva de la feature.
- `types/`: Tipados TypeScript específicos del dominio.

### Infraestructura Compartida (`src/shared/`)
- **Componentes**: UI genérica y reutilizable (Buttons, Loaders, FormFields).
- **API Client**: Cliente HTTP global con interceptores y lógica de resiliencia.
- **State**: Gestión de estado global mediante stores especializados (Sesión, Liga Activa, UI).
- **Utils**: Formatters, validadores y helpers transversales.

---

## ⚡ Resiliencia y Comunicación de Red

La aplicación móvil ha sido diseñada específicamente para operar en entornos de red inestables (estadios, canchas), implementando estrategias avanzadas de comunicación:

### Backoff Exponencial
Para mitigar fallos temporales de red o errores de servidor (`5xx`), el cliente de API implementa un algoritmo de reintentos automáticos:
- **Lógica**: El tiempo de espera aumenta exponencialmente entre intentos: $2^{retryCount} \times 1000\text{ms}$.
- **Secuencia**: Reintento 1 (1s) $\rightarrow$ Reintento 2 (2s) $\rightarrow$ Reintento 3 (4s).
- **Objetivo**: Evitar la saturación del servidor y mejorar la tasa de éxito de las peticiones en movilidad.

### Flujo de Autenticación y Seguridad
- **Refresh Token**: Interceptores automáticos que detectan errores `401` y solicitan un nuevo token mediante el endpoint `/auth/refresh`.
- **Sincronización de Peticiones**: Uso de un sistema de suscriptores (`refreshSubscribers`) para encolar peticiones pendientes mientras se renueva el token, evitando llamadas duplicadas.
- **Persistencia Segura**: A diferencia de la web, los tokens y datos sensibles se almacenan en el **Keychain (iOS)** o **EncryptedSharedPreferences (Android)** mediante `expo-secure-store`.

---

## 🗺️ Navegación y UX

### Expo Router
Se utiliza un sistema de navegación semántico basado en archivos en `src/app/`:
- **`(tabs)`**: Navegación principal inferior (Home, Calendario, Estadísticas, Perfil).
- **`auth`**: Flujo dedicado de Login, Registro y Recuperación de Cuenta.
- **`league`**: Rutas profundas para la gestión de equipos y usuarios.

### Diseño y Experiencia
- **Estética**: Interfaz moderna basada en Tailwind CSS, optimizada para pantallas móviles con `react-native-safe-area-context`.
- **Feedback**: Implementación de vibraciones tácticas en acciones críticas y transiciones fluidas mediante Reanimated.

---

## 🚀 Instalación y Ejecución

### Configuración del Entorno
Cree un archivo `.env` en la raíz con las siguientes variables:
```env
EXPO_PUBLIC_API_URL_DEV=https://api-dev.goalapp.com
EXPO_PUBLIC_API_URL_PROD=https://goalapp-api.onrender.com
EXPO_PUBLIC_MAX_RETRIES=3
```

### Pasos para ejecutar
1. **Instalar dependencias**:
   ```bash
   npm install
   ```
2. **Iniciar el servidor de desarrollo**:
   ```bash
   npx expo start
   ```
3. **Lanzar en emulador/dispositivo**:
   - Presione `a` para Android.
   - Presione `i` para iOS.
