import React, { memo, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/shared/constants/colors';
import { theme } from '@/src/shared/styles/theme';

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
  disabled?: boolean;
  searchable?: boolean;
  emptyText?: string;
}

function OptionSelectFieldComponent({
  label,
  value,
  options,
  placeholder = 'Selecciona una opción',
  onChange,
  disabled = false,
  searchable = true,
  emptyText = 'No hay opciones disponibles',
}: OptionSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedLabel = useMemo(() => {
    return options.find(option => option.value === value)?.label ?? '';
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(option => option.label.toLowerCase().includes(q));
  }, [options, query]);

  function handleOpen() {
    if (disabled) return;
    setQuery('');
    setOpen(true);
  }

  return (
    <>
      <View style={{ flex: 1 }}>
        <Text style={fieldStyles.label}>{label}</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleOpen}
          disabled={disabled}
          style={[fieldStyles.input, disabled ? fieldStyles.inputDisabled : null]}
        >
          <Text numberOfLines={1} style={[fieldStyles.inputText, !selectedLabel ? fieldStyles.placeholder : null]}>
            {selectedLabel || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={fieldStyles.backdrop} onPress={() => setOpen(false)}>
          <Pressable onPress={event => event.stopPropagation()} style={fieldStyles.sheet}>
            <View style={fieldStyles.header}>
              <Text style={fieldStyles.title}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {searchable && options.length > 8 ? (
              <View style={fieldStyles.searchRow}>
                <Ionicons name="search-outline" size={18} color={Colors.text.secondary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar..."
                  placeholderTextColor={Colors.text.disabled}
                  style={fieldStyles.searchInput}
                  autoCapitalize="none"
                />
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {filteredOptions.length === 0 ? (
                <View style={fieldStyles.emptyBox}>
                  <Text style={fieldStyles.emptyText}>{emptyText}</Text>
                </View>
              ) : null}

              {filteredOptions.map(option => {
                const isSelected = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.9}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={[fieldStyles.option, isSelected ? fieldStyles.optionSelected : null]}
                  >
                    <Text style={[fieldStyles.optionText, isSelected ? fieldStyles.optionTextSelected : null]}>
                      {option.label}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark-circle" size={18} color={Colors.brand.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export const OptionSelectField = memo(OptionSelectFieldComponent);

const fieldStyles = {
  label: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
    backgroundColor: Colors.bg.base,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  inputDisabled: {
    opacity: 0.45,
  },
  inputText: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    lineHeight: 20,
  },
  placeholder: {
    color: Colors.text.disabled,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center' as const,
    paddingHorizontal: 20,
  },
  sheet: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
    backgroundColor: Colors.bg.surface1,
    overflow: 'hidden' as const,
    maxHeight: '72%' as const,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800' as const,
  },
  searchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    margin: theme.spacing.md,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.bg.base,
    borderWidth: 1,
    borderColor: Colors.bg.surface2,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
  },
  option: {
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.surface2,
  },
  optionSelected: {
    backgroundColor: 'rgba(200,245,88,0.08)',
  },
  optionText: {
    color: Colors.text.primary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  optionTextSelected: {
    color: Colors.brand.primary,
  },
  emptyBox: {
    padding: 18,
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center' as const,
  },
};
