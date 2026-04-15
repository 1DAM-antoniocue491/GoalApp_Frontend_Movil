/**
 * Utilidades de plataforma
 */

import { Platform, Dimensions } from 'react-native';

/**
 * Verifica si la plataforma es iOS
 */
export const isIOS = Platform.OS === 'ios';

/**
 * Verifica si la plataforma es Android
 */
export const isAndroid = Platform.OS === 'android';

/**
 * Verifica si la plataforma es Web
 */
export const isWeb = Platform.OS === 'web';

/**
 * Obtiene las dimensiones de la pantalla
 */
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Verifica si la pantalla es pequeña (< 380px de ancho)
 */
export const isSmallScreen = SCREEN_WIDTH < 380;

/**
 * Verifica si la pantalla es grande (> 768px de ancho)
 */
export const isLargeScreen = SCREEN_WIDTH > 768;