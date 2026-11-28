export type TaxType =
  | 'NONE'
  | 'PPH21_GOL4'
  | 'PPH21_GOL3'
  | 'PPH22'
  | 'PPH23'
  | 'PPN_11'
  | 'CUSTOM';

export interface KopSuratConfig {
  kementerian: string;
  eselon1: string;
  satkerName: string;
  alamat: string;
  teleponEmail: string;
  website: string;
  logoPreset: 'pengayoman' | 'garuda' | 'instansi' | 'custom';
  customLogoDataUrl: string;
  tampilkanKopDiRincianDpr: boolean;
}

export interface MasterKegiatan {
  namaKementerian: string;
  namaSatker: string;
  kodeSatker: string;
  nomorDipa: string;
  tanggalDipa: string;
  tahunAnggaran: string;
  kodeMak: string;
  uraianMak: string;
  paguAnggaranMak: number;
  namaKegiatan: string;
  lokasiAsal: string;
  lokasiTujuan: string;
  provinsiTujuan: string;
  labelTransporDarat: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lamaHariDefault: number;
  nomorSuratTugas: string;
  tanggalSuratTugas: string;
  nomorSpdPrefix: string;
  tanggalSpd: string;
  kotaPenandatangan: string;
  tanggalKuitansi: string;
  ringkasanHasilKegiatan: string;
  // Pejabat Penandatangan
  ppkNama: string;
  ppkNip: string;
  ppkJabatan: string;
  bendaharaNama: string;
  bendaharaNip: string;
  bendaharaJabatan: string;
  ketuaTimNama: string;
  ketuaTimNip: string;
  ketuaTimJabatan: string;
}

export interface RiilExpenseItem {
  id: string;
  uraian: string;
  jumlah: number;
  keterangan: string;
}

export interface ParticipantPTJ {
  id: string;
  noUrut: number;
  nama: string;
  nip: string;
  pangkatGolongan: string;
  jabatan: string;
  tingkatBiaya: 'A' | 'B' | 'C';
  nomorSpd: string;
  tanggalSpd?: string; // Kolom 6 Database: Tanggal SPD per pelaksana
  tanggalPertanggungjawaban?: string; // Kolom 20 Database: Tanggal Pertanggungjawaban (auto +14 hari dari Tanggal SPD)
  nomorSuratTugas?: string; // Kolom 22 Database: ST
  tanggalSuratTugas?: string; // Kolom 23 Database: TANGGAL ST
  nomorKuitansi: string;
  // 1. Uang Harian (Kolom 7, 8, 9, 10 Database)
  jumlahHari: number;
  tarifUangHarian: number;
  // 2. Transportasi (Kolom 11, 12, 13, 14 & Kolom 25 Database)
  modaTransportasi: string;
  nomorTiketPP: string;
  biayaTiketPP: number; // Kolom 11: Pesawat (PP)
  biayaTaksiAsal: number; // Kolom 12: Taksi Jakarta
  biayaTaksiProvinsi: number; // Kolom 13: Taksi Provinsi
  biayaDaratSpd?: number; // Kolom 14: Darat
  biayaTransporDarat: number; // Kolom 25: TRANSPORTASI DARAT (masuk ke Rincian Biaya & DPR)
  // Legacy compatibility
  biayaTaksiBandaraPP?: number;
  biayaTransporLokal?: number;
  // 3. Penginapan / Hotel (Kolom 15, 16, 17 Database + Slot Pengali 30%)
  namaHotel: string;
  jumlahMalam: number; // Kolom 15: Hari Hotel
  tarifHotelPerMalam: number; // Kolom 16: Biaya Per Malam
  gunakanTarif30Persen: boolean;
  persenPenginapan?: number; // Slot pengali persen penginapan (default 30 jika gunakanTarif30Persen=true, 100 jika false)
  // 4. Uang Representatif (Kolom 18 Database)
  uangRepresentasiPerHari: number;
  // Rencana Biaya / Dibayar Semula (Untuk Perhitungan SPPD Rampung)
  rencanaDibayarSemula?: number;
  // Pengeluaran Riil Tambahan (opsional)
  riilItems: RiilExpenseItem[];
  // Pajak / Potongan
  taxType: TaxType;
  customTaxAmount: number;
}

export interface PTJWorkbookState {
  version: string;
  lastSavedAt: string;
  lastMacroRunAt: string | null;
  kopSurat: KopSuratConfig;
  master: MasterKegiatan;
  participants: ParticipantPTJ[];
}

export interface ParticipantCalculated {
  totalUangHarian: number;
  totalRepresentasi: number;
  biayaTiketPP: number;
  biayaTaksiAsal: number;
  biayaTaksiProvinsi: number;
  biayaDaratSpd: number;
  biayaTransporDarat: number;
  totalTransportasi: number;
  persenPenginapanEfektif: number;
  tarifHotelEfektifPerMalam: number;
  totalPenginapan: number;
  totalRiilTambahan: number;
  totalBiayaDatabase: number; // Kolom 19 Database (Total Uang Harian + Pesawat + Taksi + Darat + Hotel + Representatif)
  uangYangDiterima: number; // Kolom 21 Database
  daftarPengeluaranRiilTotal: number;
  jumlahBruto: number; // Total di Rincian Biaya & DPR (totalBiayaDatabase + biayaTransporDarat + riilItems)
  dibayarSemula: number;
  pengembalianRampung: number;
  potonganPajak: number;
  taxLabel: string;
  jumlahBersih: number;
  terbilangBruto: string;
  terbilangBersih: string;
  terbilangRiil: string;
  terbilangRencana: string;
}

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning';
  module: 'MASTER' | 'PEJABAT' | 'PELAKSANA' | 'ANGGARAN';
  field: string;
  message: string;
  participantId?: string;
}

export interface VirtualSheetInfo {
  sheetNumber: number;
  sheetCode: string;
  sheetCategory:
    | 'MASTER & DB'
    | 'REKAP & SURAT'
    | 'KUITANSI'
    | 'RINCIAN BIAYA'
    | 'PENGELUARAN RIIL'
    | 'SPD & VISUM';
  title: string;
  participantName?: string;
  participantId?: string;
  docType?: 'kuitansi' | 'rincian' | 'riil' | 'rencana' | 'nominatif' | 'sptjm';
  totalAmount: number;
  status: 'READY' | 'EMPTY_SLOT' | 'NEEDS_FIX';
}

const SATUAN_WORDS = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas',
];

