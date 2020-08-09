const express = require('express');
const router = express.Router();

const {
  signup,
  accountActivation,
  signin,
  forgotPassword,
  resetPassword,
  googleLogin,
} = require('../controllers/auth');
const {
  userSignupValidator,
  userSigninValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth');
const { runValidation } = require('../validators/index');

router.post('/signup', userSignupValidator, runValidation, signup);
router.post('/signin', userSigninValidator, runValidation, signin);
router.post('/activate', accountActivation);

// forgot password && reset password
router.post('/forgot', forgotPasswordValidator, runValidation, forgotPassword);
router.post('/reset', resetPasswordValidator, runValidation, resetPassword);

// google && facebook
router.post('/google-login', googleLogin);

module.exports = router;
