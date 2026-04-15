/**
 * ScreenLayout - Layout profesional con safe areas edge-to-edge
 *
 * Componente base para pantallas que implementa:
 * - Safe area handling con useSafeAreaInsets (no SafeAreaView)
 * - Fondo edge-to-edge (ocupa toda la pantalla)
 * - Protección manual de zonas funcionales (status bar, home indicator)
 * - Soporte para teclado con keyboardAvoiding
 *
 * @example
 * <ScreenLayout>
 *   <YourContent />
 * </ScreenLayout>
 */

import React, { PropsWithChildren } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenLayoutProps extends PropsWithChildren {
  /**
   * Si true, envuelve el contenido en ScrollView
   * Útil para pantallas con contenido que puede exceder el viewport
   */
  scrollable?: boolean;
  /**
   * Padding horizontal (default: 24)
   */
  horizontalPadding?: number;
  /**
   * Si true, protege el bottom para contenido fijo inferior
   * (botones CTA, tab bars, etc.)
   */
  protectBottom?: boolean;
  /**
   * Estilo adicional para el contenedor principal
   */
  style?: ViewStyle;
  /**
   * Contenido que se mantiene fijo en la parte inferior
   * (protegido por safe area bottom)
   */
  footer?: React.ReactNode;
}

export function ScreenLayout({
  children,
  scrollable = false,
  horizontalPadding = 24,
  protectBottom = false,
  style,
  footer,
}: ScreenLayoutProps) {
  const insets = useSafeAreaInsets();

  // Estilos dinámicos basados en safe areas
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: '#0F0F13', // bg.base de constants
    paddingTop: insets.top, // Protege status bar / notch
    paddingBottom: protectBottom || footer ? 0 : insets.bottom, // Protege home indicator
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    ...style,
  };

  const contentContainerStyle: ViewStyle = {
    flex: 1,
    // Si hay footer, no aplicamos paddingBottom aquí
    paddingBottom: footer ? 0 : insets.bottom,
  };

  const footerContainerStyle: ViewStyle = {
    paddingBottom: insets.bottom,
    paddingHorizontal: horizontalPadding,
    backgroundColor: '#0F0F13',
  };

  // Componente de contenido interno
  const ContentWrapper = scrollable ? ScrollView : View;
  const scrollProps = scrollable
    ? {
        contentContainerStyle: contentContainerStyle,
        keyboardShouldPersistTaps: 'handled' as const,
        showsVerticalScrollIndicator: false,
      }
    : {
        style: contentContainerStyle,
      };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <View style={containerStyle}>
        <ContentWrapper {...scrollProps}>{children}</ContentWrapper>

        {footer && (
          <View style={footerContainerStyle}>{footer}</View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Hook helper para obtener insets con valores por defecto
 * Útil cuando necesitas acceso directo en componentes personalizados
 */
export function useSafeAreaInsetsWithDefaults() {
  const insets = useSafeAreaInsets();

  return {
    top: insets.top || 44, // Default status bar height
    bottom: insets.bottom || 34, // Default home indicator height
    left: insets.left || 0,
    right: insets.right || 0,
  };
}
