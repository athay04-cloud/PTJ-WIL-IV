import test from 'node:test';
import assert from 'node:assert/strict';
import {
  terbilangRupiah,
  terbilangHariKecil,
  formatRupiah,
  formatAccountingCell,
  formatTanggalIndo,
  addDaysIso,
  calculateParticipantTotals,
  validatePTJWorkbook,
  generate57SheetManifest,
  parseParticipantPaste,
  createDummyPTJState,
  DEFAULT_SBM_PROVINCES,
  detectSbmTierForParticipant,
  applySbmToParticipant,
} from './ptjEngine';

test('terbilangRupiah & terbilangHariKecil match PDF format', () => {
  assert.equal(terbilangRupiah(0), 'Nol Rupiah');
  assert.equal(
    terbilangRupiah(1140000),
    'Satu Juta Seratus Empat Puluh Ribu Rupiah'
  );
  assert.equal(terbilangHariKecil(4), 'empat');
  assert.equal(terbilangHariKecil(1), 'satu');
});

test('formatTanggalIndo, addDaysIso & formatAccountingCell match PDF layout', () => {
  assert.equal(formatTanggalIndo('2025-11-19'), '19 November 2025');
  assert.equal(formatTanggalIndo('2025-12-03'), '03 Desember 2025');
  assert.equal(addDaysIso('2025-11-19', 14), '2025-12-03');
  assert.equal(addDaysIso('2025-10-06', 14), '2025-10-20');
  assert.equal(formatAccountingCell(210000), '210.000');
  assert.equal(formatAccountingCell(0), '-');
  assert.equal(formatRupiah(1140000), 'Rp 1.140.000');
});

test('createDummyPTJState contains all 27 rows from Database PDF and matches Falentina Paramita Sari (Row 10)', () => {
  const dummy = createDummyPTJState();
  assert.equal(dummy.participants.length, 27);
  assert.equal(dummy.kopSurat.kementerian, 'KEMENTERIAN HUKUM REPUBLIK INDONESIA');
  assert.equal(dummy.kopSurat.eselon1, 'INSPEKTORAT JENDERAL');

  // Row 1: Bambang Setyabudi
  const p1 = dummy.participants[0];
  const calc1 = calculateParticipantTotals(p1);
  assert.equal(p1.nama, 'Bambang Setyabudi');
  assert.equal(calc1.totalUangHarian, 210000);
  assert.equal(calc1.totalRepresentasi, 75000);
  assert.equal(calc1.totalBiayaDatabase, 285000);
  assert.equal(calc1.uangYangDiterima, 285000);

  // Row 10: Falentina Paramita Sari
  const p10 = dummy.participants[9];
  const calc10 = calculateParticipantTotals(p10);

  assert.equal(p10.nama, 'Falentina Paramita Sari');
  assert.equal(p10.nomorSpd, 'ITJ.1-KU.03.02-8427');
  assert.equal(p10.tanggalSpd, '2025-11-19');
  assert.equal(p10.tanggalPertanggungjawaban, '2025-12-03');
  assert.equal(calc10.totalUangHarian, 840000);
  assert.equal(calc10.totalBiayaDatabase, 840000);
  assert.equal(calc10.biayaTransporDarat, 300000);
  assert.equal(calc10.jumlahBruto, 1140000);
  assert.equal(calc10.daftarPengeluaranRiilTotal, 1140000);
  assert.equal(calc10.dibayarSemula, 1140000);
  assert.equal(calc10.pengembalianRampung, 0);
  assert.equal(
    calc10.terbilangBruto,
    'Satu Juta Seratus Empat Puluh Ribu Rupiah'
  );
});

test('generate57SheetManifest produces 57 virtual worksheets', () => {
  const dummy = createDummyPTJState();
  const manifest = generate57SheetManifest(dummy);
  assert.equal(manifest.length, 57);
  assert.equal(manifest[0].sheetCode, '01_MASTER_PTJ');
  assert.equal(manifest[3].sheetCode, '04_RENCANA_BIAYA');
  assert.equal(manifest[9].sheetCode, 'RINCIAN_01');
  assert.equal(manifest[10].sheetCode, 'DPR_RIIL_01');
});

test('validatePTJWorkbook passes clean 27-row Database and flags invalid fields', () => {
  const dummy = createDummyPTJState();
  const issues = validatePTJWorkbook(dummy);
  assert.equal(issues.length, 0);

  const broken = createDummyPTJState();
  broken.master.nomorSuratTugas = '';
  broken.participants[0].nip = '12345';
  const brokenIssues = validatePTJWorkbook(broken);
  assert.ok(brokenIssues.some((i) => i.id === 'master-st'));
  assert.ok(brokenIssues.some((i) => i.id === `p-nip-${broken.participants[0].id}`));
});

test('parseParticipantPaste parses TSV rows from Excel accurately', () => {
  const dummy = createDummyPTJState();
  const sampleTsv = [
    'Nama\tNIP\tGolongan\tJabatan\tHari\tUang Harian\tTiket PP\tTranspor Darat',
    'Ahmad Fauzi, S.E.\t198703112010121004\tPenata (III/c)\tAuditor Muda\t4\t210000\t0\t300000',
  ].join('\n');

  const parsed = parseParticipantPaste(sampleTsv, 27, dummy.master);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].nama, 'Ahmad Fauzi, S.E.');
  assert.equal(parsed[0].noUrut, 28);
  assert.equal(parsed[0].biayaTransporDarat, 300000);
});