function convertNumberToWordsCore(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num === 0) return '';
  if (num < 12) {
    return SATUAN_WORDS[num];
  }
  if (num < 20) {
    return `${convertNumberToWordsCore(num - 10)} Belas`.trim();
  }
  if (num < 100) {
    const puluh = Math.floor(num / 10);
    const sisa = num % 10;
    return `${convertNumberToWordsCore(puluh)} Puluh ${convertNumberToWordsCore(sisa)}`.trim();
  }
  if (num < 200) {
    return `Seratus ${convertNumberToWordsCore(num - 100)}`.trim();
  }
  if (num < 1000) {
    const ratus = Math.floor(num / 100);
    const sisa = num % 100;
    return `${convertNumberToWordsCore(ratus)} Ratus ${convertNumberToWordsCore(sisa)}`.trim();
  }
  if (num < 2000) {
    return `Seribu ${convertNumberToWordsCore(num - 1000)}`.trim();
  }
  if (num < 1_000_000) {
    const ribu = Math.floor(num / 1000);
    const sisa = num % 1000;
    return `${convertNumberToWordsCore(ribu)} Ribu ${convertNumberToWordsCore(sisa)}`.trim();
  }
  if (num < 1_000_000_000) {
    const juta = Math.floor(num / 1_000_000);
    const sisa = num % 1_000_000;
    return `${convertNumberToWordsCore(juta)} Juta ${convertNumberToWordsCore(sisa)}`.trim();
  }
  if (num < 1_000_000_000_000) {
    const miliar = Math.floor(num / 1_000_000_000);
    const sisa = num % 1_000_000_000;
    return `${convertNumberToWordsCore(miliar)} Miliar ${convertNumberToWordsCore(sisa)}`.trim();
  }
  const triliun = Math.floor(num / 1_000_000_000_000);
  const sisa = num % 1_000_000_000_000;
  return `${convertNumberToWordsCore(triliun)} Triliun ${convertNumberToWordsCore(sisa)}`.trim();
}

/**
 * Mengonversi angka kecil (misal jumlah hari: 4 -> "empat") untuk format "4 (empat) hari x"
 */
export function terbilangHariKecil(n: number): string {
  const num = Math.max(0, Math.floor(Number(n) || 0));
  if (num === 0) return 'nol';
  return convertNumberToWordsCore(num).toLowerCase();
}

/**
 * Mengonversi angka nominal ke teks Terbilang Bahasa Indonesia resmi
 */
export function terbilangRupiah(amount: number): string {
  if (!Number.isFinite(amount) || Math.round(amount) === 0) {
    return 'Nol Rupiah';
  }
  const rounded = Math.round(amount);
  const prefix = rounded < 0 ? 'Minus ' : '';
  const words = convertNumberToWordsCore(Math.abs(rounded)).replace(/\s+/g, ' ').trim();
  return `${prefix}${words} Rupiah`;
}

/**
 * Memformat angka ke mata uang Rupiah standar administrasi pemerintahan (misal: Rp 1.140.000)
 */
export function formatRupiah(amount: number, includePrefix = true): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const formatted = Math.abs(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = safe < 0 ? '-' : '';
  return includePrefix ? `${sign}Rp ${formatted}` : `${sign}${formatted}`;
}

/**
 * Memformat angka untuk sel akuntansi PDF: jika > 0 tampilkan "210.000", jika 0 tampilkan "-"
 */
export function formatAccountingCell(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  if (safe === 0) return '-';
  return formatRupiah(safe, false);
}

const BULAN_INDO = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Memformat tanggal YYYY-MM-DD menjadi format dokumen resmi Indonesia (misal: "19 November 2025" atau "03 Desember 2025")
 */
export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return dateStr;
  const year = match[1];
  const monthIdx = parseInt(match[2], 10) - 1;
  const day = match[3];
  const monthName = BULAN_INDO[monthIdx] || match[2];
  return `${day} ${monthName} ${year}`;
}

/**
 * Menambahkan N hari pada tanggal YYYY-MM-DD (Rumus Excel Database: Tanggal Pertanggungjawaban = Tanggal SPD + 14 hari)
 */
export function addDaysIso(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return dateStr;
  const dt = new Date(
    Date.UTC(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10))
  );
  dt.setUTCDate(dt.getUTCDate() + days);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTaxLabel(taxType: TaxType): string {
  switch (taxType) {
    case 'NONE':
      return 'Tanpa Potongan Pajak (0%)';
    case 'PPH21_GOL4':
      return 'PPh Pasal 21 Gol. IV (15% atas Uang Representasi/Honor)';
    case 'PPH21_GOL3':
      return 'PPh Pasal 21 Gol. III (5% atas Uang Representasi/Honor)';
    case 'PPH22':
      return 'PPh Pasal 22 Belanja Barang (1,5%)';
    case 'PPH23':
      return 'PPh Pasal 23 Jasa/Sewa (2%)';
    case 'PPN_11':
      return 'PPN (11%)';
    case 'CUSTOM':
      return 'Potongan Pajak Manual (Custom)';
  }
}

/**
 * Menghitung seluruh rincian biaya, kolom Database (1-25), perhitungan SPPD rampung, dan terbilang untuk 1 pelaksana
 */
