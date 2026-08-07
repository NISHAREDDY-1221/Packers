import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Packaging Materials...');

  // 1. Create or get Category
  let category = await prisma.category.findUnique({ where: { name: 'Packaging Materials' } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Packaging Materials',
        description: 'All packaging related items',
        isActive: true,
      }
    });
    console.log(`Created Category: ${category.name}`);
  }

  // 2. Ensure UOMs exist
  const uomsToEnsure = [
    { name: 'Pieces', abbreviation: 'PCS' },
    { name: 'Rolls', abbreviation: 'ROLL' },
    { name: 'Meters', abbreviation: 'MTR' }
  ];

  const uomMap = new Map<string, string>();
  for (const u of uomsToEnsure) {
    let uom = await prisma.unitOfMeasure.findUnique({ where: { abbreviation: u.abbreviation } });
    if (!uom) {
      // Also try to find by name just in case
      uom = await prisma.unitOfMeasure.findUnique({ where: { name: u.name } });
      if (!uom) {
        uom = await prisma.unitOfMeasure.create({
          data: {
            name: u.name,
            abbreviation: u.abbreviation,
            isActive: true,
          }
        });
        console.log(`Created UOM: ${uom.abbreviation}`);
      }
    }
    uomMap.set(u.abbreviation, uom.id);
  }

  // 3. Create Products
  const products = [
    { name: '500g Food Pouch', sku: 'PKG-PCH-500G', uomAbbr: 'PCS', stock: 5000 },
    { name: '1kg Food Pouch', sku: 'PKG-PCH-1KG', uomAbbr: 'PCS', stock: 5000 },
    { name: '500ml Bottle', sku: 'PKG-BTL-500ML', uomAbbr: 'PCS', stock: 3000 },
    { name: '1L Bottle', sku: 'PKG-BTL-1L', uomAbbr: 'PCS', stock: 3000 },
    { name: 'Small Carton Box', sku: 'PKG-BOX-SML', uomAbbr: 'PCS', stock: 1000 },
    { name: 'Medium Carton Box', sku: 'PKG-BOX-MED', uomAbbr: 'PCS', stock: 1000 },
    { name: 'Tamper Seal', sku: 'PKG-SEAL-01', uomAbbr: 'PCS', stock: 10000 },
    { name: 'Packing Tape', sku: 'PKG-TAPE-01', uomAbbr: 'ROLL', stock: 200 },
    { name: 'Packaging Thread', sku: 'PKG-THRD-01', uomAbbr: 'MTR', stock: 5000 },
    { name: 'Gift Box', sku: 'PKG-GIFT-01', uomAbbr: 'PCS', stock: 500 },
  ];

  for (const p of products) {
    let product = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: p.name,
          sku: p.sku,
          categoryId: category.id,
          uomId: uomMap.get(p.uomAbbr)!,
          type: 'PACKAGING', // mapped to ProductType.PACKAGING
          isActive: true,
          availableStock: p.stock
        }
      });
      console.log(`Created Product: ${product.name}`);
    } else {
      console.log(`Product already exists: ${product.name}`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
