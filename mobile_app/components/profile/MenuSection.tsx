import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface MenuItem {
    id: string;
    label: string;
    icon: string;
    route?: string;
    onPress?: () => void;
}

interface MenuSectionProps {
    title?: string;
    items: MenuItem[];
    onItemPress?: (item: MenuItem) => void;
}

export default function MenuSection({ title, items, onItemPress }: MenuSectionProps) {
    return (
        <View style={styles.section}>
            {title && <Text style={styles.sectionTitle}>{title}</Text>}
            <View style={styles.menuCard}>
                {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                item.onPress?.();
                                onItemPress?.(item);
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuItemLeft}>
                                {/* <View style={styles.iconContainer}>
                  <IconSymbol name={item.icon} size={20} color="#0a7ea4" />
                </View> */}
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color="#687076" />
                        </TouchableOpacity>
                        {index < items.length - 1 && <View style={styles.divider} />}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#687076',
        textTransform: 'uppercase',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e8f4f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#11181C',
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 68,
    },
});