export function calculateParticipantTotals(p: ParticipantPTJ): ParticipantCalculated {
  const hari = Math.max(0, Number(p.jumlahHari) || 0);
  const malam = Math.max(0, Number(p.jumlahMalam) || 0);

  const totalUangHarian = Math.round(hari * (Number(p.tarifUangHarian) || 0));
  const totalRepresentasi = Math.round(
    (hari > 0 ? hari : 1) * (Number(p.uangRepresentasiPerHari) || 0)
  );

  const biayaTiketPP = Math.round(Number(p.biayaTiketPP) || 0);
  const biayaTaksiAsal = Math.round(
    Number(p.biayaTaksiAsal ?? p.biayaTaksiBandaraPP) || 0
  );
  const biayaTaksiProvinsi = Math.round(Number(p.biayaTaksiProvinsi) || 0);
  const biayaDaratSpd = Math.round(Number(p.biayaDaratSpd) || 0);
  const biayaTransporDarat = Math.round(
    Number(p.biayaTransporDarat ?? p.biayaTransporLokal) || 0
  );

  const totalTransportasi =
    biayaTiketPP + biayaTaksiAsal + biayaTaksiProvinsi + biayaDaratSpd + biayaTransporDarat;

  const tarifHotel = Math.round(Number(p.tarifHotelPerMalam) || 0);
  const persenPenginapanEfektif =
    p.persenPenginapan !== undefined && Number(p.persenPenginapan) > 0
      ? Number(p.persenPenginapan)
      : p.gunakanTarif30Persen
      ? 30
      : 100;
  const tarifHotelEfektifPerMalam = Math.round(
    tarifHotel * (persenPenginapanEfektif / 100)
  );
  const totalPenginapan = Math.round(malam * tarifHotelEfektifPerMalam);

  const totalRiilTambahan = (p.riilItems || []).reduce(
    (sum, item) => sum + Math.round(Number(item.jumlah) || 0),
    0
  );

  // Kolom 19 Database: Total Biaya (Uang Harian + Pesawat + Taksi Jakarta + Taksi Provinsi + Darat + Total Hotel + Representatif)
  const totalBiayaDatabase =
    totalUangHarian +
    biayaTiketPP +
    biayaTaksiAsal +
    biayaTaksiProvinsi +
    biayaDaratSpd +
    totalPenginapan +
    totalRepresentasi;

  // Kolom 21 Database: Uang yang diterima
  const uangYangDiterima = totalBiayaDatabase;

  // Total pada Rincian Biaya Perjalanan Dinas (termasuk seluruh komponen biaya + Kolom 25 TRANSPORTASI DARAT)
  const jumlahBruto =
    totalBiayaDatabase +
    biayaTransporDarat +
    totalRiilTambahan;

  // Daftar Pengeluaran Riil: hanya yang tidak ada buktinya (Uang Harian + Transportasi Darat/Taksi + Uang Representatif + Riil Tambahan)
  const daftarPengeluaranRiilTotal =
    totalUangHarian +
    biayaTaksiAsal +
    biayaTaksiProvinsi +
    biayaDaratSpd +
    biayaTransporDarat +
    totalRepresentasi +
    totalRiilTambahan;

  const dibayarSemula =
    p.rencanaDibayarSemula !== undefined && p.rencanaDibayarSemula > 0
      ? Math.round(Number(p.rencanaDibayarSemula))
      : jumlahBruto;

  const pengembalianRampung = Math.max(0, dibayarSemula - jumlahBruto);

  let potonganPajak = 0;
  switch (p.taxType) {
    case 'NONE':
      potonganPajak = 0;
      break;
    case 'PPH21_GOL4':
      potonganPajak = Math.round(
        (totalRepresentasi > 0 ? totalRepresentasi : totalUangHarian) * 0.15
      );
      break;
    case 'PPH21_GOL3':
      potonganPajak = Math.round(
        (totalRepresentasi > 0 ? totalRepresentasi : totalUangHarian) * 0.05
      );
      break;
    case 'PPH22':
      potonganPajak = Math.round(jumlahBruto * 0.015);
      break;
    case 'PPH23':
      potonganPajak = Math.round(jumlahBruto * 0.02);
      break;
    case 'PPN_11':
      potonganPajak = Math.round(jumlahBruto * 0.11);
      break;
    case 'CUSTOM':
      potonganPajak = Math.max(0, Math.round(Number(p.customTaxAmount) || 0));
      break;
  }

  const jumlahBersih = Math.max(0, jumlahBruto - potonganPajak);

  return {
    totalUangHarian,
    totalRepresentasi,
    biayaTiketPP,
    biayaTaksiAsal,
    biayaTaksiProvinsi,
    biayaDaratSpd,
    biayaTransporDarat,
    totalTransportasi,
    persenPenginapanEfektif,
    tarifHotelEfektifPerMalam,
    totalPenginapan,
    totalRiilTambahan,
    totalBiayaDatabase,
    uangYangDiterima,
    daftarPengeluaranRiilTotal,
    jumlahBruto,
    dibayarSemula,
    pengembalianRampung,
    potonganPajak,
    taxLabel: getTaxLabel(p.taxType),
    jumlahBersih,
    terbilangBruto: terbilangRupiah(jumlahBruto),
    terbilangBersih: terbilangRupiah(jumlahBersih),
    terbilangRiil: terbilangRupiah(daftarPengeluaranRiilTotal),
    terbilangRencana: terbilangRupiah(dibayarSemula),
  };
}

export function calculateWorkbookSummary(state: PTJWorkbookState) {
  let totalUangHarian = 0;
  let totalRepresentasi = 0;
  let totalTransportasi = 0;
  let totalPenginapan = 0;
  let totalPengeluaranRiil = 0;
  let grandTotalBruto = 0;
  let grandTotalPajak = 0;
  let grandTotalBersih = 0;

  const perParticipant = state.participants.map((p) => {
    const calc = calculateParticipantTotals(p);
    totalUangHarian += calc.totalUangHarian;
    totalRepresentasi += calc.totalRepresentasi;
    totalTransportasi += calc.totalTransportasi;
    totalPenginapan += calc.totalPenginapan;
    totalPengeluaranRiil += calc.biayaTransporDarat + calc.totalRiilTambahan;
    grandTotalBruto += calc.jumlahBruto;
    grandTotalPajak += calc.potonganPajak;
    grandTotalBersih += calc.jumlahBersih;
    return { participant: p, calc };
  });

  const sisaPagu = (Number(state.master.paguAnggaranMak) || 0) - grandTotalBruto;
  const persentaseSerapan =
    state.master.paguAnggaranMak > 0
      ? Math.min(100, (grandTotalBruto / state.master.paguAnggaranMak) * 100)
      : 0;

  return {
    totalParticipants: state.participants.length,
    totalUangHarian,
    totalRepresentasi,
    totalTransportasi,
    totalPenginapan,
    totalPengeluaranRiil,
    grandTotalBruto,
    grandTotalPajak,
    grandTotalBersih,
    sisaPagu,
    persentaseSerapan,
    terbilangGrandTotalBruto: terbilangRupiah(grandTotalBruto),
    terbilangGrandTotalBersih: terbilangRupiah(grandTotalBersih),
    perParticipant,
  };
}

