import express from 'express';

import controller from '../controllers/User';
import { verifyToken } from '../middleware';

const router = express.Router();
router.get('/available', verifyToken, controller.getAvailableUsers);
router.patch('/permissions', verifyToken, controller.setPermission);

export = router;
