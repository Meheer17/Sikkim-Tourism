import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    PanResponder,
    TouchableOpacity,
    Text,
} from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer, loadTextureAsync } from 'expo-three';
import { 
    Scene, 
    PerspectiveCamera, 
    SphereGeometry, 
    MeshBasicMaterial, 
    Mesh,
    DoubleSide,
} from 'three';
import { Asset } from 'expo-asset';
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
    const [orientation, setOrientation] = useState({ pitch: 0, yaw: 0 });
    const orientationRef = useRef({ pitch: 0, yaw: 0 });
    const lastGesture = useRef({ dx: 0, dy: 0 });
    const [fov, setFov] = useState(140); // Start with a wider FOV
    const fovRef = useRef(140);
    const lastPinchDistance = useRef<number | null>(null);
    
    // Three.js refs
    const cameraRef = useRef<PerspectiveCamera | null>(null);
    const rendererRef = useRef<Renderer | null>(null);
    const sceneRef = useRef<Scene | null>(null);
    const glRef = useRef<any>(null);
    const renderFrameRef = useRef<number | null>(null);

    // Initialize Three.js scene
    const onContextCreate = async (gl: any) => {
        glRef.current = gl;
        
        // Create renderer
        const renderer = new Renderer({ gl });
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        rendererRef.current = renderer;

        // Create scene
        const scene = new Scene();
        sceneRef.current = scene;

        // Create camera with wide FOV for immersive experience
        const camera = new PerspectiveCamera(
            fov, // FOV - adjustable for zoom
            SCREEN_WIDTH / SCREEN_HEIGHT,
            0.1,
            1000
        );
        camera.position.set(0, 0, 0); // Camera at center of sphere
        cameraRef.current = camera;

        // Create sphere geometry (render from inside)
        const geometry = new SphereGeometry(
            1000, // Large radius for panorama
            128,  // More segments for smoother appearance
            128   // More segments for smoother appearance
        );
        geometry.scale(-1, 1, 1); // Flip for inside view
        console.log('Sphere geometry:', geometry);

        // Load texture from image source
        let texture;
        try {
            let asset;
            if (typeof imageSource === 'number') {
                asset = Asset.fromModule(imageSource);
                await asset.downloadAsync();
            } else if (imageSource?.uri) {
                asset = Asset.fromURI(imageSource.uri);
                await asset.downloadAsync();
            }

            if (!asset) {
                console.error('No asset for panorama image');
                return;
            }

            // Pass the Asset object directly to loadTextureAsync for full resolution
            texture = await loadTextureAsync({ asset });
            console.log('Texture image:', texture.image && {
                width: texture.image.width,
                height: texture.image.height,
            });
        } catch (e) {
            console.error('Error loading texture', e);
            return;
        }

        if (!texture) {
            console.error('Texture is null');
            return;
        }
        // Fix texture mapping for equirectangular panorama
        texture.flipY = true;
        texture.encoding = 3001; // THREE.sRGBEncoding
        texture.wrapS = texture.wrapT = 1000; // THREE.ClampToEdgeWrapping
        texture.repeat.set(1, 1);
        texture.generateMipmaps = false;
        // texture.minFilter = 1006; // THREE.LinearFilter
        // texture.magFilter = 1006; // THREE.LinearFilter
        texture.needsUpdate = true;

        // Log texture details for debugging
        console.log('Texture loaded:', texture);
        if (texture.image) {
            console.log('Texture image dimensions:', texture.image.width, texture.image.height);
            console.log('Texture image type:', typeof texture.image);
        }

        // Create material with texture - MeshBasicMaterial is unlit
        const material = new MeshBasicMaterial({
            map: texture,
            side: DoubleSide,
            transparent: false,
            opacity: 1,
            blending: 1, // THREE.NormalBlending
        });
        console.log('Material created with map:', !!material.map);
        console.log('Material side:', material.side);
        console.log('Camera position:', camera.position);
        console.log('Sphere radius: 500');

        // Create mesh and add to scene
        const sphere = new Mesh(geometry, material);
        scene.add(sphere);

        // Start render loop
        startRenderLoop();
    };
    
    // Render loop - separated so it can access latest orientation
    const startRenderLoop = () => {
        const render = () => {
            renderFrameRef.current = requestAnimationFrame(render);
            if (cameraRef.current && rendererRef.current && sceneRef.current && glRef.current) {
                // Update FOV for zoom
                cameraRef.current.fov = fovRef.current;
                cameraRef.current.updateProjectionMatrix();
                 // Convert orientation to radians (read from ref for latest values)
                const pitch = (orientationRef.current.pitch * Math.PI) / 180;
                const yaw = (orientationRef.current.yaw * Math.PI) / 180;
                cameraRef.current.rotation.order = 'YXZ';
                cameraRef.current.rotation.y = -yaw;
                cameraRef.current.rotation.x = pitch;
                rendererRef.current.render(sceneRef.current, cameraRef.current);
                glRef.current.endFrameEXP();
            }
        };
        render();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (renderFrameRef.current) {
                cancelAnimationFrame(renderFrameRef.current);
            }
        };
    }, []);

    // Pan responder for touch gestures
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                lastGesture.current = { dx: 0, dy: 0 };
                lastPinchDistance.current = null;
            },
            onPanResponderMove: (evt, gestureState) => {
                if (evt.nativeEvent.touches.length === 2) {
                    // Pinch zoom
                    const touch1 = evt.nativeEvent.touches[0];
                    const touch2 = evt.nativeEvent.touches[1];
                    const distance = Math.hypot(
                        touch2.pageX - touch1.pageX,
                        touch2.pageY - touch1.pageY
                    );
                    if (lastPinchDistance.current !== null) {
                        const pinchDelta = distance - lastPinchDistance.current;
                        setFov((prevFov) => {
                            let nextFov = prevFov - pinchDelta * 0.1;
                            nextFov = Math.max(30, Math.min(145, nextFov));
                            fovRef.current = nextFov;
                            console.log(`Current FOV: ${nextFov.toFixed(2)}`);
                            return nextFov;
                        });
                    }
                    lastPinchDistance.current = distance;
                } else {
                    // Single finger pan
                    const deltaDx = gestureState.dx - lastGesture.current.dx;
                    const deltaDy = gestureState.dy - lastGesture.current.dy;
                    lastGesture.current = { dx: gestureState.dx, dy: gestureState.dy };
                    setOrientation((prev) => {
                        let newYaw = prev.yaw + deltaDx * 0.3;
                        let newPitch = prev.pitch + deltaDy * 0.3;
                        newYaw = ((newYaw % 360) + 360) % 360;
                        newPitch = Math.max(-80, Math.min(80, newPitch));
                        const newOrientation = { pitch: newPitch, yaw: newYaw };
                        orientationRef.current = newOrientation;
                        onOrientationChange?.(newOrientation);
                        return newOrientation;
                    });
                }
            },
            onPanResponderRelease: () => {
                lastGesture.current = { dx: 0, dy: 0 };
                lastPinchDistance.current = null;
            },
        })
    ).current;

    // Device motion tracking effect
    useEffect(() => {
        let subscription: any;

        const startMotionTracking = async () => {
            Gyroscope.setUpdateInterval(16); // 60 FPS
            subscription = Gyroscope.addListener(({ x, y, z }) => {
                // This is a simplified integration.
                // A more robust solution would involve quaternions.
                setOrientation((prev) => {
                    // Adjust sensitivity with a multiplier
                    const sensitivity = 0.5;
                    let newYaw = prev.yaw - y * sensitivity;
                    let newPitch = prev.pitch + x * sensitivity;

                    newYaw = ((newYaw % 360) + 360) % 360;
                    newPitch = Math.max(-80, Math.min(80, newPitch));

                    const newOrientation = { pitch: newPitch, yaw: newYaw };
                    orientationRef.current = newOrientation;
                    onOrientationChange?.(newOrientation);
                    return newOrientation;
                });
            });
        };

        const stopMotionTracking = () => {
            if (subscription) {
                subscription.remove();
                subscription = null;
            }
        };

        startMotionTracking();

        return () => {
            stopMotionTracking();
        };
    }, []);
    
    return (
        <View style={styles.container}>
            {/* <View style={styles.hotspotContainer} pointerEvents="box-none">
                {children}
            </View> */}
            
            {/* <View style={styles.compassContainer} pointerEvents="box-none">
                <View style={styles.compass}>
                    <View
                        style={[
                            styles.compassNeedle,
                            {
                                transform: [{ rotate: `${orientation.yaw}deg` }],
                            },
                        ]}
                    />
                </View>
            </View> */}

                <GLView
                    style={{ flex: 1, width: '100%', height: '100%' }}
                    onContextCreate={onContextCreate}
                    {...panResponder.panHandlers}
                />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    glView: {
        flex: 1,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
