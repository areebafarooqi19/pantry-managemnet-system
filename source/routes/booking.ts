import express from 'express';

import { verifyToken } from '../middleware';
import controller from '../controllers/Booking';

const router = express.Router();

//Booking-CRUD
router.post('/bookings', verifyToken, controller.createBooking);
router.get('/bookings', verifyToken, controller.getAllBookings);

router.get('/bookings/:id', verifyToken, controller.getBookingbyId);
router.delete('/bookings/:id', verifyToken, controller.deleteBooking);
router.patch('/bookings/:id', verifyToken, controller.updateBooking);

export = router;
