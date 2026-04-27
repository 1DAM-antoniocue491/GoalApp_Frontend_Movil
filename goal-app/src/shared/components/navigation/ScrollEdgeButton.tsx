/**
 * ScrollEdgeButton - Botón flotante para navegar al inicio o final de un ScrollView.
 *
 * Aparece en el lateral derecho inferior cuando el contenido tiene scroll suficiente.
 * Muestra "ir abajo" si el usuario está cerca del inicio, y "ir arriba" en caso contrario.
 * Se oculta automáticamente si el contenido cabe en el viewport sin scroll.
 *
 * Este componente vive en shared/components/navigation porque no pertenece
 * a una feature concreta: puede reutilizarse en cualquier pantalla larga
 * que use ScrollView.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/src/shared/constants/colors';

// Píxeles desde el inicio a partir de los cuales se considera que el usuario "ha bajado"
const SCROLL_THRESHOLD = 80;

// El contenido debe superar el viewport en al menos este valor para que el botón tenga sentido
const MIN_SCROLLABLE_SURPLUS = 100;

interface ScrollEdgeButtonProps {
  // Referencia al ScrollView para llamar a scrollTo
  scrollRef: React.RefObject<ScrollView | null>;

  // Posición vertical actual del scroll
  scrollY: number;

  // Altura total del contenido del ScrollView, normalmente desde onContentSizeChange
  contentHeight: number;

  // Altura visible del ScrollView, normalmente desde onLayout
  viewportHeight: number;
}

export function ScrollEdgeButton({
  scrollRef,
  scrollY,
  contentHeight,
  viewportHeight,
}: ScrollEdgeButtonProps) {
  const insets = useSafeAreaInsets();

  /**
   * Valor animado de opacidad.
   *
   * Se usa solo para animar entrada/salida.
   * No lo usamos para decidir si renderizar porque Animated.Value
   * no debe leerse con getValue().
   */
  const opacity = useRef(new Animated.Value(0)).current;

  /**
   * Controla si el componente existe o no en el árbol.
   *
   * Sustituye al antiguo:
   * opacity.getValue()
   *
   * porque getValue() no es una API pública/tipada de Animated.Value.
   */
  const [shouldRender, setShouldRender] = useState(false);

  /**
   * Solo mostramos el botón si el contenido excede el viewport lo suficiente.
   *
   * Si el contenido apenas tiene scroll, el botón sería ruido visual.
   */
  const hasEnoughScroll =
    contentHeight > viewportHeight + MIN_SCROLLABLE_SURPLUS;

  /**
   * Si el usuario está cerca del inicio, la acción útil es bajar al final.
   * Si ya ha bajado, la acción útil es volver al inicio.
   */
  const isNearTop = scrollY < SCROLL_THRESHOLD;

  /**
   * Animación de entrada/salida del botón.
   *
   * - Cuando hay scroll suficiente, primero montamos el componente
   *   y después animamos opacity a 1.
   *
   * - Cuando deja de haber scroll suficiente, animamos opacity a 0
   *   y al terminar desmontamos el componente.
   */
  useEffect(() => {
    if (hasEnoughScroll) {
      // Montamos antes de animar para que el botón pueda aparecer suavemente.
      setShouldRender(true);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      return;
    }

    // Si no hay scroll suficiente, hacemos fade out antes de desmontar.
    Animated.timing(opacity, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });
  }, [hasEnoughScroll, opacity]);

  /**
   * Acción principal del botón:
   * - si está arriba, baja al final
   * - si está abajo/intermedio, sube al inicio
   */
  const handlePress = () => {
    if (!scrollRef.current) return;

    // Feedback háptico ligero para que el botón se sienta táctil y premium.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isNearTop) {
      // Ir al final del contenido.
      scrollRef.current.scrollTo({
        y: Math.max(contentHeight - viewportHeight, 0),
        animated: true,
      });

      return;
    }

    // Volver al inicio.
    scrollRef.current.scrollTo({
      y: 0,
      animated: true,
    });
  };

  /**
   * No ocupa espacio en el árbol cuando no debe mostrarse.
   *
   * Usamos shouldRender porque Animated.Value no debe leerse con getValue().
   */
  if (!shouldRender) return null;

  /**
   * Usamos style aquí porque:
   * - position absolute no conviene mezclarlo con layout normal
   * - bottom depende de safe area
   * - shadows/elevation se controlan mejor con style
   * - medidas exactas del botón son parte del comportamiento flotante
   */
  const containerStyle: ViewStyle = {
    position: 'absolute',
    right: 16,

    // Respeta safe area inferior para no quedar bajo el home indicator.
    bottom: (insets.bottom || 20) + 16,

    width: 44,
    height: 44,
    borderRadius: 22,

    backgroundColor: Colors.bg.surface2,
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,

    // Color semitransparente para dar borde sutil sin crear demasiado contraste.
    borderColor: 'rgba(161,161,170,0.15)',

    // Sombra para destacar sobre el contenido sin tapar acciones importantes.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  };

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          opacity,
        },
      ]}
      // Evita bloquear toques si se estuviera animando hacia invisible.
      pointerEvents={hasEnoughScroll ? 'auto' : 'none'}
    >
      <Pressable
        onPress={handlePress}
        hitSlop={8}
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        android_ripple={{
          color: 'rgba(255,255,255,0.1)',
          borderless: true,
          radius: 22,
        }}
        accessibilityRole="button"
        accessibilityLabel={
          isNearTop ? 'Ir al final del contenido' : 'Volver al inicio'
        }
      >
        <Ionicons
          name={isNearTop ? 'arrow-down' : 'arrow-up'}
          size={18}
          color={Colors.text.primary}
        />
      </Pressable>
    </Animated.View>
  );
}