import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { hash } from 'bcryptjs';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
  { key: 'users:read', description: 'View users' },
  { key: 'users:create', description: 'Create users' },
  { key: 'users:update', description: 'Update users' },
  { key: 'users:delete', description: 'Delete users' },
  { key: 'roles:read', description: 'View roles' },
  { key: 'roles:create', description: 'Create roles' },
  { key: 'roles:update', description: 'Update roles' },
  { key: 'roles:delete', description: 'Delete roles' },
  { key: 'dashboard:read', description: 'View dashboard' },
];

async function main() {
  // Create permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      permissions: { set: PERMISSIONS.map((p) => ({ key: p.key })) },
    },
    create: {
      name: 'admin',
      description: 'Full system access',
      permissions: { connect: PERMISSIONS.map((p) => ({ key: p.key })) },
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {
      permissions: {
        set: PERMISSIONS.filter((p) => !p.key.startsWith('roles:')).map((p) => ({ key: p.key })),
      },
    },
    create: {
      name: 'manager',
      description: 'User management access',
      permissions: {
        connect: PERMISSIONS.filter((p) => !p.key.startsWith('roles:')).map((p) => ({ key: p.key })),
      },
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {
      permissions: {
        set: [{ key: 'dashboard:read' }],
      },
    },
    create: {
      name: 'user',
      description: 'Basic access',
      permissions: { connect: [{ key: 'dashboard:read' }] },
    },
  });

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      password: adminPassword,
      roleId: adminRole.id,
    },
  });

  // Create manager user
  const managerPassword = await hash('manager123', 12);
  await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      name: 'Manager',
      email: 'manager@example.com',
      password: managerPassword,
      roleId: managerRole.id,
    },
  });

  // Create regular user
  const userPassword = await hash('user123', 12);
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      name: 'User',
      email: 'user@example.com',
      password: userPassword,
      roleId: userRole.id,
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
