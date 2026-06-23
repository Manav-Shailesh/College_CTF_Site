import 'dotenv/config'; 
import bcrypt from 'bcryptjs'; 
import mongoose from 'mongoose'; 
import Flag from '../models/Flag.js';

const FLAGS = 
{ 
    pride: { label: 'Pride', answer: process.env.FLAG_PRIDE }, 
    greed: { label: 'Greed', answer: process.env.FLAG_GREED }, 
    wrath: { label: 'Wrath', answer: process.env.FLAG_WRATH }, 
    sloth: { label: 'Sloth', answer: process.env.FLAG_SLOTH }, 
    envy: { label: 'Envy', answer: process.env.FLAG_ENVY }, 
    gluttony: { label: 'Gluttony', answer: process.env.FLAG_GLUTTONY }, 
    lust: { label: 'Lust', answer: process.env.FLAG_LUST } 
};

async function seed() { 
    try { 
        await mongoose.connect(process.env.MONGODB_URI); 
        console.log('Connected to MongoDB.'); 
        
        for (const [sin, { label, answer }] of Object.entries(FLAGS)) { 
            if (!answer || !answer.trim()) { 
                console.warn(`Skipping "${sin}" - FLAG_${sin.toUpperCase()} not found in .env`); 
                continue; 
            }

            const answerHash = await bcrypt.hash(answer.trim(), 12); 
            
            await Flag.findOneAndUpdate( { sin }, 
                { sin, label, answerHash }, 
                { upsert: true, new: true } 
            ); 
                console.log(`Seeded ${label}`); 
            }

            await mongoose.disconnect(); 
            console.log('Flag seeding complete.'); 
        } catch (err) { 
            console.error('Seed failed:', err); 
            process.exit(1); 
        } 
    } 
    
    seed();