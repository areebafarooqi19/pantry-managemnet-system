import express from 'express';
import { verify } from 'jsonwebtoken';
import controller from '../controllers/Kitchen';
import { upload, verifyToken } from '../middleware';

const router = express.Router();
router.get('/capacity', verifyToken, controller.getCapacity);
router.patch('/capacity', verifyToken, controller.setCapacity);

export = router;
