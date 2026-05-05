const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'benessere_db',
});

const promisePool = pool.promise();

async function getAllUsers() {
    const [rows] = await promisePool.query(
        'SELECT id, username, punti_totali, streak FROM utenti ORDER BY punti_totali DESC'
    );
    return rows;
}

async function findUserByUsername(username) {
    const [rows] = await promisePool.query(
        'SELECT * FROM utenti WHERE username = ?',
        [username]
    );
    return rows[0];
}

async function findUserById(id) {
    const [rows] = await promisePool.query(
        'SELECT id, username, città, punti_totali, streak FROM utenti WHERE id = ?',
        [id]
    );
    return rows[0];
}

async function createUser(username, password, città) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await promisePool.query(
        'INSERT INTO utenti (username, password, città, punti_totali, streak) VALUES (?, ?, ?, 0, 0)',
        [username, hashedPassword, città || '']
    );
    return { id: result.insertId, username };
}

async function verifyLogin(username, password) {
    const user = await findUserByUsername(username);
    if (!user) return null;
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    
    return { id: user.id, username: user.username, città: user.città };
}

async function saveDailyData(userId, data, sonno, acqua, umore, punteggio) {
    // Verifica se esiste già un record per questa data
    const [existing] = await promisePool.query(
        'SELECT * FROM dati_benessere WHERE user_id = ? AND data = ?',
        [userId, data]
    );
    
    if (existing.length > 0) {
        // Aggiorna esistente
        await promisePool.query(
            'UPDATE dati_benessere SET sonno = ?, acqua = ?, umore = ?, punteggio = ? WHERE user_id = ? AND data = ?',
            [sonno, acqua, umore, punteggio, userId, data]
        );
    } else {
        // Inserisci nuovo
        await promisePool.query(
            'INSERT INTO dati_benessere (user_id, data, sonno, acqua, umore, punteggio) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, data, sonno, acqua, umore, punteggio]
        );
    }
    
    // Ricalcola streak e punti totali
    await updateUserStats(userId);
}

// Ottieni storico dati di un utente
async function getUserHistory(userId) {
    const [rows] = await promisePool.query(
        'SELECT data, sonno, acqua, umore, punteggio FROM dati_benessere WHERE user_id = ? ORDER BY data DESC',
        [userId]
    );
    return rows;
}

// Ottieni ultimi N dati
async function getLastNDays(userId, n) {
    const [rows] = await promisePool.query(
        'SELECT data, sonno, acqua, umore, punteggio FROM dati_benessere WHERE user_id = ? ORDER BY data DESC LIMIT ?',
        [userId, n]
    );
    return rows;
}

// Aggiorna streak e punteggio medio di un utente
async function updateUserStats(userId) {
    // Calcola media punteggi
    const [avgResult] = await promisePool.query(
        'SELECT AVG(punteggio) as media FROM dati_benessere WHERE user_id = ?',
        [userId]
    );
    const mediaPunteggi = Math.round(avgResult[0].media || 0);
    
    // Calcola streak (giorni consecutivi con punteggio >= 60)
    const [dati] = await promisePool.query(
        'SELECT data, punteggio FROM dati_benessere WHERE user_id = ? ORDER BY data DESC',
        [userId]
    );
    
    let streak = 0;
    let dataPrecedente = null;
    
    for (let i = 0; i < dati.length; i++) {
        if (dati[i].punteggio >= 60) {
            if (!dataPrecedente) {
                streak = 1;
                dataPrecedente = new Date(dati[i].data);
            } else {
                const diff = Math.floor((dataPrecedente - new Date(dati[i].data)) / (1000 * 60 * 60 * 24));
                if (diff === 1) {
                    streak++;
                    dataPrecedente = new Date(dati[i].data);
                } else {
                    break;
                }
            }
        } else {
            break;
        }
    }
    
    // Aggiorna utente
    await promisePool.query(
        'UPDATE utenti SET punti_totali = ?, streak = ? WHERE id = ?',
        [mediaPunteggi, streak, userId]
    );
}

// Aggiungi punti da sfida
async function addChallengePoints(userId, sfidaNome, punti) {
    const oggi = new Date().toISOString().split('T')[0];
    
    await promisePool.query(
        'INSERT INTO sfide (user_id, sfida_nome, data_completamento, punti) VALUES (?, ?, ?, ?)',
        [userId, sfidaNome, oggi, punti]
    );
    
    // Aggiorna punti totali
    const [user] = await promisePool.query('SELECT punti_totali FROM utenti WHERE id = ?', [userId]);
    const nuovoTotale = (user[0].punti_totali || 0) + punti;
    await promisePool.query('UPDATE utenti SET punti_totali = ? WHERE id = ?', [nuovoTotale, userId]);
    
    return nuovoTotale;
}

// Ottieni sfide completate da un utente
async function getUserChallenges(userId) {
    const [rows] = await promisePool.query(
        'SELECT sfida_nome, data_completamento, punti FROM sfide WHERE user_id = ? ORDER BY data_completamento DESC',
        [userId]
    );
    return rows;
}

// Ottieni classifica (top 10)
async function getRanking() {
    const [rows] = await promisePool.query(
        'SELECT username, punti_totali, streak FROM utenti ORDER BY punti_totali DESC LIMIT 10'
    );
    return rows;
}

// Calcola punteggio giornaliero (logica di business)
function calculateScore(sonno, acqua, umore) {
    let punteggioSonno = 0;
    if (sonno >= 7 && sonno <= 9) punteggioSonno = 40;
    else if (sonno >= 6 && sonno < 7) punteggioSonno = 25;
    else if (sonno > 9 && sonno <= 10) punteggioSonno = 25;
    else if (sonno >= 5 && sonno < 6) punteggioSonno = 15;
    else punteggioSonno = 5;
    
    let punteggioAcqua = 0;
    if (acqua >= 1.5 && acqua <= 2) punteggioAcqua = 30;
    else if (acqua >= 1 && acqua < 1.5) punteggioAcqua = 20;
    else if (acqua > 2 && acqua <= 2.5) punteggioAcqua = 20;
    else if (acqua >= 0.5 && acqua < 1) punteggioAcqua = 10;
    else punteggioAcqua = 5;
    
    const punteggioUmore = umore * 6;
    
    return Math.min(100, punteggioSonno + punteggioAcqua + punteggioUmore);
}

module.exports = {
    getAllUsers,
    findUserByUsername,
    findUserById,
    createUser,
    verifyLogin,
    saveDailyData,
    getUserHistory,
    getLastNDays,
    updateUserStats,
    addChallengePoints,
    getUserChallenges,
    getRanking,
    calculateScore
};