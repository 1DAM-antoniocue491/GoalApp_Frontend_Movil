/**
 * LiveMatchSection.tsx
 *
 * Envuelve el partido en vivo con encabezado de sección
 * y enlace "Ver todos" hacia /matches/live.
 *
 * Acepta `children` para que cada dashboard pase su propia
 * configuración de LiveMatchCard con los handlers correctos.
 * Así no se duplica el header en los 5 dashboards de rol.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { routes } from '@/src/shared/config/routes';
import { Colors } from '@/src/shared/constants/colors';

interface LiveMatchSectionProps {
  children: React.ReactNode;
}

export function LiveMatchSection({ children }: LiveMatchSectionProps) {
  const router = useRouter();

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
      {/* ── Cabecera de sección ── */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        {/* Título + badge EN VIVO */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '600' }}>
            Partidos en vivo
          </Text>
          <View
            style={{
              backgroundColor: `${Colors.semantic.error}25`,
              borderRadius: 99,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: Colors.semantic.error, fontSize: 11, fontWeight: '700' }}>
              EN VIVO
            </Text>
          </View>
        </View>

        {/* Enlace "Ver todos" → pantalla de partidos en vivo */}
        <TouchableOpacity
          onPress={() => router.push(routes.private.matchRoutes.live.index as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
          hitSlop={8}
        >
          <Text style={{ color: Colors.brand.primary, fontSize: 13, fontWeight: '500' }}>
            Ver todos
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.brand.primary} />
        </TouchableOpacity>
      </View>

      {/* Tarjeta de partido — contenido inyectado por el dashboard de rol */}
      {children}
    </View>
  );
}
