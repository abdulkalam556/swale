const User = require('../models/user');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const user = require('../models/user');

let mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        error: 'Email is taken already, login Instead',
      });
    }

    const token = jwt.sign(
      { name, email, password, role },
      process.env.JWT_ACCOUNT_ACTIVATION,
      { expiresIn: '10m' }
    );

    let mailDetails = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Swale Account Activation`,
      html: `
      <h1>Hi ${name}!</h1>
      <h2>Please use the following link to activate your account</h2>
      <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
      <hr />
      <p>This email may contain sensetive information</p>
      <p>${process.env.CLIENT_URL}</p>
      `,
    };

    await mailTransporter.sendMail(mailDetails);

    return res.json({
      message: `Email has been sent to ${email}. Follow the instructions to activate Account`,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'Server error, please try again.',
    });
  }
};

exports.accountActivation = (req, res) => {
  const { token } = req.body;

  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, async function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(401).json({
          error: 'Expired link. Signup again',
        });
      }

      const { name, email, password, role } = jwt.decode(token);

      const user = new User({ name, email, password, role });

      try {
        await user.save();

        const token = jwt.sign(
          { id: user._id, role: user.role, name: user.name },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        return res.json({
          token,
        });
      } catch (err) {
        return res.status(500).json({
          error: 'Server error, please try again.',
        });
      }
    });
  } else {
    return res.status(400).json({
      error: 'Something Went wrong, Signup again',
    });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        error: "User with that mail doesn't exists, try Signup instead",
      });
    }

    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: 'Email & Password donot match',
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: 'Server Error. Try again',
    });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        error: 'Please enter a registered email',
      });
    }

    const token = jwt.sign(
      { id: user.id, email },
      process.env.JWT_FORGOT_PASSWORD,
      { expiresIn: '10m' }
    );

    let mailDetails = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Swale Account Reset Password Link`,
      html: `
      <h1>Hi ${user.name}!</h1>
      <h2>Please use the following link to reset your password</h2>
      <p>${process.env.CLIENT_URL}/auth/resetpassword/${token}</p>
      <hr />
      <p>This email may contain sensetive information</p>
      <p>${process.env.CLIENT_URL}</p>
      `,
    };

    await mailTransporter.sendMail(mailDetails);

    return res.json({
      message: `Email has been sent to ${email}. Follow the instructions to Reset Password`,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Server error, please try again.',
    });
  }
};

exports.resetPassword = (req, res) => {
  const { token, newPassword } = req.body;

  if (token) {
    jwt.verify(token, process.env.JWT_FORGOT_PASSWORD, async function (
      err,
      decoded
    ) {
      if (err) {
        return res.status(401).json({
          error: 'Expired link. try ForgotPassword again',
        });
      }

      const { id } = jwt.decode(token);

      try {
        const user = await User.findById(id);

        user.password = newPassword;

        await user.save();

        return res.json({
          message: 'Updated your Password. try Login again',
        });
      } catch (err) {
        return res.status(500).json({
          error: 'Server error, please try again.',
        });
      }
    });
  } else {
    return res.status(400).json({
      error: 'Something Went wrong, try Forgot Password again',
    });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  response = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  // console.log('GOOGLE LOGIN RESPONSE',response)
  const { email_verified, name, email } = response.payload;
  if (email_verified) {
    try {
      user = await User.findOne({ email });
      if (user) {
        const token = jwt.sign(
          { id: user._id, role: user.role, name: user.name },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        return res.json({
          token,
        });
      } else {
        let password = email + process.env.JWT_SECRET;
        user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign(
          { id: user._id, role: user.role, name: user.name },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        return res.json({
          token,
        });
      }
    } catch (err) {
      return res.status(500).json({
        error: 'Server error, please try again.',
      });
    }
  } else {
    return res.status(400).json({
      error: 'Google login failed. Try again',
    });
  }
};

exports.facebookLogin = (req, res) => {
  //console.log('FACEBOOK LOGIN REQ BODY', req.body);
  const { userID, accessToken } = req.body;

  const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`;

  return (
    fetch(url, {
      method: 'GET',
    })
      .then((response) => response.json())
      // .then(response => console.log(response))
      .then((response) => {
        const { email, name } = response;
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign(
              { id: user._id, role: user.role, name: user.name },
              process.env.JWT_SECRET,
              { expiresIn: '1d' }
            );

            return res.json({
              token,
            });
          } else {
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                return res.status(500).json({
                  error: 'Server error, please try again.',
                });
              }
              const token = jwt.sign(
                { id: user._id, role: user.role, name: user.name },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
              );

              return res.json({
                token,
              });
            });
          }
        });
      })
      .catch((error) => {
        res.status(400).json({
          error: 'Facebook login failed. Try later',
        });
      })
  );
};
