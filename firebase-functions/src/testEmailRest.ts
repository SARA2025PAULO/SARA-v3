import * as functions from 'firebase-functions';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with the API key from environment variables
sgMail.setApiKey(functions.config().sendgrid.key);

export const sendTestEmail = functions.https.onRequest(async (req, res) => {
  const msg = {
    to: 'test@example.com', // Replace with your desired recipient email
    from: 'notifications@sarachile.com', // Replace with your verified SendGrid sender email
    subject: 'Test Email from Firebase Function',
    text: 'This is a test email sent from a Firebase HTTPS function using SendGrid.',
    html: '<p>This is a test email sent from a Firebase HTTPS function using SendGrid.</p>',
  };

  try {
    await sgMail.send(msg);
    console.log('Test email sent successfully');
    res.status(200).send('Test email sent successfully!');
  } catch (error: any) {
    console.error('Error sending test email:', error);
    if (error.response) {
      console.error(error.response.body)
    }
    res.status(500).send('Failed to send test email.');
  }
});