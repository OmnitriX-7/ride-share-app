import { Request, Response, NextFunction } from 'express';

export const errMid = (err: any, req: Request, res: Response, nxt: NextFunction) => {
  err.code = err.code || 500;
  err.stat = err.stat || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.code).json({
      stat: err.stat,
      err: err,
      msg: err.message,
      stk: err.stack
    });
  } else {
    if (err.isOp) {
      res.status(err.code).json({
        stat: err.stat,
        msg: err.message
      });
    } else {
      console.error('ERROR:', err);
      res.status(500).json({
        stat: 'error',
        msg: 'Something went wrong'
      });
    }
  }
};