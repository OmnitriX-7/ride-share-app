import cors from 'cors';
import express from 'express';
import uRts from './routes/user.routes';
import { errMid } from './middleware/error.middleware';
import { AppError } from './utils/AppError';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', uRts);

app.all('*', (req, res, nxt) => {
  nxt(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errMid);

export default app;