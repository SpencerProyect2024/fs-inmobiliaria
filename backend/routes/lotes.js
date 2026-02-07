import express from 'express';
import pool from '../db.js';
import { verifyToken } from '../middleware/auth.js';
import twilio from 'twilio'; // Importación agregada

const router = express.Router();

// Función de notificación (Lógica Senior: No bloquea el flujo principal)
const enviarNotificacionWhatsApp = async (datos) => {
  const numerosALosQueLlega = ["whatsapp:+573204838819", "whatsapp:+573142610308"];
  const fechaCita = datos.cita_agendada ? new Date(datos.cita_agendada).toLocaleString() : 'Pendiente';

  const promesas = numerosALosQueLlega.map(numero => {
    return client.messages.create({
      from: 'whatsapp:+14155238886', 
      body: `📅 *CITA AGENDADA AUTOMÁTICA*\n\n👤 *Cliente:* ${datos.nombre_completo}\n🏗️ *Proyecto:* ${datos.proyecto || 'N/A'}\n🗓️ *Fecha:* ${fechaCita}\n📞 *Teléfono:* ${datos.telefono || 'N/A'}`,
      to: numero
    });
  });

  return Promise.all(promesas);
};

// Crear lote
router.post('/', verifyToken, async (req, res) => {
  try {
    const { 
      nombre_completo, nombre_empresa, estado_civil, origen_cliente,
      proyecto, manzana, lote, estado_lote, precio_total,
      enganche_porcentaje, tasa_interes, cuota_mensual,
      cita_agendada, telefono // Extraídos para la notificación
    } = req.body;

    if (!nombre_completo || !precio_total) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo y precio son requeridos'
      });
    }

    if (isNaN(precio_total) || precio_total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número válido'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        `INSERT INTO lotes (
          user_id, nombre_completo, nombre_empresa, estado_civil, origen_cliente,
          proyecto, manzana, lote, estado_lote, precio_total,
          enganche_porcentaje, tasa_interes, cuota_mensual
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, nombre_completo, nombre_empresa, estado_civil, origen_cliente,
          proyecto, manzana, lote, estado_lote, precio_total,
          enganche_porcentaje, tasa_interes, cuota_mensual
        ]
      );

      // --- DISPARO AUTOMÁTICO SILENCIOSO ---
      if (cita_agendada) {
        enviarNotificacionWhatsApp(req.body)
          .then(() => console.log("✅ WhatsApp enviado correctamente"))
          .catch(err => console.error("❌ Error Twilio:", err.message));
      }

      res.status(201).json({
        success: true,
        message: 'Lote guardado exitosamente',
        lote_id: result.insertId
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar el lote'
    });
  }
});

// Obtener lotes del usuario
router.get('/', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [lotes] = await connection.query(
        'SELECT * FROM lotes WHERE user_id = ? ORDER BY fecha_creacion DESC',
        [req.user.id]
      );

      res.json({
        success: true,
        data: lotes
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lotes'
    });
  }
});

// Obtener un lote
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [lotes] = await connection.query(
        'SELECT * FROM lotes WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (lotes.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lote no encontrado'
        });
      }

      res.json({
        success: true,
        data: lotes[0]
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el lote'
    });
  }
});

// Actualizar lote
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { 
      nombre_completo, nombre_empresa, estado_civil, origen_cliente,
      proyecto, manzana, lote, estado_lote, precio_total,
      enganche_porcentaje, tasa_interes, cuota_mensual,
      cita_agendada, telefono // Extraídos para la notificación
    } = req.body;

    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        `UPDATE lotes SET 
          nombre_completo = ?, nombre_empresa = ?, estado_civil = ?, origen_cliente = ?,
          proyecto = ?, manzana = ?, lote = ?, estado_lote = ?, precio_total = ?,
          enganche_porcentaje = ?, tasa_interes = ?, cuota_mensual = ?
        WHERE id = ? AND user_id = ?`,
        [
          nombre_completo, nombre_empresa, estado_civil, origen_cliente,
          proyecto, manzana, lote, estado_lote, precio_total,
          enganche_porcentaje, tasa_interes, cuota_mensual,
          req.params.id, req.user.id
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lote no encontrado'
        });
      }

      // --- DISPARO AUTOMÁTICO EN ACTUALIZACIÓN ---
      if (cita_agendada) {
        enviarNotificacionWhatsApp(req.body)
          .catch(err => console.error("❌ Error Twilio en actualización:", err.message));
      }

      res.json({
        success: true,
        message: 'Lote actualizado exitosamente'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el lote'
    });
  }
});

// Eliminar lote
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'DELETE FROM lotes WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lote no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Lote eliminado exitosamente'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el lote'
    });
  }
});

export default router;