import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface NavigationHotspot {
    id: string;
    position: { x: number; y: number }; // Percentage based position (0-100)
    direction: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down';
    label?: string;
    targetViewpointId: string;
}

interface NavigationHotspotProps {
    hotspot: NavigationHotspot;
    onPress: (targetViewpointId: string) => void;
    visible?: boolean;
}

export default function NavigationHotspotComponent({
    hotspot,
    onPress,
    visible = true,
}: NavigationHotspotProps) {
    const [scale] = React.useState(new Animated.Value(1));

    React.useEffect(() => {
        // Pulse animation to draw attention
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, []);

    const getIconName = () => {
        switch (hotspot.direction) {
            case 'forward':
                return 'arrow.up';
            case 'backward':
                return 'arrow.down';
            case 'left':
                return 'arrow.left';
            case 'right':
                return 'arrow.right';
            case 'up':
                return 'arrow.up.circle';
            case 'down':
                return 'arrow.down.circle';
            default:
                return 'arrow.right';
        }
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    left: `${hotspot.position.x}%`,
                    top: `${hotspot.position.y}%`,
                    transform: [{ scale }],
                },
            ]}
        >
            <TouchableOpacity
                style={styles.hotspot}
                onPress={() => onPress(hotspot.targetViewpointId)}
                activeOpacity={0.7}
            >
                <View style={styles.arrowContainer}>
                    <IconSymbol
                        name={getIconName() as any}
                        size={32}
                        color="#fff"
                    />
                </View>
                {hotspot.label && (
                    <View style={styles.labelContainer}>
                        <Text style={styles.label}>{hotspot.label}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 5,
    },
    hotspot: {
        alignItems: 'center',
    },
    arrowContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(10, 126, 164, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    labelContainer: {
        marginTop: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    label: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});
