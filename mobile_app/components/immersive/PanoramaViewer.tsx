import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Gyroscope } from 'expo-sensors';

interface PanoramaViewerProps {
    imageSource: any;
    onOrientationChange?: (orientation: { pitch: number; yaw: number }) => void;
    children?: React.ReactNode;
}

export default function PanoramaViewer({
    imageSource,
    onOrientationChange,
    children,
}: PanoramaViewerProps) {
    const webViewRef = useRef<WebView>(null);
    const [imageUri, setImageUri] = useState<string>('');

    useEffect(() => {
        if (typeof imageSource === 'object' && imageSource?.uri) {
            setImageUri(imageSource.uri);
        }
    }, [imageSource]);

    // Gyroscope for device orientation
    useEffect(() => {
        let subscription: any;
        const start = async () => {
            try {
                Gyroscope.setUpdateInterval(32);
                subscription = Gyroscope.addListener(({ x, y }) => {
                    if (webViewRef.current) {
                        webViewRef.current.injectJavaScript(`
                            if (window.updateGyro) {
                                window.updateGyro(${x}, ${y});
                            }
                            true;
                        `);
                    }
                });
            } catch (e) {
                console.log('Gyroscope error:', e);
            }
        };
        start();
        return () => { subscription?.remove(); };
    }, []);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #000; touch-action: none; }
        #container { width: 100%; height: 100%; }
        #loading { 
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            color: white; font-family: sans-serif; text-align: center;
        }
        .spinner {
            width: 40px; height: 40px; margin: 0 auto 10px;
            border: 3px solid rgba(255,255,255,0.3); border-top-color: white;
            border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="container"></div>
    <div id="loading"><div class="spinner"></div>Loading panorama...</div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        const IMAGE_URL = '${imageUri}';
        
        let camera, scene, renderer, sphere;
        let isUserInteracting = false;
        let onPointerDownMouseX = 0, onPointerDownMouseY = 0;
        let lon = 0, onPointerDownLon = 0;
        let lat = 0, onPointerDownLat = 0;
        let targetLon = 0, targetLat = 0;
        let phi = 0, theta = 0;
        let fov = 130;
        
        function init() {
            const container = document.getElementById('container');
            
            camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1100);
            scene = new THREE.Scene();
            
            const geometry = new THREE.SphereGeometry(500, 60, 40);
            geometry.scale(-1, 1, 1);
            
            const loader = new THREE.TextureLoader();
            loader.crossOrigin = 'anonymous';
            
            if (IMAGE_URL && IMAGE_URL.length > 0) {
                loader.load(
                    IMAGE_URL,
                    function(texture) {
                        document.getElementById('loading').style.display = 'none';
                        texture.minFilter = THREE.LinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        const material = new THREE.MeshBasicMaterial({ map: texture });
                        sphere = new THREE.Mesh(geometry, material);
                        scene.add(sphere);
                        animate();
                    },
                    undefined,
                    function(err) {
                        console.error('Texture load error:', err);
                        document.getElementById('loading').innerHTML = 'Failed to load image';
                        // Create fallback gradient
                        createFallbackSphere(geometry);
                    }
                );
            } else {
                createFallbackSphere(geometry);
            }
            
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(renderer.domElement);
            
            // Touch events
            container.addEventListener('touchstart', onTouchStart, { passive: false });
            container.addEventListener('touchmove', onTouchMove, { passive: false });
            container.addEventListener('touchend', onTouchEnd, { passive: false });
            
            window.addEventListener('resize', onWindowResize);
        }
        
        function createFallbackSphere(geometry) {
            document.getElementById('loading').style.display = 'none';
            // Create gradient canvas texture
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Sky gradient
            const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
            skyGrad.addColorStop(0, '#87CEEB');
            skyGrad.addColorStop(1, '#E0F0FF');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);
            
            // Ground gradient
            const groundGrad = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
            groundGrad.addColorStop(0, '#90EE90');
            groundGrad.addColorStop(1, '#228B22');
            ctx.fillStyle = groundGrad;
            ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.5);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.MeshBasicMaterial({ map: texture });
            sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);
            animate();
        }
        
        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        let lastTouchX = 0, lastTouchY = 0;
        let lastPinchDist = 0;
        
        function onTouchStart(event) {
            event.preventDefault();
            if (event.touches.length === 1) {
                isUserInteracting = true;
                lastTouchX = event.touches[0].clientX;
                lastTouchY = event.touches[0].clientY;
                onPointerDownLon = lon;
                onPointerDownLat = lat;
            } else if (event.touches.length === 2) {
                lastPinchDist = getPinchDistance(event.touches);
            }
        }
        
        function onTouchMove(event) {
            event.preventDefault();
            if (event.touches.length === 1 && isUserInteracting) {
                const dx = event.touches[0].clientX - lastTouchX;
                const dy = event.touches[0].clientY - lastTouchY;
                targetLon -= dx * 0.2;
                targetLat += dy * 0.2;
                targetLat = Math.max(-85, Math.min(85, targetLat));
                lastTouchX = event.touches[0].clientX;
                lastTouchY = event.touches[0].clientY;
            } else if (event.touches.length === 2) {
                const dist = getPinchDistance(event.touches);
                const delta = lastPinchDist - dist;
                fov = Math.max(50, Math.min(150, fov + delta * 0.1));
                camera.fov = fov;
                camera.updateProjectionMatrix();
                lastPinchDist = dist;
            }
        }
        
        function onTouchEnd(event) {
            isUserInteracting = false;
        }
        
        function getPinchDistance(touches) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
        
        // Gyroscope input from React Native
        window.updateGyro = function(x, y) {
            if (!isUserInteracting) {
                targetLon -= y * 2.0;
                targetLat += x * 2.0;
                targetLat = Math.max(-85, Math.min(85, targetLat));
            }
        };
        
        function lerp(start, end, factor) {
            return start + (end - start) * factor;
        }
        
        function animate() {
            requestAnimationFrame(animate);
            update();
        }
        
        function update() {
            // Smooth interpolation with lerp
            const lerpFactor = 0.1;
            lon = lerp(lon, targetLon, lerpFactor);
            lat = lerp(lat, targetLat, lerpFactor);
            
            phi = THREE.MathUtils.degToRad(90 - lat);
            theta = THREE.MathUtils.degToRad(lon);
            
            const x = 500 * Math.sin(phi) * Math.cos(theta);
            const y = 500 * Math.cos(phi);
            const z = 500 * Math.sin(phi) * Math.sin(theta);
            
            camera.lookAt(x, y, z);
            renderer.render(scene, camera);
            
            // Send orientation back to React Native
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'orientation',
                    pitch: lat,
                    yaw: lon
                }));
            }
        }
        
        init();
    </script>
</body>
</html>
    `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'orientation' && onOrientationChange) {
                onOrientationChange({ pitch: data.pitch, yaw: data.yaw });
            }
        } catch (e) {}
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                style={styles.webview}
                source={{ html: htmlContent }}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                mixedContentMode="always"
                onMessage={handleMessage}
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
            />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    webview: { flex: 1, backgroundColor: '#000' },
});
