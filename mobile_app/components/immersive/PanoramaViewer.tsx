import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    PanResponder,
    Animated,
    Image,
} from 'react-native';
import { Gyroscope } from 'expo-sensors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PanoramaViewerProps {
    imageSource: any; // Can be require() or { uri: string }
    onOrientationChange?: (orientation: { pitch: number; yaw: number }) => void;
    children?: React.ReactNode; // For navigation hotspots
}

export default function PanoramaViewer({
    imageSource,
    onOrientationChange,
    children,
}: PanoramaViewerProps) {
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const [orientation, setOrientation] = useState({ pitch: 0, yaw: 0 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [gyroEnabled, setGyroEnabled] = useState(false);
    const gyroData = useRef({ x: 0, y: 0, z: 0 });
    const initialGyro = useRef({ x: 0, y: 0, z: 0, set: false });

    // Get image dimensions
    useEffect(() => {
        if (typeof imageSource === 'number') {
            const asset = Image.resolveAssetSource(imageSource);
            setImageSize({ width: asset.width, height: asset.height });
        } else if (imageSource?.uri) {
            Image.getSize(
                imageSource.uri,
                (width, height) => setImageSize({ width, height }),
                (error) => console.error('Error getting image size:', error)
            );
        }
    }, [imageSource]);

    // Setup gyroscope
    useEffect(() => {
        let subscription: any;
        
        const setupGyroscope = async () => {
            try {
                const available = await Gyroscope.isAvailableAsync();
                if (available) {
                    setGyroEnabled(true);
                    Gyroscope.setUpdateInterval(16); // ~60fps
                    
                    subscription = Gyroscope.addListener((data) => {
                        gyroData.current = data;
                        
                        // Set initial reference on first reading
                        if (!initialGyro.current.set) {
                            initialGyro.current = { ...data, set: true };
                            return;
                        }
                        
                        // Calculate rotation delta from initial position
                        const deltaX = (data.y - initialGyro.current.y) * 20; // Pitch
                        const deltaY = (data.z - initialGyro.current.z) * 20; // Yaw
                        
                        setOrientation((prev) => {
                            const newYaw = (prev.yaw + deltaY) % 360;
                            const newPitch = Math.max(-60, Math.min(60, prev.pitch + deltaX));
                            
                            onOrientationChange?.({ pitch: newPitch, yaw: newYaw });
                            return { pitch: newPitch, yaw: newYaw };
                        });
                    });
                }
            } catch (error) {
                console.log('Gyroscope not available:', error);
            }
        };
        
        setupGyroscope();
        
        return () => {
            if (subscription) {
                subscription.remove();
            }
        };
    }, [onOrientationChange]);

    // Pan responder for touch gestures
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                // Reset gyro reference when user starts touching
                if (gyroEnabled) {
                    initialGyro.current = { ...gyroData.current, set: true };
                }
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value,
                });
            },
            onPanResponderMove: (_, gestureState) => {
                // Calculate new orientation based on drag
                const newYaw = (orientation.yaw + gestureState.dx * 0.5) % 360;
                const newPitch = Math.max(
                    -60,
                    Math.min(60, orientation.pitch - gestureState.dy * 0.3)
                );

                pan.setValue({ x: gestureState.dx, y: gestureState.dy });
                setOrientation({ pitch: newPitch, yaw: newYaw });
                onOrientationChange?.({ pitch: newPitch, yaw: newYaw });
            },
            onPanResponderRelease: () => {
                pan.flattenOffset();
                // Reset gyro reference after touch ends
                if (gyroEnabled) {
                    initialGyro.current = { ...gyroData.current, set: true };
                }
            },
        })
    ).current;

    // Calculate image position based on orientation
    const getImageTransform = () => {
        if (!imageSize.width) return { transform: [] };

        // Calculate offset based on yaw (horizontal rotation)
        // Map 360 degrees to full image width
        const xOffset = -(orientation.yaw / 360) * imageSize.width;
        
        // Calculate vertical offset based on pitch
        const yOffset = (orientation.pitch / 90) * (SCREEN_HEIGHT * 0.3);

        return {
            transform: [
                { translateX: xOffset },
                { translateY: yOffset },
            ],
        };
    };

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            <View style={styles.imageContainer}>
                <Animated.Image
                    source={imageSource}
                    style={[
                        styles.panoramaImage,
                        {
                            width: imageSize.width || SCREEN_WIDTH * 3,
                            height: imageSize.height || SCREEN_HEIGHT,
                        },
                        getImageTransform(),
                    ]}
                    resizeMode="cover"
                />
            </View>
            
            {/* Render navigation hotspots */}
            <View style={styles.hotspotContainer} pointerEvents="box-none">
                {children}
            </View>

            {/* Compass overlay */}
            <View style={styles.compassContainer}>
                <View style={styles.compass}>
                    <Animated.View
                        style={[
                            styles.compassNeedle,
                            {
                                transform: [{ rotate: `${orientation.yaw}deg` }],
                            },
                        ]}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    imageContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    panoramaImage: {
        position: 'absolute',
    },
    hotspotContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compassContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    compass: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    compassNeedle: {
        width: 2,
        height: 20,
        backgroundColor: '#ef4444',
        position: 'absolute',
        top: 8,
    },
});
