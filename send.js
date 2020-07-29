const nodemailer = require('nodemailer');
const { getMaxListeners } = require('./models/user');

const transport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD
  }
});

transport
  .sendMail({
    from: process.env.NODEMAILER_EMAIL,
    to: 'seabra.eloisa@gmail.com',
    subject: 'An email from Isa',
    html: `<html>
    <body>
    <a href="localhost:3000/auth/confirm/${confirmationToken}">Link to confirm email</a>
    </body>
    </html>`
  })
  .then(result => {
    console.log('Email was sent.');
    console.log(result);
  })
  .catch(error => {
    console.log('There was an error sending email');
    console.log(error);
  });
