import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

const endpointsToTest = [
  { method: 'GET', url: '/health' },
  { method: 'GET', url: '/users/profile' },
  { method: 'GET', url: '/auth/operators' },
  { method: 'GET', url: '/auth/qc-inspectors' },
  { method: 'GET', url: '/master-data/products' },
  { method: 'GET', url: '/master-data/categories' },
  { method: 'GET', url: '/master-data/recipes' },
  { method: 'GET', url: '/work-orders' },
  { method: 'GET', url: '/workflows/quality-checks' },
  { method: 'GET', url: '/workflows/qc-checklists' },
  { method: 'GET', url: '/workflows/finished-goods' },
  { method: 'GET', url: '/workflows/repacking' },
  { method: 'GET', url: '/reports/yield?startDate=2024-01-01&endDate=2024-12-31' },
  { method: 'GET', url: '/reports/qc-summary?startDate=2024-01-01&endDate=2024-12-31' },
  { method: 'GET', url: '/approvals' },
  { method: 'GET', url: '/settings' },
  { method: 'GET', url: '/notifications' },
];

async function runTests() {
  console.log('--- API Health Check Started ---\n');
  let token = '';

  try {
    // 1. Get an Admin User
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    if (!adminRole) throw new Error('Admin role not found');
    
    const adminUser = await prisma.user.findFirst({ where: { roleId: adminRole.id } });
    if (!adminUser) throw new Error('Admin user not found');
    
    console.log(`Using Admin User: ${adminUser.email}`);
    
    // 2. Generate JWT
    token = jwt.sign(
      { id: adminUser.id, role: adminRole.name, permissions: adminRole.permissions },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
    console.log('Token generated successfully.\n');
  } catch (error: any) {
    console.error('Failed to authenticate:', error.message);
    process.exit(1);
  }

  // 3. Test Endpoints
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const endpoint of endpointsToTest) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.url}`, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      if (success) passed++;
      else failed++;
      
      results.push({
        endpoint: `${endpoint.method} ${endpoint.url}`,
        status: response.status,
        statusText: response.statusText,
        passed: success
      });
      
      console.log(`[${success ? 'PASS' : 'FAIL'}] ${endpoint.method} ${endpoint.url} - ${response.status} ${response.statusText}`);
      
      if (!success) {
         try {
           const body = await response.json();
           console.log(`      Error: ${JSON.stringify(body)}`);
         } catch(e) {}
      }
    } catch (error: any) {
      failed++;
      results.push({
        endpoint: `${endpoint.method} ${endpoint.url}`,
        status: 0,
        statusText: 'Network Error',
        passed: false
      });
      console.log(`[FAIL] ${endpoint.method} ${endpoint.url} - Network Error: ${error.message}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total: ${endpointsToTest.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
}

runTests().finally(() => prisma.$disconnect());
