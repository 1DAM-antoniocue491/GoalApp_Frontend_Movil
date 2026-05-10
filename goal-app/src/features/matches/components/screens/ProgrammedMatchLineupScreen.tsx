import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';

export function ProgrammedMatchLineupScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.bg.base }}>
      <Ionicons name="people-outline" size={36} color={Colors.text.disabled} />
      <Text style={{ color: Colors.text.primary, fontSize: 18, fontWeight: '900', marginTop: 12, textAlign: 'center' }}>Alineación eliminada en próximos partidos</Text>
      <Text style={{ color: Colors.text.secondary, marginTop: 8, textAlign: 'center' }}>Gestiona titulares y suplentes desde Convocatoria.</Text>
    </View>
  );
}
