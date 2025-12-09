import React, { useEffect, useRef, useState } from 'react';

// Type definitions
export interface NetworkState {
    isConnected: boolean;
    isInternetReachable: boolean;
    type: string;
}

// Dynamic import to handle package not installed yet
let NetInfo: any = null;

const initNetInfo = async () => {
    try {
        const module = await import('@react-native-community/netinfo');
        NetInfo = module.default;
    } catch (error) {
        console.warn('NetInfo package not installed yet. Install with: npm install @react-native-community/netinfo');
        NetInfo = null;
    }
};

// Initialize on module load
initNetInfo();

export class NetworkManager {
    private static listeners: Set<(state: NetworkState) => void> = new Set();
    private static currentState: NetworkState = {
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
    };

    static async initialize(): Promise<void> {
        if (!NetInfo) {
            console.warn('NetInfo not initialized. Make sure @react-native-community/netinfo is installed');
            return;
        }

        try {
            const state = await NetInfo.fetch();
            this.updateState(state);

            // Subscribe to network state updates
            const unsubscribe = NetInfo.addEventListener((state: any) => {
                this.updateState(state);
            });

            // Store unsubscribe for cleanup if needed
            (this as any).unsubscribe = unsubscribe;
        } catch (error) {
            console.error('Error initializing NetworkManager:', error);
        }
    }

    private static updateState(state: any): void {
        this.currentState = {
            isConnected: state?.isConnected ?? true,
            isInternetReachable: state?.isInternetReachable ?? true,
            type: state?.type ?? 'unknown',
        };

        // Notify all listeners
        this.listeners.forEach((listener) => {
            listener(this.currentState);
        });
    }

    static isOnline(): boolean {
        return this.currentState.isConnected && this.currentState.isInternetReachable;
    }

    static getState(): NetworkState {
        return { ...this.currentState };
    }

    static subscribe(listener: (state: NetworkState) => void): () => void {
        this.listeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    static hasListener(listener: (state: NetworkState) => void): boolean {
        return this.listeners.has(listener);
    }

    static clearListeners(): void {
        this.listeners.clear();
    }
}

/**
 * Hook to monitor network connectivity
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const listenerRef = useRef<((state: NetworkState) => void) | null>(null);

    useEffect(() => {
        // Initialize network manager on first mount
        NetworkManager.initialize();

        // Create listener
        const handleNetworkChange = (state: NetworkState) => {
            setIsOnline(state.isConnected && state.isInternetReachable);
        };

        listenerRef.current = handleNetworkChange;

        // Subscribe to changes
        const unsubscribe = NetworkManager.subscribe(handleNetworkChange);

        // Get initial state
        const initialState = NetworkManager.getState();
        setIsOnline(initialState.isConnected && initialState.isInternetReachable);

        return () => {
            unsubscribe();
        };
    }, []);

    return isOnline;
}
