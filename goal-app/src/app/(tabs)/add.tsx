/**
 * app/(tabs)/add.tsx
 *
 * Pantalla placeholder — NUNCA se renderiza en la práctica.
 *
 * El tap del tab "add" es interceptado en _layout.tsx con `e.preventDefault()`,
 * lo que abre el QuickActionSheet sin navegar a esta ruta. Este archivo existe
 * únicamente porque Expo Router requiere un archivo por cada Tabs.Screen
 * registrado; si se elimina, el router lanza un warning en consola.
 *
 * Toda la lógica del sheet vive en _layout.tsx.
 */
import React from 'react';
import { View } from 'react-native';

export default function AddScreen() {
  return <View style={{ flex: 1, backgroundColor: '#0F0F13' }} />;
}