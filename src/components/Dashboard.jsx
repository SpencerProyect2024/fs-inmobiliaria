import { useState, useEffect } from 'react'
import { LogOut, FileText, MessageCircle, Save, User, Calendar } from 'lucide-react'
import api from '../services/api'
import logoInmobiliaria from '../assets/logo1.png'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONFIGURACIÓN DE JEFES ---
const NUMERO_JEFE_1 = "573142610308"; 
const NUMERO_JEFE_2 = "573222901786"; 

// --- LISTA DE PROYECTOS INTEGRADA ---
const proyectosFS = [
  "PROYECTO LAS RAMBLAS",
  "PROYECTO EL OASIS PARCELACIÓN EL OLIMPO",
  "PROYECTO URBANIZACIÓN ECOLÓGICA EL OASIS",
  "FINCAS DE SAN ISIDRO",
  "LAGOS DEL OLIMPO",
  "MONTEVERDE CONDOMINIO CAMPESTRE",
  "ACQUAVIVA CAMPESTRE",
  "COELLO SAN MATIAS",
  "PROYECTO",
  "PROYECTO CUNDAY",
  "PROMOTORA VILLAS DEL OLIMPO",
  "PROYECTO SOLE"
];

const Dashboard = ({ user, onLogout }) => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    telefono: '',       
    correo: '',         
    cita_agendada: '',  
    nombre_empresa: '',
    origen_cliente: '', 
    proyecto: '',
    manzana: '',
    lote: '',
    estado_lote: 'disponible',
    precio_total: '',
    enganche_porcentaje: 1000000,
    tasa_interes: 4000000,
    cuota_mensual: 0,
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
    if (!formData.precio_total || isNaN(formData.precio_total) || formData.precio_total <= 0) {
      setMessage('El precio debe ser un número válido mayor a 0')
      return false
    }
    return true
  }

  const calcularCuota = (currentData) => {
    const data = currentData || formData;
    const precioTotal = parseFloat(data.precio_total) || 0;
    const separacion = parseFloat(data.enganche_porcentaje) || 0;
    const promesa = parseFloat(data.tasa_interes) || 0;
    const saldoAFinanciar = precioTotal - separacion - promesa;
    return saldoAFinanciar > 0 ? (saldoAFinanciar / 36).toFixed(2) : 0;
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
      const colorOro = [184, 148, 77]; 
      doc.setFillColor(36, 48, 60); 
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('F&S INMOBILIARIA', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text('COTIZACIÓN DE PROYECTO HABITACIONAL', 105, 30, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('INFORMACIÓN DEL PROSPECTO', 14, 55);
      autoTable(doc, {
          startY: 60,
          body: [
              ['Nombre Completo:', formData.nombre_completo || 'N/A'],
              ['WhatsApp / Tel:', formData.telefono || 'N/A'],
              ['Correo Electrónico:', formData.correo || 'N/A'],
              ['Proyecto:', formData.proyecto || 'N/A'],
          ],
          theme: 'plain',
          styles: { fontSize: 11, cellPadding: 2 }
      });
      doc.setFontSize(14);
      doc.text('DETALLES FINANCIEROS', 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Concepto', 'Detalle']],
          body: [
              ['Manzana / Lote', `${formData.manzana || '0'} / ${formData.lote || '0'}`],
              ['Precio Total', `$${parseFloat(formData.precio_total).toLocaleString('es-CO')}`],
              ['Separación', `$${parseFloat(formData.enganche_porcentaje).toLocaleString('es-CO')}`],
              ['Cuota Promesa', `$${parseFloat(formData.tasa_interes).toLocaleString('es-CO')}`],
              ['CUOTA MENSUAL (36 MESES)', `$${parseFloat(formData.cuota_mensual).toLocaleString('es-CO')}`],
          ],
          headStyles: { fillColor: colorOro, textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      const finalY = doc.lastAutoTable.finalY + 30;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Esta cotización es informativa y está sujeta a cambios sin previo aviso.', 105, finalY, { align: 'center' });
      doc.text('© 2026 F&S Inmobiliaria - Gestión de Lujo', 105, finalY + 7, { align: 'center' });
      doc.save(`Cotizacion_${formData.nombre_completo}.pdf`);
      setMessage('✓ PDF generado correctamente');
    } catch (error) {
      console.error("Error al generar PDF:", error);
      setMessage('✗ Error al generar PDF');
    }
  };

  // ✅ LOGICA DE NOTIFICACION UNIDA
  const handleSendWhatsApp = () => {
    if (!formData.nombre_completo || !formData.telefono) {
      setMessage('⚠️ Completa el nombre y teléfono del cliente primero');
      return;
    }

    const mensaje = 
      `*🔔 NUEVA CITA AGENDADA - F&S*\n\n` +
      `👤 *Cliente:* ${formData.nombre_completo}\n` +
      `📞 *Teléfono:* ${formData.telefono}\n` +
      `🏗️ *Proyecto:* ${formData.proyecto || 'No especificado'}\n` +
      `📍 *Lote:* ${formData.lote || 'N/A'} (Mza: ${formData.manzana || 'N/A'})\n` +
      `📅 *Cita:* ${formData.cita_agendada || 'Por confirmar'}\n\n` +
      `_Enviado desde el Sistema de Gestión F&S_`;

    const url = `https://wa.me/${NUMERO_JEFE_1}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    setMessage('✓ Ventana de WhatsApp abierta');
  };

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
        await api.post('/lotes', formData)
        setMessage('✓ Lote guardado exitosamente')
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

  const handleEdit = (lote) => { setEditingId(lote.id); setFormData({ ...lote }); }

  const handleDelete = async (id) => {
    if (confirm('¿Deseas eliminar este lote?')) {
      try {
        await api.delete(`/lotes/${id}`)
        setMessage('✓ Lote eliminado')
        loadLotes()
      } catch (err) { setMessage('✗ Error al eliminar') }
    }
  }

  // --- ESTILOS EXACTOS ---
  const containerStyle = { minHeight: '100vh', backgroundColor: '#e5e7eb', padding: '20px' }
  const cardStyle = { maxWidth: '1400px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }
  const navStyle = { backgroundColor: '#24303c', color: '#fff', padding: '12px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #d4af37' }
  const contentStyle = { padding: '30px' }
  const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }
  const sectionStyle = { display: 'flex', flexDirection: 'column', gap: '16px' }
  const sectionTitleStyle = { fontSize: '16px', fontWeight: 'bold', color: '#333', paddingBottom: '12px', borderBottom: '2px solid #24303c' }
  const formGroupStyle = { display: 'flex', flexDirection: 'column', gap: '6px' }
  const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#555' }
  const inputStyle = { padding: '12px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const simulatorStyle = { backgroundColor: '#f3f4f6', padding: '24px', borderRadius: '12px', marginBottom: '30px' }
  const simulatorGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }
  const buttonsStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '30px', marginBottom: '40px' }
  const buttonBlueStyle = { padding: '14px', backgroundColor: '#24303c', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
  const buttonWhiteStyle = { ...buttonBlueStyle, backgroundColor: '#fff', color: '#24303c', border: '2px solid #24303c' }
  const buttonGreenStyle = { ...buttonBlueStyle, backgroundColor: '#22c55e' }
  const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '20px' }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={navStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={logoInmobiliaria} alt="Logo" style={{ height: '45px', borderRadius: '50%', border: '2px solid #d4af37' }} />
            <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>INMOBILIARIA F&S</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={onLogout}>
            <User size={20} />
            <span style={{ fontWeight: '500' }}>Hola, {user?.name || 'Asesor'}</span>
            <LogOut size={18} />
          </div>
        </div>

        <div style={contentStyle}>
          {message && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px', 
              backgroundColor: message.includes('✓') || message.includes('✅') ? '#dcfce7' : '#fee2e2', 
              color: message.includes('✓') || message.includes('✅') ? '#166534' : '#991b1b' 
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={gridStyle}>
              {/* SECCIÓN 1: CONTACTO */}
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>DATOS DE CONTACTO Y PROSPECTO</h3>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Nombre Completo *</label>
                  <input type="text" style={inputStyle} value={formData.nombre_completo} onChange={(e) => handleInputChange('nombre_completo', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>WhatsApp / Teléfono *</label>
                    <input type="tel" style={inputStyle} value={formData.telefono} onChange={(e) => handleInputChange('telefono', e.target.value)} />
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Correo Electrónico</label>
                    <input type="email" style={inputStyle} value={formData.correo} onChange={(e) => handleInputChange('correo', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Canal de Origen</label>
                    <select style={selectStyle} value={formData.origen_cliente} onChange={(e) => handleInputChange('origen_cliente', e.target.value)}>
                      <option value="">Seleccionar...</option>
                      <option value="Web">Web</option>
                      <option value="Publicidad">Publicidad</option>
                      <option value="Referencia">Referencia</option>
                    </select>
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Agendar Cita</label>
                    <input type="datetime-local" style={inputStyle} value={formData.cita_agendada} onChange={(e) => handleInputChange('cita_agendada', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: LOTE */}
              <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>DETALLES TÉCNICOS DEL LOTE</h3>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Proyecto/Urbanización</label>
                  <select 
                    style={selectStyle} 
                    value={formData.proyecto} 
                    onChange={(e) => handleInputChange('proyecto', e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    {proyectosFS.map((proy, index) => (
                      <option key={index} value={proy}>{proy}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Manzana / Lote</label>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <input type="text" style={{...inputStyle, flex: 1}} value={formData.manzana} onChange={(e) => handleInputChange('manzana', e.target.value)} placeholder="Mza" />
                      <input type="text" style={{...inputStyle, flex: 1}} value={formData.lote} onChange={(e) => handleInputChange('lote', e.target.value)} placeholder="Lote" />
                    </div>
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Estado del Lote</label>
                    <select style={selectStyle} value={formData.estado_lote} onChange={(e) => handleInputChange('estado_lote', e.target.value)}>
                      <option value="disponible">Disponible</option>
                      <option value="vendido">Vendido</option>
                      <option value="reservado">Reservado</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: SIMULADOR */}
            <div style={simulatorStyle}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>SIMULADOR FINANCIERO</h3>
              <div style={simulatorGridStyle}>
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Precio Total *</label>
                    <input type="number" style={inputStyle} value={formData.precio_total} onChange={(e) => handleInputChange('precio_total', e.target.value)} />
                </div>
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Separación</label>
                    <input type="number" style={inputStyle} value={formData.enganche_porcentaje} onChange={(e) => handleInputChange('enganche_porcentaje', e.target.value)} />
                </div>
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Cuota Promesa</label>
                    <input type="number" style={inputStyle} value={formData.tasa_interes} onChange={(e) => handleInputChange('tasa_interes', e.target.value)} />
                </div>
                <div style={{ backgroundColor: '#24303c', padding: '16px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>CUOTA (36 MESES)</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>${parseFloat(formData.cuota_mensual).toLocaleString('es-CO')}</div>
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div style={buttonsStyle}>
              <button type="submit" style={buttonBlueStyle} disabled={loading}>
                <Save size={18} /> {editingId ? 'ACTUALIZAR' : 'GUARDAR EN BD'}
              </button>
              <button type="button" style={buttonWhiteStyle} onClick={handleGeneratePDF}>
                <FileText size={18} /> GENERAR PDF
              </button>
              <button type="button" style={buttonGreenStyle} onClick={handleSendWhatsApp}>
                <MessageCircle size={18} /> NOTIFICAR JEFES
              </button>
            </div>
          </form>

          {/* TABLA DE RESULTADOS */}
          {lotes.length > 0 && (
            <div>
              <h3 style={sectionTitleStyle}>LOTES REGISTRADOS</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead style={{backgroundColor: '#24303c', color: '#fff'}}>
                    <tr>
                      <th style={{padding: '12px', textAlign: 'left'}}>Nombre</th>
                      <th style={{padding: '12px', textAlign: 'left'}}>Proyecto</th>
                      <th style={{padding: '12px', textAlign: 'left'}}>Precio</th>
                      <th style={{padding: '12px', textAlign: 'left'}}>Estado</th>
                      <th style={{padding: '12px', textAlign: 'left'}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotes.map(lote => (
                      <tr key={lote.id} style={{borderBottom: '1px solid #ddd'}}>
                        <td style={{padding: '12px'}}>{lote.nombre_completo}</td>
                        <td style={{padding: '12px'}}>{lote.proyecto}</td>
                        <td style={{padding: '12px'}}>${parseFloat(lote.precio_total).toLocaleString('es-CO')}</td>
                        <td style={{padding: '12px'}}>{lote.estado_lote}</td>
                        <td style={{padding: '12px'}}>
                          <button onClick={() => handleEdit(lote)} style={{marginRight: '8px', padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Editar</button>
                          <button onClick={() => handleDelete(lote.id)} style={{padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Borrar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard;