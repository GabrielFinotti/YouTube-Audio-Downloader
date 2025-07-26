// Arquivo para setup de testes
// Este arquivo será executado antes de cada teste

// Mock de console para testes
global.console = {
  ...console,
  // Silenciar logs durante testes
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Configurações globais para testes
process.env.NODE_ENV = 'test'

// Timeout padrão para testes
jest.setTimeout(30000)
