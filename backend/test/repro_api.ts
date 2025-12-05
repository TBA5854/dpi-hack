
async function main() {
  const username = 'api_user_' + Date.now();
  const phoneNumber = '9876543210' + Math.floor(Math.random() * 1000);
  const password = 'password123';

  console.log(`Registering user via API: ${username}`);
  const regRes = await fetch('http://localhost:3001/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, phoneNumber, password }),
  });

  if (!regRes.ok) {
    console.error('Registration failed:', await regRes.text());
    return;
  }
  console.log('Registration successful');

  console.log('Attempting login via API...');
  const loginRes = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: username, password }),
  });

  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
  } else {
    console.log('Login successful:', await loginRes.json());
  }
}

main();
