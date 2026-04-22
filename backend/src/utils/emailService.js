const nodemailer = require('nodemailer');
const Booking = require('../models/Booking');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: `"Tourism SL" <${process.env.EMAIL_USER}>`, to, subject, html });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

exports.sendEmail = sendEmail;

exports.sendBookingConfirmation = async (booking, tourist, providerEmail) => {
  const html = `
    <h2>Booking Confirmation</h2>
    <p>Dear ${tourist.name},</p>
    <p>Your booking has been confirmed!</p>
    <p><strong>Reference:</strong> ${booking.referenceNumber}</p>
    <p><strong>Service:</strong> ${booking.serviceType}</p>
    <p><strong>Dates:</strong> ${new Date(booking.startDate).toDateString()} - ${new Date(booking.endDate).toDateString()}</p>
    <p><strong>Total:</strong> LKR ${booking.totalPrice}</p>
    <p><strong>Status:</strong> ${booking.status}</p>
  `;
  await sendEmail({ to: tourist.email, subject: `Booking Confirmed - ${booking.referenceNumber}`, html });
  if (providerEmail) {
    await sendEmail({ to: providerEmail, subject: `New Booking - ${booking.referenceNumber}`, html: `<h2>New Booking Received</h2>${html}` });
  }
};

exports.sendBookingStatusUpdate = async (booking, tourist) => {
  const html = `
    <h2>Booking Status Update</h2>
    <p>Dear ${tourist.name},</p>
    <p>Your booking <strong>${booking.referenceNumber}</strong> status has been updated to: <strong>${booking.status}</strong></p>
    <p><strong>Dates:</strong> ${new Date(booking.startDate).toDateString()} - ${new Date(booking.endDate).toDateString()}</p>
  `;
  await sendEmail({ to: tourist.email, subject: `Booking Update - ${booking.referenceNumber}`, html });
};

exports.sendPasswordReset = async (email, resetUrl) => {
  const html = `
    <h2>Password Reset</h2>
    <p>Click the link below to reset your password. This link expires in 10 minutes.</p>
    <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
    <p>If you did not request this, ignore this email.</p>
  `;
  await sendEmail({ to: email, subject: 'Password Reset Request', html });
};

exports.sendBookingReminders = async () => {
  try {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // 1 day reminder
    const bookings1Day = await Booking.find({
      status: 'Confirmed',
      reminderSent1Day: false,
      startDate: { $gte: oneDayLater, $lte: new Date(oneDayLater.getTime() + 60 * 60 * 1000) }
    }).populate('tourist', 'email name');

    for (const b of bookings1Day) {
      if (b.tourist) {
        await sendEmail({
          to: b.tourist.email,
          subject: `Reminder: Your booking ${b.referenceNumber} is tomorrow!`,
          html: `<p>Dear ${b.tourist.name}, your booking <strong>${b.referenceNumber}</strong> starts tomorrow on ${new Date(b.startDate).toDateString()}.</p>`
        });
        b.reminderSent1Day = true;
        await b.save();
      }
    }

    // 3 hour reminder
    const bookings3h = await Booking.find({
      status: 'Confirmed',
      reminderSentFewHours: false,
      startDate: { $gte: threeHoursLater, $lte: new Date(threeHoursLater.getTime() + 60 * 60 * 1000) }
    }).populate('tourist', 'email name');

    for (const b of bookings3h) {
      if (b.tourist) {
        await sendEmail({
          to: b.tourist.email,
          subject: `Reminder: Your booking ${b.referenceNumber} is in a few hours!`,
          html: `<p>Dear ${b.tourist.name}, your booking <strong>${b.referenceNumber}</strong> starts in about 3 hours.</p>`
        });
        b.reminderSentFewHours = true;
        await b.save();
      }
    }
  } catch (err) {
    console.error('Reminder cron error:', err.message);
  }
};
