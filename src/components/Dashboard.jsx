import { useState, useEffect } from 'react'
import { LogOut, FileText, MessageCircle, Save, User } from 'lucide-react'
import api from '../services/api'
import logoInmobiliaria from '../assets/logo1.png'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const proyectosFS = [
  "PROYECTO LAS RAMBLAS", "PROYECTO EL OASIS PARCELACIÓN EL OLIMPO",
  "PROYECTO URBANIZACIÓN ECOLÓGICA EL OASIS", "FINCAS DE SAN ISIDRO",
  "LAGOS DEL OLIMPO", "MONTEVERDE CONDOMINIO CAMPESTRE",
  "ACQUAVIVA CAMPESTRE", "COELLO SAN MATIAS", "PROYECTO",
  "PROYECTO CUNDAY", "PROMOTORA VILLAS DEL OLIMPO", "PROYECTO SOLE"
];

const Dashboard = ({ user, onLogout }) => {
  const [formData, setFormData] = useState({
    nombre_completo: '', telefono: '', correo: '', cita_agendada: '',
    nombre_empresa: '', origen_cliente: '', proyecto: '',
    manzana: '', lote: '', estado_lote: 'disponible',
    precio_total: '', enganche_porcentaje: 1000000,
    tasa_interes: 4000000, cuota_mensual: 0,
  })

  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    loadLotes()
  }, [])

  const loadLotes = async () => {
    try {
      const response = await api.get('/lotes')
      if (response.data.success) {
        setLotes(response.data.data)
      }
    } catch (error) {
      console.error('Error cargando lotes:', error)
    }
  }

  const validateForm = () => {
    if (!formData.nombre_completo.trim()) {
      setMessage('El nombre completo es requerido')
      return false
    }
    if (!formData.precio_total || isNaN(formData.precio_total)) {
      setMessage('El precio debe ser un número válido')
      return false
    }
    return true
  }

  const calcularCuota = (data) => {
    const precioTotal = parseFloat(data.precio_total) || 0;
    const separacion = parseFloat(data.enganche_porcentaje) || 0;
    const promesa = parseFloat(data.tasa_interes) || 0;
    const saldo = precioTotal - separacion - promesa;
    return saldo > 0 ? (saldo / 36).toFixed(2) : 0;
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (['precio_total', 'enganche_porcentaje', 'tasa_interes'].includes(field)) {
        newData.cuota_mensual = calcularCuota(newData);
      }
      return newData;
    });
  }

  const handleGeneratePDF = () => {
    try {
      if (!validateForm()) return;
      const doc = new jsPDF();
      doc.setFillColor(36, 48, 60); 
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('F&S INMOBILIARIA', 105, 25, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: 50,
        head: [['Concepto', 'Detalle']],
        body: [
          ['Cliente', formData.nombre_completo],
          ['Proyecto', formData.proyecto],
          ['Manzana/Lote', `${formData.manzana} / ${formData.lote}`],
          ['Precio Total', `$${parseFloat(formData.precio_total).toLocaleString('es-CO')}`],
          ['Cuota Mensual', `$${parseFloat(formData.cuota_mensual).toLocaleString('es-CO')}`]
        ],
        headStyles: { fillColor: [184, 148, 77] }
      });
      doc.save(`Cotizacion_${formData.nombre_completo}.pdf`);
      setMessage('✓ PDF generado');
    } catch (e) { setMessage('✗ Error PDF'); }
  };

  // ✅ LOGICA CORREGIDA: El backend ya hace el trabajo pesado
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    setMessage('')
    try {
      if (editingId) {
        await api.put(`/lotes/${editingId}`, formData)
        setMessage('✓ Lote actualizado exitosamente')
      } else {
        // Al enviar esto, el backend guarda en Supabase y dispara Twilio automáticamente
        await api.post('/lotes', formData)
        setMessage('✅ Lote guardado y Jefes notificados')
      }
      setEditingId(null)
      loadLotes()
      setFormData({
        nombre_completo: '', telefono: '', correo: '', cita_agendada: '',
        nombre_empresa: '', origen_cliente: '', proyecto: '', manzana: '',
        lote: '', estado_lote: 'disponible', precio_total: '',
        enganche_porcentaje: 1000000, tasa_interes: 4000000, cuota_mensual: 0,
      })
    } catch (err) {
      setMessage('✗ Error: ' + (err.response?.data?.message || err.message))
    } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar lote?')) {
      try {
        await api.delete(`/lotes/${id}`)
        loadLotes()
        setMessage('✓ Lote eliminado')
      } catch (e) { setMessage('✗ Error al eliminar') }
    }
  }

  // --- ESTILOS ---
  const containerStyle = { minHeight: '100vh', backgroundColor: '#e5e7eb', padding: '20px', fontFamily: 'sans-serif' }
  const cardStyle = { maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }
  const navStyle = { backgroundColor: '#24303c', color: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
  const inputStyle = { padding: '10px', border: '1px solid #ddd', borderRadius: '6px', width: '100%', boxSizing: 'border-box' }
  const buttonBlueStyle = { padding: '12px', backgroundColor: '#24303c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoInmobiliaria} alt="Logo" style={{ height: '40px', borderRadius: '50%' }} />
            <span style={{ fontWeight: 'bold' }}>F&S DASHBOARD</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span><User size={16} inline /> {user?.name}</span>
            <LogOut size={20} onClick={onLogout} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        <div style={{ padding: '30px' }}>
          {message && (
            <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '20px', backgroundColor: message.includes('✓') || message.includes('✅') ? '#dcfce7' : '#fee2e2', color: message.includes('✓') || message.includes('✅') ? '#166534' : '#991b1b' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label>Nombre Completo *</label>
                <input type="text" style={inputStyle} value={formData.nombre_completo} onChange={(e) => handleInputChange('nombre_completo', e.target.value)} />
              </div>
              <div>
                <label>WhatsApp *</label>
                <input type="tel" style={inputStyle} value={formData.telefono} onChange={(e) => handleInputChange('telefono', e.target.value)} />
              </div>
              <div>
                <label>Proyecto</label>
                <select style={inputStyle} value={formData.proyecto} onChange={(e) => handleInputChange('proyecto', e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {proyectosFS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label>Cita (Opcional - Notifica a Jefes)</label>
                <input type="datetime-local" style={inputStyle} value={formData.cita_agendada} onChange={(e) => handleInputChange('cita_agendada', e.target.value)} />
              </div>
            </div>

            <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', alignItems: 'end' }}>
              <div><label>Precio Total</label><input type="number" style={inputStyle} value={formData.precio_total} onChange={(e) => handleInputChange('precio_total', e.target.value)} /></div>
              <div><label>Separación</label><input type="number" style={inputStyle} value={formData.enganche_porcentaje} onChange={(e) => handleInputChange('enganche_porcentaje', e.target.value)} /></div>
              <div><label>Promesa</label><input type="number" style={inputStyle} value={formData.tasa_interes} onChange={(e) => handleInputChange('tasa_interes', e.target.value)} /></div>
              <div style={{ backgroundColor: '#24303c', color: '#fff', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px' }}>CUOTA (36 MESES)</div>
                <div style={{ fontWeight: 'bold' }}>${parseFloat(formData.cuota_mensual).toLocaleString('es-CO')}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
              <button type="submit" style={buttonBlueStyle} disabled={loading}><Save size={18} /> {editingId ? 'ACTUALIZAR' : 'GUARDAR Y NOTIFICAR'}</button>
              <button type="button" style={{ ...buttonBlueStyle, backgroundColor: '#fff', color: '#24303c', border: '1px solid #24303c' }} onClick={handleGeneratePDF}><FileText size={18} /> GENERAR PDF</button>
            </div>
          </form>

          {lotes.length > 0 && (
            <div style={{ marginTop: '40px' }}>
              <h3 style={{ borderBottom: '2px solid #24303c', paddingBottom: '10px' }}>LOTES REGISTRADOS</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Cliente</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Proyecto</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Precio</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lotes.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{l.nombre_completo}</td>
                      <td style={{ padding: '10px' }}>{l.proyecto}</td>
                      <td style={{ padding: '10px' }}>${parseFloat(l.precio_total).toLocaleString('es-CO')}</td>
                      <td style={{ padding: '10px' }}>
                        <button onClick={() => {setEditingId(l.id); setFormData({...l})}} style={{ marginRight: '5px', color: 'blue', border: 'none', background: 'none', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => handleDelete(l.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Borrar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard;