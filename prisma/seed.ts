import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep data)
  console.log('🧹 Cleaning existing data...');
  await prisma.userWarning.deleteMany();
  await prisma.roleRequest.deleteMany();
  await prisma.downloadHistory.deleteMany();
  await prisma.resourceRating.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.moderationLog.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.pendingUpload.deleteMany();
  await prisma.user.deleteMany();
  await prisma.college.deleteMany();

  // 1. Create Colleges
  console.log('🏫 Creating colleges...');
  const college1 = await prisma.college.create({
    data: {
      name: 'Government College Chamba',
      city: 'Chamba',
      state: 'Himachal Pradesh',
      logo: 'https://example.com/gcc-logo.png',
    },
  });

  const college2 = await prisma.college.create({
    data: {
      name: 'DAV College Jalandhar',
      city: 'Jalandhar',
      state: 'Punjab',
    },
  });

  // 2. Create Users (different roles)
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'owner@vidyaverse.com',
      passwordHash: hashedPassword,
      name: 'System Owner',
      roles: ['OWNER', 'ADMIN'],
      collegeId: college1.id,
      emailVerified: true,
      semester: 8,
      department: 'COMPUTER',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@vidyaverse.com',
      passwordHash: hashedPassword,
      name: 'Admin User',
      roles: ['ADMIN'],
      collegeId: college1.id,
      emailVerified: true,
      semester: 6,
      department: 'COMPUTER',
    },
  });

  const mentor = await prisma.user.create({
    data: {
      email: 'mentor@vidyaverse.com',
      passwordHash: hashedPassword,
      name: 'Mentor Singh',
      bio: 'Expert in Data Structures and Algorithms',
      roles: ['MENTOR', 'CONTRIBUTOR'],
      collegeId: college1.id,
      emailVerified: true,
      semester: 7,
      department: 'COMPUTER',
    },
  });

  const contributor1 = await prisma.user.create({
    data: {
      email: 'contributor1@vidyaverse.com',
      passwordHash: hashedPassword,
      name: 'Rahul Sharma',
      roles: ['CONTRIBUTOR', 'STUDENT'],
      collegeId: college1.id,
      emailVerified: true,
      semester: 5,
      department: 'COMPUTER',
    },
  });

  const contributor2 = await prisma.user.create({
    data: {
      email: 'contributor2@vidyaverse.com',
      passwordHash: hashedPassword,
      name: 'Priya Patel',
      roles: ['CONTRIBUTOR', 'STUDENT'],
      collegeId: college2.id,
      emailVerified: true,
      semester: 4,
      department: 'PHYSICS',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student1@vidyaverse.com',
      passwordHash: hashedPassword,
      name: 'Amit Kumar',
      roles: ['STUDENT'],
      collegeId: college1.id,
      emailVerified: true,
      semester: 3,
      department: 'COMPUTER',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@vidyaverse.com',
      passwordHash: hashedPassword,
      name: 'Neha Verma',
      roles: ['STUDENT'],
      collegeId: college1.id,
      emailVerified: true,
      semester: 2,
      department: 'MATHEMATICS',
    },
  });

  const warnedStudent = await prisma.user.create({
    data: {
      email: 'warned@vidyaverse.com',
      passwordHash: hashedPassword,
      name: 'Warned Student',
      roles: ['STUDENT'],
      collegeId: college1.id,
      emailVerified: true,
      semester: 3,
      department: 'COMPUTER',
      warningCount: 2,
    },
  });

  // 3. Create Approved Resources
  console.log('📚 Creating approved resources...');
  const resource1 = await prisma.resource.create({
    data: {
      title: 'Data Structures Complete Notes',
      description: 'Comprehensive notes covering all topics: Arrays, Linked Lists, Trees, Graphs',
      subject: 'Data Structures',
      semester: 3,
      department: 'COMPUTER',
      resourceType: 'NOTES',
      chapterTopic: 'All Chapters',
      fileUrl: 'https://example.com/files/ds-notes.pdf',
      fileSize: 2500000,
      fileHash: 'hash123abc',
      uploadedById: contributor1.id,
      approvedById: admin.id,
      approvedAt: new Date(),
      downloadCount: 45,
      viewCount: 120,
      averageRating: 4.5,
      totalRatings: 12,
    },
  });

  const resource2 = await prisma.resource.create({
    data: {
      title: 'Algorithms Previous Year Questions (2020-2024)',
      description: 'Collection of PYQs from last 4 years with solutions',
      subject: 'Algorithms',
      semester: 4,
      department: 'COMPUTER',
      resourceType: 'PYQ',
      fileUrl: 'https://example.com/files/algo-pyq.pdf',
      fileSize: 1800000,
      fileHash: 'hash456def',
      uploadedById: contributor1.id,
      approvedById: admin.id,
      approvedAt: new Date(),
      downloadCount: 78,
      viewCount: 200,
      averageRating: 4.8,
      totalRatings: 25,
    },
  });

  const resource3 = await prisma.resource.create({
    data: {
      title: 'Quantum Mechanics Syllabus 2024',
      description: 'Official syllabus for Quantum Mechanics course',
      subject: 'Quantum Mechanics',
      semester: 5,
      department: 'PHYSICS',
      resourceType: 'SYLLABUS',
      fileUrl: 'https://example.com/files/qm-syllabus.pdf',
      fileSize: 500000,
      fileHash: 'hash789ghi',
      uploadedById: contributor2.id,
      approvedById: admin.id,
      approvedAt: new Date(),
      downloadCount: 30,
      viewCount: 95,
    },
  });

  const resource4 = await prisma.resource.create({
    data: {
      title: 'DBMS Notes - Normalization & Transactions',
      description: 'Detailed notes on database normalization and transaction management',
      subject: 'Database Management',
      semester: 4,
      department: 'COMPUTER',
      resourceType: 'NOTES',
      chapterTopic: 'Normalization, Transactions',
      fileUrl: 'https://example.com/files/dbms-notes.pdf',
      fileSize: 3200000,
      fileHash: 'hash101jkl',
      uploadedById: mentor.id,
      approvedById: admin.id,
      approvedAt: new Date(),
      downloadCount: 62,
      viewCount: 180,
      averageRating: 4.3,
      totalRatings: 8,
    },
  });

  // 4. Create Pending Uploads (awaiting approval)
  console.log('⏳ Creating pending uploads...');
  const pending1 = await prisma.pendingUpload.create({
    data: {
      title: 'Operating Systems Notes - Process Scheduling',
      description: 'Notes on various CPU scheduling algorithms',
      subject: 'Operating Systems',
      semester: 4,
      department: 'COMPUTER',
      resourceType: 'NOTES',
      chapterTopic: 'Process Scheduling',
      blobUrl: 'https://blob.vercel-storage.com/pending-os-notes.pdf',
      fileSize: 1500000,
      fileHash: 'hash202mno',
      uploadedById: student1.id,
      status: 'PENDING',
    },
  });

  const pending2 = await prisma.pendingUpload.create({
    data: {
      title: 'Computer Networks PYQ 2023',
      description: 'Previous year question paper with answers',
      subject: 'Computer Networks',
      semester: 5,
      department: 'COMPUTER',
      resourceType: 'PYQ',
      blobUrl: 'https://blob.vercel-storage.com/pending-cn-pyq.pdf',
      fileSize: 800000,
      fileHash: 'hash303pqr',
      uploadedById: contributor1.id,
      status: 'UNDER_REVIEW',
      assignedAdminId: admin.id,
    },
  });

  const pending3 = await prisma.pendingUpload.create({
    data: {
      title: 'Linear Algebra Notes',
      description: 'Complete notes on matrices and vector spaces',
      subject: 'Linear Algebra',
      semester: 2,
      department: 'MATHEMATICS',
      resourceType: 'NOTES',
      blobUrl: 'https://blob.vercel-storage.com/pending-la-notes.pdf',
      fileSize: 2000000,
      fileHash: 'hash404stu',
      uploadedById: student2.id,
      status: 'REJECTED',
      rejectionReason: 'Handwriting is unclear, please upload typed notes',
      assignedAdminId: admin.id,
      appealCount: 0,
    },
  });

  // 5. Create Chat Session for Appeal
  console.log('💬 Creating chat session...');
  const chatSession = await prisma.chatSession.create({
    data: {
      pendingUploadId: pending3.id,
      userId: student2.id,
      adminId: admin.id,
      status: 'ACTIVE',
    },
  });

  // Update pending upload with chat session
  await prisma.pendingUpload.update({
    where: { id: pending3.id },
    data: { chatSessionId: chatSession.id, status: 'APPEALED', appealCount: 1 },
  });

  // 6. Create Chat Messages
  console.log('💬 Creating chat messages...');
  await prisma.chatMessage.createMany({
    data: [
      {
        chatSessionId: chatSession.id,
        senderId: student2.id,
        senderType: 'CONTRIBUTOR',
        messageText: 'Hi, I would like to appeal the rejection. The handwriting is mine and is readable.',
        isRead: true,
      },
      {
        chatSessionId: chatSession.id,
        senderId: admin.id,
        senderType: 'ADMIN',
        messageText: 'Thanks for appealing. Can you please upload a sample page so I can review?',
        isRead: false,
      },
    ],
  });

  // 7. Create Moderation Logs
  console.log('📝 Creating moderation logs...');
  await prisma.moderationLog.createMany({
    data: [
      {
        originalUploadId: pending3.id,
        decision: 'REJECTED',
        reason: 'Handwriting is unclear, please upload typed notes',
        decidedById: admin.id,
        metadataSnapshot: {
          title: 'Linear Algebra Notes',
          semester: 2,
          department: 'MATHEMATICS',
        },
      },
      {
        originalUploadId: pending1.id,
        resourceId: resource1.id,
        decision: 'APPROVED',
        reason: 'Good quality content',
        decidedById: admin.id,
        metadataSnapshot: {
          title: 'Data Structures Complete Notes',
          semester: 3,
          department: 'COMPUTER',
        },
      },
    ],
  });

  // 8. Create Bookmarks
  console.log('🔖 Creating bookmarks...');
  await prisma.bookmark.createMany({
    data: [
      { userId: student1.id, resourceId: resource1.id },
      { userId: student1.id, resourceId: resource2.id },
      { userId: student2.id, resourceId: resource1.id },
      { userId: mentor.id, resourceId: resource4.id },
    ],
  });

  // 9. Create Ratings & Reviews
  console.log('⭐ Creating ratings...');
  await prisma.resourceRating.createMany({
    data: [
      {
        resourceId: resource1.id,
        userId: student1.id,
        rating: 5,
        reviewText: 'Excellent notes! Very comprehensive and easy to understand.',
      },
      {
        resourceId: resource1.id,
        userId: student2.id,
        rating: 4,
        reviewText: 'Good content but could use more examples.',
      },
      {
        resourceId: resource2.id,
        userId: student1.id,
        rating: 5,
        reviewText: 'Perfect for exam preparation!',
      },
      {
        resourceId: resource4.id,
        userId: contributor1.id,
        rating: 4,
      },
    ],
  });

  // 10. Create Download History
  console.log('📥 Creating download history...');
  await prisma.downloadHistory.createMany({
    data: [
      { userId: student1.id, resourceId: resource1.id },
      { userId: student1.id, resourceId: resource2.id },
      { userId: student2.id, resourceId: resource1.id },
      { userId: student2.id, resourceId: resource3.id },
      { userId: mentor.id, resourceId: resource4.id },
      { userId: contributor1.id, resourceId: resource1.id },
    ],
  });

  // 11. Create Role Requests
  console.log('🎭 Creating role requests...');
  await prisma.roleRequest.createMany({
    data: [
      {
        userId: student1.id,
        requestedRole: 'CONTRIBUTOR',
        status: 'PENDING',
      },
      {
        userId: student2.id,
        requestedRole: 'CONTRIBUTOR',
        status: 'APPROVED',
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    ],
  });

  // 12. Create Warnings
  console.log('⚠️ Creating user warnings...');
  await prisma.userWarning.createMany({
    data: [
      {
        userId: warnedStudent.id,
        warnedById: admin.id,
        reason: 'Uploaded copyrighted material',
      },
      {
        userId: warnedStudent.id,
        warnedById: admin.id,
        reason: 'Spam uploads',
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Colleges: 2`);
  console.log(`   Users: 8 (1 Owner, 1 Admin, 1 Mentor, 2 Contributors, 3 Students)`);
  console.log(`   Approved Resources: 4`);
  console.log(`   Pending Uploads: 3`);
  console.log(`   Chat Sessions: 1`);
  console.log(`   Chat Messages: 2`);
  console.log(`   Moderation Logs: 2`);
  console.log(`   Bookmarks: 4`);
  console.log(`   Ratings: 4`);
  console.log(`   Downloads: 6`);
  console.log(`   Role Requests: 2`);
  console.log(`   Warnings: 2`);
  console.log('\n🔐 All users password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });