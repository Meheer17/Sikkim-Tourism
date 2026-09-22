import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import config from '@/config/api.config';

export default function ThreeDScreen() {
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isAutoRotating, setIsAutoRotating] = useState(true);

    const placeName = (params.name as string) || '3D Monastery Model';

    // Parse model name from parameters (modelPath, modelName, or url)
    const rawParam = (params.modelPath as string) || (params.modelName as string) || (params.url as string) || '';

    const cleanModelName = useMemo(() => {
        if (!rawParam) return 'rumtek.glb';

        let name = rawParam.trim();
        // If it's a URL (including stale domains), extract filename
        const match = name.match(/(?:models|viewer)\/([^/?#]+)/i);
        if (match && match[1]) {
            name = match[1];
        } else if (name.includes('/')) {
            name = name.split('/').pop() || name;
        }

        // Clean any url-encoding
        name = decodeURIComponent(name);

        // Ensure extension
        if (!name.toLowerCase().endsWith('.glb') && !name.toLowerCase().endsWith('.gltf')) {
            name = `${name}.glb`;
        }

        return name;
    }, [rawParam]);

    const baseURL = (config.api.baseURL || 'http://192.168.29.140:8000/api/v1').replace(/\/$/, '');
    const serverRoot = baseURL.replace(/\/api\/v1\/?$/, '');
    const modelUrl = `${baseURL}/cdn/models/${cleanModelName}`;
    const localScriptUrl = `${serverRoot}/static/js/model-viewer.min.js`;

    const htmlContent = useMemo(() => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>3D Model Viewer</title>
  <script type="module" src="${localScriptUrl}"></script>
  <script type="module">
    // Fallback to Google CDN if local script didn't register model-viewer
    if (!customElements.get('model-viewer')) {
      const s = document.createElement('script');
      s.type = 'module';
      s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
      document.head.appendChild(s);
    }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, #1e293b 0%, #030712 100%);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    model-viewer {
      width: 100%;
      height: 100%;
      --progress-bar-color: #38bdf8;
      --progress-bar-height: 4px;
    }
    #badge {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      padding: 8px 18px;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 500;
      pointer-events: none;
      z-index: 10;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <model-viewer
    id="mv"
    src="${modelUrl}"
    alt="${cleanModelName}"
    auto-rotate
    rotation-per-second="25deg"
    camera-controls
    touch-action="pan-y"
    shadow-intensity="1.4"
    shadow-softness="0.8"
    exposure="1.15"
    environment-image="neutral"
    loading="eager"
  >
  </model-viewer>
  <div id="badge">🖐 Drag to Rotate &bull; Pinch to Zoom</div>
  <script>
    const mv = document.getElementById('mv');
    
    mv.addEventListener('load', () => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOADED' }));
      }
    });

    mv.addEventListener('error', (e) => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'ERROR', 
          detail: (e && e.detail) ? String(e.detail) : 'Model load failed' 
        }));
      }
    });

    window.toggleAutoRotate = (enable) => {
      if (mv) {
        mv.autoRotate = enable;
      }
    };

    window.resetCamera = () => {
      if (mv) {
        mv.cameraOrbit = '0deg 75deg 105%';
        mv.cameraTarget = 'auto auto auto';
        mv.jumpCameraToGoal();
      }
    };
  </script>
</body>
</html>
    `, [cleanModelName, modelUrl, localScriptUrl]);

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'LOADED') {
                setIsLoading(false);
                setLoadError(null);
            } else if (data.type === 'ERROR') {
                setIsLoading(false);
                setLoadError(data.detail || 'Failed to render 3D model');
            }
        } catch (e) {
            console.warn('Error parsing WebView message:', e);
        }
    };

    const handleToggleAutoRotate = () => {
        const next = !isAutoRotating;
        setIsAutoRotating(next);
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`window.toggleAutoRotate && window.toggleAutoRotate(${next}); true;`);
        }
    };

    const handleResetCamera = () => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`window.resetCamera && window.resetCamera(); true;`);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color="#fff" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle} numberOfLines={1}>
                    {placeName}
                </ThemedText>
                
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={handleToggleAutoRotate} style={styles.actionBtn}>
                        <ThemedText style={[styles.actionBtnText, isAutoRotating && styles.actionBtnActive]}>
                            {isAutoRotating ? 'Pause' : 'Rotate'}
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleResetCamera} style={styles.actionBtn}>
                        <ThemedText style={styles.actionBtnText}>Reset</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                <WebView
                    ref={webViewRef}
                    source={{ html: htmlContent, baseUrl: serverRoot }}
                    style={styles.webview}
                    originWhitelist={['*']}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowFileAccess={true}
                    allowUniversalAccessFromFileURLs={true}
                    mixedContentMode="always"
                    onMessage={handleMessage}
                    onLoadEnd={() => {
                        // Safety timeout to dismiss loader after 5s even if load event was missed
                        setTimeout(() => setIsLoading(false), 5000);
                    }}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error: ', nativeEvent);
                        setIsLoading(false);
                        setLoadError(nativeEvent.description || 'Failed to load 3D viewer');
                    }}
                />

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#38bdf8" />
                        <Text style={styles.loadingText}>Loading 3D Model...</Text>
                        <Text style={styles.loadingSubtext}>{cleanModelName}</Text>
                    </View>
                )}

                {loadError && (
                    <View style={styles.errorOverlay}>
                        <IconSymbol name="exclamationmark.triangle" size={44} color="#f87171" />
                        <Text style={styles.errorTitle}>Could Not Load 3D Model</Text>
                        <Text style={styles.errorText}>{loadError}</Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => {
                                setIsLoading(true);
                                setLoadError(null);
                                webViewRef.current?.reload();
                            }}
                        >
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#030712',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#0b0f19',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#1e293b',
    },
    backButton: {
        marginRight: 10,
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#f8fafc',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },
    actionBtn: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 14,
        backgroundColor: '#1e293b',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#94a3b8',
    },
    actionBtnActive: {
        color: '#38bdf8',
    },
    content: {
        flex: 1,
        position: 'relative',
    },
    webview: {
        flex: 1,
        backgroundColor: '#030712',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    loadingText: {
        marginTop: 14,
        fontSize: 15,
        fontWeight: '600',
        color: '#f1f5f9',
    },
    loadingSubtext: {
        marginTop: 4,
        fontSize: 12,
        color: '#64748b',
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#030712',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        zIndex: 30,
    },
    errorTitle: {
        marginTop: 12,
        fontSize: 17,
        fontWeight: '600',
        color: '#f87171',
    },
    errorText: {
        marginTop: 6,
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 18,
    },
    retryBtn: {
        backgroundColor: '#0284c7',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryBtnText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
});
