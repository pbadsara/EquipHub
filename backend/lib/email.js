const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared `onboarding@resend.dev` sender works without verifying a
// custom domain first — fine for a project at this stage. Once a real
// domain is verified with Resend, swap RESEND_FROM_EMAIL to an address on
// that domain instead.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

async function sendPasswordResetEmail(to, resetUrl) {
  await resend.emails.send({
    from: `EquipHub <${FROM_EMAIL}>`,
    to,
    subject: 'Reset your EquipHub password',
    html: `
      <p>Someone (hopefully you) asked to reset the password on your EquipHub account.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `
  });
}

module.exports = { sendPasswordResetEmail };
