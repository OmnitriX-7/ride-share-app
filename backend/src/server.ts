import dotenv from 'dotenv';
dotenv.config();
import app from './app';

const pt = process.env.PORT || 5000;

app.listen(pt, () => {
  console.log(`Server running on port ${pt}`);
});