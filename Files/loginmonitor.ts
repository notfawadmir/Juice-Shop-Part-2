
const fs = require('fs')
const path = require('path')
const nodemailer = require('nodemailer')

// You may need to install nodemailer
// npm install nodemailer --save

// Track failed attempts
const failedAttempts = {}

// Clear old records periodically
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000
  for (const key in failedAttempts) {
    if (failedAttempts[key].timestamp < oneHourAgo) {
      delete failedAttempts[key]
    }
  }
}, 600000) // Clean every 10 minutes

function logFailedLogin(username, ip) {
  const logDir = path.join(__dirname, '../logs')
  const logFile = path.join(logDir, 'auth.log')
  
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  
  const logMessage = `${new Date().toISOString()} - Failed login attempt for user ${username} from IP ${ip}`
  fs.appendFileSync(logFile, logMessage + '\n')
  
  // Track for alerts
  const key = `${username}:${ip}`
  if (!failedAttempts[key]) {
    failedAttempts[key] = {
      count: 0,
      timestamp: Date.now()
    }
  }
  
  failedAttempts[key].count++
  failedAttempts[key].timestamp = Date.now()
  
  if (failedAttempts[key].count >= 3) {
    sendAlertEmail(username, ip, failedAttempts[key].count)
  }
}

function sendAlertEmail(username, ip, attempts) {
  // Configure with your email settings
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or your SMTP settings
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password'
    }
  })
  
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: 'admin@yourdomain.com',
    subject: 'Security Alert: Multiple Failed Login Attempts',
    text: `Warning: There have been ${attempts} failed login attempts for user "${username}" from IP address ${ip}.`
  }
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Failed to send alert email:', error)
    } else {
      console.log('Alert email sent:', info.response)
    }
  })
}

module.exports = { logFailedLogin }
