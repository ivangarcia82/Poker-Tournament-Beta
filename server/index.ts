import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const prisma = new PrismaClient();
const app = express();
const port = 5001;

app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet()); // Protect HTTP Headers
app.use(express.json({ limit: '500kb' })); // Mitigate Large Payload DoS

// Global Rate Limiter: Maximum 300 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(globalLimiter);

// Strict Rate Limiter for Authentication (Register/Login): 10 requests per hour
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again after an hour.' }
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const authenticate = (req: any, res: any, next: any) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // --- Input Validation / Sanitization ---
        if (!email || email.length > 255 || !email.includes('@')) return res.status(400).json({ error: 'Invalid email format' });
        if (!username || username.length < 3 || username.length > 50) return res.status(400).json({ error: 'Username must be between 3 and 50 characters' });
        if (!password || password.length < 6 || password.length > 128) return res.status(400).json({ error: 'Password must be between 6 and 128 characters' });

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: { email, username, passwordHash }
        });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user.id, email: user.email, username: user.username } });
    } catch (err: any) {
        console.error('Registration Prisma Error:', err);
        res.status(500).json({ error: err.message || 'Registration failed' });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const validPass = await bcrypt.compare(password, user.passwordHash);
        if (!validPass) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
    } catch (err: any) {
        console.error('Login Prisma Error:', err);
        res.status(500).json({ error: err.message || 'Login failed' });
    }
});

// Get all tournaments for the logged-in user
app.get('/api/tournaments', authenticate, async (req: any, res: any) => {
    try {
        const tournaments = await prisma.tournament.findMany({
            where: { userId: req.user.id },
            include: {
                levels: true,
                bonuses: true,
                players: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tournaments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
});

// Create a new tournament
app.post('/api/tournaments', authenticate, async (req: any, res: any) => {
    try {
        const data = req.body;

        // --- Payload Sanitization ---
        if (!data.name || data.name.length > 100) return res.status(400).json({ error: 'Tournament name must be between 1 and 100 characters' });
        if (data.levels && data.levels.length > 200) return res.status(400).json({ error: 'Too many blind levels (Max 200)' });
        if (data.players && data.players.length > 500) return res.status(400).json({ error: 'Too many players (Max 500)' });

        // We expect the frontend to send the full nested object.
        // Prisma requires a slightly different structure for nested creates if IDs are pre-generated by frontend, 
        // but the easiest is simply mapping them to create inputs.
        const tournament = await prisma.tournament.create({
            data: {
                id: data.id,
                userId: req.user.id,
                name: data.name,
                date: data.date,
                status: data.status,
                buyIn: data.buyIn,
                startingChips: data.startingChips,
                currentLevelIndex: data.currentLevelIndex,
                timeRemainingSeconds: data.timeRemainingSeconds,
                rakePercentage: data.rakePercentage || 0,
                customPayouts: data.customPayouts || [],
                levels: {
                    create: data.levels?.map((l: any) => ({
                        id: l.id,
                        level: l.level,
                        smallBlind: l.smallBlind,
                        bigBlind: l.bigBlind,
                        ante: l.ante,
                        durationMinutes: l.durationMinutes,
                        isBreak: l.isBreak,
                        breakName: l.breakName,
                    })) || []
                },
                bonuses: {
                    create: data.bonuses?.map((b: any) => ({
                        id: b.id,
                        name: b.name,
                        cost: b.cost,
                        chips: b.chips,
                    })) || []
                },
                players: {
                    create: data.players?.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        status: p.status,
                        reEntries: p.reEntries,
                        position: p.position,
                        appliedBonuses: p.appliedBonuses || [],
                    })) || []
                },
            },
            include: {
                levels: true,
                bonuses: true,
                players: true,
            }
        });

        res.status(201).json(tournament);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create tournament' });
    }
});

// Update a tournament (and its nested elements like players)
app.put('/api/tournaments/:id', authenticate, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Verify ownership
        const existing = await prisma.tournament.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updateData: any = {
            name: data.name,
            status: data.status,
            currentLevelIndex: data.currentLevelIndex,
            timeRemainingSeconds: data.timeRemainingSeconds,
            rakePercentage: data.rakePercentage,
            customPayouts: data.customPayouts,
        };

        if (data.players) {
            updateData.players = {
                deleteMany: {},
                create: data.players.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    status: p.status,
                    reEntries: p.reEntries,
                    position: p.position,
                    appliedBonuses: p.appliedBonuses || [],
                }))
            };
        }

        if (data.levels) {
            updateData.levels = {
                deleteMany: {},
                create: data.levels.map((l: any) => ({
                    id: l.id,
                    level: l.level,
                    smallBlind: l.smallBlind,
                    bigBlind: l.bigBlind,
                    ante: l.ante,
                    durationMinutes: l.durationMinutes,
                    isBreak: l.isBreak,
                    breakName: l.breakName,
                }))
            };
        }

        if (data.bonuses) {
            updateData.bonuses = {
                deleteMany: {},
                create: data.bonuses.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    cost: b.cost,
                    chips: b.chips,
                }))
            };
        }

        await prisma.tournament.update({
            where: { id },
            data: updateData
        });

        const updated = await prisma.tournament.findUnique({
            where: { id },
            include: { levels: true, bonuses: true, players: true }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update tournament' });
    }
});

// Delete a tournament
app.delete('/api/tournaments/:id', authenticate, async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Verify ownership
        const existing = await prisma.tournament.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.tournament.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete tournament' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

export default app;
