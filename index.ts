

const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError(...args);
  if (args[0]?.stack) {
    originalConsoleError('STACK:', args[0].stack);
  }
};

ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  console.log('=== GLOBAL ERROR ===');
  console.log('message:', error.message);
  console.log('stack:', error.stack);
  console.log('isFatal:', isFatal);
});

import { registerRootComponent } from 'expo';

import App from './App';


// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
