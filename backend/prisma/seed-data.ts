import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', description: 'Admin', permissions: ['ALL'] } });
  const adminUser = await prisma.user.upsert({ where: { email: 'admin@villagkart.com' }, update: {}, create: { email: 'admin@villagkart.com', password: 'hash', name: 'Admin User', roleId: adminRole.id } });

  const cat = await prisma.category.upsert({ where: { name: 'Pulses' }, update: {}, create: { name: 'Pulses' } });
  const uom = await prisma.unitOfMeasure.upsert({ where: { name: 'Kilogram' }, update: {}, create: { name: 'Kilogram', abbreviation: 'kg' } });
  
  const prod = await prisma.product.upsert({ where: { sku: 'PUL-TOOR-1KG' }, update: {}, create: { sku: 'PUL-TOOR-1KG', name: 'Toor Dal 1kg', categoryId: cat.id, uomId: uom.id, type: 'FINISHED_GOOD' } });
  const rec = await prisma.recipe.upsert({ where: { code: 'REC-TOOR-1KG' }, update: {}, create: { code: 'REC-TOOR-1KG', name: 'Toor Dal 1kg Recipe', outputProductId: prod.id, outputQty: 1 } });
  
  const wo = await prisma.workOrder.upsert({
    where: { woNumber: 'WO-12345' },
    update: {},
    create: {
      woNumber: 'WO-12345',
      productId: prod.id,
      recipeId: rec.id,
      status: 'APPROVED',
      priority: 'HIGH',
      requiredQty: 500,
      supervisorId: adminUser.id
    }
  });
  console.log('Seeded data');
}
main().finally(() => prisma.$disconnect());

