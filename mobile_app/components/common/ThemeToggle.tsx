import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();
  const cardBg = useThemeColor('card');
  const text = useThemeColor('text');
  const mutedText = useThemeColor('mutedText');
  const tint = useThemeColor('tint');

  const options = [
    { key: 'light' as const, label: 'Light', icon: 'sun.max.fill' },
    { key: 'dark' as const, label: 'Dark', icon: 'moon.fill' },
    { key: 'system' as const, label: 'System', icon: 'gear' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      <View style={styles.header}>
        <IconSymbol name="paintbrush.fill" size={20} color={tint as string} />
        <Text style={[styles.title, { color: text }]}>Appearance</Text>
      </View>
      <View style={styles.optionsRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.option,
              {
                backgroundColor: themeMode === option.key ? tint + '22' : 'transparent',
                borderColor: themeMode === option.key ? tint : mutedText + '40',
              },
            ]}
            onPress={() => setThemeMode(option.key)}
          >
            <IconSymbol
              name={option.icon as any}
              size={20}
              color={themeMode === option.key ? (tint as string) : (mutedText as string)}
            />
            <Text
              style={[
                styles.optionLabel,
                { color: themeMode === option.key ? tint : mutedText },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
