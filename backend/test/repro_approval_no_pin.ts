
import { authService } from '../src/auth/auth.service';
import { shareService } from '../src/share/share.service';
import prisma from '../src/prisma';

async function main() {
  const user1Name = 'approver_' + Date.now();
  const user2Name = 'requester_' + Date.now();
  const phone1 = '3333333333' + Math.floor(Math.random() * 100);
  const phone2 = '4444444444' + Math.floor(Math.random() * 100);
  const password = 'password123';

  // 1. Register users
  console.log('Registering users...');
  await authService.register(user1Name, phone1, password);
  await authService.register(user2Name, phone2, password);

  const user1 = await prisma.user.findUnique({ where: { username: user1Name } });
  const user2 = await prisma.user.findUnique({ where: { username: user2Name } });

  if (!user1 || !user2) throw new Error('Users not created');

  // 2. Create Request (User 2 requests User 1)
  console.log('Creating share request...');
  const req = await shareService.createRequest(user2.id, user1Name, 'REQUEST_DPI', 1);
  console.log('Request created:', req.id);

  // 3. Approve WITHOUT PIN
  console.log('Approving request without PIN...');
  try {
    const res = await shareService.respondToRequest(req.id, user1.id, 'APPROVE');
    console.log('Approval successful:', res.status);
  } catch (e) {
    console.error('Approval failed:', e);
  }

  // Cleanup
  await prisma.shareRequest.deleteMany({ where: { id: req.id } });
  await prisma.user.deleteMany({ where: { id: { in: [user1.id, user2.id] } } });
}

main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
