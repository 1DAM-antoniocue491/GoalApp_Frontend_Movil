/**
 * TabsLayout - Navegación con tabs principal
 *
 * Muestra la barra de navegación inferior con:
 * - Inicio (onboarding/listado de ligas)
 * - Liga
 * - Añadir
 * - Partidos
 * - Perfil
 */

import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000000",
          borderTopColor: "#2A2A35",
          paddingBottom: 40,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: "#C8F558",
        tabBarInactiveTintColor: "#9a9ea5",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
      }}>
      {/* Tab Inicio - Onboarding con listado de ligas */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Tab Liga */}
      <Tabs.Screen
        name="league"
        options={{
          title: "Liga",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Tab Añadir */}
      <Tabs.Screen
        name="add"
        options={{
          title: "Añadir",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Tab Partidos */}
      <Tabs.Screen
        name="matches"
        options={{
          title: "Partidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
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
  );
}