export function validatePTJWorkbook(state: PTJWorkbookState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { master, participants } = state;

  if (!master.namaSatker.trim()) {
    issues.push({
      id: 'master-satker',
      severity: 'error',
      module: 'MASTER',
      field: 'Nama Satuan Kerja',
      message: 'Nama Satuan Kerja wajib diisi untuk pencetakan Kop Surat dan Kuitansi.',
    });
  }
  if (!master.nomorDipa.trim()) {
    issues.push({
      id: 'master-dipa',
      severity: 'error',
      module: 'MASTER',
      field: 'Nomor DIPA',
      message: 'Nomor DIPA belum diisi pada pengaturan Master Kegiatan.',
    });
  }
  if (!master.kodeMak.trim()) {
    issues.push({
      id: 'master-mak',
      severity: 'error',
      module: 'MASTER',
      field: 'Kode MAK / Akun',
      message: 'Kode MAK (misal: 524111 / 524113) wajib diisi untuk pembebanan anggaran.',
    });
  }
  if (!master.nomorSuratTugas.trim()) {
    issues.push({
      id: 'master-st',
      severity: 'error',
      module: 'MASTER',
      field: 'Nomor Surat Tugas',
      message: 'Nomor Surat Tugas (ST) belum diisi.',
    });
  }
  if (!master.tanggalMulai || !master.tanggalSelesai) {
    issues.push({
      id: 'master-dates',
      severity: 'error',
      module: 'MASTER',
      field: 'Tanggal Kegiatan',
      message: 'Tanggal Mulai dan Tanggal Selesai perjalanan dinas wajib lengkap.',
    });
  }

  const cleanNip = (nip: string) => nip.replace(/\s+/g, '');
  if (!master.ppkNama.trim() || cleanNip(master.ppkNip).length < 18) {
    issues.push({
      id: 'pejabat-ppk',
      severity: 'warning',
      module: 'PEJABAT',
      field: 'Data PPK',
      message: 'Nama atau NIP 18 digit Pejabat Pembuat Komitmen (PPK) belum lengkap.',
    });
  }
  if (!master.bendaharaNama.trim() || cleanNip(master.bendaharaNip).length < 18) {
    issues.push({
      id: 'pejabat-bendahara',
      severity: 'warning',
      module: 'PEJABAT',
      field: 'Data Bendahara',
      message: 'Nama atau NIP 18 digit Bendahara Pengeluaran belum lengkap.',
    });
  }

  if (participants.length === 0) {
    issues.push({
      id: 'pelaksana-empty',
      severity: 'error',
      module: 'PELAKSANA',
      field: 'Daftar Pelaksana',
      message: 'Belum ada peserta/pelaksana tugas yang ditambahkan.',
    });
  }

  participants.forEach((p, idx) => {
    const calc = calculateParticipantTotals(p);
    const label = p.nama.trim() || `Pelaksana #${idx + 1}`;
    if (!p.nama.trim()) {
      issues.push({
        id: `p-nama-${p.id}`,
        severity: 'error',
        module: 'PELAKSANA',
        field: `Nama (${label})`,
        message: `Nama pelaksana baris ke-${idx + 1} masih kosong.`,
        participantId: p.id,
      });
    }
    const isPpnpn = /ppnpn/i.test(p.jabatan);
    const nipDigits = p.nip.replace(/\D/g, '');
    if (!isPpnpn && nipDigits.length !== 18) {
      issues.push({
        id: `p-nip-${p.id}`,
        severity: 'warning',
        module: 'PELAKSANA',
        field: `NIP (${label})`,
        message: `NIP ${label} (${nipDigits.length} digit) belum berformat standar 18 digit ASN.`,
        participantId: p.id,
      });
    }
    if (p.jumlahHari <= 0 && calc.jumlahBruto <= 0) {
      issues.push({
        id: `p-hari-${p.id}`,
        severity: 'error',
        module: 'PELAKSANA',
        field: `Jumlah Hari (${label})`,
        message: `Jumlah hari perjalanan dinas untuk ${label} harus lebih dari 0 hari.`,
        participantId: p.id,
      });
    }
    if (calc.jumlahBruto <= 0) {
      issues.push({
        id: `p-bruto-${p.id}`,
        severity: 'error',
        module: 'PELAKSANA',
        field: `Total Biaya (${label})`,
        message: `Total biaya perjalanan dinas ${label} bernilai Rp 0.`,
        participantId: p.id,
      });
    }
  });

  const summary = calculateWorkbookSummary(state);
  if (master.paguAnggaranMak > 0 && summary.grandTotalBruto > master.paguAnggaranMak) {
    issues.push({
      id: 'anggaran-overpagu',
      severity: 'error',
      module: 'ANGGARAN',
      field: 'Pagu Anggaran MAK',
      message: `Total realisasi PTJ (${formatRupiah(summary.grandTotalBruto)}) melampaui Pagu MAK (${formatRupiah(master.paguAnggaranMak)}).`,
    });
  }

  return issues;
}

export function generate57SheetManifest(state: PTJWorkbookState): VirtualSheetInfo[] {
  const summary = calculateWorkbookSummary(state);
  const sheets: VirtualSheetInfo[] = [
    {
      sheetNumber: 1,
      sheetCode: '01_MASTER_PTJ',
      sheetCategory: 'MASTER & DB',
      title: 'Master Input Kegiatan, DIPA & Pejabat',
      totalAmount: state.master.paguAnggaranMak,
      status: state.master.namaSatker && state.master.nomorDipa ? 'READY' : 'NEEDS_FIX',
    },
    {
      sheetNumber: 2,
      sheetCode: '02_DB_PELAKSANA',
      sheetCategory: 'MASTER & DB',
      title: 'Database Nominatif Personel & Golongan',
      totalAmount: summary.grandTotalBruto,
      status: state.participants.length > 0 ? 'READY' : 'NEEDS_FIX',
    },
    {
      sheetNumber: 3,
      sheetCode: '03_REF_SBM_PMK',
      sheetCategory: 'MASTER & DB',
      title: 'Tabel Standar Biaya Masukan (SBM) & Tarif Provinsi',
      totalAmount: summary.totalUangHarian,
      status: 'READY',
    },
    {
      sheetNumber: 4,
      sheetCode: '04_RENCANA_BIAYA',
      sheetCategory: 'REKAP & SURAT',
      title: `Rencana Biaya Perjalanan Dinas (${state.master.nomorSuratTugas || 'Draft'})`,
      docType: 'rencana',
      totalAmount: summary.grandTotalBruto,
      status: state.master.nomorSuratTugas ? 'READY' : 'NEEDS_FIX',
    },
    {
      sheetNumber: 5,
      sheetCode: '05_NOMINATIF',
      sheetCategory: 'REKAP & SURAT',
      title: 'Daftar Nominatif Perjalanan Dinas (Gabungan)',
      docType: 'nominatif',
      totalAmount: summary.grandTotalBruto,
      status: state.participants.length > 0 ? 'READY' : 'NEEDS_FIX',
    },
    {
      sheetNumber: 6,
      sheetCode: '06_REKAP_PAJAK',
      sheetCategory: 'REKAP & SURAT',
      title: 'Rekapitulasi Potongan PPh 21 / PPh 22 / PPh 23 / PPN',
      docType: 'nominatif',
      totalAmount: summary.grandTotalPajak,
      status: 'READY',
    },
    {
      sheetNumber: 7,
      sheetCode: '07_SPTJM_PPK',
      sheetCategory: 'REKAP & SURAT',
      title: 'Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)',
      docType: 'sptjm',
      totalAmount: summary.grandTotalBersih,
      status: state.master.ppkNama ? 'READY' : 'NEEDS_FIX',
    },
    {
      sheetNumber: 8,
      sheetCode: '08_LAP_KEGIATAN',
      sheetCategory: 'REKAP & SURAT',
      title: 'Laporan Singkat Pelaksanaan Perjalanan Dinas',
      docType: 'sptjm',
      totalAmount: summary.grandTotalBruto,
      status: state.master.ringkasanHasilKegiatan ? 'READY' : 'NEEDS_FIX',
    },
    {
      sheetNumber: 9,
      sheetCode: '09_DAFTAR_CMS',
      sheetCategory: 'REKAP & SURAT',
      title: 'Rekap Pembayaran Netto Bendahara (Transfer CMS)',
      docType: 'nominatif',
      totalAmount: summary.grandTotalBersih,
      status: 'READY',
    },
  ];

  for (let slot = 1; slot <= 12; slot++) {
    const p = state.participants[slot - 1];
    const calc = p ? calculateParticipantTotals(p) : null;
    const baseSheetNum = 9 + (slot - 1) * 4;
    const pStatus: VirtualSheetInfo['status'] = !p
      ? 'EMPTY_SLOT'
      : p.nama.trim() && calc && calc.jumlahBruto > 0
      ? 'READY'
      : 'NEEDS_FIX';

    sheets.push({
      sheetNumber: baseSheetNum + 1,
      sheetCode: `RINCIAN_${String(slot).padStart(2, '0')}`,
      sheetCategory: 'RINCIAN BIAYA',
      title: p
        ? `Rincian Biaya & SPPD Rampung — ${p.nama}`
        : `Slot Rincian Biaya #${slot} (Kosong)`,
      participantName: p?.nama,
      participantId: p?.id,
      docType: 'rincian',
      totalAmount: calc ? calc.jumlahBruto : 0,
      status: pStatus,
    });

    sheets.push({
      sheetNumber: baseSheetNum + 2,
      sheetCode: `DPR_RIIL_${String(slot).padStart(2, '0')}`,
      sheetCategory: 'PENGELUARAN RIIL',
      title: p
        ? `Daftar Pengeluaran Riil — ${p.nama}`
        : `Slot Pengeluaran Riil #${slot} (Kosong)`,
      participantName: p?.nama,
      participantId: p?.id,
      docType: 'riil',
      totalAmount: calc ? calc.daftarPengeluaranRiilTotal : 0,
      status: pStatus,
    });

    sheets.push({
      sheetNumber: baseSheetNum + 3,
      sheetCode: `KUITANSI_${String(slot).padStart(2, '0')}`,
      sheetCategory: 'KUITANSI',
      title: p
        ? `Kuitansi / Bukti Pembayaran — ${p.nama}`
        : `Slot Kuitansi Pelaksana #${slot} (Kosong)`,
      participantName: p?.nama,
      participantId: p?.id,
      docType: 'kuitansi',
      totalAmount: calc ? calc.jumlahBersih : 0,
      status: pStatus,
    });

    sheets.push({
      sheetNumber: baseSheetNum + 4,
      sheetCode: `SPD_VISUM_${String(slot).padStart(2, '0')}`,
      sheetCategory: 'SPD & VISUM',
      title: p
        ? `Rencana Biaya & Lembar SPD — ${p.nama}`
        : `Slot Lembar SPD #${slot} (Kosong)`,
      participantName: p?.nama,
      participantId: p?.id,
      docType: 'rencana',
      totalAmount: calc ? calc.jumlahBruto : 0,
      status: pStatus,
    });
  }

  return sheets;
}

