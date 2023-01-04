import jwt from 'jsonwebtoken';
const multer = require('multer');
const path = require('path');

import { Request, Response, NextFunction } from 'express';
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'dhidj5678bftw858ijwbywye4evu8kmdweyd';
const JWT_REFRESH_KEY = process.env.JWT_REFRESH_KEY || 'asxdcvbnmk34567u8i9oertybnxfygvfdvd';

export const accessToken = (id: string) => {
  const token = jwt.sign({ id }, JWT_SECRET_KEY, { expiresIn: '1h' });
  return token;
};
export const refreshToken = (id: string) => {
  const token = jwt.sign({ id }, JWT_REFRESH_KEY, { expiresIn: '1d' });
  return token;
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).send('Unauthorized user');
    }
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];

    const user: any = jwt.verify(token, JWT_SECRET_KEY);

    req.body.userid = user.id;

    next();
  } catch (err) {
    return res.status(400).json({
      status: 400,
      message: 'Session Expired'
    });
  }
};
export const newRefreshToken = (token: string) => {
  const veriftToken = jwt.verify(token, JWT_REFRESH_KEY, (err, payload) => {
    if (!err) {
      return payload;
    }
  });

  return veriftToken;
};

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, path.join(__dirname, '/Images'));
  },
  filename: (req: any, file: any, cb: any) => {
    cb(null, `image-${Date.now()}.${file.originalname}`);
  }
});

export const upload = multer({ storage: storage });
