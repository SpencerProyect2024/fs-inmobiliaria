import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const router = express.Router();

/* ===============================
   TEST LOGIN (PARA DEBUG)
================================ */
router.post('/login-test', (req, res) => {
  res.json({
    success: true,
    message: 'Login OK'
  });
});

/* ===============================
   LOGIN REAL
================================ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email); 

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // ✅ CAMBIO PARA POSTGRES: Usamos pool.query directamente y $1 en vez de ?
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    const users = result.rows; // Postgres devuelve las filas en .rows
    console.log('Users found:', users.length);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Autenticación exitosa',
      user: {
        id: user.id,
        name: user.nombre,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Error en Login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

/* ===============================
   REGISTRO
================================ */
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ CAMBIO PARA POSTGRES: Usamos $1, $2, $3 y pool.query
    await pool.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)',
      [nombre, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente'
    });

  } catch (error) {
    console.error('Error en Registro:', error);
    
    // Manejo de duplicados en Postgres
    if (error.code === '23505') { 
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

export default router;