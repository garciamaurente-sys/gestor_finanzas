const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path'); // Necesario para manejar rutas de carpetas
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (Frontend) desde la carpeta client
// Esto hace que tu web funcione entrando a http://localhost:3000
app.use(express.static(path.join(__dirname, '../client')));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- RUTAS ---

app.get('/dashboard', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM movimientos ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/dashboard/cerrar-mes', async (req, res) => {
    const { mes_anio } = req.body;
    if (!mes_anio) return res.status(400).json({ error: 'Falta el nombre del mes.' });

    try {
        await pool.query('BEGIN');
        const queryInsert = `
            INSERT INTO historial_meses (monto, tipo, categoria, descripcion, fecha, mes_anio)
            SELECT monto, tipo, categoria, descripcion, fecha, $1
            FROM movimientos
        `;
        await pool.query(queryInsert, [mes_anio]);
        await pool.query('TRUNCATE TABLE movimientos');
        await pool.query('COMMIT');
        res.status(200).json({ mensaje: 'Mes cerrado y archivado correctamente.' });
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: 'Error al procesar el cierre de mes.' });
    }
});

app.post('/movimientos', async (req, res) => {
    const { monto, tipo, categoria, descripcion, frecuencia } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO movimientos (monto, tipo, categoria, descripcion, frecuencia) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [monto, tipo, categoria, descripcion, frecuencia]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/movimientos/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM movimientos WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/historial', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM historial_meses ORDER BY fecha DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});