const { prisma } = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendAttendanceReport } = require('../services/emailService');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalRecords] = await Promise.all([
      prisma.user.count({ where: { role: 'student' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.attendance.count(),
    ]);

    const presentCount = await prisma.attendance.count({ where: { status: 'Present' } });
    const overallAttendance = totalRecords > 0 ? parseFloat(((presentCount / totalRecords) * 100).toFixed(1)) : 0;

    // Students below 75% threshold
    const belowThresholdQuery = await prisma.$queryRaw`
      SELECT count(*) as count FROM (
        SELECT "studentId", COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present 
        FROM "attendances" 
        GROUP BY "studentId"
      ) AS stats 
      WHERE (present::float / total) < 0.75
    `;
    const belowThreshold = belowThresholdQuery.length > 0 ? Number(belowThresholdQuery[0].count) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendance.count({
      where: {
        date: { gte: today, lt: tomorrow },
        status: 'Present',
      },
    });

    // Attendance trend - last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendQuery = await prisma.$queryRaw`
      SELECT TO_CHAR(date, 'YYYY-MM-DD') as date, COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances"
      WHERE date >= ${sevenDaysAgo}
      GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;
    
    const attendanceTrend = trendQuery.map(t => ({
      date: t.date,
      total: Number(t.total),
      present: Number(t.present),
      percentage: Number(t.total) > 0 ? Number(((Number(t.present) / Number(t.total)) * 100).toFixed(1)) : 0
    }));

    // Monthly attendance - last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyQuery = await prisma.$queryRaw`
      SELECT TO_CHAR(date, 'YYYY-MM') as month, COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances"
      WHERE date >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    const monthlyAttendance = monthlyQuery.map(m => ({
      month: m.month,
      total: Number(m.total),
      present: Number(m.present),
      percentage: Number(m.total) > 0 ? Number(((Number(m.present) / Number(m.total)) * 100).toFixed(1)) : 0
    }));

    // Department-wise attendance
    const deptQuery = await prisma.$queryRaw`
      SELECT department, COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances"
      WHERE department IS NOT NULL
      GROUP BY department
      ORDER BY department ASC
    `;

    const departmentWise = deptQuery.map(d => ({
      department: d.department,
      total: Number(d.total),
      present: Number(d.present),
      percentage: Number(d.total) > 0 ? Number(((Number(d.present) / Number(d.total)) * 100).toFixed(1)) : 0
    }));

    // Subject-wise attendance
    const subjQuery = await prisma.$queryRaw`
      SELECT subject, COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances"
      GROUP BY subject
      ORDER BY subject ASC
    `;

    const subjectWise = subjQuery.map(s => ({
      subject: s.subject,
      total: Number(s.total),
      present: Number(s.present),
      percentage: Number(s.total) > 0 ? Number(((Number(s.present) / Number(s.total)) * 100).toFixed(1)) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalRecords,
        overallAttendance,
        belowThreshold,
        todayAttendance,
        attendanceTrend,
        monthlyAttendance,
        departmentWise,
        subjectWise,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
};

// @desc    Get all students with attendance percentage
// @route   GET /api/admin/students
const getStudents = async (req, res) => {
  try {
    const { search, department, semester, section, page = 1, limit = 10 } = req.query;

    const where = { role: 'student' };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (department) where.department = department;
    if (semester) where.semester = parseInt(semester);
    if (section) where.section = section;

    const total = await prisma.user.count({ where });
    const students = await prisma.user.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { fullName: 'asc' },
    });

    const studentsWithAttendance = await Promise.all(
      students.map(async (student) => {
        const stats = await prisma.attendance.groupBy({
          by: ['studentId'],
          where: { studentId: student.id },
          _count: { _all: true },
        });
        
        const presentStats = await prisma.attendance.groupBy({
          by: ['studentId'],
          where: { studentId: student.id, status: 'Present' },
          _count: { _all: true },
        });

        const totalClasses = stats.length > 0 ? stats[0]._count._all : 0;
        const presentCount = presentStats.length > 0 ? presentStats[0]._count._all : 0;
        const percentage = totalClasses > 0 ? parseFloat(((presentCount / totalClasses) * 100).toFixed(1)) : 0;

        const { password, ...studentWithoutPassword } = student;
        return {
          ...studentWithoutPassword,
          _id: student.id, // Aliasing for frontend compatibility
          attendancePercentage: percentage,
          totalClasses,
          presentCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      students: studentsWithAttendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
};

// @desc    Get all teachers
// @route   GET /api/admin/teachers
const getTeachers = async (req, res) => {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;

    const where = { role: 'teacher' };
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.user.count({ where });
    const teachers = await prisma.user.findMany({
      where,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { fullName: 'asc' },
    });

    // Add _id alias and remove password
    const mappedTeachers = teachers.map(t => {
      const { password, ...rest } = t;
      return { ...rest, _id: t.id };
    });

    res.status(200).json({
      success: true,
      teachers: mappedTeachers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch teachers.' });
  }
};

const registerStudent = async (req, res) => {
  try {
    const { fullName, email, password, rollNumber, department, semester, section, class: studentClass } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide fullName, email, and password.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'student',
        rollNumber,
        department,
        semester: semester ? parseInt(semester) : null,
        section,
        class: studentClass,
      },
    });

    const { password: _, ...studentResponse } = student;
    studentResponse._id = student.id;

    res.status(201).json({ success: true, message: 'Student registered successfully.', student: studentResponse });
  } catch (error) {
    console.error('Register student error:', error);
    res.status(500).json({ success: false, message: 'Failed to register student.' });
  }
};

  const registerTeacher = async (req, res) => {
  try {
    const { fullName, email, password, department, subjects, rollNumber } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide fullName, email, and password.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const teacher = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'teacher',
        department,
        subjects: subjects || [],
        rollNumber,
      },
    });

    const { password: _, ...teacherResponse } = teacher;
    teacherResponse._id = teacher.id;

    res.status(201).json({ success: true, message: 'Teacher registered successfully.', teacher: teacherResponse });
  } catch (error) {
    console.error('Register teacher error:', error);
    res.status(500).json({ success: false, message: 'Failed to register teacher.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }
    
    // Prevent updating id
    delete updateData.id;
    delete updateData._id;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ success: true, message: 'User updated successfully.', user: { ...user, _id: user.id } });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete cascading references first (Prisma requires doing this manually if no cascading set in schema)
    await prisma.attendance.deleteMany({
      where: { OR: [{ studentId: id }, { markedById: id }] }
    });
    
    await prisma.leaveRequest.deleteMany({
      where: { OR: [{ userId: id }, { reviewedById: id }] }
    });

    await prisma.attendanceSession.deleteMany({
      where: { teacherId: id }
    });
    
    await prisma.liveSession.deleteMany({
      where: { teacherId: id }
    });

    await prisma.user.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'User and associated attendance records deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

const getRecentRecords = async (req, res) => {
  try {
    const records = await prisma.attendance.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        student: { select: { fullName: true, rollNumber: true } },
        markedBy: { select: { fullName: true } }
      }
    });

    const mappedRecords = records.map(r => ({
      ...r,
      _id: r.id,
      studentId: r.student,
      markedBy: r.markedBy
    }));

    res.status(200).json({ success: true, records: mappedRecords });
  } catch (error) {
    console.error('Get recent records error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent records.' });
  }
};

const sendReport = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'Please provide a student ID.' });

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'student') return res.status(404).json({ success: false, message: 'Student not found.' });

    const subjectQuery = await prisma.$queryRaw`
      SELECT subject, COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances"
      WHERE "studentId" = ${student.id}
      GROUP BY subject
    `;
    
    const subjectStats = subjectQuery.map(s => ({
      subject: s.subject,
      totalClasses: Number(s.total),
      present: Number(s.present),
      absent: Number(s.total) - Number(s.present),
      percentage: Number(s.total) > 0 ? (Number(s.present) / Number(s.total)) * 100 : 0
    }));

    const overallQuery = await prisma.$queryRaw`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM "attendances"
      WHERE "studentId" = ${student.id}
    `;

    const overall = overallQuery.length > 0 ? { total: Number(overallQuery[0].total), present: Number(overallQuery[0].present) } : { total: 0, present: 0 };
    const overallPercentage = overall.total > 0 ? (overall.present / overall.total) * 100 : 0;

    await sendAttendanceReport(student.email, student.fullName, { subjects: subjectStats, overallPercentage });

    res.status(200).json({ success: true, message: `Attendance report sent to ${student.email}.` });
  } catch (error) {
    console.error('Send report error:', error);
    res.status(500).json({ success: false, message: 'Failed to send report.' });
  }
};

module.exports = {
  getDashboardStats,
  getStudents,
  getTeachers,
  registerStudent,
  registerTeacher,
  updateUser,
  deleteUser,
  getRecentRecords,
  sendReport,
};
