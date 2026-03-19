import { prisma } from './lib/prisma';

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test 1: Simple query
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('✅ Database connected successfully!');
    console.log('📅 Server time:', result);
    
    // Test 2: Count users
    const userCount = await prisma.user.count();
    console.log(`👥 Total users in database: ${userCount}`);
    
    // Test 3: Count colleges
    const collegeCount = await prisma.college.count();
    console.log(`🏫 Total colleges in database: ${collegeCount}`);
    
    // Test 4: Count resources
    const resourceCount = await prisma.resource.count();
    console.log(`📚 Total resources in database: ${resourceCount}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();