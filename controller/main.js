const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080;
const SECRET_KEY = "oscarBostan";

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'views')));

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token)
        return res.status(401).json({
            message: "Token mancante"
        });
        jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err)
            return res.status(403).json({
                message: "Token non valido"
            });
        req.user = user;
        next();
    });
}

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));});
app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));});
app.get('/dashboard', authenticateToken, (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));});
app.get('/inserimento', authenticateToken, (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'inserimento.html'));});
app.get('/storico', authenticateToken, (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'storico.html'));});
app.get('/sfide', authenticateToken, (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'sfide.html'));});
app.get('/classifica', authenticateToken, (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'classifica.html'));});
app.get('/fonti', authenticateToken, (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'fonti.html'));});
app.get('/privacy', authenticateToken, (req, res) => { res.sendFile(path.join(__dirname, '..', 'views', 'privacy.html'));});


app.post('/api/register', async (req, res) => {
    const { username, password, città } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password richiesti' });
    }
    
    try {
        const existing = await db.findUserByUsername(username);
        if (existing) {
            return res.status(400).json({ error: 'Username già esistente' });
        }
        
        const newUser = await db.createUser(username, password, città);
        res.json({ success: true, userId: newUser.id, username: newUser.username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await db.verifyLogin(username, password);
        if (!user) {
            return res.status(401).json({ error: 'Credenziali non valide' });
        }

        const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
            SECRET_KEY,
        { expiresIn: "1h" }

        );

        res.cookie("token", token, {
            httpOnly: false,
            secure: false,
            sameSite: "lax",
            maxAge: 3600000
        });
        
        res.json({ success: true, userId: user.id, username: user.username, città: user.città });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
});

app.post('/api/salva-dati', authenticateToken, async (req, res) => {
    const { userId, sonno, acqua, umore, data } = req.body;
    
    if (!userId || sonno === undefined || acqua === undefined || !umore) {
        return res.status(400).json({ error: 'Dati incompleti' });
    }
    
    const punteggio = db.calculateScore(sonno, acqua, umore);
    const oggi = data || new Date().toISOString().split('T')[0];
    
    try {
        await db.saveDailyData(userId, oggi, sonno, acqua, umore, punteggio);
        
       
        const user = await db.findUserById(userId);
        
        res.json({ success: true, punteggio, streak: user?.streak || 0, puntiTotali: user?.punti_totali || 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore salvataggio' });
    }
});

app.get('/api/user/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const user = await db.findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        
        const dati = await db.getUserHistory(userId);
        
        res.json({ user, dati });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
});

app.get('/api/classifica', authenticateToken, async (req, res) => {
    try {
        const classifica = await db.getRanking();
        res.json(classifica);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
});

app.post('/api/sfida-completa', authenticateToken, async (req, res) => {
    const { userId, sfidaNome, punti } = req.body;
    
    try {
        const nuovoTotale = await db.addChallengePoints(userId, sfidaNome, punti);
        res.json({ success: true, nuovoTotale });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore' });
    }
});

app.get('/api/sfide/:userId', authenticateToken, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const sfide = await db.getUserChallenges(userId);
        res.json(sfide);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore' });
    }
});

app.listen(PORT, () => {
    console.log(`server in ascolto su http://localhost:${PORT}`);
});