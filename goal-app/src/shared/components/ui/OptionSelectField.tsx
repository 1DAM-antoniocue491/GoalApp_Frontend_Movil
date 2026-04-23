import React, { memo, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

/**
 * Tipo de una opción del select.
 * label = texto visible
 * value = valor interno que se guarda en el formulario
 */
export interface SelectOption {
    label: string;
    value: string;
}

interface OptionSelectFieldProps {
    label: string;
    value: string;
    options: SelectOption[];
    placeholder?: string;
    onChange: (value: string) => void;
}

function OptionSelectFieldComponent({
    label,
    value,
    options,
    placeholder = 'Selecciona una opción',
    onChange,
}: OptionSelectFieldProps) {
    /**
     * Estado local para abrir/cerrar el modal del select.
     */
    const [open, setOpen] = useState(false);

    /**
     * Etiqueta actualmente seleccionada.
     * La calculamos en base al value actual.
     */
    const selectedLabel = useMemo(() => {
        return options.find((option) => option.value === value)?.label ?? '';
    }, [options, value]);

    return (
        <>
            <View style={{ flex: 1 }}>
                {/* Etiqueta del campo */}
                <Text
                    style={{
                        color: Colors.text.secondary,
                        fontSize: 13,
                        marginBottom: 8,
                        lineHeight: 18,
                    }}
                >
                    {label}
                </Text>

                {/* Campo visual del select */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setOpen(true)}
                    style={{
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: Colors.bg.surface2,
                        backgroundColor: Colors.bg.base,
                        paddingHorizontal: 16,
                        height: 52,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text
                        numberOfLines={1}
                        style={{
                            flex: 1,
                            color: selectedLabel ? Colors.text.primary : Colors.text.disabled,
                            fontSize: 15,
                            lineHeight: 20,
                        }}
                    >
                        {selectedLabel || placeholder}
                    </Text>

                    <Ionicons
                        name="chevron-down"
                        size={18}
                        color={Colors.text.secondary}
                    />
                </TouchableOpacity>
            </View>

            {/* Modal del select */}
            <Modal transparent visible={open} animationType="fade">
                <Pressable
                    onPress={() => setOpen(false)}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        justifyContent: 'center',
                        paddingHorizontal: 20,
                    }}
                >
                    {/* Contenedor interno para evitar que el clic cierre si pulsas dentro */}
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        style={{
                            borderRadius: 22,
                            borderWidth: 1,
                            borderColor: Colors.bg.surface2,
                            backgroundColor: Colors.bg.surface1,
                            overflow: 'hidden',
                            maxHeight: '70%',
                        }}
                    >
                        {/* Cabecera */}
                        <View
                            style={{
                                paddingHorizontal: 18,
                                paddingVertical: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: Colors.bg.surface2,
                            }}
                        >
                            <Text
                                style={{
                                    color: Colors.text.primary,
                                    fontSize: 18,
                                    lineHeight: 24,
                                    fontWeight: '700',
                                }}
                            >
                                {label}
                            </Text>
                        </View>

                        {/* Lista de opciones */}
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {options.map((option) => {
                                const isSelected = option.value === value;

                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                        style={{
                                            minHeight: 54,
                                            paddingHorizontal: 18,
                                            paddingVertical: 14,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderBottomWidth: 1,
                                            borderBottomColor: Colors.bg.surface2,
                                            backgroundColor: isSelected
                                                ? `${Colors.brand.primary}12`
                                                : 'transparent',
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: isSelected
                                                    ? Colors.brand.primary
                                                    : Colors.text.primary,
                                                fontSize: 15,
                                                lineHeight: 20,
                                                fontWeight: isSelected ? '600' : '500',
                                            }}
                                        >
                                            {option.label}
                                        </Text>

                                        {isSelected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={18}
                                                color={Colors.brand.primary}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Footer */}
                        <View
                            style={{
                                padding: 16,
                                borderTopWidth: 1,
                                borderTopColor: Colors.bg.surface2,
                            }}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setOpen(false)}
                                style={{
                                    height: 48,
                                    borderRadius: 14,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: Colors.bg.surface2,
                                }}
                            >
                                <Text
                                    style={{
                                        color: Colors.text.secondary,
                                        fontSize: 15,
                                        fontWeight: '600',
                                    }}
                                >
                                    Cerrar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

export const OptionSelectField = memo(OptionSelectFieldComponent);