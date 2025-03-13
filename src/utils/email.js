import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // True for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log("📧 Sending email to:", to); // ✅ Log recipient

    if (!to || typeof to !== "string") {
      throw new Error("Recipient email is required and must be a string.");
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Email sending failed");
  }
};

const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: "Welcome to Our App!",
    text: `Hi ${user.firstName}, welcome to our platform!`,
    html: `<p>Hi ${user.firstName}, welcome to our platform!</p>`,
  });
};

export { sendEmail, sendWelcomeEmail };
