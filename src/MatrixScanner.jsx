import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { Component } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ResultsPage } from './ResultsPage';
import { ScanPage } from './ScanPage';

const Stack = createStackNavigator();

export class MatrixScanner extends Component {

  render() {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="scan">
            <Stack.Screen name="scan" component={ScanPage} options={{ title: 'MatrixScanSimple' }} />
            <Stack.Screen name="results" component={ResultsPage} options={{ title: 'Scan Results' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }
}