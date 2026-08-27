const ExcelJS = require('exceljs');
const { prisma } = require('../config/db');

// @desc    Export attendance data as Excel file
// @route   GET /api/export/excel
// @access  Private
const exportExcel = async (req, res) => {
  try {
    const { subject, class: className, department, startDate, endDate } = req.query;

    const where = {};

    // Enforce student role access restriction
    if (req.user && req.user.role === 'student') {
      where.studentId = req.user.id;
    }

    if (subject) where.subject = subject;
    if (className) where.class = className;
    if (department) where.department = department;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { fullName: true, rollNumber: true, department: true } }
      },
      orderBy: [
        { date: 'desc' },
        { student: { fullName: 'asc' } }
      ]
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Attendance Management System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Attendance Report', {
      properties: { tabColor: { argb: '4f46e5' } },
    });

    // Define columns
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Student Name', key: 'name', width: 25 },
      { header: 'Roll Number', key: 'roll', width: 15 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Subject', key: 'subject', width: 25 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4f46e5' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // Add data rows
    records.forEach((record, index) => {
      const row = worksheet.addRow({
        sno: index + 1,
        name: record.student ? record.student.fullName : 'N/A',
        roll: record.student ? record.student.rollNumber : 'N/A',
        department: record.student ? record.student.department : record.department || 'N/A',
        subject: record.subject,
        date: record.date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        status: record.status,
      });

      // Alternating row colors
      if (index % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }

      // Color status cells
      const statusCell = row.getCell('status');
      if (record.status === 'Present') {
        statusCell.font = { bold: true, color: { argb: 'FF16a34a' } };
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdcfce7' } };
      } else {
        statusCell.font = { bold: true, color: { argb: 'FFef4444' } };
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfee2e2' } };
      }

      // Center align all cells
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.height = 22;
    });

    // Add borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFe2e8f0' } },
          left: { style: 'thin', color: { argb: 'FFe2e8f0' } },
          bottom: { style: 'thin', color: { argb: 'FFe2e8f0' } },
          right: { style: 'thin', color: { argb: 'FFe2e8f0' } },
        };
      });
    });

    // Auto-fit column widths based on content
    worksheet.columns.forEach((column) => {
      let maxLength = column.header.length;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellLength = cell.value ? cell.value.toString().length : 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 4, 40);
    });

    // Set response headers
    const filename = `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export attendance data.' });
  }
};

module.exports = {
  exportExcel,
};
