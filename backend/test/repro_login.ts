
import { authService } from '../src/auth/auth.service';
import prisma from '../src/prisma';

async function main() {
  const username = 'testuser_' + Date.now();
  const phoneNumber = '1234567890' + Math.floor(Math.random() * 1000);
  const password = 'password123';

  console.log(`Registering user: ${username}, ${phoneNumber}, ${password}`);
  try {
    const token = await authService.register(username, phoneNumber, password);
    console.log('Registration successful, token:', token ? 'Generated' : 'Failed');
  } catch (e) {
    console.error('Registration failed:', e);
    return;
  }

  console.log('Attempting login...');
  try {
    const loginToken = await authService.login(username, password);
    console.log('Login successful, token:', loginToken ? 'Generated' : 'Failed');
  } catch (e) {
    console.error('Login failed:', e);
  }
  
  // Clean up
  await prisma.user.delete({ where: { username } });
}

main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
