const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
// Asegúrate de que la ruta 'client' apunte a donde está tu index.html y archivos estáticos
app.use(express.static(path.join(__dirname, '../client')));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- SEGURIDAD: Middleware para validar Token ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Acceso denegado. No hay token." });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });
        req.user = user; // Guardamos el ID del usuario del token
        next();
    });
};
app.post('/api/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    // 1. Validación básica: evitar campos vacíos
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)',
            [nombre, email, hashedPassword]
        );

        res.status(201).json({ message: "Usuario creado exitosamente." });

    } catch (err) {
        // 2. Identificar si el error es porque el email ya existe (Código 23505 en PostgreSQL)
        if (err.code === '23505') {
            return res.status(409).json({ error: "El correo electrónico ya está registrado." });
        }

        console.error("Error en registro:", err);
        res.status(500).json({ error: "Error interno al procesar el registro." });
    }
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
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// --- RUTAS PROTEGIDAS (Solo usuarios logueados) ---

app.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM movimientos WHERE usuario_id = $1 ORDER BY fecha DESC', [req.user.id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Error al cargar movimientos" }); }
});

app.post('/movimientos', authenticateToken, async (req, res) => {
    const { monto, tipo, categoria, descripcion, frecuencia } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO movimientos (usuario_id, monto, tipo, categoria, descripcion, frecuencia, fecha) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) RETURNING *',
            [req.user.id, monto, tipo, categoria, descripcion, frecuencia]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: "Error al guardar movimiento" }); }
});

app.delete('/movimientos/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM movimientos WHERE id = $1 AND usuario_id = $2', [req.params.id, req.user.id]);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: "Error al eliminar" }); }
});

// --- RUTA PARA CERRAR MES ---
app.post('/dashboard/cerrar-mes', authenticateToken, async (req, res) => {
    try {
        // Opcional: Aquí podrías copiar los datos a una tabla 'historial' antes de borrarlos
        await pool.query('DELETE FROM movimientos WHERE usuario_id = $1', [req.user.id]);
        res.json({ message: "Mes cerrado y panel reiniciado" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al cerrar el mes" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));