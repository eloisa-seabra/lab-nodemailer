const { Router } = require('express');
const router = new Router();

const User = require('./../models/user');
const bcryptjs = require('bcryptjs');

const nodemailer = require('nodemailer');

router.get('/', (req, res, next) => {
  res.render('index');
});

const generateRandomToken = length => {
  const characters =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters[Math.floor(Math.random() * characters.length)];
  }
  return token;
};

router.get('/sign-up', (req, res, next) => {
  res.render('sign-up');
});

router.post('/sign-up', (req, res, next) => {
  const { name, email, password } = req.body;
  let userSignedUpId;
  const token = generateRandomToken(10);
  const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD
    }
  });
  bcryptjs
    .hash(password, 10)
    .then(hash => {
      return User.create({
        name,
        email,
        passwordHash: hash,
        confirmationToken: token
      });
    })
    .then(user => {
      userSignedUpId = user._id;
      return transport.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: email,
        subject: 'Email verification',
        html: `
          <a href="http://localhost:3000/authentication/confirm-email?token=${token}">Click to confirm email</a>`
      });
    })
    .then(() => {
      req.session.user = userSignedUpId;
      res.redirect('/');
    })
    .catch(error => {
      next(error);
    });
});

router.get('/authentication/confirm-email', (req, res, next) => {
  const userToken = req.query.token;
  User.findOneAndUpdate({ ConfirmationToken: userToken }, { status: 'active' })
    .then(user => {
      res.render('confirmation');
    })
    .catch(error => {
      next(error);
    });
});

router.get('/sign-in', (req, res, next) => {
  res.render('sign-in');
});

router.post('/sign-in', (req, res, next) => {
  let userId;
  const { email, password } = req.body;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return Promise.reject(new Error("There's no user with that email."));
      } else {
        userId = user._id;
        return bcryptjs.compare(password, user.passwordHash);
      }
    })
    .then(result => {
      if (result) {
        req.session.user = userId;
        res.redirect('/');
      } else {
        return Promise.reject(new Error('Wrong password.'));
      }
    })
    .catch(error => {
      next(error);
    });
});

router.post('/sign-out', (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
});

const routeGuard = require('./../middleware/route-guard');
const { getMaxListeners } = require('./../models/user');

router.get('/profile', routeGuard, (req, res, next) => {
  res.render('profile');
});
router.get('/private', routeGuard, (req, res, next) => {
  res.render('private');
});

module.exports = router;
