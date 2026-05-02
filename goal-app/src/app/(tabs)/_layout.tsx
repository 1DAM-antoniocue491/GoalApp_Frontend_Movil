/**
 * TabsLayout - Navegación con tabs principal
 *
 * Muestra la barra de navegación inferior con:
 * - Inicio (onboarding/listado de ligas)
 * - Calendario
 * - + (acceso rápido a Usuarios y roles)
 * - Estadísticas
 * - Perfil
 *
 * Protegido con AuthWrapper - requiere autenticación
 *
 * TODO permissions: ocultar el botón + para roles sin permiso de gestión.
 */

import { Tabs, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Colors } from "@/src/shared/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProtectedRoute } from '@/src/components/ProtectedRoute';
import { routes } from '@/src/shared/config/routes';

function PlusTabButton(props: any) {
  return (
    <TouchableOpacity
      {...props}
      style={[props.style, { alignItems: "center", justifyContent: "center" }]}
    >
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: Colors.brand.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Ionicons name="add" size={28} color="#000" />
      </View>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#000000",
            borderTopColor: "#2A2A35",
            paddingBottom: insets.bottom + 40,
            paddingTop: 1,
            height: 70 + insets.bottom,
          },
          tabBarActiveTintColor: Colors.brand.primary,
          tabBarInactiveTintColor: "#9a9ea5",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 4,
          },
        }}
      >
        {/* Tab Inicio */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />

        {/* Tab Calendario */}
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendario",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" color={color} size={size} />
            ),
          }}
        />

        {/* Tab + — navega directamente a Usuarios y roles */}
        <Tabs.Screen
          name="add"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push(routes.private.league.users as never);
            },
          }}
          options={{
            title: "Añadir",
            tabBarButton: (props) => <PlusTabButton {...props} />,
          }}
        />

        {/* Tab Estadísticas */}
        <Tabs.Screen
          name="statistics"
          options={{
            title: "Estadísticas",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" color={color} size={size} />
            ),
          }}
        />

        {/* Tab Perfil */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
