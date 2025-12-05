
import { authService } from '../src/auth/auth.service';
import { locationService } from '../src/location/location.service';
import prisma from '../src/prisma';

async function main() {
  const user1Name = 'user1_' + Date.now();
  const user2Name = 'user2_' + Date.now();
  const phone1 = '1111111111' + Math.floor(Math.random() * 100);
  const phone2 = '2222222222' + Math.floor(Math.random() * 100);
  const password = 'password123';

  // 1. Register two users
  console.log('Registering users...');
  await authService.register(user1Name, phone1, password);
  await authService.register(user2Name, phone2, password);

  const user1 = await prisma.user.findUnique({ where: { username: user1Name } });
  const user2 = await prisma.user.findUnique({ where: { username: user2Name } });

  if (!user1 || !user2) throw new Error('Users not created');

  // 2. Set location for User 1
  const lat = 12.9716; // Bangalore
  const long = 77.5946;

  console.log(`Setting location for User 1 (${user1.id}) at ${lat}, ${long}`);
  const loc1 = await locationService.setInitialLocation(user1.id, lat, long);
  console.log('User 1 Location set:', loc1.dpi);

  // 3. Set SAME location for User 2
  console.log(`Setting location for User 2 (${user2.id}) at ${lat}, ${long}`);
  try {
    const loc2 = await locationService.setInitialLocation(user2.id, lat, long);
    console.log('User 2 Location set:', loc2.dpi);
  } catch (e: any) {
    console.error('Failed to set location for User 2:', e.message || e);
    if (e.code === 'P2002') {
      console.log('CONFIRMED: Unique constraint violation on DPI');
    }
  }

  // Cleanup
  await prisma.location.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });
}

main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
