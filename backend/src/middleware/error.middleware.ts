import { Request, Response, NextFunction } from 'express';

export const errMid = (err: any, req: Request, res: Response, nxt: NextFunction) => {
  const statusCode = err.code || 500;
  const status = err.stat || 'error';

  // In Development, we send everything for debugging
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      status: status,
      message: err.message, 
      error: err,
      stack: err.stack
    });
  } else {
    // In Production, we only send the message if it's an "Operational" error
    if (err.isOp) {
      res.status(statusCode).json({
        status: status,
        message: err.message
      });
    } else {
      console.error('INTERNAL ERROR:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
      });
    }
  }
};