import React, { useEffect, useRef, memo } from 'react';
import { View, Animated } from 'react-native';
import { Colors } from '@/src/shared/constants/colors';

/**
 * Props del bloque visual del skeleton.
 */
interface SkeletonBlockProps {
  width?: number | string;
  height?: number;
  radius?: number;
  opacity: Animated.Value;
  style?: object;
}

/**
 * Bloque básico del skeleton.
 *
 * Lo reutilizamos muchas veces para simular la card real.
 */
function SkeletonBlock({
  width = '100%',
  height = 12,
  radius = 8,
  opacity,
  style,
}: SkeletonBlockProps) {
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: Colors.bg.surface2,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton individual alineado al nuevo diseño vertical de LeagueCard.
 */
function LeagueCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.45)).current;

  /**
   * Animación pulsante continua.
   */
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View
      className="mb-5 border p-5"
      style={{
        backgroundColor: Colors.bg.surface1,
        borderColor: Colors.bg.surface2,
        borderRadius: 28,
      }}
    >
      {/* Cabecera superior */}
      <View className="flex-row items-start justify-between mb-5">
        <View className="flex-row items-center">
          <SkeletonBlock width={104} height={32} radius={12} opacity={opacity} />
          <SkeletonBlock
            width={36}
            height={36}
            radius={12}
            opacity={opacity}
            style={{ marginLeft: 8 }}
          />
        </View>

        <SkeletonBlock width={28} height={28} radius={14} opacity={opacity} />
      </View>

      {/* Escudo + info principal */}
      <View className="flex-row items-center mb-6">
        <SkeletonBlock width={82} height={82} radius={41} opacity={opacity} />

        <View className="flex-1 ml-4">
          <SkeletonBlock width="72%" height={20} radius={8} opacity={opacity} />
          <SkeletonBlock
            width="54%"
            height={14}
            radius={6}
            opacity={opacity}
            style={{ marginTop: 10 }}
          />
        </View>
      </View>

      {/* Métricas secundarias */}
      <View className="flex-row mb-6">
        <View className="flex-1 pr-3">
          <SkeletonBlock width="42%" height={12} radius={6} opacity={opacity} />
          <SkeletonBlock
            width="76%"
            height={16}
            radius={6}
            opacity={opacity}
            style={{ marginTop: 10 }}
          />
        </View>

        <View className="flex-1">
          <SkeletonBlock width="54%" height={12} radius={6} opacity={opacity} />
          <SkeletonBlock
            width="32%"
            height={16}
            radius={6}
            opacity={opacity}
            style={{ marginTop: 10 }}
          />
        </View>
      </View>

      {/* CTA final */}
      <SkeletonBlock width="100%" height={56} radius={20} opacity={opacity} />
    </View>
  );
}

interface LeaguesSkeletonProps {
  count?: number;
}

function LeaguesSkeletonComponent({ count = 2 }: LeaguesSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <LeagueCardSkeleton key={index} />
      ))}
    </View>
  );
}

export const LeaguesSkeleton = memo(LeaguesSkeletonComponent);