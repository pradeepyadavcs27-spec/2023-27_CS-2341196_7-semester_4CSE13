const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER) {
    console.warn(
      'WARNING: Email credentials not configured. Email functionality is disabled.'
    );
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send low attendance alert email
const sendLowAttendanceAlert = async (email, name, percentage) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(
        `[Email Skipped] Low attendance alert for ${name} (${percentage}%) - No SMTP configured`
      );
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .percentage { font-size: 48px; font-weight: bold; color: #ef4444; text-align: center; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Attendance Alert</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${name}</strong>,</p>
            <div class="alert-box">
              <p>Your attendance has fallen below the required threshold of <strong>75%</strong>.</p>
            </div>
            <div class="percentage">${percentage.toFixed(1)}%</div>
            <p>Your current attendance percentage is critically low. Please take immediate action to improve your attendance to avoid academic consequences.</p>
            <p>If you believe this is an error, please contact your department immediately.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Attendance Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Attendance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '⚠️ Low Attendance Alert - Immediate Action Required',
      html: htmlContent,
    });

    console.log(`Low attendance alert sent to ${email}`);
  } catch (error) {
    console.error(
      `Failed to send low attendance alert to ${email}:`,
      error.message
    );
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(
        `[Email Skipped] Password reset for ${email} - No SMTP configured. Reset URL: ${resetUrl}`
      );
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .btn { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>You have requested a password reset. Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="btn">Reset Password</a>
            </p>
            <p>If you didn't request this, please ignore this email. This link will expire in 10 minutes.</p>
            <p style="color: #94a3b8; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser: ${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from the Attendance Management System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Attendance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset Request',
      html: htmlContent,
    });

    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error(
      `Failed to send password reset email to ${email}:`,
      error.message
    );
  }
};

// Send attendance report email
const sendAttendanceReport = async (email, name, reportData) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(
        `[Email Skipped] Attendance report for ${name} - No SMTP configured`
      );
      return;
    }

    let subjectRows = '';
    if (reportData.subjects && reportData.subjects.length > 0) {
      subjectRows = reportData.subjects
        .map(
          (s) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${s.subject}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.totalClasses}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.present}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.absent}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${s.percentage >= 75 ? '#16a34a' : '#ef4444'};">${s.percentage.toFixed(1)}%</td>
          </tr>`
        )
        .join('');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #4f46e5; color: white; padding: 12px; text-align: left; }
          .overall { text-align: center; margin: 20px 0; }
          .overall-percentage { font-size: 48px; font-weight: bold; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Attendance Report</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Here is your attendance report:</p>
            <div class="overall">
              <p>Overall Attendance</p>
              <div class="overall-percentage" style="color: ${reportData.overallPercentage >= 75 ? '#16a34a' : '#ef4444'};">${reportData.overallPercentage.toFixed(1)}%</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th style="text-align: center;">Total</th>
                  <th style="text-align: center;">Present</th>
                  <th style="text-align: center;">Absent</th>
                  <th style="text-align: center;">%</th>
                </tr>
              </thead>
              <tbody>
                ${subjectRows}
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Attendance Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Attendance System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '📊 Your Attendance Report',
      html: htmlContent,
    });

    console.log(`Attendance report sent to ${email}`);
  } catch (error) {
    console.error(
      `Failed to send attendance report to ${email}:`,
      error.message
    );
  }
};

module.exports = {
  sendLowAttendanceAlert,
  sendPasswordResetEmail,
  sendAttendanceReport,
};
