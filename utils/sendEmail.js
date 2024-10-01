import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ID, // Your email from environment variables
    pass: process.env.JWT_SECRET, // Your email password from environment variables
  },
});

// Function to send email
const sendEmail = (userEmail, subject, htmlContent) => {
  const mailOptions = {
    from: process.env.EMAIL_ID, // Sender email address
    to: userEmail, // Receiver email address
    subject: subject, // Email subject
    html: htmlContent, // Email content
  };

  // Send email
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        reject(error);
      } else {
        console.log('Email sent:', info.response);
        resolve(info.response);
      }
    });
  });
};

export default sendEmail;
