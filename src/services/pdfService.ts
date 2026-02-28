import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { formatCurrency } from '../utils';

interface ReportData {
  indicators: {
    totalLoaned: number;
    totalReceived: number;
    totalInterest: number;
    openCapital: number;
    loanCount: number;
    activeClients: number;
    lateClients: number;
  };
  charts: {
    cashFlow: any[];
    growth: any[];
  };
  details: any[];
  rankings: {
    topProfit: any[];
    topDebt: any[];
  };
}

export const generatePDFReport = async (data: ReportData, period: string) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('pt-BR');
  const now = new Date().toLocaleTimeString('pt-BR');

  // Helper for centered text
  const centerText = (text: string, y: number, size = 12, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // 1. Header
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  centerText('Adisson - Gestão de Empréstimos', 15, 10, 'bold');
  centerText('RELATÓRIO FINANCEIRO PROFISSIONAL', 25, 18, 'bold');
  centerText(`Período: ${period.toUpperCase()} | Gerado em: ${today} às ${now}`, 34, 10, 'normal');

  let currentY = 50;

  // 2. Executive Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO EXECUTIVO', 14, currentY);
  currentY += 10;

  const indicators = [
    { label: 'Total Emprestado', value: formatCurrency(data.indicators.totalLoaned || 0) },
    { label: 'Total Recebido', value: formatCurrency(data.indicators.totalReceived || 0) },
    { label: 'Juros Recebidos', value: formatCurrency(data.indicators.totalInterest || 0) },
    { label: 'Capital em Aberto', value: formatCurrency(data.indicators.openCapital || 0) },
    { label: 'Empréstimos', value: String(data.indicators.loanCount || 0) },
    { label: 'Clientes Ativos', value: String(data.indicators.activeClients || 0) },
    { label: 'Inadimplentes', value: String(data.indicators.lateClients || 0) },
  ];

  // Draw indicator boxes
  let xPos = 14;
  let yPos = currentY;
  const boxWidth = (pageWidth - 42) / 3;
  const boxHeight = 20;

  indicators.forEach((ind, index) => {
    if (index > 0 && index % 3 === 0) {
      xPos = 14;
      yPos += boxHeight + 5;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(xPos, yPos, boxWidth, boxHeight, 2, 2, 'FD');
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(ind.label.toUpperCase(), xPos + 2, yPos + 6);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(ind.value, xPos + 2, yPos + 15);
    
    xPos += boxWidth + 7;
  });

  currentY = yPos + boxHeight + 15;

  // 3. Charts (Capturing from DOM if possible, or placeholders)
  // For this implementation, we'll use tables for rankings and details first
  // and then try to capture charts if we can find them.
  
  // 4. Rankings
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RANKINGS DE PERFORMANCE', 14, currentY);
  currentY += 8;

  const rankingData = data.rankings.topProfit.map((item, i) => [
    i + 1,
    item.name,
    formatCurrency(item.profit)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Cliente (Maior Lucro)', 'Lucro Gerado']],
    body: rankingData,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  const debtRankingData = data.rankings.topDebt.map((item, i) => [
    i + 1,
    item.name,
    formatCurrency(item.debt)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Cliente (Maior Dívida)', 'Saldo Devedor']],
    body: debtRankingData,
    theme: 'striped',
    headStyles: { fillColor: [244, 63, 94] },
    margin: { left: 14, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // 5. Detailed Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALHAMENTO DE CARTEIRA', 14, currentY);
  currentY += 8;

  const tableBody = data.details.map(row => [
    row.clientName,
    formatCurrency(row.loaned),
    formatCurrency(row.paid),
    formatCurrency(row.balance),
    row.status,
    row.daysLate ? `${Math.floor(row.daysLate)} dias` : '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Cliente', 'Emprestado', 'Pago', 'Saldo', 'Status', 'Atraso']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    }
  });

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Adisson Financial Report | Gerado em ${today} | Página ${i} de ${totalPages}`, 14, doc.internal.pageSize.getHeight() - 10);
  }

  const filename = `relatorio_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

export const generateCollectionsPDF = async (collections: any[]) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('pt-BR');
  const now = new Date().toLocaleTimeString('pt-BR');

  // Helper for centered text
  const centerText = (text: string, y: number, size = 12, style = 'normal') => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // 1. Header
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  centerText('Adisson - Gestão de Empréstimos', 15, 10, 'bold');
  centerText('LISTA DE COBRANÇA DIÁRIA', 25, 18, 'bold');
  centerText(`Data: ${today} | Gerado em: ${today} às ${now}`, 34, 10, 'normal');

  let currentY = 50;

  // 2. Summary
  const totalToCollect = collections.reduce((acc, curr) => acc + curr.pending_value, 0);
  const totalCount = collections.length;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DO DIA', 14, currentY);
  currentY += 10;

  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('TOTAL A COBRAR HOJE', 18, currentY + 7);
  doc.text('QTD. CLIENTES', pageWidth / 2 + 10, currentY + 7);

  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalToCollect), 18, currentY + 15);
  doc.text(String(totalCount), pageWidth / 2 + 10, currentY + 15);

  currentY += 30;

  // 3. Table
  const tableBody = collections.map(col => [
    col.clientName,
    col.clientPhone,
    formatCurrency(col.pending_value),
    col.payment_method,
    col.installmentStatus === 'LATE' ? 'ATRASADO' : 'PENDENTE'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Cliente', 'Telefone', 'Saldo Devedor', 'Tipo', 'Status']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    columnStyles: {
      2: { halign: 'right' },
    }
  });

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Adisson | Lista de Cobrança | Gerado em ${today} | Página ${i} de ${totalPages}`, 14, doc.internal.pageSize.getHeight() - 10);
  }

  const filename = `cobranças_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
