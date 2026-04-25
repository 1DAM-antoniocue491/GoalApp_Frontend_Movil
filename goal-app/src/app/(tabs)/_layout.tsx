/**
 * TabsLayout - Navegación con tabs principal
 *
 * Muestra la barra de navegación inferior con:
 * - Inicio (onboarding/listado de ligas)
 * - Calendario
 * - Añadir (abre QuickActionSheet, no navega)
 * - Estadísticas
 * - Perfil
 */

import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { QuickActionSheet } from '@/src/shared/components/ui/QuickActionSheet';
import { CreateTeamModal } from '@/src/features/teams/components/modals/CreateTeamModal';
import { CreateCalendarModal } from '@/src/features/calendar/components/modals/CreateCalendarModal';
import { CreateManualMatchModal } from '@/src/features/calendar/components/modals/CreateManualMatchModal';
import { Colors } from "@/src/shared/constants/colors";

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
  const [sheetOpen, setSheetOpen] = useState(false);
  // Estos estados viven aquí porque los Modal de RN deben montarse fuera
  // de <Tabs> para superponerse correctamente a la tab bar
  const [createMatchOpen, setCreateMatchOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createCalendarOpen, setCreateCalendarOpen] = useState(false);

  return (
    // Fragment para que el Modal pueda renderizarse fuera del árbol de Tabs
    <>
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

        {/* Tab Añadir — intercepta el tap y abre el sheet, nunca navega */}
        <Tabs.Screen
          name="add"
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // Evita la navegación al tab
              setSheetOpen(true);
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

      {/*
       * QuickActionSheet y CreateTeamModal DEBEN estar FUERA de <Tabs>.
       * Los Modal de RN necesitan estar en la raíz del árbol para superponerse
       * a toda la UI, incluyendo la tab bar. Dentro de <Tabs> quedan atrapados.
       */}
      <QuickActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAddMatch={() => setCreateMatchOpen(true)}
        onAddTeam={() => setCreateTeamOpen(true)}
        onCreateCalendar={() => setCreateCalendarOpen(true)}
      />

      {/* Modal Nuevo Partido */}
      <CreateManualMatchModal
        visible={createMatchOpen}
        onClose={() => setCreateMatchOpen(false)}
        onSubmit={(data) => {
          // TODO: conectar con calendarService cuando esté disponible
          console.log('Nuevo partido:', data);
          setCreateMatchOpen(false);
        }}
      />

      {/* Modal Nuevo Equipo */}
      <CreateTeamModal
        visible={createTeamOpen}
        onClose={() => setCreateTeamOpen(false)}
        onSubmit={(data) => {
          // TODO: conectar con teamsService cuando esté disponible
          console.log('Nuevo equipo:', data);
          setCreateTeamOpen(false);
        }}
      />

      {/* Modal Crear Calendario */}
      <CreateCalendarModal
        visible={createCalendarOpen}
        onClose={() => setCreateCalendarOpen(false)}
        onSubmit={(data) => {
          // TODO: conectar con calendarService cuando esté disponible
          console.log('Nuevo calendario:', data);
          setCreateCalendarOpen(false);
        }}
      />
    </>
  );
}