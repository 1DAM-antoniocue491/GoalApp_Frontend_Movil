/**
 * app/(tabs)/add.tsx
 *
 * Pantalla placeholder — NUNCA se renderiza en la práctica.
 *
 * El tap del tab "+" es interceptado en _layout.tsx con `e.preventDefault()`,
 * lo que navega directamente a /league/users sin renderizar esta pantalla.
 * Este archivo existe únicamente porque Expo Router requiere un archivo por
 * cada Tabs.Screen registrado; si se elimina, el router lanza un warning.
 */
import React from 'react';
import { View } from 'react-native';

export default function AddScreen() {
  return <View style={{ flex: 1, backgroundColor: '#0F0F13' }} />;
}
