import express from 'express';
import controller from '../controllers/user';

const router = express.Router();

router.post('/', controller.createData);
router.get('/', controller.readData);
router.put('/', controller.updateData);
router.delete('/', controller.deleteData);

export = router;
