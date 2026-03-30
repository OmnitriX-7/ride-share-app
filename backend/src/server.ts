import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { supabase } from './config/supabase'; // NO .ts extension here

const port = process.env.PORT || 5000;

const startServer = async () => {
    try {
        const { error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });
        
        if (error && 
            error.code !== 'PGRST116' && 
            error.message !== 'relation "users" does not exist'
        ) {
            throw error;
        }

        console.log("✅ Supabase Connection: Verified.");
        app.listen(port, () => {
            console.log(`🚀 Server running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error("❌ Supabase Connection Failed:", err);
    }
};

startServer();