export function runMacroNormalizeNumbering(state: PTJWorkbookState): PTJWorkbookState {
  const tahun = state.master.tahunAnggaran || '2025';
  const satkerCode = state.master.kodeSatker || 'ITJ.1';
  const spdPrefix = state.master.nomorSpdPrefix || 'ITJ.1-KU.03.02-';

  const updatedParticipants = state.participants.map((p, index) => {
    const seq = index + 1;
    const padded = String(8426 + seq);
    return {
      ...p,
      noUrut: seq,
      nomorSpd: p.nomorSpd.trim()
        ? p.nomorSpd
        : `${spdPrefix}${padded}`,
      nomorKuitansi: `KP-${String(seq).padStart(3, '0')}/PTJ-${state.master.kodeMak || '524113'}/${satkerCode}/${tahun}`,
      jumlahHari: p.jumlahHari > 0 ? p.jumlahHari : state.master.lamaHariDefault || 4,
    };
  });

  return {
    ...state,
    lastMacroRunAt: new Date().toISOString(),
    participants: updatedParticipants,
  };
}

export function parseParticipantPaste(
  rawText: string,
  existingCount: number,
  master: MasterKegiatan
): ParticipantPTJ[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: ParticipantPTJ[] = [];
  lines.forEach((line, idx) => {
    const cols = line.includes('\t')
      ? line.split('\t')
      : line.split(';').length > 2
      ? line.split(';')
      : line.split(',');
    const cleanCols = cols.map((c) => c.trim().replace(/^"|"$/g, ''));

    if (
      idx === 0 &&
      /^(no|nama|nip)/i.test(cleanCols[0] || '') &&
      cleanCols.some((c) => /nip|golongan|jabatan/i.test(c))
    ) {
      return;
    }

    const nama = cleanCols[0] || `Pelaksana Baru #${existingCount + results.length + 1}`;
    const nip = cleanCols[1] || '199409192017122001';
    const pangkatGolongan = cleanCols[2] || 'Penata Muda Tk. I (III/b)';
    const jabatan = cleanCols[3] || 'Auditor Muda Inspektorat Wilayah IV';
    const jumlahHari = Number(cleanCols[4]?.replace(/\D/g, '')) || master.lamaHariDefault || 4;
    const tarifUangHarian = Number(cleanCols[5]?.replace(/\D/g, '')) || 210000;
    const biayaTiketPP = Number(cleanCols[6]?.replace(/\D/g, '')) || 0;
    const biayaTransporDarat = Number(cleanCols[7]?.replace(/\D/g, '')) || 300000;

    const seq = existingCount + results.length + 1;
    const spdNum = 8426 + seq;

    results.push({
      id: `p-import-${Date.now()}-${seq}`,
      noUrut: seq,
      nama,
      nip,
      pangkatGolongan,
      jabatan,
      tingkatBiaya: /IV\//.test(pangkatGolongan) ? 'B' : 'C',
      nomorSpd: `${master.nomorSpdPrefix || 'ITJ.1-KU.03.02-'}${spdNum}`,
      nomorKuitansi: `KP-${String(seq).padStart(3, '0')}/PTJ-${master.kodeMak || '524113'}/${master.kodeSatker || 'ITJ.1'}/${master.tahunAnggaran || '2025'}`,
      jumlahHari,
      tarifUangHarian,
      uangRepresentasiPerHari: 0,
      modaTransportasi: 'Transportasi Darat (Jabodetabek)',
      nomorTiketPP: '-',
      biayaTiketPP,
      biayaTaksiAsal: 0,
      biayaTaksiProvinsi: 0,
      biayaTransporDarat,
      namaHotel: '-',
      jumlahMalam: 0,
      tarifHotelPerMalam: 0,
      gunakanTarif30Persen: false,
      riilItems: [],
      taxType: 'NONE',
      customTaxAmount: 0,
    });
  });

  return results;
}

export interface MasterPegawaiDirectoryItem {
  no: number;
  nip: string;
  nama: string;
  jabatan: string;
  noSpd: string;
  tglSpd: string;
  hariDl: number;
  uangHarian: number;
  hariHotel: number;
  representatif: number;
  tglPtj: string;
  st: string;
  tglSt: string;
  transporDarat: number;
}

