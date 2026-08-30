import PDFDocument from 'pdfkit';
import { LaporanDataResult } from './dataLaporan.service';

/**
 * Service untuk men-generate file PDF resmi laporan evaluasi & riset pimpinan
 * dengan layout formal Universitas Andalas.
 */
export async function generatePdfLaporan(data: LaporanDataResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1E7E34'; // Unand Green
      const darkColor = '#212529';
      const grayColor = '#6C757D';
      const lightBg = '#F8F9FA';
      const borderColor = '#DEE2E6';

      // ==========================================
      // KOP SURAT RESMI UNIVERSITAS ANDALAS
      // ==========================================
      doc.rect(40, 35, doc.page.width - 80, 4).fill(primaryColor);
      doc.moveDown(0.5);

      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold')
        .text('UNIVERSITAS ANDALAS', { align: 'center' });
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold')
        .text('SISTEM AKTIVITAS & PRESTASI MAHASISWA (SAPS)', { align: 'center' });
      doc.fillColor(grayColor).fontSize(9).font('Helvetica')
        .text('Gedung Rektorat Limau Manis, Padang - Sumatera Barat 25163', { align: 'center' });

      doc.moveDown(0.5);
      doc.strokeColor(primaryColor).lineWidth(1.5)
        .moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
      doc.moveDown(0.8);

      // ==========================================
      // JUDUL LAPORAN & METADATA
      // ==========================================
      doc.fillColor(darkColor).fontSize(13).font('Helvetica-Bold')
        .text('LAPORAN EKSEKUTIF EVALUASI KEMAHASISWAAN', { align: 'center' });
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text(data.scopeNama.toUpperCase(), { align: 'center' });

      doc.moveDown(0.5);
      doc.fillColor(grayColor).fontSize(8).font('Helvetica')
        .text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })} | Kurikulum: ${data.kurikulum.nama} (Target: ${data.kurikulum.targetPoin} Poin)`, { align: 'center' });

      doc.moveDown(1);

      // ==========================================
      // KARTU KPI UTAMA (EXECUTIVE CARDS)
      // ==========================================
      const cardWidth = (doc.page.width - 80 - 20) / 3;
      const cardHeight = 50;
      const startY = doc.y;

      const kpis = [
        { label: 'Total Mahasiswa Terdata', val: `${data.kpi.totalMahasiswa.toLocaleString('id-ID')} Mhs` },
        { label: 'Rata-rata Capaian Poin', val: `${data.kpi.rataRataPoin} Poin (${data.kpi.rataRataPersentase}%)` },
        { label: 'Lulus Target Kurikulum', val: `${data.kpi.persentaseLulusTarget}% Mahasiswa` },
      ];

      kpis.forEach((kpi, idx) => {
        const x = 40 + idx * (cardWidth + 10);
        doc.rect(x, startY, cardWidth, cardHeight).fillAndStroke(lightBg, borderColor);
        doc.fillColor(grayColor).fontSize(8).font('Helvetica')
          .text(kpi.label, x + 8, startY + 8, { width: cardWidth - 16, align: 'center' });
        doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
          .text(kpi.val, x + 8, startY + 24, { width: cardWidth - 16, align: 'center' });
      });

      doc.y = startY + cardHeight + 15;

      // ==========================================
      // SECTION 1: EVALUASI 4 PILAR KURIKULUM
      // ==========================================
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text('1. Evaluasi Sebaran Capaian Per Pilar Kurikulum');
      doc.moveDown(0.3);

      // Table Header
      const tableLeft = 40;
      const colWidthsKur = [140, 85, 95, 110, 85];
      let currentY = doc.y;

      doc.rect(tableLeft, currentY, doc.page.width - 80, 20).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('Pilar Capaian', tableLeft + 5, currentY + 6);
      doc.text('Tahun', tableLeft + colWidthsKur[0], currentY + 6);
      doc.text('Target Poin', tableLeft + colWidthsKur[0] + colWidthsKur[1], currentY + 6);
      doc.text('Rata-rata Terkumpul', tableLeft + colWidthsKur[0] + colWidthsKur[1] + colWidthsKur[2], currentY + 6);
      doc.text('Capaian (%)', tableLeft + colWidthsKur[0] + colWidthsKur[1] + colWidthsKur[2] + colWidthsKur[3], currentY + 6);

      currentY += 20;

      data.capaianKurikulumStats.forEach((c, idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : lightBg;
        doc.rect(tableLeft, currentY, doc.page.width - 80, 18).fillAndStroke(bg, borderColor);
        doc.fillColor(darkColor).fontSize(8).font('Helvetica');
        doc.text(c.nama, tableLeft + 5, currentY + 5);
        doc.text(`Tahun ${c.tahun}`, tableLeft + colWidthsKur[0], currentY + 5);
        doc.text(`${c.targetPoin} Poin`, tableLeft + colWidthsKur[0] + colWidthsKur[1], currentY + 5);
        doc.text(`${c.rataRataTerkumpul} Poin`, tableLeft + colWidthsKur[0] + colWidthsKur[1] + colWidthsKur[2], currentY + 5);
        doc.text(`${c.persentaseCapaian}%`, tableLeft + colWidthsKur[0] + colWidthsKur[1] + colWidthsKur[2] + colWidthsKur[3], currentY + 5);
        currentY += 18;
      });

      doc.y = currentY + 15;

      // ==========================================
      // SECTION 2: PERINGKAT KOMPARASI (FAKULTAS / PRODI)
      // ==========================================
      const unitLabel = data.komparasi.unit === 'fakultas' ? 'Fakultas' : 'Program Studi';
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text(`2. Peringkat Capaian Aktivitas & Poin Antar-${unitLabel}`);
      doc.moveDown(0.3);

      const colWidthsKomp = [45, 180, 95, 95, 100];
      currentY = doc.y;

      doc.rect(tableLeft, currentY, doc.page.width - 80, 20).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('Rank', tableLeft + 5, currentY + 6);
      doc.text(`Nama ${unitLabel}`, tableLeft + colWidthsKomp[0], currentY + 6);
      doc.text('Total Mahasiswa', tableLeft + colWidthsKomp[0] + colWidthsKomp[1], currentY + 6);
      doc.text('Rata-rata Poin', tableLeft + colWidthsKomp[0] + colWidthsKomp[1] + colWidthsKomp[2], currentY + 6);
      doc.text('Capaian Target (%)', tableLeft + colWidthsKomp[0] + colWidthsKomp[1] + colWidthsKomp[2] + colWidthsKomp[3], currentY + 6);

      currentY += 20;

      data.komparasi.items.slice(0, 10).forEach((item, idx) => {
        const bg = idx % 2 === 0 ? '#FFFFFF' : lightBg;
        doc.rect(tableLeft, currentY, doc.page.width - 80, 18).fillAndStroke(bg, borderColor);
        doc.fillColor(darkColor).fontSize(8).font(item.ranking <= 3 ? 'Helvetica-Bold' : 'Helvetica');
        doc.text(`#${item.ranking}`, tableLeft + 5, currentY + 5);
        doc.text(item.nama, tableLeft + colWidthsKomp[0], currentY + 5, { width: colWidthsKomp[1] - 5 });
        doc.text(`${item.totalMahasiswa} Mhs`, tableLeft + colWidthsKomp[0] + colWidthsKomp[1], currentY + 5);
        doc.text(`${item.rataRataPoin} Poin`, tableLeft + colWidthsKomp[0] + colWidthsKomp[1] + colWidthsKomp[2], currentY + 5);
        doc.text(`${item.rataRataPersentase}%`, tableLeft + colWidthsKomp[0] + colWidthsKomp[1] + colWidthsKomp[2] + colWidthsKomp[3], currentY + 5);
        currentY += 18;
      });

      doc.y = currentY + 15;

      // ==========================================
      // SECTION 3: REKAP PRESTASI UNGGULAN (TOP 5)
      // ==========================================
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text('3. Rekapitulasi Prestasi Unggulan Mahasiswa (SIMKATMAWA)');
      doc.moveDown(0.3);

      const colWidthsPres = [110, 120, 125, 90, 70];
      currentY = doc.y;

      doc.rect(tableLeft, currentY, doc.page.width - 80, 20).fill('#0D6EFD'); // Biru
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('Nama Mahasiswa (NIM)', tableLeft + 5, currentY + 6);
      doc.text('Nama Prestasi / Kegiatan', tableLeft + colWidthsPres[0], currentY + 6);
      doc.text('Penyelenggara', tableLeft + colWidthsPres[0] + colWidthsPres[1], currentY + 6);
      doc.text('Skala / Peran', tableLeft + colWidthsPres[0] + colWidthsPres[1] + colWidthsPres[2], currentY + 6);
      doc.text('Poin Sah', tableLeft + colWidthsPres[0] + colWidthsPres[1] + colWidthsPres[2] + colWidthsPres[3], currentY + 6);

      currentY += 20;

      if (data.prestasiList.length === 0) {
        doc.rect(tableLeft, currentY, doc.page.width - 80, 20).fillAndStroke(lightBg, borderColor);
        doc.fillColor(grayColor).fontSize(8).font('Helvetica')
          .text('Belum ada data prestasi pada periode ini.', tableLeft + 10, currentY + 6);
        currentY += 20;
      } else {
        data.prestasiList.slice(0, 8).forEach((p, idx) => {
          const bg = idx % 2 === 0 ? '#FFFFFF' : lightBg;
          doc.rect(tableLeft, currentY, doc.page.width - 80, 20).fillAndStroke(bg, borderColor);
          doc.fillColor(darkColor).fontSize(8).font('Helvetica');
          doc.text(`${p.namaMahasiswa}\n(${p.nim})`, tableLeft + 5, currentY + 3, { width: colWidthsPres[0] - 5 });
          doc.text(p.namaKegiatan, tableLeft + colWidthsPres[0], currentY + 3, { width: colWidthsPres[1] - 5 });
          doc.text(p.penyelenggara, tableLeft + colWidthsPres[0] + colWidthsPres[1], currentY + 3, { width: colWidthsPres[2] - 5 });
          doc.text(`${p.skala}\n${p.peran}`, tableLeft + colWidthsPres[0] + colWidthsPres[1] + colWidthsPres[2], currentY + 3);
          doc.text(`${p.poin} Poin`, tableLeft + colWidthsPres[0] + colWidthsPres[1] + colWidthsPres[2] + colWidthsPres[3], currentY + 6);
          currentY += 20;
        });
      }

      // ==========================================
      // LEMBAR PENGESAHAN / TANDA TANGAN
      // ==========================================
      if (currentY > 660) {
        doc.addPage();
        currentY = 50;
      } else {
        currentY += 25;
      }

      const signX = doc.page.width - 220;
      doc.fillColor(darkColor).fontSize(9).font('Helvetica')
        .text(`Padang, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, signX, currentY);
      doc.text('Mengetahui / Mengesahkan,', signX, currentY + 14);
      doc.font('Helvetica-Bold').text(data.scopeNama, signX, currentY + 28, { width: 180 });

      doc.moveDown(4);
      doc.text('( ............................................................ )', signX, currentY + 90);
      doc.font('Helvetica').fontSize(8).text('NIP. .................................................', signX, currentY + 104);

      // Footer Penomoran Halaman
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fillColor(grayColor).fontSize(8).font('Helvetica')
          .text(
            `Dokumen Resmi SAPS Universitas Andalas — Halaman ${i + 1} dari ${range.count}`,
            40,
            doc.page.height - 30,
            { align: 'center', width: doc.page.width - 80 }
          );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
