import { Router } from 'express';
import { reg } from '../controllers/auth.controller';

const r = Router();

r.post('/reg', reg);

export default r;