// prisma/seed.ts
import "dotenv/config";
import { PrismaClient, UserRole, Department, ResourceType, MentorAvailability, NotificationType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Seed uses DIRECT_URL (port 5432) — bypasses PgBouncer which blocks long-running connections
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting VidyaVerse seed...\n");

  // ──────────────────────────────────────────────
  // 1. COLLEGES
  // ──────────────────────────────────────────────
  console.log("📚 Seeding colleges...");

  const colleges = await Promise.all([
    prisma.college.upsert({
      where: { id: "college-001" },
      update: {},
      create: { id: "college-001", name: "Government College Chamba", city: "Chamba", state: "Himachal Pradesh", isActive: true },
    }),
    prisma.college.upsert({
      where: { id: "college-002" },
      update: {},
      create: { id: "college-002", name: "NIT Hamirpur", city: "Hamirpur", state: "Himachal Pradesh", isActive: true },
    }),
    prisma.college.upsert({
      where: { id: "college-003" },
      update: {},
      create: { id: "college-003", name: "IIT Mandi", city: "Mandi", state: "Himachal Pradesh", isActive: true },
    }),
    prisma.college.upsert({
      where: { id: "college-004" },
      update: {},
      create: { id: "college-004", name: "Himachal Pradesh University", city: "Shimla", state: "Himachal Pradesh", isActive: true },
    }),
    prisma.college.upsert({
      where: { id: "college-005" },
      update: {},
      create: { id: "college-005", name: "DAV College Jalandhar", city: "Jalandhar", state: "Punjab", isActive: true },
    }),
    prisma.college.upsert({
      where: { id: "college-006" },
      update: {},
      create: { id: "college-006", name: "Panjab University", city: "Chandigarh", state: "Punjab", isActive: true },
    }),
    prisma.college.upsert({
      where: { id: "college-007" },
      update: {},
      create: { id: "college-007", name: "Delhi University", city: "New Delhi", state: "Delhi", isActive: true },
    }),
    prisma.college.upsert({
      where: { id: "college-008" },
      update: {},
      create: { id: "college-008", name: "Jaypee University of IT", city: "Solan", state: "Himachal Pradesh", isActive: true },
    }),
  ]);

  console.log(`   ✅ ${colleges.length} colleges created\n`);

  // ──────────────────────────────────────────────
  // 2. USERS
  // ──────────────────────────────────────────────
  console.log("👥 Seeding users...");

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@vidyaverse.com" },
    update: {},
    create: {
      id: "user-owner-001",
      email: "owner@vidyaverse.com",
      passwordHash: hash("Owner@123"),
      name: "Akash Sharma",
      bio: "Founder of VidyaVerse. Building the future of collaborative learning.",
      semester: 6,
      department: Department.COMPUTER,
      collegeId: "college-001",
      roles: [UserRole.OWNER, UserRole.ADMIN],
      emailVerified: true,
      isActive: true,
      canUpload: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@vidyaverse.com" },
    update: {},
    create: {
      id: "user-admin-001",
      email: "admin@vidyaverse.com",
      passwordHash: hash("Admin@123"),
      name: "Priya Verma",
      bio: "Content moderator and admin at VidyaVerse.",
      semester: 4,
      department: Department.COMPUTER,
      collegeId: "college-002",
      roles: [UserRole.ADMIN],
      emailVerified: true,
      isActive: true,
      canUpload: true,
    },
  });

  const mentor1 = await prisma.user.upsert({
    where: { email: "mentor1@vidyaverse.com" },
    update: {},
    create: {
      id: "user-mentor-001",
      email: "mentor1@vidyaverse.com",
      passwordHash: hash("Mentor@123"),
      name: "Rahul Singh",
      bio: "5th year CSE student at NIT Hamirpur. DSA, Web Dev, and ML enthusiast.",
      semester: 5,
      department: Department.COMPUTER,
      collegeId: "college-002",
      roles: [UserRole.MENTOR, UserRole.CONTRIBUTOR],
      emailVerified: true,
      isActive: true,
      canUpload: true,
    },
  });

  const mentor2 = await prisma.user.upsert({
    where: { email: "mentor2@vidyaverse.com" },
    update: {},
    create: {
      id: "user-mentor-002",
      email: "mentor2@vidyaverse.com",
      passwordHash: hash("Mentor@123"),
      name: "Anjali Patel",
      bio: "Mathematics grad, loves teaching calculus and linear algebra.",
      semester: 6,
      department: Department.MATHEMATICS,
      collegeId: "college-004",
      roles: [UserRole.MENTOR, UserRole.CONTRIBUTOR],
      emailVerified: true,
      isActive: true,
      canUpload: true,
    },
  });

  const contributor1 = await prisma.user.upsert({
    where: { email: "contrib1@vidyaverse.com" },
    update: {},
    create: {
      id: "user-contrib-001",
      email: "contrib1@vidyaverse.com",
      passwordHash: hash("Contrib@123"),
      name: "Vikram Nair",
      bio: "3rd year Electronics student. Sharing notes to help juniors.",
      semester: 3,
      department: Department.ELECTRONICS,
      collegeId: "college-003",
      roles: [UserRole.CONTRIBUTOR],
      emailVerified: true,
      isActive: true,
      canUpload: true,
    },
  });

  const student1 = await prisma.user.upsert({
    where: { email: "student1@vidyaverse.com" },
    update: {},
    create: {
      id: "user-student-001",
      email: "student1@vidyaverse.com",
      passwordHash: hash("Student@123"),
      name: "Sneha Gupta",
      bio: "1st year CSE student at HP University. Loves coding!",
      semester: 1,
      department: Department.COMPUTER,
      collegeId: "college-004",
      roles: [UserRole.STUDENT],
      emailVerified: true,
      isActive: true,
      canUpload: true,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "student2@vidyaverse.com" },
    update: {},
    create: {
      id: "user-student-002",
      email: "student2@vidyaverse.com",
      passwordHash: hash("Student@123"),
      name: "Arjun Mehta",
      bio: "2nd year Physics student. Preparing for GATE.",
      semester: 2,
      department: Department.PHYSICS,
      collegeId: "college-002",
      roles: [UserRole.STUDENT],
      emailVerified: true,
      isActive: true,
      canUpload: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "unverified@vidyaverse.com" },
    update: {},
    create: {
      id: "user-student-003",
      email: "unverified@vidyaverse.com",
      passwordHash: hash("Student@123"),
      name: "Riya Kapoor",
      semester: 1,
      department: Department.CHEMISTRY,
      collegeId: "college-001",
      roles: [UserRole.STUDENT],
      emailVerified: false,
      emailVerificationToken: "demo-verify-token-riya-kapoor-12345",
      emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,
      canUpload: true,
    },
  });

  console.log("   ✅ 8 users created\n");

  // ──────────────────────────────────────────────
  // 3. APPROVED RESOURCES
  // ──────────────────────────────────────────────
  console.log("📄 Seeding resources...");

  const resourceData = [
    {
      id: "res-001", title: "Data Structures & Algorithms - Complete Notes",
      description: "Comprehensive notes covering arrays, linked lists, trees, graphs, and dynamic programming. Includes time complexity analysis and solved examples.",
      subject: "Data Structures", semester: 3, department: Department.COMPUTER,
      resourceType: ResourceType.NOTES, chapterTopic: "Complete Syllabus",
      fileUrl: "https://utfs.io/f/demo-dsa-notes.pdf", uploadthingKey: "demo-dsa-notes",
      fileSize: 2_456_789, fileHash: "dsa_notes_hash_001", downloadCount: 342, viewCount: 1205, averageRating: 4.7, totalRatings: 89,
    },
    {
      id: "res-002", title: "Operating Systems PYQ 2019-2023",
      description: "Previous year questions from 2019 to 2023 for Operating Systems. Includes answers and marking scheme.",
      subject: "Operating Systems", semester: 4, department: Department.COMPUTER,
      resourceType: ResourceType.PYQ, chapterTopic: null,
      fileUrl: "https://utfs.io/f/demo-os-pyq.pdf", uploadthingKey: "demo-os-pyq",
      fileSize: 1_234_567, fileHash: "os_pyq_hash_002", downloadCount: 523, viewCount: 1890, averageRating: 4.5, totalRatings: 112,
    },
    {
      id: "res-003", title: "Calculus Syllabus - Semester 1",
      description: "Official syllabus for Calculus (MTH-101) covering limits, derivatives, integration, and series.",
      subject: "Calculus", semester: 1, department: Department.MATHEMATICS,
      resourceType: ResourceType.SYLLABUS, chapterTopic: null,
      fileUrl: "https://utfs.io/f/demo-calc-syllabus.pdf", uploadthingKey: "demo-calc-syllabus",
      fileSize: 345_678, fileHash: "calc_syllabus_hash_003", downloadCount: 789, viewCount: 2341, averageRating: 4.2, totalRatings: 67,
    },
    {
      id: "res-004", title: "Digital Electronics Unit 2 Notes",
      description: "Detailed notes on Boolean Algebra, Logic Gates, Karnaugh Maps, and Combinational Circuits.",
      subject: "Digital Electronics", semester: 3, department: Department.ELECTRONICS,
      resourceType: ResourceType.NOTES, chapterTopic: "Boolean Algebra & Logic Gates",
      fileUrl: "https://utfs.io/f/demo-de-unit2.pdf", uploadthingKey: "demo-de-unit2",
      fileSize: 3_456_789, fileHash: "de_notes_hash_004", downloadCount: 156, viewCount: 678, averageRating: 4.8, totalRatings: 34,
    },
    {
      id: "res-005", title: "Organic Chemistry PYQ 2020-2024",
      description: "Five years of organic chemistry previous year questions with detailed solutions by faculty.",
      subject: "Organic Chemistry", semester: 2, department: Department.CHEMISTRY,
      resourceType: ResourceType.PYQ, chapterTopic: null,
      fileUrl: "https://utfs.io/f/demo-orgchem-pyq.pdf", uploadthingKey: "demo-orgchem-pyq",
      fileSize: 2_123_456, fileHash: "orgchem_pyq_hash_005", downloadCount: 234, viewCount: 890, averageRating: 4.3, totalRatings: 56,
    },
    {
      id: "res-006", title: "Computer Networks Complete Notes",
      description: "All 5 units covered. OSI model, TCP/IP, routing algorithms, socket programming included.",
      subject: "Computer Networks", semester: 5, department: Department.COMPUTER,
      resourceType: ResourceType.NOTES, chapterTopic: "All Units",
      fileUrl: "https://utfs.io/f/demo-cn-notes.pdf", uploadthingKey: "demo-cn-notes",
      fileSize: 4_567_890, fileHash: "cn_notes_hash_006", downloadCount: 445, viewCount: 1567, averageRating: 4.6, totalRatings: 98,
    },
    {
      id: "res-007", title: "Linear Algebra Handwritten Notes",
      description: "Clear handwritten notes on vectors, matrices, eigenvalues, and linear transformations. Excellent for last-minute revision.",
      subject: "Linear Algebra", semester: 2, department: Department.MATHEMATICS,
      resourceType: ResourceType.NOTES, chapterTopic: "Matrices & Eigenvalues",
      fileUrl: "https://utfs.io/f/demo-linalg-notes.pdf", uploadthingKey: "demo-linalg-notes",
      fileSize: 5_678_901, fileHash: "linalg_notes_hash_007", downloadCount: 312, viewCount: 1123, averageRating: 4.9, totalRatings: 78,
    },
    {
      id: "res-008", title: "Physics Mechanics Syllabus",
      description: "B.Sc. Physics Semester 1 mechanics syllabus. Newton's laws, work-energy theorem, rotational dynamics.",
      subject: "Mechanics", semester: 1, department: Department.PHYSICS,
      resourceType: ResourceType.SYLLABUS, chapterTopic: null,
      fileUrl: "https://utfs.io/f/demo-physics-syl.pdf", uploadthingKey: "demo-physics-syl",
      fileSize: 234_567, fileHash: "physics_syl_hash_008", downloadCount: 567, viewCount: 1789, averageRating: 4.1, totalRatings: 45,
    },
  ];

  for (const r of resourceData) {
    await prisma.resource.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        title: r.title,
        description: r.description,
        subject: r.subject,
        semester: r.semester,
        department: r.department,
        resourceType: r.resourceType,
        chapterTopic: r.chapterTopic ?? undefined,
        fileUrl: r.fileUrl,
        uploadthingKey: r.uploadthingKey,
        fileSize: r.fileSize,
        fileHash: r.fileHash,
        downloadCount: r.downloadCount,
        viewCount: r.viewCount,
        averageRating: r.averageRating,
        totalRatings: r.totalRatings,
        uploadedById: contributor1.id,
        approvedById: admin.id,
        approvedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`   ✅ ${resourceData.length} resources created\n`);

  // ──────────────────────────────────────────────
  // 4. PENDING UPLOADS
  // ──────────────────────────────────────────────
  console.log("⏳ Seeding pending uploads...");

  await prisma.pendingUpload.upsert({
    where: { id: "pending-001" },
    update: {},
    create: {
      id: "pending-001",
      title: "DBMS Unit 4 - Normalization Notes",
      description: "Detailed notes on 1NF, 2NF, 3NF, BCNF with examples. Very helpful for exams.",
      subject: "Database Management Systems",
      semester: 4,
      department: Department.COMPUTER,
      resourceType: ResourceType.NOTES,
      chapterTopic: "Normalization",
      blobUrl: "https://utfs.io/f/demo-dbms-pending.pdf",
      uploadthingKey: "demo-dbms-pending",
      fileSize: 1_890_234,
      fileHash: "dbms_pending_hash_001",
      uploadedById: student1.id,
      status: "PENDING",
    },
  });

  await prisma.pendingUpload.upsert({
    where: { id: "pending-002" },
    update: {},
    create: {
      id: "pending-002",
      title: "Quantum Physics PYQ 2022-2024",
      description: "3 years of Quantum Physics previous year papers. Includes wave functions, Schrodinger equation questions.",
      subject: "Quantum Physics",
      semester: 5,
      department: Department.PHYSICS,
      resourceType: ResourceType.PYQ,
      blobUrl: "https://utfs.io/f/demo-quantum-pending.pdf",
      uploadthingKey: "demo-quantum-pending",
      fileSize: 987_654,
      fileHash: "quantum_pending_hash_002",
      uploadedById: student2.id,
      status: "PENDING",
    },
  });

  console.log("   ✅ 2 pending uploads created\n");

  // ──────────────────────────────────────────────
  // 5. BOOKMARKS & RATINGS
  // ──────────────────────────────────────────────
  console.log("🔖 Seeding bookmarks & ratings...");

  await prisma.bookmark.upsert({
    where: { userId_resourceId: { userId: student1.id, resourceId: "res-001" } },
    update: {}, create: { userId: student1.id, resourceId: "res-001" },
  });
  await prisma.bookmark.upsert({
    where: { userId_resourceId: { userId: student1.id, resourceId: "res-003" } },
    update: {}, create: { userId: student1.id, resourceId: "res-003" },
  });
  await prisma.bookmark.upsert({
    where: { userId_resourceId: { userId: student2.id, resourceId: "res-005" } },
    update: {}, create: { userId: student2.id, resourceId: "res-005" },
  });
  await prisma.bookmark.upsert({
    where: { userId_resourceId: { userId: student2.id, resourceId: "res-008" } },
    update: {}, create: { userId: student2.id, resourceId: "res-008" },
  });

  await prisma.resourceRating.upsert({
    where: { resourceId_userId: { resourceId: "res-001", userId: student1.id } },
    update: {},
    create: { resourceId: "res-001", userId: student1.id, rating: 5, reviewText: "Amazing notes! Covered everything for the exam. Highly recommend." },
  });
  await prisma.resourceRating.upsert({
    where: { resourceId_userId: { resourceId: "res-001", userId: student2.id } },
    update: {},
    create: { resourceId: "res-001", userId: student2.id, rating: 4, reviewText: "Very helpful. Could add more on graph algorithms." },
  });

  console.log("   ✅ Bookmarks and ratings created\n");

  // ──────────────────────────────────────────────
  // 6. MENTOR PROFILES
  // ──────────────────────────────────────────────
  console.log("🎓 Seeding mentor profiles...");

  await prisma.mentorProfile.upsert({
    where: { userId: mentor1.id },
    update: {},
    create: {
      id: "mentor-profile-001",
      userId: mentor1.id,
      headline: "5th Year CSE @ NIT Hamirpur | DSA & Web Dev Expert",
      bio: "I've cracked 3 internships using DSA. I love teaching and can help you crack placement season.",
      expertise: ["Data Structures", "Algorithms", "React", "Node.js", "Interview Prep"],
      department: Department.COMPUTER,
      semester: 5,
      availability: [MentorAvailability.WEEKDAY_EVENINGS, MentorAvailability.WEEKENDS],
      hourlyRate: null,
      isActive: true,
      totalSessions: 24,
      averageRating: 4.8,
      totalRatings: 20,
    },
  });

  await prisma.mentorProfile.upsert({
    where: { userId: mentor2.id },
    update: {},
    create: {
      id: "mentor-profile-002",
      userId: mentor2.id,
      headline: "Mathematics Tutor | Calculus & Linear Algebra Specialist",
      bio: "Gold medallist in Mathematics. I teach in a simple, visual way that makes concepts click.",
      expertise: ["Calculus", "Linear Algebra", "Probability", "Discrete Mathematics"],
      department: Department.MATHEMATICS,
      semester: 6,
      availability: [MentorAvailability.WEEKDAY_MORNINGS, MentorAvailability.FLEXIBLE],
      hourlyRate: 200,
      isActive: true,
      totalSessions: 51,
      averageRating: 4.9,
      totalRatings: 45,
    },
  });

  console.log("   ✅ 2 mentor profiles created\n");

  // ──────────────────────────────────────────────
  // 7. Q&A
  // ──────────────────────────────────────────────
  console.log("💬 Seeding questions & answers...");

  const q1 = await prisma.question.upsert({
    where: { id: "question-001" },
    update: {},
    create: {
      id: "question-001", authorId: student1.id,
      title: "What is the difference between BFS and DFS?",
      body: "I understand BFS uses a queue and DFS uses a stack, but when should I actually use each one? Can someone explain with a real example?",
      subject: "Data Structures", semester: 3, department: Department.COMPUTER,
      tags: ["dsa", "graphs", "bfs", "dfs"], viewCount: 234, answerCount: 2, isResolved: true,
    },
  });

  const q2 = await prisma.question.upsert({
    where: { id: "question-002" },
    update: {},
    create: {
      id: "question-002", authorId: student2.id,
      title: "How do I solve problems involving Kirchhoff's laws?",
      body: "I keep getting confused with sign conventions in KVL. Is there a systematic approach to solve circuit problems?",
      subject: "Circuit Theory", semester: 2, department: Department.ELECTRONICS,
      tags: ["circuits", "kvl", "kcl", "electronics"], viewCount: 156, answerCount: 1, isResolved: false,
    },
  });

  const q3 = await prisma.question.upsert({
    where: { id: "question-003" },
    update: {},
    create: {
      id: "question-003", authorId: student1.id,
      title: "Best resources for GATE CSE preparation?",
      body: "I'm starting GATE prep in 3rd year. What books, online courses, and previous papers should I focus on for CSE?",
      subject: "GATE Preparation", semester: 3, department: Department.COMPUTER,
      tags: ["gate", "preparation", "cse", "resources"], viewCount: 567, answerCount: 2, isResolved: false,
    },
  });

  await prisma.answer.upsert({
    where: { id: "answer-001" }, update: {},
    create: {
      id: "answer-001", questionId: q1.id, authorId: mentor1.id,
      body: "Great question!\n\n**BFS** uses a queue, explores level by level — best for shortest path in unweighted graphs.\n\n**DFS** uses a stack/recursion, goes deep first — best for cycle detection, topological sort, and maze solving.\n\nRule of thumb: shortest path → BFS. Explore all possibilities → DFS.",
      isAccepted: true, upvotes: 45, downvotes: 1,
    },
  });

  await prisma.answer.upsert({
    where: { id: "answer-002" }, update: {},
    create: {
      id: "answer-002", questionId: q1.id, authorId: contributor1.id,
      body: "Memory complexity matters too: BFS stores all nodes at current level O(w), DFS only stores current path O(h). For very wide graphs DFS is more efficient.",
      isAccepted: false, upvotes: 23, downvotes: 0,
    },
  });

  await prisma.answer.upsert({
    where: { id: "answer-003" }, update: {},
    create: {
      id: "answer-003", questionId: q2.id, authorId: mentor1.id,
      body: "For KVL: 1) Choose loop direction. 2) Assign current directions. 3) Going through resistor in current direction = drop (-IR), against = rise (+IR). Through battery - to + = rise (+V), + to - = drop (-V). Practice 10-15 problems and it becomes automatic.",
      isAccepted: false, upvotes: 18, downvotes: 0,
    },
  });

  await prisma.answer.upsert({
    where: { id: "answer-004" }, update: {},
    create: {
      id: "answer-004", questionId: q3.id, authorId: mentor1.id,
      body: "GATE CSE roadmap: Books — CLRS for DSA, Galvin for OS, Korth for DBMS, Forouzan for CN. Online — NPTEL lectures, GateSmashers YouTube. Practice — GATE Overflow, 15 years of PYQs minimum. Start 3rd year, study strong subjects first.",
      isAccepted: false, upvotes: 67, downvotes: 2,
    },
  });

  await prisma.answer.upsert({
    where: { id: "answer-005" }, update: {},
    create: {
      id: "answer-005", questionId: q3.id, authorId: contributor1.id,
      body: "Make a 6-month schedule and stick to it. Consistency beats cramming. I studied 4 hours/day for 8 months and scored 720/1000.",
      isAccepted: false, upvotes: 34, downvotes: 0,
    },
  });

  console.log("   ✅ 3 questions and 5 answers created\n");

  // ──────────────────────────────────────────────
  // 8. NOTIFICATIONS
  // ──────────────────────────────────────────────
  console.log("🔔 Seeding notifications...");

  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      {
        id: "notif-001", recipientId: student1.id, senderId: admin.id,
        type: NotificationType.UPLOAD_APPROVED,
        title: "Your upload was approved!",
        body: '"Data Structures Notes" has been approved and is now live on VidyaVault.',
        linkUrl: "/vidya-vault", isRead: false, metadata: { resourceId: "res-001" },
      },
      {
        id: "notif-002", recipientId: student1.id, senderId: mentor1.id,
        type: NotificationType.NEW_ANSWER,
        title: "New answer on your question",
        body: "Rahul Singh answered your question about BFS vs DFS.",
        linkUrl: "/vidya-sang/questions/question-001", isRead: true,
        metadata: { questionId: "question-001", answerId: "answer-001" },
      },
      {
        id: "notif-003", recipientId: mentor1.id, senderId: null,
        type: NotificationType.SYSTEM,
        title: "Welcome to VidyaVerse Mentors! 🎉",
        body: "Your mentor profile is active. Students can find and book you.",
        linkUrl: "/vidya-setu", isRead: false, metadata: {},
      },
      {
        id: "notif-004", recipientId: admin.id, senderId: student1.id,
        type: NotificationType.ROLE_REQUEST_SUBMITTED,
        title: "New role request",
        body: "Sneha Gupta has requested the CONTRIBUTOR role.",
        linkUrl: "/dashboard/admin/role-requests", isRead: false, metadata: {},
      },
    ],
  });

  console.log("   ✅ 4 notifications created\n");

  // ──────────────────────────────────────────────
  // 9. DOWNLOAD HISTORY
  // ──────────────────────────────────────────────
  console.log("📥 Seeding download history...");

  await prisma.downloadHistory.createMany({
    skipDuplicates: true,
    data: [
      { id: "dl-001", userId: student1.id, resourceId: "res-001" },
      { id: "dl-002", userId: student1.id, resourceId: "res-003" },
      { id: "dl-003", userId: student2.id, resourceId: "res-005" },
      { id: "dl-004", userId: student2.id, resourceId: "res-008" },
      { id: "dl-005", userId: contributor1.id, resourceId: "res-002" },
    ],
  });

  console.log("   ✅ 5 download records created\n");

  // ──────────────────────────────────────────────
  // DONE
  // ──────────────────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ VidyaVerse seed complete!\n");
  console.log("📋 LOGIN CREDENTIALS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  OWNER    → owner@vidyaverse.com      / Owner@123");
  console.log("  ADMIN    → admin@vidyaverse.com      / Admin@123");
  console.log("  MENTOR   → mentor1@vidyaverse.com    / Mentor@123");
  console.log("  MENTOR   → mentor2@vidyaverse.com    / Mentor@123");
  console.log("  CONTRIB  → contrib1@vidyaverse.com   / Contrib@123");
  console.log("  STUDENT  → student1@vidyaverse.com   / Student@123");
  console.log("  STUDENT  → student2@vidyaverse.com   / Student@123");
  console.log("  UNVERF   → unverified@vidyaverse.com / Student@123  (email not verified)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });