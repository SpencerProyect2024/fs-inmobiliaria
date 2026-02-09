import express from 'express';
import pool from '../db.js';
import { verifyToken } from '../middleware/auth.js';
import twilio from 'twilio';

const router = express.Router();

// Configuración de Twilio (Lógica Senior: Se inicializa con variables de entorno)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Función de notificación (No bloquea el flujo principal)
const enviarNotificacionWhatsApp = async (datos) => {
  try {
    const numerosALosQueLlega = ["whatsapp:+573204838819", "whatsapp:+573142610308"];
    const fechaCita = datos.cita_agendada ? new Date(datos.cita_agendada).toLocaleString() : 'Pendiente';

    const promesas = numerosALosQueLlega.map(numero => {
      return client.messages.create({
        from: 'whatsapp:+14155238886', 
        body: `📅 *CITA AGENDADA AUTOMÁTICA*\n\n👤 *Cliente:* ${datos.nombre_completo}\n🏗️ *Proyecto:* ${datos.proyecto || 'N/A'}\n🗓️ *Fecha:* ${fechaCita}\n📞 *Teléfono:* ${datos.telefono || 'N/A'}`,
        to: numero
      });
    });

    return await Promise.all(promesas);
  } catch (error) {
    console.error("❌ Error enviando WhatsApp:", error.message);
  }
};

// --- RUTAS TRANSFORMADAS A POSTGRESQL ---

// 1. CREAR LOTE
router.post('/', verifyToken, async (req, res) => {
  try {
    const { 
      nombre_completo, nombre_empresa, estado_civil, origen_cliente,
      proyecto, manzana, lote, estado_lote, precio_total,
      enganche_porcentaje, tasa_interes, cuota_mensual,
      cita_agendada, telefono 
    } = req.body;

    if (!nombre_completo || !precio_total) {
      return res.status(400).json({ success: false, message: 'Nombre completo y precio son requeridos' });
    }

    // ✅ EN POSTGRES: Usamos pool.query directo y marcadores $1, $2, etc.
    const query = `
      INSERT INTO lotes (
        user_id, nombre_completo, nombre_empresa, estado_civil, origen_cliente,
        proyecto, manzana, lote, estado_lote, precio_total,
        enganche_porcentaje, tasa_interes, cuota_mensual
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`;

    const values = [
      req.user.id, nombre_completo, nombre_empresa, estado_civil, origen_cliente,
      proyecto, manzana, lote, estado_lote, precio_total,
      enganche_porcentaje, tasa_interes, cuota_mensual
    ];

    const result = await pool.query(query, values);

    // Disparo de WhatsApp (Si hay cita)
    if (cita_agendada) {
      enviarNotificacionWhatsApp(req.body);
    }

    res.status(201).json({
      success: true,
      message: 'Lote guardado exitosamente',
      lote_id: result.rows[0].id // Postgres devuelve el ID en rows[0]
    });

  } catch (error) {
    console.error('Error al guardar:', error);
    res.status(500).json({ success: false, message: 'Error al guardar el lote' });
  }
});

// 2. OBTENER TODOS LOS LOTES DEL USUARIO
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lotes WHERE user_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener lotes' });
  }
});

// 3. OBTENER UN LOTE POR ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lotes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lote no encontrado' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener el lote' });
  }
});

// 4. ACTUALIZAR LOTE
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { 
      nombre_completo, nombre_empresa, estado_civil, origen_cliente,
      proyecto, manzana, lote, estado_lote, precio_total,
      enganche_porcentaje, tasa_interes, cuota_mensual,
      cita_agendada 
    } = req.body;

    const query = `
      UPDATE lotes SET 
        nombre_completo = $1, nombre_empresa = $2, estado_civil = $3, origen_cliente = $4,
        proyecto = $5, manzana = $6, lote = $7, estado_lote = $8, precio_total = $9,
        enganche_porcentaje = $10, tasa_interes = $11, cuota_mensual = $12
      WHERE id = $13 AND user_id = $14`;

    const values = [
      nombre_completo, nombre_empresa, estado_civil, origen_cliente,
      proyecto, manzana, lote, estado_lote, precio_total,
      enganche_porcentaje, tasa_interes, cuota_mensual,
      req.params.id, req.user.id
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Lote no encontrado' });
    }

    if (cita_agendada) {
      enviarNotificacionWhatsApp(req.body);
    }

    res.json({ success: true, message: 'Lote actualizado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al actualizar' });
  }
});

// 5. ELIMINAR LOTE
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM lotes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Lote no encontrado' });
    }

    res.json({ success: true, message: 'Lote eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al eliminar' });
  }
});

export default router;