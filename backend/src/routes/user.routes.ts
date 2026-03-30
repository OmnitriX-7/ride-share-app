import { Router } from 'express';

const router = Router();

router.get("/status", (req, res) => {
    res.json({ status: "User Routes are Active" });
});

export default router;