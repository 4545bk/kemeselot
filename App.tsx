import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme';

const App: React.FC = () => {
    return (
        <NavigationContainer
            theme={{
                dark: true,
                colors: {
                    primary: Colors.gold,
                    background: Colors.backgroundDark,
                    card: Colors.backgroundPrimary,
                    text: Colors.textPrimary,
                    border: Colors.surfaceLight,
                    notification: Colors.crimson,
                },
                fonts: {
                    regular: {
                        fontFamily: 'System',
                        fontWeight: '400',
                    },
                    medium: {
                        fontFamily: 'System',
                        fontWeight: '500',
                    },
                    bold: {
                        fontFamily: 'System',
                        fontWeight: '700',
                    },
                    heavy: {
                        fontFamily: 'System',
                        fontWeight: '900',
                    },
                },
            }}>
            <AppNavigator />
        </NavigationContainer>
    );
};

export default App;
