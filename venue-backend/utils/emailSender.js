import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "ammar69aa59@gmail.com",
    pass: "otssqxmmomyswjuf"
  }
});

export const sendEmail = async ({ email, subject, message }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text: message
    });
  } catch (err) {
    console.error('Email sending error:', err);
  }
};