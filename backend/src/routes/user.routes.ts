import { Router } from 'express';
import { register } from '../controllers/auth.controller';

const r = Router();

r.post('/register', register);

export default r;