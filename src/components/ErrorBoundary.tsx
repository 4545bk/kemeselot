import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary catches any JS crash in the app and shows the error
 * on screen instead of a white screen. Useful when USB debugging is unavailable.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>⚠️ App Crashed</Text>
                    <Text style={styles.subtitle}>Screenshot this and share it</Text>
                    <ScrollView style={styles.scroll}>
                        <Text style={styles.errorName}>
                            {this.state.error?.name}: {this.state.error?.message}
                        </Text>
                        <Text style={styles.errorStack}>
                            {this.state.error?.stack}
                        </Text>
                        {this.state.errorInfo && (
                            <Text style={styles.errorStack}>
                                Component Stack:{'\n'}
                                {this.state.errorInfo.componentStack}
                            </Text>
                        )}
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a0a14',
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FF4444',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 16,
    },
    scroll: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 8,
        padding: 12,
    },
    errorName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF6666',
        marginBottom: 12,
    },
    errorStack: {
        fontSize: 11,
        color: '#CCC',
        fontFamily: 'monospace',
        lineHeight: 16,
    },
    button: {
        backgroundColor: '#D4AF37',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
});

export default ErrorBoundary;
