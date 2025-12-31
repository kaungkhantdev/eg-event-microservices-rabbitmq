const transporter = require('../config/mailer');
const newEventTemplate = require('../templates/newEvent');

const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`✓ Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('✗ Email sending failed:', error);
    throw error;
  }
};

const processNewEvent = async (job) => {
  const { eventId, title, startDate, location, description, recipientEmail } = job;

  const html = newEventTemplate({
    title,
    startDate: new Date(startDate).toLocaleString(),
    location,
    description,
  });

  await sendMail(
    recipientEmail || process.env.ADMIN_EMAIL,
    `New Event Created: ${title}`,
    html
  );

  return { success: true, eventId };
};

module.exports = {
  processNewEvent,
};
