import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import logging from './config/logging';
import config from './config/config';
import userRoutes from './routes/User';
import bookingRoutes from './routes/booking';
import kitchenRouter from './routes/Kitchen';
import miscellaneousRouter from './routes/miscellaneous';
const path = require('path');

var cookieParser = require('cookie-parser');

const NAMESPACE = 'Server';
const router = express();
router.use(cookieParser());

// Logging the request
router.use((req, res, next) => {
  logging.info(NAMESPACE, `METHOD - [${req.method}], URL - [${req.url}], IP - [${req.socket.remoteAddress}]`);

  res.on('finish', () => {
    logging.info(NAMESPACE, `METHOD - [${req.method}], URL - [${req.url}], IP - [${req.socket.remoteAddress}], STATUS - [${res.statusCode}]`);
  });

  next();
});

// Parse the request
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.use('/images', express.static(path.join(__dirname, 'Images')));

// Rules of API
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-Width, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE,PATCH');
  if (req.method == 'OPTIONS') {
    res.header('Access-Control-Allow-Method', 'GET PATCH DELETE POST PUT');
    return res.status(200).json({});
  }

  next();
});

// Routes
router.use(userRoutes);
router.use(bookingRoutes);
router.use(kitchenRouter);
router.use(miscellaneousRouter);
// Error Handling
router.use((req, res, next) => {
  const error = new Error('not found');

  return res.status(404).json({
    message: error.message
  });
});

// Create server
const httpServer = http.createServer(router);
httpServer.listen(config.server.port, () => logging.info(NAMESPACE, `Server running on ${config.server.hostname}:${config.server.port}`));
