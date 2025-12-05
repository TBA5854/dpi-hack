
import { authService } from '../src/auth/auth.service';
import prisma from '../src/prisma';

async function main() {
  const username = 'dummy_user_472'; // The one we created
  const password = 'password123';
  const pin = '123456';

  console.log(`Logging in as ${username}...`);
  try {
    const token = await authService.login(username, password);
    console.log('Login successful.');

    // We can use the service directly since we are in a script, 
    // but let's verify the user exists first.
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error('User not found');

    console.log(`Setting PIN for user ${user.id}...`);
    await authService.setDpiPin(user.id, pin);
    console.log('PIN set successfully to:', pin);

  } catch (e) {
    console.error('Failed:', e);
  }
}

main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
