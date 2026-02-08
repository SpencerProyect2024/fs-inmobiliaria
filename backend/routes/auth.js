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

    console.log('Login attempt:', email); // DEBUG


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }


    const connection = await pool.getConnection();
    console.log('DB connected'); // DEBUG
    

    const [users] = await connection.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );


    console.log('Users found:', users.length); // DEBUG

    connection.release();


    if (users.length === 0) {
      console.log('User not found'); // DEBUG

      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }


    const user = users[0];

    console.log('Password hash:', user.password); // DEBUG
    

    const validPassword = await bcrypt.compare(password, user.password);

    console.log('Password valid:', validPassword); // DEBUG


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

    console.error(error);

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

    const connection = await pool.getConnection();
    

    try {

      await connection.query(
        'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
        [nombre, email, hashedPassword]
      );


      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente'
      });


    } catch (error) {

      if (error.code === 'ER_DUP_ENTRY') {

        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });

      }

      throw error;


    } finally {

      connection.release();

    }

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});


export default router;
