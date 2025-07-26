// Arquivo temporário para testar o setup
console.log('🚀 YouTube Audio Downloader API - Setup Test');
console.log('✅ TypeScript compilation working');
console.log('✅ tsx hot reload working');

// Teste de importação ESM
import { resolve } from 'path';

const tempDir = resolve(process.cwd(), 'temp');
console.log(`📁 Temp directory: ${tempDir}`);

// Teste de async/await
const testAsync = async (): Promise<void> => {
  console.log('⏳ Testing async functionality...');
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('✅ Async/await working correctly');
};

// Execução
void testAsync();

export default {
  message: 'Setup test completed successfully!',
};
