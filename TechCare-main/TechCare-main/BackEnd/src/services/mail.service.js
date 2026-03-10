const transporter = require('../config/mail');

async function sendMail(options) {
  return transporter.sendMail(options);
}

module.exports = { sendMail };
