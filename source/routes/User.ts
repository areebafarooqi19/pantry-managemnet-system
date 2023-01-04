import express from 'express';
import controller from '../controllers/User';
import { upload, verifyToken } from '../middleware';

const router = express.Router();

//User-CRUD
router.post('/users', verifyToken, upload.single('profileImageUrl'), controller.createUser);
router.post('/auth', controller.login);
router.get('/users', verifyToken, controller.getAllUsers);
router.get('/users/:id', verifyToken, controller.getUserById);
router.patch('/users/:id', verifyToken, upload.single('profileImageUrl'), controller.updateUser);
router.delete('/users/:id', verifyToken, controller.deleteUser);

router.get('/available', verifyToken, controller.getAvailableUsers);
router.patch('/permissions', verifyToken, controller.setPermission);

export = router;
