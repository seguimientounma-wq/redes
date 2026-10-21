'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Copy, Check, MessageSquare, Mail, Image as ImageIcon, 
  ExternalLink, Download, Sparkles, Filter, Calendar, BarChart3, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: any[];
  dateStart?: string;
  dateEnd?: string;
  activeFilters?: Record<string, string>;
}

export default function ExecutiveReportModal({
  isOpen,
  onClose,
  tasks,
  dateStart,
  dateEnd,
  activeFilters = {}
}: ExecutiveReportModalProps) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'graphic'>('whatsapp');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [taskFilterOption, setTaskFilterOption] = useState<'all' | 'critical' | 'active' | 'completed'>('all');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeAssignees, setIncludeAssignees] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper dinámico de estado
  const getDiffDays = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return null;
    const parts = fechaVencimiento.split(/[\/\-]/);
    if (parts.length !== 3) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    // Asumiendo formato DD/MM/YYYY
    const [d, m, y] = parts;
    const limitDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const diffTime = limitDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusLabel = (task: any) => {
    if (task.estado === 'Vencida') return 'Vencida';
    if (task.estado === 'Cumplida') return 'Cumplida';
    if (task.estado === 'Cancelada') return 'Cancelada';
    if (task.estado === 'En proceso') return 'En proceso';
    const diff = getDiffDays(task.fechaVencimiento);
    if (diff !== null) {
      if (diff < 0) return 'Vencida';
      if (diff >= 0 && diff <= 2) return 'Próxima a Vencer';
    }
    return task.estado || 'Pendiente';
  };

  // Cálculo de KPIs
  const total = tasks.length;
  const cumplidas = tasks.filter(t => getStatusLabel(t) === 'Cumplida').length;
  const enProceso = tasks.filter(t => getStatusLabel(t) === 'En proceso').length;
  const pendientes = tasks.filter(t => getStatusLabel(t) === 'Pendiente').length;
  const proximas = tasks.filter(t => getStatusLabel(t) === 'Próxima a Vencer').length;
  const vencidas = tasks.filter(t => getStatusLabel(t) === 'Vencida').length;
  const canceladas = tasks.filter(t => getStatusLabel(t) === 'Cancelada').length;

  const pctCumplimiento = total > 0 ? Math.round((cumplidas / total) * 100) : 0;
  const pctEnProceso = total > 0 ? Math.round((enProceso / total) * 100) : 0;
  const pctVencidas = total > 0 ? Math.round((vencidas / total) * 100) : 0;

  // Barra de progreso textual para WhatsApp
  const generateProgressBar = (pct: number) => {
    const blocks = Math.round(pct / 10);
    return '█'.repeat(blocks) + '░'.repeat(10 - blocks) + ` ${pct}%`;
  };

  // Formato legible de fecha
  const formatDateRangeText = () => {
    if (dateStart && dateEnd) {
      return `del ${dateStart} al ${dateEnd}`;
    }
    if (dateStart) return `desde el ${dateStart}`;
    if (dateEnd) return `hasta el ${dateEnd}`;
    return 'Período completo actual';
  };

  // Filtrar tareas según la opción elegida en el modal
  const filteredModalTasks = tasks.filter(t => {
    const status = getStatusLabel(t);
    if (taskFilterOption === 'critical') return status === 'Vencida' || status === 'Próxima a Vencer';
    if (taskFilterOption === 'active') return status === 'En proceso' || status === 'Pendiente';
    if (taskFilterOption === 'completed') return status === 'Cumplida';
    return true;
  });

  // Texto generado para WhatsApp
  const generateWhatsAppText = () => {
    const lines = [
      `🏛️ *UNIVERSIDAD NACIONAL MADRES DE PLAZA DE MAYO*`,
      `📑 *REPORTE DE DIRECCIÓN DE EDUCACIÓN A DISTANCIA UNMa - SIED*`,
      `📅 *Período:* ${formatDateRangeText()}`,
      `⏰ *Fecha de Emisión:* ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📊 *RESUMEN EJECUTIVO DEL PERÍODO:*`,
      `• *Total de tareas:* ${total}`,
      `• *Avance institucional:* [${generateProgressBar(pctCumplimiento)}]`,
      ``,
      `• ✅ *Cumplidas:* ${cumplidas} (${pctCumplimiento}%)`,
      `• ⏳ *En Proceso:* ${enProceso} (${pctEnProceso}%)`,
      `• 📌 *Pendientes:* ${pendientes}`,
      `• ⚠️ *Próximas a vencer:* ${proximas}`,
      `• 🚨 *Vencidas:* ${vencidas} (${pctVencidas}%)`,
      ...(canceladas > 0 ? [`• ⚪ *Canceladas:* ${canceladas}`] : []),
      `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ];

    if (vencidas > 0) {
      lines.push(`⚠️ *ALERTA:* Se registran ${vencidas} tarea(s) vencida(s) que requieren atención prioritaria.`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    } else {
      lines.push(`✨ *ESTADO:* Período al día sin demoras críticas registradas.`);
      lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    }

    lines.push(`📋 *DETALLE DE TAREAS (${filteredModalTasks.length}):*`);
    
    if (filteredModalTasks.length === 0) {
      lines.push(`_No se encontraron tareas con el filtro seleccionado._`);
    } else {
      filteredModalTasks.forEach((t, index) => {
        const status = getStatusLabel(t);
        let icon = '📌';
        if (status === 'Cumplida') icon = '✅';
        else if (status === 'En proceso') icon = '⏳';
        else if (status === 'Próxima a Vencer') icon = '⚠️';
        else if (status === 'Vencida') icon = '🚨';
        else if (status === 'Cancelada') icon = '⚪';

        const persona = t.nombreAsignado ? `${t.nombreAsignado} ${t.apellidoAsignado || ''}`.trim() : (t.cargo || 'Sin asignar');
        const docente = t.docenteVinculado ? ` [Docente: ${t.docenteVinculado}]` : '';
        const vencimiento = t.fechaVencimiento ? ` | Vence: ${t.fechaVencimiento}` : '';

        lines.push(`${index + 1}. ${icon} *[${status}]* ${t.descripcion || 'Sin descripción'}`);
        if (includeAssignees) {
          lines.push(`   👤 Resp: ${persona}${docente}${vencimiento}`);
        }
        if (includeDetails && t.evidencia) {
          lines.push(`   📝 Avance: ${t.evidencia.substring(0, 100)}${t.evidencia.length > 100 ? '...' : ''}`);
        }
      });
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🌐 _Sistema de Seguimiento UNMa - SIED_`);
    lines.push(`✉️ _seguimiento.ead@unma.net.ar_`);

    return lines.join('\n');
  };

  // HTML generado para Email Institucional
  const generateEmailHtml = () => {
    const rangeText = formatDateRangeText();
    const currentDate = `${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;

    let rowsHtml = '';
    filteredModalTasks.forEach((t, i) => {
      const status = getStatusLabel(t);
      let badgeBg = '#dbeafe';
      let badgeColor = '#1e40af';
      if (status === 'Cumplida') { badgeBg = '#dcfce7'; badgeColor = '#15803d'; }
      else if (status === 'En proceso') { badgeBg = '#fef9c3'; badgeColor = '#854d0e'; }
      else if (status === 'Próxima a Vencer') { badgeBg = '#ffedd5'; badgeColor = '#9a3412'; }
      else if (status === 'Vencida') { badgeBg = '#fee2e2'; badgeColor = '#b91c1c'; }

      const persona = t.nombreAsignado ? `${t.nombreAsignado} ${t.apellidoAsignado || ''}`.trim() : (t.cargo || '-');
      const rowBg = i % 2 === 0 ? '#ffffff' : '#f9fafb';

      rowsHtml += `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #111827;">${t.id || (i + 1)}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #1f2937;">
            <strong>${t.descripcion || '-'}</strong>
            ${t.tipo ? `<br/><span style="font-size: 11px; color: #6b7280;">Tipo: ${t.tipo} | Área: ${t.area || 'General'}</span>` : ''}
            ${includeDetails && t.evidencia ? `<br/><span style="font-size: 11px; color: #059669; font-style: italic;">Último avance: ${t.evidencia}</span>` : ''}
          </td>
          ${includeAssignees ? `<td style="padding: 10px 12px; font-size: 12px; color: #374151;">${persona}${t.docenteVinculado ? `<br/><span style="color:#2563eb; font-size:11px;">Vinculado: ${t.docenteVinculado}</span>` : ''}</td>` : ''}
          <td style="padding: 10px 12px; font-size: 12px; color: #4b5563; white-space: nowrap;">${t.fechaVencimiento || t.fechaInicio || '-'}</td>
          <td style="padding: 10px 12px; text-align: center;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${badgeBg}; color: ${badgeColor};">
              ${status}
            </span>
          </td>
        </tr>
      `;
    });

    return `
      <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 750px; margin: 0 auto; color: #1f2937; line-height: 1.5; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; padding: 24px; text-align: left;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">UNIVERSIDAD NACIONAL MADRES DE PLAZA DE MAYO</h2>
          <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Dirección General de Educación a Distancia - SIED</p>
          <p style="margin: 10px 0 0; font-size: 17px; font-weight: 700; color: #bfdbfe;">REPORTE DE DIRECCIÓN DE EDUCACIÓN A DISTANCIA UNMa</p>
          <div style="margin-top: 14px; display: inline-block; background-color: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">
            📅 Período: <strong>${rangeText}</strong> | Emitido: ${currentDate}
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 24px; background-color: #ffffff;">
          <!-- Tarjetas KPI -->
          <h3 style="margin-top: 0; font-size: 16px; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📊 Resumen de Rendimiento del Período</h3>
          
          <table style="width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 20px;">
            <tr>
              <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center; width: 20%;">
                <span style="font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase;">Total</span>
                <div style="font-size: 24px; font-weight: 900; color: #1e3a8a; margin-top: 2px;">${total}</div>
              </td>
              <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; width: 20%;">
                <span style="font-size: 11px; font-weight: 700; color: #15803d; text-transform: uppercase;">Cumplidas</span>
                <div style="font-size: 24px; font-weight: 900; color: #14532d; margin-top: 2px;">${cumplidas}</div>
                <span style="font-size: 10px; color: #16a34a; font-weight: 600;">${pctCumplimiento}%</span>
              </td>
              <td style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px; text-align: center; width: 20%;">
                <span style="font-size: 11px; font-weight: 700; color: #a16207; text-transform: uppercase;">En Proceso</span>
                <div style="font-size: 24px; font-weight: 900; color: #713f12; margin-top: 2px;">${enProceso}</div>
                <span style="font-size: 10px; color: #ca8a04; font-weight: 600;">${pctEnProceso}%</span>
              </td>
              <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center; width: 20%;">
                <span style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase;">Pendientes</span>
                <div style="font-size: 24px; font-weight: 900; color: #1e40af; margin-top: 2px;">${pendientes}</div>
              </td>
              <td style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center; width: 20%;">
                <span style="font-size: 11px; font-weight: 700; color: #b91c1c; text-transform: uppercase;">Vencidas</span>
                <div style="font-size: 24px; font-weight: 900; color: #7f1d1d; margin-top: 2px;">${vencidas}</div>
                <span style="font-size: 10px; color: #dc2626; font-weight: 600;">${pctVencidas}%</span>
              </td>
            </tr>
          </table>

          <!-- Barra de Progreso Visual -->
          <div style="margin-bottom: 24px; background-color: #f3f4f6; border-radius: 9999px; height: 16px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); width: ${pctCumplimiento}%; height: 100%; border-radius: 9999px;"></div>
          </div>

          <!-- Tabla de tareas -->
          <h3 style="font-size: 16px; color: #111827; margin: 24px 0 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            📑 Detalle de Tareas (${filteredModalTasks.length})
          </h3>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background-color: #1e3a8a; color: #ffffff;">
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; border-top-left-radius: 6px;">ID</th>
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700;">Descripción</th>
                  ${includeAssignees ? '<th style="padding: 10px 12px; font-size: 12px; font-weight: 700;">Responsable</th>' : ''}
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700;">Vencimiento</th>
                  <th style="padding: 10px 12px; font-size: 12px; font-weight: 700; text-align: center; border-top-right-radius: 6px;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Footer Reporte -->
          <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
            <p style="margin: 0;">Reporte generado automáticamente desde la plataforma de Seguimiento Institucional UNMa.</p>
            <p style="margin: 4px 0 0;">Para consultas o reasignaciones dirigirse a: <strong>seguimiento.ead@unma.net.ar</strong></p>
          </div>
        </div>
      </div>
    `;
  };

  // Función dedicada para dibujar la tarjeta visual en alta definición
  const drawCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1200;
    const height = 675; // Formato 16:9 HD
    canvas.width = width;
    canvas.height = height;

    // Fondo degradado elegante ultra nítido
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0a0f1d');
    bgGradient.addColorStop(0.5, '#0f172a');
    bgGradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Borde exterior refinado
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(14, 14, width - 28, height - 28, 16);
    ctx.stroke();

    // Header Institucional
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 18px Roboto, sans-serif';
    ctx.fillText('UNIVERSIDAD NACIONAL MADRES DE PLAZA DE MAYO', 48, 56);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Roboto, sans-serif';
    ctx.fillText('REPORTE DIRECCIÓN DE EDUCACIÓN A DISTANCIA UNMa', 48, 98);

    // Subtítulo con rango de fechas
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Roboto, sans-serif';
    ctx.fillText(`SIED • Período: ${formatDateRangeText()}  •  Emitido: ${new Date().toLocaleDateString('es-AR')}`, 48, 132);

    // Línea divisoria
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 152);
    ctx.lineTo(width - 48, 152);
    ctx.stroke();

    // 4 Tarjetas de Métricas Rápidas
    const cards = [
      { label: 'TOTAL TAREAS', val: total.toString(), color: '#38bdf8', border: '#0284c7' },
      { label: 'CUMPLIDAS', val: `${cumplidas} (${pctCumplimiento}%)`, color: '#4ade80', border: '#16a34a' },
      { label: 'EN PROCESO', val: `${enProceso} (${pctEnProceso}%)`, color: '#facc15', border: '#ca8a04' },
      { label: 'VENCIDAS', val: `${vencidas} (${pctVencidas}%)`, color: '#f87171', border: '#dc2626' },
    ];

    const cardWidth = 254;
    const cardHeight = 90;
    const startX = 48;
    const cardY = 172;
    const gap = 30;

    cards.forEach((c, i) => {
      const cx = startX + i * (cardWidth + gap);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(cx, cardY, cardWidth, cardHeight, 12);
      ctx.fill();
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px Roboto, sans-serif';
      ctx.fillText(c.label, cx + 18, cardY + 30);

      ctx.fillStyle = c.color;
      ctx.font = 'bold 28px Roboto, sans-serif';
      ctx.fillText(c.val, cx + 18, cardY + 68);
    });

    // Gráfico de Dona / Torta de Estados
    const donutCenterX = 240;
    const donutCenterY = 440;
    const radius = 120;
    const innerRadius = 70;

    const pieSlices = [
      { label: 'Cumplidas', count: cumplidas, color: '#22c55e' },
      { label: 'En Proceso', count: enProceso, color: '#eab308' },
      { label: 'Pendientes', count: pendientes, color: '#3b82f6' },
      { label: 'Próximas', count: proximas, color: '#f97316' },
      { label: 'Vencidas', count: vencidas, color: '#ef4444' },
    ].filter(s => s.count > 0);

    let startAngle = -Math.PI / 2;

    if (total === 0) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.arc(donutCenterX, donutCenterY, (radius + innerRadius) / 2, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      pieSlices.forEach(slice => {
        const sliceAngle = (slice.count / total) * 2 * Math.PI;
        ctx.fillStyle = slice.color;
        ctx.beginPath();
        ctx.arc(donutCenterX, donutCenterY, radius, startAngle, startAngle + sliceAngle);
        ctx.arc(donutCenterX, donutCenterY, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();
        startAngle += sliceAngle;
      });
    }

    // Centro de la dona con % de Cumplimiento
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${pctCumplimiento}%`, donutCenterX, donutCenterY + 8);
    ctx.font = 'bold 11px Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('AVANCE', donutCenterX, donutCenterY + 28);
    ctx.textAlign = 'left';

    // Leyenda del gráfico de dona
    const legendX = 410;
    const legendY = 340;
    pieSlices.forEach((slice, idx) => {
      const ly = legendY + idx * 36;
      ctx.fillStyle = slice.color;
      ctx.beginPath();
      ctx.roundRect(legendX, ly, 18, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 16px Roboto, sans-serif';
      const pctSlice = total > 0 ? Math.round((slice.count / total) * 100) : 0;
      ctx.fillText(`${slice.label}: ${slice.count} (${pctSlice}%)`, legendX + 28, ly + 15);
    });

    // Panel Derecho: Diagnóstico y Salud del Período
    const panelX = 690;
    const panelY = 300;
    const panelW = 462;
    const panelH = 280;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 17px Roboto, sans-serif';
    ctx.fillText('DIAGNÓSTICO INSTITUCIONAL DEL PERÍODO', panelX + 24, panelY + 36);

    // Barra de progreso dentro del panel
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(panelX + 24, panelY + 56, panelW - 48, 14, 7);
    ctx.fill();

    const progressW = ((panelW - 48) * pctCumplimiento) / 100;
    if (progressW > 0) {
      const barGrad = ctx.createLinearGradient(panelX + 24, 0, panelX + 24 + progressW, 0);
      barGrad.addColorStop(0, '#22c55e');
      barGrad.addColorStop(1, '#10b981');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(panelX + 24, panelY + 56, progressW, 14, 7);
      ctx.fill();
    }

    // Texto de diagnóstico
    ctx.fillStyle = '#f8fafc';
    ctx.font = '15px Roboto, sans-serif';
    if (vencidas > 0) {
      ctx.fillStyle = '#fca5a5';
      ctx.fillText(`• Se detectan ${vencidas} tareas vencidas con riesgo de desvío.`, panelX + 24, panelY + 110);
      ctx.fillStyle = '#fdba74';
      ctx.fillText(`• ${proximas} tareas vencen en las próximas 48 horas.`, panelX + 24, panelY + 145);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`• Prioridad: Regularizar entregables pendientes del área.`, panelX + 24, panelY + 180);
      ctx.fillText(`• Equipo asignado: ${cumplidas} tareas completadas en fecha.`, panelX + 24, panelY + 215);
    } else {
      ctx.fillStyle = '#86efac';
      ctx.fillText(`• Período con excelente cumplimiento y 0 tareas vencidas.`, panelX + 24, panelY + 110);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`• ${cumplidas} tareas completadas satisfactoriamente.`, panelX + 24, panelY + 145);
      ctx.fillText(`• ${enProceso} tareas en proceso dentro de los plazos fijados.`, panelX + 24, panelY + 180);
      ctx.fillText(`• Funcionamiento regular del área sin alertas críticas.`, panelX + 24, panelY + 215);
    }

    // Pie de la tarjeta
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Roboto, sans-serif';
    ctx.fillText('Dirección General de Educación a Distancia (SIED) • Universidad Nacional Madres de Plaza de Mayo', 48, 642);
  };

  // Redibujado automático ante cualquier cambio
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      drawCanvas();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, activeTab, total, cumplidas, enProceso, pendientes, proximas, vencidas, pctCumplimiento, dateStart, dateEnd]);

  // Copiar texto para WhatsApp
  const copyWhatsApp = async () => {
    try {
      const text = generateWhatsAppText();
      await navigator.clipboard.writeText(text);
      setCopiedType('whatsapp');
      toast.success('¡Copiado con formato para WhatsApp!', {
        description: 'Pégalo con Ctrl+V en tu chat o grupo de WhatsApp.'
      });
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      toast.error('No se pudo copiar automáticamente');
    }
  };

  // Abrir WhatsApp Web con el texto precargado
  const openWhatsAppWeb = () => {
    const text = generateWhatsAppText();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Copiar Email en formato HTML enriquecido
  const copyEmailHtml = async () => {
    try {
      const html = generateEmailHtml();
      const plainText = generateWhatsAppText();

      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobPlain = new Blob([plainText], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobPlain
          })
        ]);
        setCopiedType('email');
        toast.success('¡Formato de Email Institucional copiado!', {
          description: 'Pégalo en Gmail o Outlook con Ctrl+V. Se pegará la tabla con colores y estilos institucionales.'
        });
      } else {
        await navigator.clipboard.writeText(plainText);
        setCopiedType('email');
        toast.success('Copiado texto plano para correo.');
      }
      setTimeout(() => setCopiedType(null), 2500);
    } catch (e) {
      toast.error('Error al copiar el formato de correo');
    }
  };

  // Abrir cliente de correo predeterminado
  const openMailClient = () => {
    const subject = encodeURIComponent(`[Seguimiento UNMa] Minuta y Reporte Ejecutivo - ${formatDateRangeText()}`);
    const body = encodeURIComponent(generateWhatsAppText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Copiar Imagen del Gráfico al portapapeles
  const copyCanvasImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) throw new Error('No se pudo generar el blob');
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedType('graphic');
          toast.success('¡Imagen del Gráfico copiada al portapapeles!', {
            description: 'Presiona Ctrl+V en WhatsApp Web o en tu correo para pegarla directamente.'
          });
          setTimeout(() => setCopiedType(null), 2500);
        } else {
          toast.error('Tu navegador no soporta copiar imágenes directamente. Usa el botón Descargar.');
        }
      }, 'image/png');
    } catch (e) {
      toast.error('No se pudo copiar la imagen al portapapeles');
    }
  };

  // Descargar Imagen PNG
  const downloadCanvasImage = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_UNMa_${dateStart || 'periodo'}_${dateEnd || 'actual'}.png`;
    a.click();
    toast.success('¡Imagen del reporte descargada con éxito!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Reporte Dirección de Educación a Distancia UNMa</h2>
                <span className="bg-blue-500/30 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-400/30">
                  SIED
                </span>
              </div>
              <p className="text-sm text-blue-200 mt-0.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 inline" />
                Período: <span className="font-semibold text-white">{formatDateRangeText()}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold ml-1">
                  {total} tareas
                </span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* AJUSTES Y CONFIGURACIÓN DEL REPORTE */}
        <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">Incluir en el listado:</span>
            <div className="flex bg-white dark:bg-gray-900 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setTaskFilterOption('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${taskFilterOption === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
              >
                Todas ({total})
              </button>
              <button 
                onClick={() => setTaskFilterOption('critical')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${taskFilterOption === 'critical' ? 'bg-red-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
              >
                Críticas ({vencidas + proximas})
              </button>
              <button 
                onClick={() => setTaskFilterOption('active')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${taskFilterOption === 'active' ? 'bg-yellow-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
              >
                Activas ({enProceso + pendientes})
              </button>
              <button 
                onClick={() => setTaskFilterOption('completed')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${taskFilterOption === 'completed' ? 'bg-green-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}
              >
                Cumplidas ({cumplidas})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 dark:text-gray-400">
              <input 
                type="checkbox" 
                checked={includeAssignees} 
                onChange={(e) => setIncludeAssignees(e.target.checked)} 
                className="rounded text-blue-600 focus:ring-blue-500" 
              />
              <span>Responsables y Docentes</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 dark:text-gray-400">
              <input 
                type="checkbox" 
                checked={includeDetails} 
                onChange={(e) => setIncludeDetails(e.target.checked)} 
                className="rounded text-blue-600 focus:ring-blue-500" 
              />
              <span>Detalles y Avances</span>
            </label>
          </div>
        </div>

        {/* TABS DE FORMATO */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex border-b border-gray-200 dark:border-gray-800 gap-2 sm:gap-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-3 px-2 sm:px-3 flex items-center gap-2 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'whatsapp'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>1. WhatsApp</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`pb-3 px-2 sm:px-3 flex items-center gap-2 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            <span>2. Email Institucional (HTML)</span>
          </button>
          <button
            onClick={() => setActiveTab('graphic')}
            className={`pb-3 px-2 sm:px-3 flex items-center gap-2 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'graphic'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>3. Gráfico Visual (PNG)</span>
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL SCROLLEABLE */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-green-50 dark:bg-green-950/30 p-3 rounded-xl border border-green-200 dark:border-green-800 gap-3">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-300 text-xs sm:text-sm font-medium">
                  <MessageSquare className="w-5 h-5 text-green-600 shrink-0" />
                  <span>Optimizado para WhatsApp con viñetas, emojis y barra de avance tipográfica.</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={copyWhatsApp}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
                  >
                    {copiedType === 'whatsapp' ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                    {copiedType === 'whatsapp' ? '¡Copiado!' : 'Copiar para WhatsApp'}
                  </button>
                  <button
                    onClick={openWhatsAppWeb}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                    title="Abrir WhatsApp Web con el mensaje precargado"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>Abrir Web</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 text-gray-100 p-4 sm:p-5 rounded-2xl font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-inner border border-gray-800 max-h-[480px] overflow-y-auto">
                {generateWhatsAppText()}
              </div>
            </div>
          )}

          {/* TAB 2: EMAIL INSTITUCIONAL */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 dark:border-blue-800 gap-3">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 text-xs sm:text-sm font-medium">
                  <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Se copia como tabla enriquecida con colores institucionales compatible con Gmail, Outlook y Word.</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={copyEmailHtml}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
                  >
                    {copiedType === 'email' ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                    {copiedType === 'email' ? '¡Formato Copiado!' : 'Copiar para Email (HTML)'}
                  </button>
                  <button
                    onClick={openMailClient}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>Mailto</span>
                  </button>
                </div>
              </div>

              {/* Vista Previa Renderizada del Correo */}
              <div 
                className="p-3 sm:p-4 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm max-h-[500px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: generateEmailHtml() }}
              />
            </div>
          )}

          {/* TAB 3: GRÁFICO / TARJETA VISUAL */}
          <div className={activeTab === 'graphic' ? 'space-y-4' : 'hidden'}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-purple-50 dark:bg-purple-950/30 p-3 rounded-xl border border-purple-200 dark:border-purple-800 gap-3">
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 text-xs sm:text-sm font-medium">
                <ImageIcon className="w-5 h-5 text-purple-600 shrink-0" />
                <span>Tarjeta visual oficial de alta resolución lista para copiar o descargar y enviar por WhatsApp o correo.</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={copyCanvasImage}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  {copiedType === 'graphic' ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                  {copiedType === 'graphic' ? '¡Imagen Copiada!' : 'Copiar Imagen'}
                </button>
                <button
                  onClick={downloadCanvasImage}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Descargar PNG</span>
                </button>
              </div>
            </div>

            <div className="flex justify-center items-center bg-gray-950 p-3 sm:p-5 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              <canvas 
                ref={canvasRef} 
                className="w-full h-auto max-w-[960px] rounded-xl shadow-2xl border border-gray-800 bg-slate-950 block"
                style={{ width: '100%', height: 'auto', aspectRatio: '16/9' }}
              />
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">💡 Tip de Uso:</span>
            <span>Copia la imagen y pégala en WhatsApp Web con Ctrl+V junto con el texto resumen.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
