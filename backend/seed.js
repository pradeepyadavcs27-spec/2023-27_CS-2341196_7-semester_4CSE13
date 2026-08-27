require('dotenv').config();
const { prisma } = require('./config/db');
const bcrypt = require('bcryptjs');

const seedDB = async () => {
  try {
    console.log('PostgreSQL Connected for seeding via Prisma...');

    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.attendance.deleteMany({});
    await prisma.leaveRequest.deleteMany({});
    await prisma.liveSession.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Existing data cleared.');

    // Helper for hashing
    const hash = async (pwd) => {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(pwd, salt);
    };

    // ==================== CREATE ADMIN ====================
    const admin = await prisma.user.create({
      data: {
        fullName: 'System Administrator',
        email: 'admin@attendance.com',
        password: await hash('Admin@123'),
        role: 'admin',
        department: 'Administration',
      }
    });
    console.log('✅ Admin created:', admin.email);

    // ==================== CREATE TEACHERS ====================
    const teachersData = [
      {
        fullName: 'Dr. Sarah Johnson',
        email: 'sarah@attendance.com',
        password: await hash('Teacher@123'),
        role: 'teacher',
        department: 'Computer Science',
        subjects: ['Data Structures', 'Algorithms'],
      },
      {
        fullName: 'Prof. Michael Chen',
        email: 'michael@attendance.com',
        password: await hash('Teacher@123'),
        role: 'teacher',
        department: 'Electronics',
        subjects: ['Digital Electronics', 'Circuit Theory'],
      },
      {
        fullName: 'Dr. Emily Davis',
        email: 'emily@attendance.com',
        password: await hash('Teacher@123'),
        role: 'teacher',
        department: 'Computer Science',
        subjects: ['Database Systems', 'Web Development'],
      },
    ];

    const teachers = [];
    for (const data of teachersData) {
      teachers.push(await prisma.user.create({ data }));
    }
    console.log(`✅ \${teachers.length} Teachers created`);

    // ==================== CREATE STUDENTS ====================
    const studentsData = [
      // Computer Science students
      {
        fullName: 'Aarav Sharma',
        email: 'aarav@attendance.com',
        password: await hash('Student@123'),
        role: 'student',
        rollNumber: 'CS2024001',
        department: 'Computer Science',
        semester: 3,
        section: 'A',
        class: 'CS-3A',
      },
      {
        fullName: 'Priya Patel',
        email: 'priya@attendance.com',
        password: await hash('Student@123'),
        role: 'student',
        rollNumber: 'CS2024002',
        department: 'Computer Science',
        semester: 3,
        section: 'A',
        class: 'CS-3A',
      },
      {
        fullName: 'Rahul Verma',
        email: 'rahul@attendance.com',
        password: await hash('Student@123'),
        role: 'student',
        rollNumber: 'CS2024003',
        department: 'Computer Science',
        semester: 3,
        section: 'B',
        class: 'CS-3B',
      },
      {
        fullName: 'Sneha Gupta',
        email: 'sneha@attendance.com',
        password: await hash('Student@123'),
        role: 'student',
        rollNumber: 'CS2024004',
        department: 'Computer Science',
        semester: 5,
        section: 'A',
        class: 'CS-5A',
      },
      {
        fullName: 'Arjun Reddy',
        email: 'arjun@attendance.com',
        password: await hash('Student@123'),
        role: 'student',
        rollNumber: 'CS2024005',
        department: 'Computer Science',
        semester: 5,
        section: 'A',
        class: 'CS-5A',
      },
    ];

    const students = [];
    for (const data of studentsData) {
      students.push(await prisma.user.create({ data }));
    }
    console.log(`✅ \${students.length} Students created`);

    // ==================== CREATE ATTENDANCE RECORDS ====================
    console.log('Creating attendance records...');

    const allSubjects = [
      'Data Structures',
      'Algorithms',
      'Digital Electronics',
      'Circuit Theory',
      'Database Systems',
      'Web Development',
    ];

    // Map subjects to teachers
    const subjectTeacherMap = {
      'Data Structures': teachers[0].id,
      Algorithms: teachers[0].id,
      'Digital Electronics': teachers[1].id,
      'Circuit Theory': teachers[1].id,
      'Database Systems': teachers[2].id,
      'Web Development': teachers[2].id,
    };

    // Map departments to relevant subjects
    const departmentSubjects = {
      'Computer Science': [
        'Data Structures',
        'Algorithms',
        'Database Systems',
        'Web Development',
      ],
    };

    // Students who should have low attendance (below 75%)
    const lowAttendanceStudents = new Set([
      students[2].id, // Rahul Verma
    ]);

    const attendanceRecords = [];
    const now = new Date();

    // Generate attendance for the last 30 days (excluding weekends)
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      // Skip weekends
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Each day, mark attendance for 1-2 subjects
      const subjectsToday = dayOffset % 2 === 0 ? 2 : 1;

      for (let s = 0; s < subjectsToday; s++) {
        const subjectIndex = (dayOffset + s) % allSubjects.length;
        const subject = allSubjects[subjectIndex];
        const teacherId = subjectTeacherMap[subject];

        for (const student of students) {
          const relevantSubjects = departmentSubjects[student.department] || [];
          if (!relevantSubjects.includes(subject)) continue;

          let status;
          if (lowAttendanceStudents.has(student.id)) {
            status = Math.random() < 0.6 ? 'Present' : 'Absent';
          } else {
            status = Math.random() < 0.88 ? 'Present' : 'Absent';
          }

          attendanceRecords.push({
            studentId: student.id,
            subject,
            date,
            status,
            markedById: teacherId,
            department: student.department,
            class: student.class,
            section: student.section,
            semester: student.semester,
          });
        }
      }
    }

    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < attendanceRecords.length; i += batchSize) {
      const batch = attendanceRecords.slice(i, i + batchSize);
      await prisma.attendance.createMany({ data: batch, skipDuplicates: true });
      totalInserted += batch.length;
    }

    console.log(`✅ \${totalInserted} Attendance records created`);

    // ==================== PRINT CREDENTIALS ====================
    console.log('\\n========================================');
    console.log('  SEED DATA CREATED SUCCESSFULLY');
    console.log('========================================\\n');

    console.log('📋 Login Credentials:\\n');

    console.log('👑 ADMIN:');
    console.log('   Email: admin@attendance.com');
    console.log('   Password: Admin@123');
    console.log('   Role: admin\\n');

    console.log('👨‍🏫 TEACHERS:');
    teachersData.forEach((t) => {
      console.log(`   \${t.fullName}`);
      console.log(`   Email: \${t.email}`);
      console.log(`   Password: Teacher@123`);
      console.log(`   Department: \${t.department}`);
      console.log(`   Subjects: \${t.subjects.join(', ')}\\n`);
    });

    console.log('🎓 STUDENTS:');
    studentsData.forEach((s) => {
      console.log(`   \${s.fullName} (\${s.rollNumber})`);
      console.log(`   Email: \${s.email}`);
      console.log(`   Password: Student@123`);
      console.log(`   Department: \${s.department} | Sem: \${s.semester} | Section: \${s.section}\\n`);
    });

    console.log('========================================');
    console.log(`  Total Users: \${1 + teachers.length + students.length}`);
    console.log(`  Total Attendance Records: \${totalInserted}`);
    console.log('========================================\\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

seedDB();
