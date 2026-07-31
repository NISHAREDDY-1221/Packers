async function test() {
  try {
    // 1. Get an operator from DB
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const qc = await prisma.user.findFirst({ where: { role: { name: 'QC_INSPECTOR' } }, include: { role: true } });
    
    if (!qc) {
      console.log('No QC found');
      return prisma.$disconnect();
    }
    
    console.log('Logging in as:', qc.email);
    
    // 2. Login
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: qc.email, password: 'password' })
    });
    
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
    
    const token = loginData.data.token;
    console.log('Got token:', token.substring(0, 15) + '...');
    
    // 3. Fetch Work Orders
    const woRes = await fetch('http://localhost:5000/api/v1/work-orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const woData = await woRes.json();
    if (!woRes.ok) throw new Error(JSON.stringify(woData));
    
    console.log('Success! Got WOs:', woData.data.length);
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
test();
