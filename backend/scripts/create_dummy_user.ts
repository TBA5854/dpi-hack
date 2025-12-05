
import { authService } from '../src/auth/auth.service';
import { locationService } from '../src/location/location.service';
import { DigiPin } from '../src/dpi/grid-encoding';
import prisma from '../src/prisma';

async function main() {
  const targetDpi = '4P7-73P-2T34';
  const username = 'dummy_user_' + Math.floor(Math.random() * 1000);
  const phone = '5555555555' + Math.floor(Math.random() * 100);
  const password = 'password123';

  console.log(`Creating dummy user: ${username} with DPI: ${targetDpi}`);

  // 1. Decode DPI to get coordinates
  let coords;
  try {
    coords = DigiPin.decode(targetDpi);
    console.log(`Decoded DPI to Lat: ${coords.lat}, Long: ${coords.long}`);
  } catch (e) {
    console.error('Failed to decode DPI:', e);
    process.exit(1);
  }

  // 2. Register User
  try {
    const token = await authService.register(username, phone, password);
    console.log('User registered successfully.');
    
    // We need the user ID, so we verify the token or just fetch the user
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error('User not found after registration');

    // 3. Set Location
    // Note: setInitialLocation will re-encode the coordinates to DPI. 
    // Due to floating point precision, it might slightly differ, but should be consistent.
    // However, since we want *exactly* this DPI, we should check if the re-encoding matches.
    
    const reEncoded = DigiPin.encode(coords.lat, coords.long);
    console.log(`Re-encoded DPI check: ${reEncoded}`);
    
    if (reEncoded !== targetDpi) {
        console.warn(`WARNING: Re-encoded DPI (${reEncoded}) does not match target (${targetDpi}). Precision issue?`);
    }

    const loc = await locationService.setInitialLocation(user.id, coords.lat, coords.long);
    console.log('Location set successfully:', loc);
    console.log(`\nUser Created:\nUsername: ${username}\nPassword: ${password}\nDPI: ${loc.dpi}`);

  } catch (e) {
    console.error('Error creating dummy user:', e);
  }
}

main().catch(console.error).finally(async () => {
    await prisma.$disconnect();
});
