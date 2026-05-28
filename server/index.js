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

// --- GUARDIA DE SEGURIDAD (Middleware) ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // El token viene como "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: "Acceso denegado. No hay token." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user; // Guardamos el ID del usuario para usarlo en las rutas
        next();
    });
};

// --- RUTAS DE SEGURIDAD (AUTH) ---
app.post('/api/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)', [nombre, email, hashedPassword]);
        res.status(201).json({ message: "Usuario creado" });
    } catch (err) { res.status(500).json({ error: "Error al registrar" }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (user.rows.length === 0) return res.status(400).json({ error: "Usuario no encontrado" });
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) return res.status(400).json({ error: "Contraseña incorrecta" });
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, nombre: user.rows[0].nombre });
    } catch (err) { res.status(500).json({ error: "Error en el servidor" }); }
});

// --- RUTAS PROTEGIDAS (Solo acceden usuarios con Token) ---

app.get('/dashboard', authenticateToken, async (req, res) => {
    // Solo trae los movimientos del usuario logueado (req.user.id viene del token)
    const result = await pool.query('SELECT * FROM movimientos WHERE usuario_id = $1 ORDER BY fecha DESC', [req.user.id]);
    res.json(result.rows);
});

app.post('/movimientos', authenticateToken, async (req, res) => {
    const { monto, tipo, categoria, descripcion, frecuencia } = req.body;
    const result = await pool.query(
        'INSERT INTO movimientos (usuario_id, monto, tipo, categoria, descripcion, frecuencia) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.user.id, monto, tipo, categoria, descripcion, frecuencia]
    );
    res.status(201).json(result.rows[0]);
});

app.delete('/movimientos/:id', authenticateToken, async (req, res) => {
    // Verificamos que el movimiento pertenezca al usuario antes de borrar
    await pool.query('DELETE FROM movimientos WHERE id = $1 AND usuario_id = $2', [req.params.id, req.user.id]);
    res.status(204).send();
});

// (Acá podés repetir la lógica para las rutas de /historial y /cerrar-mes añadiendo authenticateToken)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));