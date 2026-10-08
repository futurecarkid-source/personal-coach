/* Preparación de pruebas: Reanimated y worklets corren sin código nativo. */
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
require('react-native-reanimated').setUpTests();
