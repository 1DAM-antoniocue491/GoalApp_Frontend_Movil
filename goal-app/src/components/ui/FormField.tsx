// Recibe todas las props de TextInput para ser flexible (secureTextEntry, etc.)

// Cada campo del formulario tiene: ícono izquierdo + label + TextInput.
// En vez de repetir esa estructura 4 veces, la encapsulamos.

import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { styles } from '../../styles';

interface FormFieldProps extends TextInputProps {
    label: string;
    icon: React.ReactNode; // acepta cualquier ícono (Ionicons, SVG, etc.)
}

export function FormField({ label, icon, ...inputProps }: FormFieldProps) {
    return (
        // ¿Por qué gap-1 en el wrapper? Espaciado consistente entre label e input
        // sin necesidad de marginBottom en cada elemento hijo.
        <View className={styles.fieldWrapper}>
            <Text className={styles.label}>{label}</Text>

            <View className={styles.inputRow}>
                {/* El ícono va fuera del TextInput pero dentro del row visual */}
                <View className={styles.inputIcon}>{icon}</View>

                <TextInput
                    className={styles.input}
                    placeholderTextColor={styles.inputPlaceholder}
                    // Spread de todas las props extra: secureTextEntry, keyboardType, etc.
                    {...inputProps}
                />
            </View>
        </View>
    );
}