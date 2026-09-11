import prisma from '../src/core/database/prisma.client';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Permissions
  const permissions = [
    'MANAGE_USERS',
    'MANAGE_ROLES',
    'MANAGE_PRODUCTS',
    'VIEW_INVENTORY',
    'PROCESS_SALES',
    'VIEW_REPORTS',
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm },
      update: {},
      create: { name: perm, description: `Allows to ${perm.toLowerCase().replace('_', ' ')}` },
    });
  }

  // 2. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'System Administrator with full access' },
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: 'CASHIER' },
    update: {},
    create: { name: 'CASHIER', description: 'Point of Sale operator' },
  });

  // 3. Assign Permissions to Roles (Admin gets all)
  const allPermissions = await prisma.permission.findMany();
  
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Cashier gets specific permissions
  const posPermission = await prisma.permission.findUnique({ where: { name: 'PROCESS_SALES' } });
  if (posPermission) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: cashierRole.id, permissionId: posPermission.id },
      },
      update: {},
      create: { roleId: cashierRole.id, permissionId: posPermission.id },
    });
  }

  // 4. Create an Initial Super Admin User
  const adminEmail = 'admin@ecopos.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Super Administrator',
        roles: {
          create: [{ roleId: adminRole.id }]
        }
      },
    });
    console.log(`👤 Admin user created: ${user.email}`);
  }

  console.log('✅ Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });