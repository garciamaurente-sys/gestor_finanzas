const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Acceso denegado." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user;
        next();
    });
};

// --- RUTAS AUTH ---
app.post('/api/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)', [nombre, email, hashedPassword]);
        res.status(201).json({ message: "Usuario creado." });
    } catch (err) { res.status(500).json({ error: "Error en registro." }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const user = result.rows[0];
        const validPassword = user ? await bcrypt.compare(password, user.password) : false;
        if (!user || !validPassword) return res.status(401).json({ error: "Credenciales inválidas" });
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, nombre: user.nombre });
    } catch (err) { res.status(500).json({ error: "Error en login" }); }
});

// --- RUTAS PROTEGIDAS ---
app.get('/dashboard', authenticateToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM movimientos WHERE usuario_id = $1 ORDER BY fecha DESC', [req.user.id]);
    res.json(result.rows);
});

// NUEVA RUTA: Historial
app.get('/api/historial', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM historial_meses WHERE usuario_id = $1 ORDER BY fecha DESC', [req.user.id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Error al cargar historial" }); }
});

app.post('/movimientos', authenticateToken, async (req, res) => {
    const { monto, tipo, categoria, descripcion, frecuencia } = req.body;
    const result = await pool.query(
        'INSERT INTO movimientos (usuario_id, monto, tipo, categoria, descripcion, frecuencia, fecha) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) RETURNING *',
        [req.user.id, monto, tipo, categoria, descripcion, frecuencia]
    );
    res.status(201).json(result.rows[0]);
});

app.delete('/movimientos/:id', authenticateToken, async (req, res) => {
    await pool.query('DELETE FROM movimientos WHERE id = $1 AND usuario_id = $2', [req.params.id, req.user.id]);
    res.status(204).send();
});

// MODIFICADA: Transacción para cerrar mes
app.post('/dashboard/cerrar-mes', authenticateToken, async (req, res) => {
    const { mes_anio } = req.body;
    try {
        await pool.query('BEGIN');
        await pool.query(`
            INSERT INTO historial_meses (usuario_id, monto, tipo, categoria, descripcion, fecha, mes_anio)
            SELECT usuario_id, monto, tipo, categoria, descripcion, fecha, $2
            FROM movimientos WHERE usuario_id = $1
        `, [req.user.id, mes_anio]);
        await pool.query('DELETE FROM movimientos WHERE usuario_id = $1', [req.user.id]);
        await pool.query('COMMIT');
        res.json({ message: "Mes cerrado con éxito" });
    } catch (err) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: "Error al cerrar mes" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en ${PORT}`));