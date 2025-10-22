const nodemailer = require("nodemailer")
const logger = require("./logger")

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info(`Email sent: ${info.messageId}`)
    return info
  } catch (error) {
    logger.error("Email sending failed:", error)
    throw error
  }
}

const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0891b2;">Password Reset Request</h2>
      <p>Hi ${firstName},</p>
      <p>You requested a password reset for your TechHub account. Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">TechHub - Professional Computer Hardware & IT Solutions</p>
    </div>
  `

  await sendEmail({
    to: email,
    subject: "Password Reset Request - TechHub",
    html,
  })
}

const sendWelcomeEmail = async (email, firstName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0891b2;">Welcome to TechHub!</h2>
      <p>Hi ${firstName},</p>
      <p>Welcome to TechHub - your trusted source for professional computer hardware and IT solutions!</p>
      <p>Your account has been successfully created. You can now:</p>
      <ul>
        <li>Browse our extensive catalog of enterprise-grade hardware</li>
        <li>Track your orders and manage your account</li>
        <li>Access exclusive deals and promotions</li>
        <li>Get expert support from our technical team</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Shopping</a>
      </div>
      <p>If you have any questions, our support team is here to help!</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 14px;">TechHub - Professional Computer Hardware & IT Solutions</p>
    </div>
  `

  await sendEmail({
    to: email,
    subject: "Welcome to TechHub!",
    html,
  })
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
}