test('30% hotel multiplier slot calculates tarifHotelEfektifPerMalam and totalPenginapan accurately', () => {
  const dummy = createDummyPTJState();
  const person = {
    ...dummy.participants[9],
    jumlahMalam: 2,
    tarifHotelPerMalam: 700000,
    gunakanTarif30Persen: true,
    persenPenginapan: 30,
  };
  const calc30 = calculateParticipantTotals(person);
  assert.equal(calc30.persenPenginapanEfektif, 30);
  assert.equal(calc30.tarifHotelEfektifPerMalam, 210000);
  assert.equal(calc30.totalPenginapan, 420000);

  const calc100 = calculateParticipantTotals({
    ...person,
    gunakanTarif30Persen: false,
    persenPenginapan: 100,
  });
  assert.equal(calc100.persenPenginapanEfektif, 100);
  assert.equal(calc100.tarifHotelEfektifPerMalam, 700000);
  assert.equal(calc100.totalPenginapan, 1400000);
});

test('DEFAULT_SBM_PROVINCES matches Excel SBM table (SUMSEL, KALBAR, JABAR, PABAR, NTT, SULTENG) and applies rates by Eselon/Golongan tier', () => {
  assert.equal(DEFAULT_SBM_PROVINCES.SUMSEL.uangHarian, 380000);
  assert.equal(DEFAULT_SBM_PROVINCES.SUMSEL.penginapanEselon2, 3134000);
  assert.equal(DEFAULT_SBM_PROVINCES.SUMSEL.penginapanEselon3Gol4, 1966000);
  assert.equal(DEFAULT_SBM_PROVINCES.SUMSEL.penginapanEselon4Gol3, 861000);
  assert.equal(DEFAULT_SBM_PROVINCES.SUMSEL.tiketPesawat, 2268000);
  assert.equal(DEFAULT_SBM_PROVINCES.SUMSEL.transporTerminalJakarta, 250000);
  assert.equal(DEFAULT_SBM_PROVINCES.SUMSEL.transporTerminalTujuan, 162000);

  assert.equal(DEFAULT_SBM_PROVINCES.KALBAR.tiketPesawat, 2781000);
  assert.equal(DEFAULT_SBM_PROVINCES.KALBAR.penginapanEselon4Gol3, 576000);
  assert.equal(DEFAULT_SBM_PROVINCES.JABAR.uangHarian, 430000);
  assert.equal(DEFAULT_SBM_PROVINCES.JABAR.tiketPesawat, 0);
  assert.equal(DEFAULT_SBM_PROVINCES.PABAR.tiketPesawat, 10824000);
  assert.equal(DEFAULT_SBM_PROVINCES.NTT.transporTerminalTujuan, 105000);
  assert.equal(DEFAULT_SBM_PROVINCES.SULTENG.uangHarian, 370000);

  const dummy = createDummyPTJState();
  // Row 1: Bambang Setyabudi (Inspektur Wilayah IV -> ESELON_II)
  const pEselon2 = dummy.participants[0];
  assert.equal(detectSbmTierForParticipant(pEselon2), 'ESELON_II');
  const appliedEselon2 = applySbmToParticipant(pEselon2, DEFAULT_SBM_PROVINCES.KALBAR);
  assert.equal(appliedEselon2.uangRepresentasiPerHari, 150000);
  assert.equal(appliedEselon2.tarifUangHarian, 380000);
  assert.equal(appliedEselon2.tarifHotelPerMalam, 1923000);
  assert.equal(appliedEselon2.biayaTiketPP, 2781000);
  assert.equal(appliedEselon2.biayaTaksiAsal, 250000);
  assert.equal(appliedEselon2.biayaTaksiProvinsi, 165000);

  // Row 2: Niken Ayu Kusumaningpuri (Auditor Madya -> ESELON_III_GOL_IV)
  const pEselon3 = dummy.participants[1];
  assert.equal(detectSbmTierForParticipant(pEselon3), 'ESELON_III_GOL_IV');
  const appliedEselon3 = applySbmToParticipant(pEselon3, DEFAULT_SBM_PROVINCES.KALBAR);
  assert.equal(appliedEselon3.uangRepresentasiPerHari, 0);
  assert.equal(appliedEselon3.tarifHotelPerMalam, 1125000);

  // Row 10: Falentina Paramita Sari (Auditor Muda -> ESELON_IV_GOL_III)
  const pEselon4 = dummy.participants[9];
  assert.equal(detectSbmTierForParticipant(pEselon4), 'ESELON_IV_GOL_III');
  const appliedEselon4 = applySbmToParticipant(pEselon4, DEFAULT_SBM_PROVINCES.KALBAR);
  assert.equal(appliedEselon4.uangRepresentasiPerHari, 0);
  assert.equal(appliedEselon4.tarifHotelPerMalam, 576000);
});