export const MASTER_PEGAWAI_ITJEN: MasterPegawaiDirectoryItem[] = [
  { no: 1, nip: '196911281997031001', nama: 'Bambang Setyabudi', jabatan: 'Inspektur Wilayah IV', noSpd: '0', tglSpd: '2025-11-19', hariDl: 1, uangHarian: 210000, hariHotel: 3, representatif: 75000, tglPtj: '2025-12-03', st: '', tglSt: '', transporDarat: 300000 },
  { no: 2, nip: '198308162006042001', nama: 'Niken Ayu Kusumaningpuri', jabatan: 'Auditor Madya Inspektorat Wilayah IV', noSpd: '0', tglSpd: '2025-10-06', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 3, nip: '198402112006041001', nama: 'Fandyla Wahyu Sasongko', jabatan: 'Auditor Madya Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8422', tglSpd: '2025-11-19', hariDl: 1, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-03', st: 'ITJ.KP.04.01-30', tglSt: '2025-11-19', transporDarat: 300000 },
  { no: 4, nip: '198503152003121003', nama: 'Dwi Ari Wibowo', jabatan: 'Auditor Madya Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8421', tglSpd: '2025-10-06', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 5, nip: '197904302009121002', nama: 'Helmy Ahirul Apriandi', jabatan: 'Auditor Muda Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8422', tglSpd: '2025-10-07', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-21', st: '', tglSt: '', transporDarat: 300000 },
  { no: 6, nip: '199305232015031001', nama: 'Faisal Afifi', jabatan: 'Auditor Muda Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8423', tglSpd: '2025-10-06', hariDl: 3, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 7, nip: '199008262015052001', nama: 'Henni Noor Utami', jabatan: 'Auditor Muda Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8424', tglSpd: '2025-10-06', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 8, nip: '198906132015031004', nama: 'Surya Narendra', jabatan: 'Auditor Muda Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8425', tglSpd: '2025-11-19', hariDl: 2, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-03', st: '', tglSt: '', transporDarat: 300000 },
  { no: 9, nip: '198808142015032004', nama: 'Adi Agustina Girsang', jabatan: 'Auditor Muda Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8426', tglSpd: '2025-10-06', hariDl: 1, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 0 },
  { no: 10, nip: '199409192017122001', nama: 'Falentina Paramita Sari', jabatan: 'Auditor Muda Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8427', tglSpd: '2025-11-19', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-03', st: '', tglSt: '', transporDarat: 300000 },
  { no: 11, nip: '199103082020121001', nama: 'Bara Dynata', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8428', tglSpd: '2025-11-19', hariDl: 1, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-03', st: '', tglSt: '', transporDarat: 300000 },
  { no: 12, nip: '199207242020122001', nama: 'Henni Maria Marpaung', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8429', tglSpd: '2025-10-06', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 13, nip: '199209152020121002', nama: 'Y.Aditya Anggara P', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8430', tglSpd: '2025-10-06', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 14, nip: '199404062020122001', nama: 'Saadia Santi', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8431', tglSpd: '2025-10-06', hariDl: 3, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 15, nip: '199603172020122001', nama: 'Monica Ronauli Saraswaty Sinaga', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8432', tglSpd: '2025-10-06', hariDl: 3, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 16, nip: '199703082020122001', nama: 'Anasti Dwi Martantya Kinasih', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8433', tglSpd: '2025-10-06', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 17, nip: '199603112025061007', nama: 'Vidi Marentra Eflar', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8434', tglSpd: '2025-11-19', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-03', st: '', tglSt: '', transporDarat: 300000 },
  { no: 18, nip: '200204302025061013', nama: 'Naufal Enji Athaya', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8435', tglSpd: '2025-11-19', hariDl: 1, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-03', st: '', tglSt: '', transporDarat: 0 },
  { no: 19, nip: '200010292025062018', nama: 'Syefardirta Fascanti Qoba', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8436', tglSpd: '2025-11-19', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-03', st: '', tglSt: '', transporDarat: 300000 },
  { no: 20, nip: '196908132001121001', nama: 'Syahrizal Lubis', jabatan: 'Kasubbag Tata Usaha Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8437', tglSpd: '2025-10-06', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 21, nip: '198808152010121002', nama: 'Doni Aji Saputro', jabatan: 'Pengadministrasi Umum', noSpd: 'ITJ.1-KU.03.02-8438', tglSpd: '2025-10-06', hariDl: 4, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-10-20', st: '', tglSt: '', transporDarat: 300000 },
  { no: 22, nip: '', nama: 'Hendriyanto', jabatan: 'PPNPN', noSpd: 'ITJ.1-KU.03.02-8438', tglSpd: '', hariDl: 0, uangHarian: 0, hariHotel: 0, representatif: 0, tglPtj: '', st: '', tglSt: '', transporDarat: 300000 },
  { no: 23, nip: '199012132025212041', nama: 'Disti Oke Viani', jabatan: 'PPPK', noSpd: 'ITJ.1-KU.03.02-8439', tglSpd: '2025-11-19', hariDl: 1, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-03', st: '', tglSt: '', transporDarat: 0 },
  { no: 24, nip: '199306202025212043', nama: 'Irmi Juwianipa', jabatan: 'PPPK', noSpd: 'ITJ.1-KU.03.02-8440', tglSpd: '2025-11-20', hariDl: 1, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-04', st: '', tglSt: '', transporDarat: 0 },
  { no: 25, nip: '199406172020121001', nama: 'Ivan Satria Nurrahman', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8441', tglSpd: '2025-11-21', hariDl: 2, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-05', st: '', tglSt: '', transporDarat: 300000 },
  { no: 26, nip: '199705092019011001', nama: 'Raden Suryo Satrio Sularso', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8442', tglSpd: '2025-11-22', hariDl: 2, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-06', st: '', tglSt: '', transporDarat: 300000 },
  { no: 27, nip: '199311132012121001', nama: 'Bobby Novianto', jabatan: 'Auditor Pertama Inspektorat Wilayah IV', noSpd: 'ITJ.1-KU.03.02-8443', tglSpd: '2025-11-23', hariDl: 2, uangHarian: 210000, hariHotel: 0, representatif: 0, tglPtj: '2025-12-07', st: '', tglSt: '', transporDarat: 300000 },
];

export function buildParticipantFromDirectoryItem(
  r: MasterPegawaiDirectoryItem,
  seq?: number,
  zeroDefaults = false
): ParticipantPTJ {
  const no = seq ?? r.no;
  const hari = zeroDefaults ? 0 : r.hariDl;
  const uh = zeroDefaults ? 0 : r.uangHarian;
  const rep = zeroDefaults ? 0 : r.representatif;
  const transpor = zeroDefaults ? 0 : r.transporDarat;
  const malam = zeroDefaults ? 0 : r.hariHotel;
  const totalUh = hari * uh;
  const totalRep = (hari > 0 ? hari : 1) * rep;
  const bruto = totalUh + totalRep + transpor;
  return {
    id: `p-${r.no}-${Date.now()}`,
    noUrut: no,
    nama: r.nama,
    nip: r.nip,
    pangkatGolongan: /Inspektur Wilayah/i.test(r.jabatan)
      ? 'Pembina Utama Muda (IV/c)'
      : /Madya/i.test(r.jabatan)
      ? 'Pembina (IV/a)'
      : /Muda|Kasubbag/i.test(r.jabatan)
      ? 'Penata (III/c)'
      : /PPPK/i.test(r.jabatan)
      ? 'PPPK Golongan IX'
      : /PPNPN/i.test(r.jabatan)
      ? 'Non-ASN / Tenaga Ahli'
      : 'Penata Muda (III/a)',
    jabatan: r.jabatan,
    tingkatBiaya: /Inspektur Wilayah/i.test(r.jabatan) ? 'B' : 'C',
    nomorSpd: zeroDefaults ? '0' : r.noSpd,
    tanggalSpd: r.tglSpd || '2025-11-19',
    tanggalPertanggungjawaban: r.tglPtj || '2025-12-03',
    nomorSuratTugas: r.st,
    tanggalSuratTugas: r.tglSt,
    nomorKuitansi: `KP-${String(no).padStart(3, '0')}/${r.noSpd || 'ITJ.1-KU.03.02'}/2025`,
    jumlahHari: hari,
    tarifUangHarian: uh,
    uangRepresentasiPerHari: rep,
    modaTransportasi: 'Transportasi Darat (Jabodetabek)',
    nomorTiketPP: '-',
    biayaTiketPP: 0,
    biayaTaksiAsal: 0,
    biayaTaksiProvinsi: 0,
    biayaDaratSpd: 0,
    biayaTransporDarat: transpor,
    namaHotel: '-',
    jumlahMalam: malam,
    tarifHotelPerMalam: 0,
    gunakanTarif30Persen: true,
    persenPenginapan: 30,
    rencanaDibayarSemula: bruto,
    riilItems: [],
    taxType: 'NONE',
    customTaxAmount: 0,
  };
}

export function createDummyPTJState(): PTJWorkbookState {
  const participants: ParticipantPTJ[] = MASTER_PEGAWAI_ITJEN.map((r) => ({
    ...buildParticipantFromDirectoryItem(r, r.no, false),
    id: `p-${r.no}`,
  }));

  return {
    version: '3.0.0',
    lastSavedAt: new Date().toISOString(),
    lastMacroRunAt: new Date().toISOString(),
    kopSurat: {
      kementerian: 'KEMENTERIAN HUKUM REPUBLIK INDONESIA',
      eselon1: 'INSPEKTORAT JENDERAL',
      satkerName: '',
      alamat: 'Jalan H.R. Rasuna Said Kav. 6-7, Kuningan Jakarta Selatan',
      teleponEmail: 'Telepon: 021-5252975; Faksimile: 021-5252975',
      website: 'Laman: http://www.itjen.kemenkum.go.id, Pos-ell: itjen@kemenkum.go.id',
      logoPreset: 'pengayoman',
      customLogoDataUrl: '/assets/aistudio/image_48266e5e.png',
      tampilkanKopDiRincianDpr: false,
    },
    master: {
      namaKementerian: 'Kementerian Hukum Republik Indonesia',
      namaSatker: 'Inspektorat Jenderal — Inspektorat Wilayah IV',
      kodeSatker: '614820',
      nomorDipa: 'SP DIPA-013.02.1.614820/2025',
      tanggalDipa: '2025-01-02',
      tahunAnggaran: '2025',
      kodeMak: '524113',
      uraianMak: 'Belanja Perjalanan Dinas Dalam Kota / Jabodetabek & Pengawasan',
      paguAnggaranMak: 85_000_000,
      namaKegiatan:
        'Pelaksanaan Audit Kinerja dan Pengawasan Satuan Kerja Inspektorat Wilayah IV',
      lokasiAsal: 'Jakarta',
      lokasiTujuan: 'Jabodetabek',
      provinsiTujuan: 'DKI Jakarta & Sekitarnya',
      labelTransporDarat: 'Transportasi Darat (Jabodetabek)',
      tanggalMulai: '2021-02-22',
      tanggalSelesai: '2021-02-27',
      lamaHariDefault: 0,
      nomorSuratTugas: 'ITJ.KP.04.01-30',
      tanggalSuratTugas: '2025-11-19',
      nomorSpdPrefix: 'ITJ.1-KU.03.02-',
      tanggalSpd: '2025-11-19',
      kotaPenandatangan: 'Jakarta',
      tanggalKuitansi: '2025-12-03',
      ringkasanHasilKegiatan:
        'Telah dilaksanakan kegiatan pengawasan dan evaluasi pertanggungjawaban keuangan sesuai Surat Perintah Perjalanan Dinas (SPPD) pada Inspektorat Wilayah IV.',
      ppkNama: 'LUSI HANDAYANI, S.E., M.M.',
      ppkNip: '19860111 200912 2 008',
      ppkJabatan: 'Pejabat Pembuat Komitmen',
      bendaharaNama: 'Kurnia Putri Natalia Lumbantoruan',
      bendaharaNip: '199512242019012001',
      bendaharaJabatan: 'Bendahara Pengeluaran',
      ketuaTimNama: 'Bambang Setyabudi',
      ketuaTimNip: '196911281997031001',
      ketuaTimJabatan: 'Inspektur Wilayah IV',
    },
    participants,
  };
}

/**
 * Menghasilkan state awal yang bersih (default 0 anggota aktif / semua nominal 0)
 * agar pengguna tinggal mencari dan memilih anggota tim satu per satu dari 27 Pegawai Database.
 */
export function createInitialTeamPTJState(
  selectedDirectoryNos: number[] = []
): PTJWorkbookState {
  const full = createDummyPTJState();
  const chosenItems = selectedDirectoryNos
    .map((no) => MASTER_PEGAWAI_ITJEN.find((item) => item.no === no))
    .filter((item): item is MasterPegawaiDirectoryItem => Boolean(item));

  const teamParticipants: ParticipantPTJ[] = chosenItems.map((r, idx) => ({
    ...buildParticipantFromDirectoryItem(r, idx + 1, true),
    id: `p-${r.no}`,
    nomorSuratTugas: r.st || full.master.nomorSuratTugas,
    tanggalSuratTugas: r.tglSt || full.master.tanggalSuratTugas,
  }));

  return {
    ...full,
    participants: teamParticipants,
  };
}

/**
 * ============================================================================
 * TABEL STANDAR BIAYA MASUKAN (SBM) PERJALANAN DINAS (SESUAI GAMBAR EXCEL)
 * Provinsi: SUMSEL, KALBAR, JABAR, PABAR, NTT, SULTENG
 * ============================================================================
 */
export type SbmProvinceCode =
  | 'SUMSEL'
  | 'KALBAR'
  | 'JABAR'
  | 'PABAR'
  | 'NTT'
  | 'SULTENG';

export type SbmEselonTier =
  | 'ESELON_II'
  | 'ESELON_III_GOL_IV'
  | 'ESELON_IV_GOL_III';

export interface SbmProvinceRate {
  code: SbmProvinceCode;
  namaProvinsi: string;
  uangRepresentatifEselon2: number;
  uangHarian: number;
  penginapanEselon2: number;
  penginapanEselon3Gol4: number;
  penginapanEselon4Gol3: number;
  tiketPesawat: number;
  transporTerminalJakarta: number;
  transporTerminalTujuan: number;
  transporDaratLautUdara: number;
}

export const SBM_PROVINCE_LIST: SbmProvinceCode[] = [
  'SUMSEL',
  'KALBAR',
  'JABAR',
  'PABAR',
  'NTT',
  'SULTENG',
];

export const DEFAULT_SBM_PROVINCES: Record<SbmProvinceCode, SbmProvinceRate> = {
  SUMSEL: {
    code: 'SUMSEL',
    namaProvinsi: 'Sumatera Selatan (SUMSEL)',
    uangRepresentatifEselon2: 150000,
    uangHarian: 380000,
    penginapanEselon2: 3134000,
    penginapanEselon3Gol4: 1966000,
    penginapanEselon4Gol3: 861000,
    tiketPesawat: 2268000,
    transporTerminalJakarta: 250000,
    transporTerminalTujuan: 162000,
    transporDaratLautUdara: 0,
  },
  KALBAR: {
    code: 'KALBAR',
    namaProvinsi: 'Kalimantan Barat (KALBAR)',
    uangRepresentatifEselon2: 150000,
    uangHarian: 380000,
    penginapanEselon2: 1923000,
    penginapanEselon3Gol4: 1125000,
    penginapanEselon4Gol3: 576000,
    tiketPesawat: 2781000,
    transporTerminalJakarta: 250000,
    transporTerminalTujuan: 165000,
    transporDaratLautUdara: 0,
  },
  JABAR: {
    code: 'JABAR',
    namaProvinsi: 'Jawa Barat (JABAR)',
    uangRepresentatifEselon2: 150000,
    uangHarian: 430000,
    penginapanEselon2: 2755000,
    penginapanEselon3Gol4: 1366000,
    penginapanEselon4Gol3: 735000,
    tiketPesawat: 0,
    transporTerminalJakarta: 250000,
    transporTerminalTujuan: 180000,
    transporDaratLautUdara: 0,
  },
  PABAR: {
    code: 'PABAR',
    namaProvinsi: 'Papua Barat (PABAR)',
    uangRepresentatifEselon2: 150000,
    uangHarian: 480000,
    penginapanEselon2: 3575000,
    penginapanEselon3Gol4: 2056000,
    penginapanEselon4Gol3: 967000,
    tiketPesawat: 10824000,
    transporTerminalJakarta: 250000,
    transporTerminalTujuan: 228000,
    transporDaratLautUdara: 0,
  },
  NTT: {
    code: 'NTT',
    namaProvinsi: 'Nusa Tenggara Timur (NTT)',
    uangRepresentatifEselon2: 150000,
    uangHarian: 430000,
    penginapanEselon2: 2283000,
    penginapanEselon3Gol4: 1450000,
    penginapanEselon4Gol3: 737000,
    tiketPesawat: 5081000,
    transporTerminalJakarta: 250000,
    transporTerminalTujuan: 105000,
    transporDaratLautUdara: 0,
  },
  SULTENG: {
    code: 'SULTENG',
    namaProvinsi: 'Sulawesi Tengah (SULTENG)',
    uangRepresentatifEselon2: 150000,
    uangHarian: 370000,
    penginapanEselon2: 2166000,
    penginapanEselon3Gol4: 1679000,
    penginapanEselon4Gol3: 951000,
    tiketPesawat: 5113000,
    transporTerminalJakarta: 250000,
    transporTerminalTujuan: 149000,
    transporDaratLautUdara: 0,
  },
};

/**
 * Menentukan kategori tarif penginapan & representatif SBM berdasarkan Jabatan / Golongan pegawai:
 * - Eselon II (Inspektur Wilayah) -> Penginapan Eselon II + Uang Representatif Eselon II
 * - Eselon III / Gol IV (Auditor Madya / Pembina IV) -> Penginapan Eselon III / Gol IV
 * - Eselon IV / Gol III ke bawah (Kasubbag / Auditor Muda / Pertama / Pelaksana / PPPK / PPNPN) -> Penginapan Eselon IV / Gol III ke bawah
 */
export function detectSbmTierForParticipant(
  p: Pick<ParticipantPTJ, 'jabatan' | 'pangkatGolongan'>
): SbmEselonTier {
  const jab = (p.jabatan || '').toLowerCase();
  const gol = (p.pangkatGolongan || '').toLowerCase();

  if (
    jab.includes('inspektur wilayah') ||
    jab.includes('inspektur jenderal') ||
    jab.includes('sekretaris inspektorat') ||
    jab.includes('eselon ii')
  ) {
    return 'ESELON_II';
  }

  if (
    jab.includes('madya') ||
    jab.includes('eselon iii') ||
    gol.includes('iv/a') ||
    gol.includes('iv/b') ||
    gol.includes('iv/c') ||
    gol.includes('iv/d') ||
    gol.includes('gol iv')
  ) {
    return 'ESELON_III_GOL_IV';
  }

  return 'ESELON_IV_GOL_III';
}

export function getSbmTierLabel(tier: SbmEselonTier): string {
  switch (tier) {
    case 'ESELON_II':
      return 'Eselon II';
    case 'ESELON_III_GOL_IV':
      return 'Eselon III / Gol IV';
    default:
      return 'Eselon IV / Gol III ke bawah';
  }
}

export function getSbmHotelRateForTier(
  rate: SbmProvinceRate,
  tier: SbmEselonTier
): number {
  switch (tier) {
    case 'ESELON_II':
      return rate.penginapanEselon2;
    case 'ESELON_III_GOL_IV':
      return rate.penginapanEselon3Gol4;
    default:
      return rate.penginapanEselon4Gol3;
  }
}

/**
 * Menerapkan tarif SBM Provinsi terpilih ke 1 anggota tim sesuai tingkat Eselon/Golongannya.
 */
export function applySbmToParticipant(
  p: ParticipantPTJ,
  rate: SbmProvinceRate,
  options?: {
    tierOverride?: SbmEselonTier;
    includeTransport?: boolean;
  }
): ParticipantPTJ {
  const tier = options?.tierOverride ?? detectSbmTierForParticipant(p);
  const hotelRate = getSbmHotelRateForTier(rate, tier);
  const repRate = tier === 'ESELON_II' ? rate.uangRepresentatifEselon2 : 0;
  const includeTrans = options?.includeTransport ?? true;

  return {
    ...p,
    tarifUangHarian: rate.uangHarian,
    uangRepresentasiPerHari: repRate,
    tarifHotelPerMalam: hotelRate,
    biayaTiketPP: includeTrans ? rate.tiketPesawat : p.biayaTiketPP,
    biayaTaksiAsal: includeTrans
      ? rate.transporTerminalJakarta
      : p.biayaTaksiAsal,
    biayaTaksiProvinsi: includeTrans
      ? rate.transporTerminalTujuan
      : p.biayaTaksiProvinsi,
    biayaTransporDarat: includeTrans
      ? rate.transporDaratLautUdara
      : p.biayaTransporDarat,
  };
}



