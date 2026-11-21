import * as XLSX from 'xlsx';
import {
  PTJWorkbookState,
  calculateParticipantTotals,
  calculateWorkbookSummary,
  generate57SheetManifest,
} from './ptjEngine';

export function exportPTJToExcel(state: PTJWorkbookState) {
  const wb = XLSX.utils.book_new();
  const summary = calculateWorkbookSummary(state);
  const { master } = state;

  // Sheet 1: 01_MASTER_PTJ
  const masterRows = [
    ['DOKUMEN MASTER PERTANGGUNGJAWABAN PERJALANAN DINAS (PTJ / SPPD)'],
    ['Kementerian / Lembaga', master.namaKementerian],
    ['Nama Satuan Kerja', master.namaSatker],
    ['Kode Satker', master.kodeSatker],
    ['Nomor & Tanggal DIPA', `${master.nomorDipa} (${master.tanggalDipa})`],
    ['Tahun Anggaran', master.tahunAnggaran],
    ['Kode MAK / Akun Belanja', `${master.kodeMak} - ${master.uraianMak}`],
    ['Pagu Anggaran MAK (Rp)', master.paguAnggaranMak],
    ['Nama Kegiatan', master.namaKegiatan],
    ['Lokasi Asal - Tujuan', `${master.lokasiAsal} -> ${master.lokasiTujuan} (${master.provinsiTujuan})`],
    ['Tanggal Pelaksanaan', `${master.tanggalMulai} s.d. ${master.tanggalSelesai} (${master.lamaHariDefault} Hari)`],
    ['Nomor & Tanggal Surat Tugas', `${master.nomorSuratTugas} (${master.tanggalSuratTugas})`],
    ['Tanggal SPPD & Pengesahan', `SPPD: ${master.tanggalSpd} | Pengesahan: ${master.tanggalKuitansi}`],
    [],
    ['PEJABAT PENANDATANGAN PTJ'],
    ['Jabatan', 'Nama Lengkap', 'NIP'],
    [master.ppkJabatan, master.ppkNama, master.ppkNip],
    [master.bendaharaJabatan, master.bendaharaNama, master.bendaharaNip],
    [master.ketuaTimJabatan, master.ketuaTimNama, master.ketuaTimNip],
    [],
    ['RINGKASAN REALISASI ANGGARAN'],
    ['Total Bruto SPPD / DPR (Rp)', summary.grandTotalBruto],
    ['Total Potongan Pajak (Rp)', summary.grandTotalPajak],
    ['Total Bersih Dibayarkan (Rp)', summary.grandTotalBersih],
    ['Terbilang Bersih', summary.terbilangGrandTotalBersih],
    ['Sisa Pagu MAK (Rp)', summary.sisaPagu],
  ];
  const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
  wsMaster['!cols'] = [{ wch: 32 }, { wch: 64 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsMaster, '01_MASTER_PTJ');

  // Sheet 2: 02_DAFTAR_NOMINATIF
  const nominatifHeader = [
    'No',
    'Nama Pelaksana',
    'NIP',
    'Pangkat / Golongan',
    'Jabatan',
    'Nomor SPPD',
    'Tujuan',
    'Lama (Hari)',
    '1. Uang Harian (Rp)',
    '2a. Pesawat PP (Rp)',
    '2b. Taksi Asal (Rp)',
    '2c. Taksi Provinsi (Rp)',
    '2d. Transpor Darat (Rp)',
    '3. Penginapan (Rp)',
    '4. Uang Representatif (Rp)',
    'Jumlah Ditetapkan (Rp)',
    'Dibayar Semula / Rencana (Rp)',
    'Pengembalian Rampung (Rp)',
    'Terbilang',
  ];

  const nominatifRows = state.participants.map((p, idx) => {
    const calc = calculateParticipantTotals(p);
    return [
      idx + 1,
      p.nama,
      p.nip,
      p.pangkatGolongan,
      p.jabatan,
      p.nomorSpd,
      master.lokasiTujuan,
      p.jumlahHari,
      calc.totalUangHarian,
      calc.biayaTiketPP,
      calc.biayaTaksiAsal,
      calc.biayaTaksiProvinsi,
      calc.biayaTransporDarat,
      calc.totalPenginapan,
      calc.totalRepresentasi,
      calc.jumlahBruto,
      calc.dibayarSemula,
      calc.pengembalianRampung,
      calc.terbilangBruto,
    ];
  });

  nominatifRows.push([
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    state.participants.reduce((a, b) => a + b.jumlahHari, 0),
    summary.totalUangHarian,
    state.participants.reduce((a, b) => a + calculateParticipantTotals(b).biayaTiketPP, 0),
    state.participants.reduce((a, b) => a + calculateParticipantTotals(b).biayaTaksiAsal, 0),
    state.participants.reduce((a, b) => a + calculateParticipantTotals(b).biayaTaksiProvinsi, 0),
    state.participants.reduce((a, b) => a + calculateParticipantTotals(b).biayaTransporDarat, 0),
    summary.totalPenginapan,
    summary.totalRepresentasi,
    summary.grandTotalBruto,
    state.participants.reduce((a, b) => a + calculateParticipantTotals(b).dibayarSemula, 0),
    state.participants.reduce((a, b) => a + calculateParticipantTotals(b).pengembalianRampung, 0),
    summary.terbilangGrandTotalBruto,
  ]);

  const wsNominatif = XLSX.utils.aoa_to_sheet([nominatifHeader, ...nominatifRows]);
  XLSX.utils.book_append_sheet(wb, wsNominatif, '02_DAFTAR_NOMINATIF');

  // Sheet 3: 03_INDEX_57_SHEET
  const manifest = generate57SheetManifest(state);
  const manifestRows = manifest.map((s) => [
    s.sheetNumber,
    s.sheetCode,
    s.sheetCategory,
    s.title,
    s.participantName || '-',
    s.totalAmount,
    s.status === 'READY'
      ? 'Siap Cetak'
      : s.status === 'EMPTY_SLOT'
      ? 'Slot Cadangan Kosong'
      : 'Perlu Dilengkapi',
  ]);
  const wsManifest = XLSX.utils.aoa_to_sheet([
    ['No Sheet', 'Kode Sheet Legacy', 'Kategori', 'Judul Lembar Kerja', 'Pelaksana', 'Nominal (Rp)', 'Status'],
    ...manifestRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsManifest, '03_INDEX_57_SHEET');

  const safeCode = (master.kodeMak || '524113').replace(/[^a-zA-Z0-9_-]/g, '');
  XLSX.writeFile(wb, `REKAP_SPPD_DPR_${safeCode}_${master.tahunAnggaran || '2025'}.xlsx`);
}

export function exportPTJBackupJson(state: PTJWorkbookState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BACKUP_TEMPLATE_PTJ_${state.master.kodeMak || '524113'}_${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
