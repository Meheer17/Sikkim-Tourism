import { StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BusinessAnalyticsScreen() {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
            headerImage={
                <IconSymbol
                    size={310}
                    color="#808080"
                    name="chart.line.uptrend.xyaxis"
                    style={styles.headerImage}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Business Analytics</ThemedText>
            </ThemedView>

            <ThemedView style={styles.content}>
                <ThemedText type="subtitle">Performance Insights</ThemedText>
                <ThemedText style={styles.description}>
                    Track your business performance, sales, and customer engagement.
                </ThemedText>
            </ThemedView>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        color: '#808080',
        bottom: -90,
        left: -35,
        position: 'absolute',
    },
    titleContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    content: {
        gap: 8,
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        color: '#666',
    },
});
