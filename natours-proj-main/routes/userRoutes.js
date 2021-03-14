const express = require('express');

const userController = require('./../controller/userController');
const authenticationController = require('./../controller/authenticationController');

const router = express.Router();

router.post('/signup', authenticationController.signup);
router.post('/login', authenticationController.login);
router.get('/logout', authenticationController.logout);
router.post('/forgotPassword', authenticationController.forgotPassword);
router.patch('/resetPassword/:token', authenticationController.resetPassword);

router.use(authenticationController.protect);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updatePassword',

  authenticationController.updatePassword
);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizePhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authenticationController.restrictRole('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
