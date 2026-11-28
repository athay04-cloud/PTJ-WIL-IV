import React, { useState } from 'react';
import {
  ParticipantPTJ,
  MasterKegiatan,
  MASTER_PEGAWAI_ITJEN,
  buildParticipantFromDirectoryItem,
  calculateParticipantTotals,
  calculateWorkbookSummary,
  PTJWorkbookState,
  formatRupiah,
  formatAccountingCell,
  formatTanggalIndo,
  addDaysIso,
  parseParticipantPaste,
  terbilangHariKecil,
  SbmProvinceCode,
  SbmProvinceRate,
  SbmEselonTier,
  SBM_PROVINCE_LIST,
  DEFAULT_SBM_PROVINCES,
  detectSbmTierForParticipant,
  getSbmTierLabel,
  getSbmHotelRateForTier,
  applySbmToParticipant,
} from '../utils/ptjEngine';
import {
  RincianBiayaSheet,
  DaftarPengeluaranRiilSheet,
  SptjmSheet,
} from './PersonDocSheets';
import {
  Plus,
  Trash2,
  FileText,
  ClipboardPaste,
  Wand2,
  Check,
  X,
  Table,
  Zap,
  UserCheck,
  Users,
  ChevronDown,
  ChevronUp,
  Layers,
  Search,
  RotateCcw,
  Printer,
  CopyCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ParticipantManagerProps {
  state: PTJWorkbookState;
  selectedParticipantId: string;
  onSelectParticipant: (id: string) => void;
  onUpdateParticipants: (participants: ParticipantPTJ[]) => void;
  onUpdateMaster?: (master: MasterKegiatan) => void;
  onRunNormalizeMacro: () => void;
  onOpenPreviewForParticipant: (
    participantId: string,
    docType: 'rincian' | 'riil' | 'sptjm' | 'bundle_all' | 'bundle_team'
  ) => void;
}

type InputViewMode = 'compact' | 'single' | 'full25';
type InlineDocTab = 'rincian' | 'riil' | 'sptjm' | 'all3';

export const ParticipantManager: React.FC<ParticipantManagerProps> = ({
  state,
  selectedParticipantId,
  onSelectParticipant,
  onUpdateParticipants,
  onUpdateMaster,
  onRunNormalizeMacro,
  onOpenPreviewForParticipant,
}) => {
  const { participants, master } = state;
  const summary = calculateWorkbookSummary(state);

  const [viewMode, setViewMode] = useState<InputViewMode>('compact');
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showMasterHeader, setShowMasterHeader] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pencarian Pegawai Satu per Satu
  const [employeeLookupQuery, setEmployeeLookupQuery] = useState('');

  // State Tabel SBM Provinsi (SUMSEL, KALBAR, JABAR, PABAR, NTT, SULTENG)
  const [sbmTable, setSbmTable] = useState<Record<SbmProvinceCode, SbmProvinceRate>>(
    () => ({ ...DEFAULT_SBM_PROVINCES })
  );
  const [selectedSbmProvince, setSelectedSbmProvince] = useState<
    SbmProvinceCode | 'NONE'
  >('NONE');
  // Default ringkas (tertutup) agar halaman input efektif & tidak penuh, bisa dibuka 1 klik
  const [showSbmMatrix, setShowSbmMatrix] = useState<boolean>(false);
  const [autoApplySbmOnAdd, setAutoApplySbmOnAdd] = useState<boolean>(true);

  // Parameter Cepat 1 Tim (Default dimulai dari 0)
  const [batchStartSpdNum, setBatchStartSpdNum] = useState<number>(8425);
  const [batchTanggalSpd, setBatchTanggalSpd] = useState<string>(
    master.tanggalSpd || '2025-11-19'
  );
  const [batchNomorSt, setBatchNomorSt] = useState<string>(
    master.nomorSuratTugas || 'ITJ.KP.04.01-30'
  );
  const [batchTanggalSt, setBatchTanggalSt] = useState<string>(
    master.tanggalSuratTugas || '2025-11-19'
  );
  const [batchHariDl, setBatchHariDl] = useState<number>(0);
  const [autoMalamMinusOne, setAutoMalamMinusOne] = useState<boolean>(true);
  const [batchPersenHotel, setBatchPersenHotel] = useState<number>(30);

  // Pratinjau Dokumen Langsung di Bawah Tabel (Live Split Preview)
  const [showInlinePreview, setShowInlinePreview] = useState<boolean>(true);
  const [inlineDocTab, setInlineDocTab] = useState<InlineDocTab>('rincian');

  const activeParticipant =
    participants.find((p) => p.id === selectedParticipantId) ||
    participants[0] ||
    null;

  const activeCalc = activeParticipant
    ? calculateParticipantTotals(activeParticipant)
    : null;

  const updateMasterField = <K extends keyof MasterKegiatan>(
    key: K,
    val: MasterKegiatan[K]
  ) => {
    if (!onUpdateMaster) return;
    onUpdateMaster({
      ...master,
      [key]: val,
    });
  };

  // Ubah nilai sel pada Tabel SBM Provinsi
  const handleUpdateSbmCell = (
    prov: SbmProvinceCode,
    field: keyof Omit<SbmProvinceRate, 'code' | 'namaProvinsi'>,
    val: number
  ) => {
    const cleanVal = Math.max(0, Number(val) || 0);
    setSbmTable((prev) => {
      const updatedProv = {
        ...prev[prov],
        [field]: cleanVal,
      };
      const nextTable = {
        ...prev,
        [prov]: updatedProv,
      };
      // Jika provinsi ini sedang aktif, langsung sinkronkan ke anggota tim yang ada
      if (selectedSbmProvince === prov && participants.length > 0) {
        const synced = participants.map((p) =>
          applySbmToParticipant(p, updatedProv, { includeTransport: true })
        );
        onUpdateParticipants(synced);
      }
      return nextTable;
    });
  };

  // Terapkan Tarif SBM Provinsi terpilih ke 1 baris pegawai
  const handleApplySbmToRow = (
    rowId: string,
    provCode?: SbmProvinceCode,
    tierOverride?: SbmEselonTier
  ) => {
    const code =
      provCode ||
      (selectedSbmProvince !== 'NONE' ? selectedSbmProvince : 'KALBAR');
    const rate = sbmTable[code];
    if (!rate) return;
    const next = participants.map((p) => {
      if (p.id !== rowId) return p;
      return applySbmToParticipant(p, rate, {
        tierOverride,
        includeTransport: true,
      });
    });
    onUpdateParticipants(next);
  };

  // Pilih & Terapkan Tarif SBM Provinsi ke seluruh anggota tim
  const handleApplySbmProvinceToEntireTeam = (provCode: SbmProvinceCode) => {
    setSelectedSbmProvince(provCode);
    setAutoApplySbmOnAdd(true);
    const rate = sbmTable[provCode];
    if (!rate) return;

    if (onUpdateMaster) {
      onUpdateMaster({
        ...master,
        lokasiTujuan: provCode,
        provinsiTujuan: rate.namaProvinsi,
      });
    }

    if (participants.length > 0) {
      const updated = participants.map((p) =>
        applySbmToParticipant(p, rate, { includeTransport: true })
      );
      onUpdateParticipants(updated);
    }
  };

  // Set mode kembali ke Default 0 (Manual)
  const handleSelectDefaultZeroMode = () => {
    setSelectedSbmProvince('NONE');
  };

  const updateRowById = (id: string, patch: Partial<ParticipantPTJ>) => {
    const next = participants.map((p) => {
      if (p.id !== id) return p;
      const updated = { ...p, ...patch };
      // Otomatis hitung Tanggal Pertanggungjawaban = Tanggal SPD + 14 hari
      if (
        patch.tanggalSpd !== undefined &&
        patch.tanggalPertanggungjawaban === undefined
      ) {
        updated.tanggalPertanggungjawaban = patch.tanggalSpd
          ? addDaysIso(patch.tanggalSpd, 14)
          : '';
      }
      return updated;
    });
    onUpdateParticipants(next);
  };

  // Ubah Hari DL pada 1 baris (dan otomatis sesuaikan Malam Hotel = Hari - 1 jika autoMalamMinusOne aktif)
  const handleChangeRowHariDl = (rowId: string, hari: number) => {
    const cleanHari = Math.max(0, Number(hari) || 0);
    const patch: Partial<ParticipantPTJ> = {
      jumlahHari: cleanHari,
    };
    if (autoMalamMinusOne) {
      patch.jumlahMalam = cleanHari > 0 ? cleanHari - 1 : 0;
    }
    updateRowById(rowId, patch);
  };

  // Terapkan Hari DL cepat ke seluruh anggota tim sekaligus
  const handleQuickSetTeamHariDl = (hari: number) => {
    const cleanHari = Math.max(0, hari);
    setBatchHariDl(cleanHari);
    if (participants.length === 0) return;
    const updated = participants.map((p) => ({
      ...p,
      jumlahHari: cleanHari,
      jumlahMalam: autoMalamMinusOne
        ? cleanHari > 0
          ? cleanHari - 1
          : 0
        : p.jumlahMalam,
    }));
    onUpdateParticipants(updated);
  };

  // Terapkan Slot Persen Penginapan (30% / 100%) ke seluruh anggota tim sekaligus
  const handleQuickSetTeamSlotHotel = (persen: number) => {
    const cleanPersen = Math.min(100, Math.max(1, persen));
    setBatchPersenHotel(cleanPersen);
    if (participants.length === 0) return;
    const updated = participants.map((p) => ({
      ...p,
      persenPenginapan: cleanPersen,
      gunakanTarif30Persen: cleanPersen !== 100,
    }));
    onUpdateParticipants(updated);
  };

  // Samakan Hari DL, Malam, Tanggal SPD, dan Slot % dari 1 baris ke seluruh anggota tim
  const handleCopyRowScheduleToAllTeam = (source: ParticipantPTJ) => {
    const prefix = master.nomorSpdPrefix || 'ITJ.1-KU.03.02-';
    const updated = participants.map((p, idx) => ({
      ...p,
      noUrut: idx + 1,
      nomorSpd: p.nomorSpd && p.nomorSpd !== '0' ? p.nomorSpd : `${prefix}${batchStartSpdNum + idx}`,
      tanggalSpd: source.tanggalSpd,
      tanggalPertanggungjawaban: source.tanggalPertanggungjawaban,
      nomorSuratTugas: source.nomorSuratTugas || batchNomorSt,
      tanggalSuratTugas: source.tanggalSuratTugas || batchTanggalSt,
      jumlahHari: source.jumlahHari,
      jumlahMalam: source.jumlahMalam,
      persenPenginapan: source.persenPenginapan,
      gunakanTarif30Persen: source.gunakanTarif30Persen,
    }));
    onUpdateParticipants(updated);
  };

  const updateActiveParticipant = (patch: Partial<ParticipantPTJ>) => {
    if (!activeParticipant) return;
    updateRowById(activeParticipant.id, patch);
  };

  // Tambah 1 Pegawai dari Direktori 27 Pegawai (Default = 0, atau langsung terisi SBM & Hari Tim jika dipilih)
  const handleAddSingleEmployeeWithZeroDefaults = (dirNo: number) => {
    const dirItem = MASTER_PEGAWAI_ITJEN.find((item) => item.no === dirNo);
    if (!dirItem) return;

    const existing = participants.find(
      (p) =>
        (dirItem.nip && p.nip === dirItem.nip) ||
        p.nama.toLowerCase() === dirItem.nama.toLowerCase()
    );
    if (existing) {
      onSelectParticipant(existing.id);
      setEmployeeLookupQuery('');
      return;
    }

    const seq = participants.length + 1;
    const spdNum = batchStartSpdNum + seq - 1;
    const prefix = master.nomorSpdPrefix || 'ITJ.1-KU.03.02-';
    const baseZero = buildParticipantFromDirectoryItem(dirItem, seq, true);
    const defaultHari = batchHariDl > 0 ? batchHariDl : 0;
    const defaultMalam =
      autoMalamMinusOne && defaultHari > 0 ? defaultHari - 1 : 0;

    let added: ParticipantPTJ = {
      ...baseZero,
      id: `p-team-${dirItem.no}-${Date.now()}`,
      noUrut: seq,
      nomorSpd:
        dirItem.noSpd && dirItem.noSpd !== '0'
          ? dirItem.noSpd
          : `${prefix}${spdNum}`,
      tanggalSpd: batchTanggalSpd || dirItem.tglSpd || '2025-11-19',
      tanggalPertanggungjawaban: addDaysIso(
        batchTanggalSpd || dirItem.tglSpd || '2025-11-19',
        14
      ),
      nomorSuratTugas: batchNomorSt || dirItem.st,
      tanggalSuratTugas: batchTanggalSt || dirItem.tglSt,
      jumlahHari: defaultHari,
      tarifUangHarian: 0,
      uangRepresentasiPerHari: 0,
      biayaTiketPP: 0,
      biayaTaksiAsal: 0,
      biayaTaksiProvinsi: 0,
      biayaDaratSpd: 0,
      biayaTransporDarat: 0,
      jumlahMalam: defaultMalam,
      tarifHotelPerMalam: 0,
      persenPenginapan: batchPersenHotel,
      gunakanTarif30Persen: batchPersenHotel !== 100,
      rencanaDibayarSemula: 0,
    };

    if (autoApplySbmOnAdd && selectedSbmProvince !== 'NONE') {
      const rate = sbmTable[selectedSbmProvince];
      if (rate) {
        added = applySbmToParticipant(added, rate, { includeTransport: true });
      }
    }

    const next = [...participants, added];
    onUpdateParticipants(next);
    onSelectParticipant(added.id);
    setEmployeeLookupQuery('');
  };

  // Pilih Pegawai dari Direktori 27 Pegawai langsung pada baris tabel tertentu
  const handleSelectDirectoryForRow = (rowId: string, dirNo: number) => {
    const found = MASTER_PEGAWAI_ITJEN.find((item) => item.no === dirNo);
    if (!found) return;
    const rowIdx = participants.findIndex((p) => p.id === rowId);
    const template = buildParticipantFromDirectoryItem(
      found,
      rowIdx >= 0 ? rowIdx + 1 : 1,
      true
    );
    const currentRow = participants.find((p) => p.id === rowId);
    let patch: Partial<ParticipantPTJ> = {
      nama: template.nama,
      nip: template.nip,
      jabatan: template.jabatan,
      pangkatGolongan: template.pangkatGolongan,
      tingkatBiaya: template.tingkatBiaya,
    };
    if (
      currentRow &&
      autoApplySbmOnAdd &&
      selectedSbmProvince !== 'NONE' &&
      sbmTable[selectedSbmProvince]
    ) {
      const withSbm = applySbmToParticipant(
        { ...currentRow, ...patch },
        sbmTable[selectedSbmProvince],
        { includeTransport: true }
      );
      patch = withSbm;
    }
    updateRowById(rowId, patch);
  };

  const handleToggleDirectoryMemberInTeam = (dirNo: number) => {
    const dirItem = MASTER_PEGAWAI_ITJEN.find((item) => item.no === dirNo);
    if (!dirItem) return;

    const exists = participants.some(
      (p) =>
        (dirItem.nip && p.nip === dirItem.nip) ||
        p.nama.toLowerCase() === dirItem.nama.toLowerCase()
    );

    if (exists) {
      const filtered = participants
        .filter(
          (p) =>
            !(
              (dirItem.nip && p.nip === dirItem.nip) ||
              p.nama.toLowerCase() === dirItem.nama.toLowerCase()
            )
        )
        .map((p, idx) => ({ ...p, noUrut: idx + 1 }));
      onUpdateParticipants(filtered);
      onSelectParticipant(filtered[0]?.id || '');
    } else {
      handleAddSingleEmployeeWithZeroDefaults(dirNo);
    }
  };

  const handleClearTeamToZero = () => {
    onUpdateParticipants([]);
    onSelectParticipant('');
  };

  const handleResetAllTeamNumbersToZero = () => {
    setSelectedSbmProvince('NONE');
    setBatchHariDl(0);
    const zeroed = participants.map((p) => ({
      ...p,
      jumlahHari: 0,
      tarifUangHarian: 0,
      uangRepresentasiPerHari: 0,
      biayaTiketPP: 0,
      biayaTaksiAsal: 0,
      biayaTaksiProvinsi: 0,
      biayaDaratSpd: 0,
      biayaTransporDarat: 0,
      jumlahMalam: 0,
      tarifHotelPerMalam: 0,
      persenPenginapan: 30,
      gunakanTarif30Persen: true,
      rencanaDibayarSemula: 0,
    }));
    onUpdateParticipants(zeroed);
  };

  // Terapkan Parameter Jadwal & Nomor SPD ke Seluruh Tim
  const handleApplyScheduleAndSpdToTeam = () => {
    if (participants.length === 0) return;
    const prefix = master.nomorSpdPrefix || 'ITJ.1-KU.03.02-';
    const tglPtj = batchTanggalSpd ? addDaysIso(batchTanggalSpd, 14) : '';
    const updated = participants.map((p, idx) => {
      const spdNum = batchStartSpdNum + idx;
      const nextHari = batchHariDl;
      const nextMalam = autoMalamMinusOne
        ? nextHari > 0
          ? nextHari - 1
          : 0
        : p.jumlahMalam;
      let row: ParticipantPTJ = {
        ...p,
        noUrut: idx + 1,
        nomorSpd: `${prefix}${spdNum}`,
        tanggalSpd: batchTanggalSpd,
        tanggalPertanggungjawaban: tglPtj,
        nomorSuratTugas: batchNomorSt,
        tanggalSuratTugas: batchTanggalSt,
        jumlahHari: nextHari,
        jumlahMalam: nextMalam,
        persenPenginapan: batchPersenHotel,
        gunakanTarif30Persen: batchPersenHotel !== 100,
      };
      if (selectedSbmProvince !== 'NONE' && sbmTable[selectedSbmProvince]) {
        row = applySbmToParticipant(row, sbmTable[selectedSbmProvince], {
          includeTransport: true,
        });
      }
      return row;
    });
    onUpdateParticipants(updated);
  };

  const handleLoadAll27FromDirectory = () => {
    const all27 = MASTER_PEGAWAI_ITJEN.map((r) => ({
      ...buildParticipantFromDirectoryItem(r, r.no, false),
      id: `p-${r.no}`,
    }));
    onUpdateParticipants(all27);
    onSelectParticipant(all27[9]?.id || all27[0].id);
  };

  const handleAddBlankRowZero = () => {
    const seq = participants.length + 1;
    const spdNum = batchStartSpdNum + seq - 1;
    const newId = `p-${Date.now()}`;
    const tglSpd = batchTanggalSpd || master.tanggalSpd || '2025-11-19';
    const defaultHari = batchHariDl > 0 ? batchHariDl : 0;
    const defaultMalam =
      autoMalamMinusOne && defaultHari > 0 ? defaultHari - 1 : 0;

    let newPerson: ParticipantPTJ = {
      id: newId,
      noUrut: seq,
      nama: '',
      nip: '',
      pangkatGolongan: 'Penata Muda (III/a)',
      jabatan: '',
      tingkatBiaya: 'C',
      nomorSpd: `${master.nomorSpdPrefix || 'ITJ.1-KU.03.02-'}${spdNum}`,
      tanggalSpd: tglSpd,
      tanggalPertanggungjawaban: addDaysIso(tglSpd, 14),
      nomorSuratTugas: batchNomorSt || master.nomorSuratTugas || '',
      tanggalSuratTugas: batchTanggalSt || master.tanggalSuratTugas || '',
      nomorKuitansi: `KP-${String(seq).padStart(3, '0')}/${master.nomorSpdPrefix || 'ITJ.1-KU.03.02-'}${spdNum}/${master.tahunAnggaran || '2025'}`,
      jumlahHari: defaultHari,
      tarifUangHarian: 0,
      uangRepresentasiPerHari: 0,
      modaTransportasi:
        master.labelTransporDarat || 'Transportasi Darat (Jabodetabek)',
      nomorTiketPP: '-',
      biayaTiketPP: 0,
      biayaTaksiAsal: 0,
      biayaTaksiProvinsi: 0,
      biayaDaratSpd: 0,
      biayaTransporDarat: 0,
      namaHotel: '-',
      jumlahMalam: defaultMalam,
      tarifHotelPerMalam: 0,
      gunakanTarif30Persen: batchPersenHotel !== 100,
      persenPenginapan: batchPersenHotel,
      rencanaDibayarSemula: 0,
      riilItems: [],
      taxType: 'NONE',
      customTaxAmount: 0,
    };

    if (autoApplySbmOnAdd && selectedSbmProvince !== 'NONE') {
      const rate = sbmTable[selectedSbmProvince];
      if (rate) {
        newPerson = applySbmToParticipant(newPerson, rate, {
          includeTransport: true,
        });
      }
    }

    onUpdateParticipants([...participants, newPerson]);
    onSelectParticipant(newId);
  };

  const handleDeleteParticipant = (id: string) => {
    const filtered = participants
      .filter((p) => p.id !== id)
      .map((p, idx) => ({ ...p, noUrut: idx + 1 }));
    onUpdateParticipants(filtered);
    if (selectedParticipantId === id) {
      onSelectParticipant(filtered[0]?.id || '');
    }
  };

  const handleConfirmPasteImport = () => {
    if (!pasteText.trim()) return;
    const imported = parseParticipantPaste(
      pasteText,
      participants.length,
      master
    );
    if (imported.length > 0) {
      const combined = [...participants, ...imported];
      onUpdateParticipants(combined);
      onSelectParticipant(imported[0].id);
      setPasteText('');
      setShowPasteModal(false);
    }
  };

  const matchingDirectoryEmployees = MASTER_PEGAWAI_ITJEN.filter((emp) => {
    if (!employeeLookupQuery.trim()) return true;
    const q = employeeLookupQuery.toLowerCase().trim();
    return (
      emp.nama.toLowerCase().includes(q) ||
      emp.nip.toLowerCase().includes(q) ||
      emp.jabatan.toLowerCase().includes(q) ||
      String(emp.no) === q
    );
  });

  const filteredParticipants = participants.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      p.nip.toLowerCase().includes(q) ||
      p.jabatan.toLowerCase().includes(q) ||
      p.nomorSpd.toLowerCase().includes(q)
    );
  });

  const activeSbmRate =
    selectedSbmProvince !== 'NONE' ? sbmTable[selectedSbmProvince] : null;

  return (
    <div className="space-y-3">
      {/* =====================================================================
          PANEL TERPADU 3-LANGKAH CEPAT (EFEKTIF & EFISIEN):
          1. Pilih SBM Provinsi & Parameter Tim (Hari DL, Slot 30%, Tgl SPD)
          2. Cari & Klik Pegawai Satu per Satu (Default Nilai = 0 / Auto SBM)
         ===================================================================== */}
      <section
        data-testid="sbm-province-panel"
        className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs space-y-3 no-print"
      >
        {/* BARIS 1: PILIH PROVINSI SBM + PARAMETER HARI DL & SLOT 30% TIM */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-center">
          {/* Kiri: Tombol 1-Klik SBM Provinsi */}
          <div className="xl:col-span-7 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] font-bold">
                  1
                </span>
                <span>Pilih Standar Biaya Masukan (SBM Provinsi):</span>
              </span>
              <button
                type="button"
                data-testid="btn-toggle-sbm-table"
                onClick={() => setShowSbmMatrix((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg"
              >
                <Table className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {showSbmMatrix
                    ? 'Tutup Tabel SBM (9 Komponen)'
                    : 'Lihat / Edit Tabel SBM Lengkap'}
                </span>
                {showSbmMatrix ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="sbm-btn-NONE"
                onClick={handleSelectDefaultZeroMode}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  selectedSbmProvince === 'NONE'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Default 0 (Manual)
              </button>
              {SBM_PROVINCE_LIST.map((provCode) => {
                const active = selectedSbmProvince === provCode;
                return (
                  <button
                    key={provCode}
                    type="button"
                    data-testid={`sbm-btn-${provCode}`}
                    onClick={() => handleApplySbmProvinceToEntireTeam(provCode)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      active
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        : 'bg-emerald-50/70 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {provCode}
                  </button>
                );
              })}
            </div>

            {/* Ringkasan Tarif SBM Provinsi Aktif dalam 1 Baris */}
            {activeSbmRate ? (
              <div className="text-[11px] bg-emerald-50/90 border border-emerald-200 text-emerald-950 px-2.5 py-1.5 rounded-lg flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono">
                <strong className="font-sans text-emerald-900">
                  SBM {activeSbmRate.code}:
                </strong>
                <span>UH: {formatAccountingCell(activeSbmRate.uangHarian)}</span>
                <span>·</span>
                <span>
                  Hotel Es.II: {formatAccountingCell(activeSbmRate.penginapanEselon2)} | Es.III/Gol.IV:{' '}
                  {formatAccountingCell(activeSbmRate.penginapanEselon3Gol4)} | Es.IV/Gol.III:{' '}
                  {formatAccountingCell(activeSbmRate.penginapanEselon4Gol3)}
                </span>
                <span>·</span>
                <span>Pesawat: {formatAccountingCell(activeSbmRate.tiketPesawat)}</span>
                <span>·</span>
                <span>
                  Taksi Jkt: {formatAccountingCell(activeSbmRate.transporTerminalJakarta)} | Tjn:{' '}
                  {formatAccountingCell(activeSbmRate.transporTerminalTujuan)}
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">
                Mode <strong>Default 0 (Manual)</strong> aktif: semua nilai biaya dimulai dari <strong>0</strong>. Klik salah satu provinsi (<strong>SUMSEL / KALBAR / JABAR / PABAR / NTT / SULTENG</strong>) untuk mengisi tarif SBM otomatis sesuai Eselon/Golongan.
              </div>
            )}
          </div>

          {/* Kanan: Parameter Cepat 1 Tim (Hari DL, Auto Malam = Hari-1, Slot 30%, Tgl SPD) */}
          <div className="xl:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-700 text-white text-[11px] font-bold">
                  2
                </span>
                <span>Set Cepat Hari DL, Slot 30% &amp; SPD Se-Tim:</span>
              </span>
              <label className="inline-flex items-center gap-1 text-[11px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoMalamMinusOne}
                  onChange={(e) => setAutoMalamMinusOne(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700"
                />
                <span>Auto Malam = Hari − 1</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Pilihan Cepat Hari DL */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-600 mr-0.5">
                  Hari DL:
                </span>
                {[0, 1, 2, 3, 4, 5, 6].map((h) => (
                  <button
                    key={h}
                    type="button"
                    data-testid={`team-hari-btn-${h}`}
                    onClick={() => handleQuickSetTeamHariDl(h)}
                    className={`w-6 h-6 text-xs font-mono font-bold rounded border transition-colors ${
                      batchHariDl === h
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50'
                    }`}
                    title={`Set ${h} Hari DL (${autoMalamMinusOne && h > 0 ? `${h - 1} Malam Hotel` : '0 Malam'}) untuk tim`}
                  >
                    {h}
                  </button>
                ))}
              </div>

              {/* Pilihan Cepat Slot Penginapan 30% / 100% */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-slate-600">
                  Hotel:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickSetTeamSlotHotel(30)}
                  className={`px-2 py-1 text-[11px] font-mono font-bold rounded border ${
                    batchPersenHotel === 30
                      ? 'bg-slate-800 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  Slot 30%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSetTeamSlotHotel(100)}
                  className={`px-2 py-1 text-[11px] font-mono font-bold rounded border ${
                    batchPersenHotel === 100
                      ? 'bg-blue-700 text-white border-blue-800'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  100%
                </button>
              </div>
            </div>

            {/* Baris Tanggal SPD, No SPD Awal, No ST + Tombol Terapkan */}
            <div className="grid grid-cols-12 gap-1.5 items-center pt-1 border-t border-slate-200/80 text-[11px]">
              <div className="col-span-4 flex items-center gap-1">
                <span className="text-slate-500 shrink-0">Tgl SPD:</span>
                <input
                  type="date"
                  aria-label="Tanggal SPD Tim"
                  value={batchTanggalSpd}
                  onChange={(e) => setBatchTanggalSpd(e.target.value)}
                  className="w-full px-1.5 py-1 font-mono text-[11px] bg-white border border-slate-300 rounded"
                />
              </div>
              <div className="col-span-3 flex items-center gap-1">
                <span className="text-slate-500 shrink-0">SPD#:</span>
                <input
                  type="number"
                  aria-label="Nomor Urut SPD Awal"
                  value={batchStartSpdNum}
                  onChange={(e) =>
                    setBatchStartSpdNum(Number(e.target.value) || 8425)
                  }
                  className="w-full px-1.5 py-1 font-mono text-[11px] bg-white border border-slate-300 rounded"
                />
              </div>
              <div className="col-span-3 flex items-center gap-1">
                <span className="text-slate-500 shrink-0">ST:</span>
                <input
                  type="text"
                  aria-label="Nomor Surat Tugas Tim"
                  value={batchNomorSt}
                  onChange={(e) => setBatchNomorSt(e.target.value)}
                  className="w-full px-1.5 py-1 font-mono text-[11px] bg-white border border-slate-300 rounded"
                />
              </div>
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={handleApplyScheduleAndSpdToTeam}
                  disabled={participants.length === 0}
                  className="w-full py-1 px-2 font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded text-center"
                  title="Samakan Tanggal SPD, No ST, Hari DL, dan Tarif SBM ke seluruh anggota tim"
                >
                  Sync Tim
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MATRIKS TABEL SBM LENGKAP (9 KOMPONEN x 6 PROVINSI) — MUNCUL SAAT TOMBOL DIKLIK */}
        {showSbmMatrix && (
          <div
            data-testid="sbm-reference-table"
            className="overflow-x-auto border border-slate-400 rounded-lg pt-1"
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="py-2 px-3 border-r border-slate-400 min-w-[260px]">
                    Komponen Standar Biaya Masukan (SBM)
                  </th>
                  {SBM_PROVINCE_LIST.map((provCode) => {
                    const isSelected = selectedSbmProvince === provCode;
                    return (
                      <th
                        key={provCode}
                        className={`py-1.5 px-2 border-r border-slate-400 text-center min-w-[120px] ${
                          isSelected ? 'bg-emerald-100 text-emerald-950' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold">{provCode}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleApplySbmProvinceToEntireTeam(provCode)
                            }
                            className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-800'
                                : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            {isSelected ? '✓ Aktif' : 'Pakai'}
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                {(
                  [
                    {
                      key: 'uangRepresentatifEselon2',
                      label: '- Uang Representatif Eselon II',
                    },
                    {
                      key: 'uangHarian',
                      label: '- Uang Harian',
                    },
                    {
                      key: 'penginapanEselon2',
                      label: '- Penginapan Eselon II',
                    },
                    {
                      key: 'penginapanEselon3Gol4',
                      label: '- Penginapan Eselon III / Gol IV',
                    },
                    {
                      key: 'penginapanEselon4Gol3',
                      label: '- Penginapan Eselon IV / Gol III ke bawah',
                    },
                    {
                      key: 'tiketPesawat',
                      label: '- Tiket Pesawat',
                    },
                    {
                      key: 'transporTerminalJakarta',
                      label:
                        '- Transportasi dari dan/atau ke Terminal/Bandara/Stasiun/Pelabuhan Jakarta',
                    },
                    {
                      key: 'transporTerminalTujuan',
                      label:
                        '- Transportasi dari dan/atau ke Terminal/Bandara/Stasiun/Pelabuhan Tujuan',
                    },
                    {
                      key: 'transporDaratLautUdara',
                      label: '- Transportasi Darat / Laut/ Udara',
                    },
                  ] as const
                ).map((rowDef) => (
                  <tr key={rowDef.key} className="hover:bg-slate-50/80">
                    <td className="py-1 px-3 border-r border-slate-400 font-sans font-medium text-slate-900 bg-white">
                      {rowDef.label}
                    </td>
                    {SBM_PROVINCE_LIST.map((provCode) => {
                      const val = sbmTable[provCode][rowDef.key];
                      const isSelected = selectedSbmProvince === provCode;
                      return (
                        <td
                          key={provCode}
                          className={`py-1 px-2 border-r border-slate-300 text-right ${
                            isSelected ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            aria-label={`SBM ${provCode} ${rowDef.label}`}
                            value={val}
                            onChange={(e) =>
                              handleUpdateSbmCell(
                                provCode,
                                rowDef.key,
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full text-right bg-transparent focus:bg-white px-1 py-0.5 rounded border border-transparent focus:border-emerald-600 focus:outline-none font-mono"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BARIS 2: CARI & TAMBAH PEGAWAI SATU PER SATU (LANGSUNG DARI 27 PEGAWAI DATABASE) */}
        <div
          data-testid="one-by-one-search-panel"
          className="pt-2.5 border-t border-slate-200 space-y-2"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-blue-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                data-testid="search-add-employee-input"
                value={employeeLookupQuery}
                onChange={(e) => setEmployeeLookupQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    matchingDirectoryEmployees.length > 0
                  ) {
                    e.preventDefault();
                    const firstNotInTeam =
                      matchingDirectoryEmployees.find(
                        (emp) =>
                          !participants.some(
                            (p) =>
                              (emp.nip && p.nip === emp.nip) ||
                              p.nama.toLowerCase() === emp.nama.toLowerCase()
                          )
                      ) || matchingDirectoryEmployees[0];
                    if (firstNotInTeam) {
                      handleAddSingleEmployeeWithZeroDefaults(
                        firstNotInTeam.no
                      );
                    }
                  }
                }}
                placeholder="3. Ketik Nama / NIP pegawai satu per satu lalu tekan Enter (contoh: Bambang, Fandyla, Falentina, Syahrizal)..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-medium bg-blue-50/40 focus:bg-white border-2 border-blue-600 rounded-xl focus:outline-none"
              />
              {employeeLookupQuery && (
                <button
                  type="button"
                  onClick={() => setEmployeeLookupQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowTeamPicker((prev) => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors shrink-0 ${
                showTeamPicker
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {showTeamPicker
                  ? 'Tutup Daftar 27 Pegawai'
                  : 'Pilih Cepat 27 Pegawai'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleAddBlankRowZero}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Baris Manual</span>
            </button>

            {participants.length > 0 && (
              <>
                <button
                  type="button"
                  data-testid="btn-zero-all-numbers"
                  onClick={handleResetAllTeamNumbersToZero}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl shrink-0"
                  title="Nol-kan semua angka Hari DL, Uang Harian, Transpor, dan Hotel"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Nol-kan Angka</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-clear-team-zero"
                  onClick={handleClearTeamToZero}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl shrink-0"
                  title="Kosongkan tim kembali ke 0 orang"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan (0)</span>
                </button>
              </>
            )}
          </div>

          {/* Hasil Autocomplete / Daftar 27 Pegawai dengan Tingkat SBM Otomatis */}
          {(employeeLookupQuery.trim().length > 0 || showTeamPicker) && (
            <div
              data-testid="employee-search-results"
              className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                <span>
                  Klik nama pegawai untuk menambah/menghapus dari tim (
                  {selectedSbmProvince !== 'NONE' ? (
                    <strong className="text-emerald-800">
                      Otomatis menerapkan tarif SBM {selectedSbmProvince} sesuai Eselon/Golongan
                    </strong>
                  ) : (
                    <strong>Nilai awal = 0</strong>
                  )}
                  ):
                </span>
                {showTeamPicker && (
                  <button
                    type="button"
                    onClick={() => setShowTeamPicker(false)}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Tutup
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-0.5">
                {matchingDirectoryEmployees.map((emp) => {
                  const isAdded = participants.some(
                    (p) =>
                      (emp.nip && p.nip === emp.nip) ||
                      p.nama.toLowerCase() === emp.nama.toLowerCase()
                  );
                  const previewP = buildParticipantFromDirectoryItem(
                    emp,
                    emp.no,
                    true
                  );
                  const tier = detectSbmTierForParticipant(previewP);
                  return (
                    <button
                      key={emp.no}
                      type="button"
                      data-testid={`add-emp-${emp.no}`}
                      onClick={() =>
                        isAdded
                          ? handleToggleDirectoryMemberInTeam(emp.no)
                          : handleAddSingleEmployeeWithZeroDefaults(emp.no)
                      }
                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                        isAdded
                          ? 'bg-emerald-700 text-white border-emerald-800 font-semibold'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-500 hover:bg-blue-50/60'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold truncate">
                          <span className="font-mono text-[10px] opacity-75 mr-1">
                            {emp.no}.
                          </span>
                          {emp.nama}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isAdded ? 'text-emerald-100' : 'text-slate-500'
                          }`}
                        >
                          {emp.jabatan} ·{' '}
                          <span className="font-semibold">
                            {getSbmTierLabel(tier)}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded shrink-0 ${
                          isAdded
                            ? 'bg-emerald-900 text-white'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isAdded ? '✓ Tim' : '+ Pilih'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          TABEL UTAMA INPUT TIM (RINGKAS, PADAT, & LANGSUNG TERHUBUNG KE DOKUMEN)
         ===================================================================== */}
      <section
        data-testid="compact-table-view"
        className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs space-y-3 no-print"
      >
        {/* Toolbar Tabel: Mode Tampilan, Info PPK/MAK, & Tombol Cetak Tim */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  viewMode === 'compact'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                Tabel Tim Efisien ({participants.length} Orang)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  viewMode === 'single'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                Form Detail 1 Orang
              </button>
              <button
                type="button"
                onClick={() => setViewMode('full25')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  viewMode === 'full25'
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                Sheet 25 Kolom (DATABASE)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowMasterHeader((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              <span>MAK {master.kodeMak} · PPK &amp; Bendahara</span>
              {showMasterHeader ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={handleLoadAll27FromDirectory}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              title="Muat contoh seluruh 27 pegawai dari DATABASE.pdf"
            >
              Muat 27 Pegawai Database
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-700">
              Total Tim ({participants.length} Org):{' '}
              <strong className="text-blue-800 font-bold">
                {formatRupiah(summary.grandTotalBruto)}
              </strong>
            </span>

            {participants.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setShowInlinePreview((prev) => !prev)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border ${
                    showInlinePreview
                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {showInlinePreview ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {showInlinePreview
                      ? 'Sembunyikan Preview Bawah'
                      : 'Tampilkan Preview Bawah'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onOpenPreviewForParticipant(
                      participants[0].id,
                      'bundle_team'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Seluruh Tim ({participants.length} Org)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Panel Collapsible: Pengaturan MAK, Tujuan, PPK & Bendahara */}
        {showMasterHeader && (
          <div
            data-testid="database-header-panel"
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs"
          >
            <div className="lg:col-span-7 space-y-2">
              <div className="grid grid-cols-12 items-center gap-2">
                <label
                  htmlFor="db-nama-kegiatan"
                  className="col-span-3 font-semibold text-slate-700"
                >
                  Kegiatan :
                </label>
                <input
                  id="db-nama-kegiatan"
                  type="text"
                  value={master.namaKegiatan}
                  onChange={(e) =>
                    updateMasterField('namaKegiatan', e.target.value)
                  }
                  className="col-span-9 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <label
                  htmlFor="db-mak"
                  className="col-span-3 font-semibold text-slate-700"
                >
                  Kode MAK :
                </label>
                <input
                  id="db-mak"
                  type="text"
                  value={master.kodeMak}
                  onChange={(e) => updateMasterField('kodeMak', e.target.value)}
                  className="col-span-3 px-2.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded font-bold"
                />
                <label
                  htmlFor="db-tujuan"
                  className="col-span-2 font-semibold text-slate-700 text-right"
                >
                  Tujuan :
                </label>
                <input
                  id="db-tujuan"
                  type="text"
                  value={master.lokasiTujuan}
                  onChange={(e) =>
                    updateMasterField('lokasiTujuan', e.target.value)
                  }
                  className="col-span-4 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="lg:col-span-5 space-y-2">
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <span className="col-span-3 font-semibold text-slate-700">
                  PPK :
                </span>
                <input
                  type="text"
                  aria-label="Nama PPK"
                  value={master.ppkNama}
                  onChange={(e) => updateMasterField('ppkNama', e.target.value)}
                  className="col-span-5 px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                />
                <input
                  type="text"
                  aria-label="NIP PPK"
                  value={master.ppkNip}
                  onChange={(e) => updateMasterField('ppkNip', e.target.value)}
                  className="col-span-4 px-2 py-1 text-[11px] font-mono bg-white border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-12 gap-1.5 items-center">
                <span className="col-span-3 font-semibold text-slate-700">
                  Bendahara :
                </span>
                <input
                  type="text"
                  aria-label="Nama Bendahara"
                  value={master.bendaharaNama}
                  onChange={(e) =>
                    updateMasterField('bendaharaNama', e.target.value)
                  }
                  className="col-span-5 px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                />
                <input
                  type="text"
                  aria-label="NIP Bendahara"
                  value={master.bendaharaNip}
                  onChange={(e) =>
                    updateMasterField('bendaharaNip', e.target.value)
                  }
                  className="col-span-4 px-2 py-1 text-[11px] font-mono bg-white border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE KETIKA TIM MASIH 0 ORANG */}
        {participants.length === 0 ? (
          <div
            data-testid="empty-team-zero-state"
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-3 bg-slate-50/60"
          >
            <div className="text-sm font-bold text-slate-800">
              Tim Masih Kosong (0 Anggota — Seluruh Nilai Default = 0)
            </div>
            <p className="text-xs text-slate-600 max-w-2xl mx-auto">
              1) Klik provinsi SBM di atas (<strong>SUMSEL / KALBAR / JABAR / PABAR / NTT / SULTENG</strong>) atau biarkan <strong>Default 0</strong>, 2) Pilih <strong>Hari DL Tim</strong>, lalu 3) Ketik/klik nama pegawai satu per satu untuk menyusun tim 5–7 orang dalam hitungan detik.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowTeamPicker(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pilih Cepat dari 27 Pegawai Database</span>
              </button>
              <button
                type="button"
                onClick={handleAddBlankRowZero}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah 1 Baris Kosong (Default 0)</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'compact' ? (
          /* MODE 1: TABEL TIM EFISIEN */
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <th className="py-2 px-1.5 border-r border-slate-300 w-8">No</th>
                  <th className="py-2 px-2 border-r border-slate-300 text-left min-w-[230px]">
                    Pegawai &amp; Tingkat SBM
                  </th>
                  <th className="py-2 px-2 border-r border-slate-300 min-w-[135px]">
                    No. SPD &amp; Tgl SPD
                  </th>
                  <th className="py-2 px-1.5 border-r border-slate-300 min-w-[95px]">
                    Hari DL
                  </th>
                  <th className="py-2 px-2 border-r border-slate-300 min-w-[125px]">
                    Uang Harian &amp; Rep
                  </th>
                  <th className="py-2 px-2 border-r border-slate-300 bg-emerald-50/80 min-w-[215px]">
                    Transportasi SBM (Pesawat &amp; Taksi)
                  </th>
                  <th className="py-2 px-2 border-r border-slate-300 bg-amber-100/80 min-w-[225px]">
                    Penginapan (Mlm × Slot 30% × SBM)
                  </th>
                  <th className="py-2 px-2 border-r border-slate-300 min-w-[115px]">
                    Total Diterima
                  </th>
                  <th className="py-2 px-2 min-w-[155px]">Dokumen / Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredParticipants.map((p, idx) => {
                  const calc = calculateParticipantTotals(p);
                  const isSelected = activeParticipant?.id === p.id;
                  const detectedTier = detectSbmTierForParticipant(p);
                  return (
                    <tr
                      key={p.id}
                      data-testid={`compact-row-${idx + 1}`}
                      onClick={() => onSelectParticipant(p.id)}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-1.5 px-1.5 border-r border-slate-200 text-center font-mono font-bold text-slate-700">
                        {idx + 1}
                      </td>

                      {/* Pegawai + Pilih Cepat + Tier SBM */}
                      <td className="py-1.5 px-2 border-r border-slate-200 space-y-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={p.nama}
                            onChange={(e) =>
                              updateRowById(p.id, { nama: e.target.value })
                            }
                            placeholder="Nama Pegawai..."
                            className="w-full font-bold text-slate-900 bg-white px-2 py-1 border border-slate-300 rounded focus:border-blue-600 focus:outline-none"
                          />
                          <select
                            aria-label={`Pilih Cepat Pegawai Baris ${idx + 1}`}
                            value=""
                            onChange={(e) => {
                              const dirNo = Number(e.target.value);
                              if (dirNo > 0)
                                handleSelectDirectoryForRow(p.id, dirNo);
                            }}
                            className="w-6 px-0.5 py-1 text-[11px] bg-blue-50 text-blue-800 border border-blue-200 rounded cursor-pointer font-bold shrink-0"
                            title="Ganti dari 27 Pegawai Database"
                          >
                            <option value="">▼</option>
                            {MASTER_PEGAWAI_ITJEN.map((emp) => (
                              <option key={emp.no} value={emp.no}>
                                {emp.no}. {emp.nama} ({emp.jabatan})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-12 gap-1">
                          <input
                            type="text"
                            value={p.nip}
                            onChange={(e) =>
                              updateRowById(p.id, { nip: e.target.value })
                            }
                            placeholder="NIP"
                            className="col-span-6 text-[10px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 border border-slate-200 rounded"
                          />
                          <input
                            type="text"
                            value={p.jabatan}
                            onChange={(e) =>
                              updateRowById(p.id, { jabatan: e.target.value })
                            }
                            placeholder="Jabatan"
                            className="col-span-6 text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 border border-slate-200 rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-semibold text-slate-600 truncate">
                            {getSbmTierLabel(detectedTier)}
                          </span>
                          <select
                            aria-label={`Terapkan SBM Provinsi ke Baris ${idx + 1}`}
                            value=""
                            onChange={(e) => {
                              const prov = e.target.value as SbmProvinceCode;
                              if (prov) handleApplySbmToRow(p.id, prov);
                            }}
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 rounded cursor-pointer"
                          >
                            <option value="">+ SBM Provinsi...</option>
                            {SBM_PROVINCE_LIST.map((code) => (
                              <option key={code} value={code}>
                                SBM {code} (Hotel:{' '}
                                {formatAccountingCell(
                                  getSbmHotelRateForTier(
                                    sbmTable[code],
                                    detectedTier
                                  )
                                )}
                                )
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* No SPD & Tgl SPD (+14 Hari PTJ) */}
                      <td className="py-1.5 px-2 border-r border-slate-200 space-y-1">
                        <input
                          type="text"
                          value={p.nomorSpd}
                          onChange={(e) =>
                            updateRowById(p.id, { nomorSpd: e.target.value })
                          }
                          className="w-full font-mono text-[11px] bg-white px-1.5 py-0.5 border border-slate-300 rounded"
                        />
                        <input
                          type="date"
                          value={p.tanggalSpd || ''}
                          onChange={(e) =>
                            updateRowById(p.id, { tanggalSpd: e.target.value })
                          }
                          className="w-full font-mono text-[11px] bg-white px-1 py-0.5 border border-slate-300 rounded"
                        />
                        <div className="flex items-center justify-between text-[10px] font-mono text-amber-900">
                          <span>
                            PTJ:{' '}
                            {p.tanggalPertanggungjawaban
                              ? p.tanggalPertanggungjawaban
                              : '-'}
                          </span>
                          {participants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleCopyRowScheduleToAllTeam(p)}
                              className="text-[10px] font-sans font-semibold text-blue-700 hover:underline inline-flex items-center gap-0.5"
                              title="Samakan Hari DL, Malam, & Tanggal SPD baris ini ke seluruh anggota tim"
                            >
                              <CopyCheck className="w-3 h-3" />
                              <span>Se-Tim</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Hari DL */}
                      <td className="py-1.5 px-1.5 border-r border-slate-200 text-center space-y-1">
                        <input
                          type="number"
                          min={0}
                          value={p.jumlahHari}
                          onChange={(e) =>
                            handleChangeRowHariDl(
                              p.id,
                              Number(e.target.value) || 0
                            )
                          }
                          className="w-14 text-center font-mono font-bold bg-white py-1 border border-slate-300 rounded"
                        />
                        <div className="flex items-center justify-center gap-0.5">
                          {[0, 1, 2, 3, 4, 5].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => handleChangeRowHariDl(p.id, d)}
                              className={`px-1 py-0.5 text-[10px] font-mono rounded ${
                                p.jumlahHari === d
                                  ? 'bg-blue-700 text-white font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Uang Harian & Representatif */}
                      <td className="py-1.5 px-2 border-r border-slate-200 space-y-1">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>UH/hr:</span>
                            <span className="font-mono font-semibold text-slate-700">
                              {formatAccountingCell(calc.totalUangHarian)}
                            </span>
                          </div>
                          <input
                            type="number"
                            min={0}
                            step={10000}
                            value={p.tarifUangHarian}
                            onChange={(e) =>
                              updateRowById(p.id, {
                                tarifUangHarian: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full text-right font-mono bg-white px-1.5 py-0.5 border border-slate-300 rounded text-[11px]"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Rep/hr:</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateRowById(p.id, {
                                  uangRepresentasiPerHari:
                                    p.uangRepresentasiPerHari === 150000
                                      ? 0
                                      : 150000,
                                })
                              }
                              className="text-[9px] font-mono px-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700"
                            >
                              150rb
                            </button>
                          </div>
                          <input
                            type="number"
                            min={0}
                            step={25000}
                            value={p.uangRepresentasiPerHari}
                            onChange={(e) =>
                              updateRowById(p.id, {
                                uangRepresentasiPerHari:
                                  Number(e.target.value) || 0,
                              })
                            }
                            className="w-full text-right font-mono bg-slate-50 px-1.5 py-0.5 border border-slate-200 rounded text-[11px]"
                          />
                        </div>
                      </td>

                      {/* Transportasi SBM dalam Grid 2x2 Ringkas */}
                      <td className="py-1.5 px-2 border-r border-slate-200 bg-emerald-50/30">
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <div>
                            <div className="text-slate-500">Pesawat PP:</div>
                            <input
                              type="number"
                              min={0}
                              step={50000}
                              value={p.biayaTiketPP}
                              onChange={(e) =>
                                updateRowById(p.id, {
                                  biayaTiketPP: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full text-right font-mono bg-white px-1 py-0.5 border border-slate-300 rounded text-[11px]"
                            />
                          </div>
                          <div>
                            <div className="text-slate-500">Taksi Jkt:</div>
                            <input
                              type="number"
                              min={0}
                              step={10000}
                              value={p.biayaTaksiAsal}
                              onChange={(e) =>
                                updateRowById(p.id, {
                                  biayaTaksiAsal: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full text-right font-mono bg-white px-1 py-0.5 border border-slate-300 rounded text-[11px]"
                            />
                          </div>
                          <div>
                            <div className="text-slate-500">Taksi Tjn:</div>
                            <input
                              type="number"
                              min={0}
                              step={10000}
                              value={p.biayaTaksiProvinsi}
                              onChange={(e) =>
                                updateRowById(p.id, {
                                  biayaTaksiProvinsi:
                                    Number(e.target.value) || 0,
                                })
                              }
                              className="w-full text-right font-mono bg-white px-1 py-0.5 border border-slate-300 rounded text-[11px]"
                            />
                          </div>
                          <div>
                            <div className="text-slate-500">Darat/Laut:</div>
                            <input
                              type="number"
                              min={0}
                              step={50000}
                              value={p.biayaTransporDarat}
                              onChange={(e) =>
                                updateRowById(p.id, {
                                  biayaTransporDarat:
                                    Number(e.target.value) || 0,
                                })
                              }
                              className="w-full text-right font-mono bg-white px-1 py-0.5 border border-slate-300 rounded text-[11px]"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Penginapan & Slot Pengali 30% */}
                      <td className="py-1.5 px-2 border-r border-slate-200 bg-amber-50/50 space-y-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            title="Jumlah Malam Hotel"
                            value={p.jumlahMalam}
                            onChange={(e) =>
                              updateRowById(p.id, {
                                jumlahMalam: Number(e.target.value) || 0,
                              })
                            }
                            className="w-11 text-center font-mono font-bold bg-white py-0.5 border border-slate-300 rounded text-[11px]"
                          />
                          <span className="text-slate-400 font-mono">×</span>
                          <div className="flex items-center bg-white border border-slate-300 text-slate-900 rounded px-1 py-0.5">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              aria-label={`Slot Persen Penginapan Baris ${idx + 1}`}
                              value={calc.persenPenginapanEfektif}
                              onChange={(e) => {
                                const val = Math.min(
                                  100,
                                  Math.max(1, Number(e.target.value) || 30)
                                );
                                updateRowById(p.id, {
                                  persenPenginapan: val,
                                  gunakanTarif30Persen: val !== 100,
                                });
                              }}
                              className="w-7 text-center font-mono font-bold text-[11px] bg-transparent text-slate-900 focus:outline-none"
                            />
                            <span className="text-[10px] font-mono font-bold">
                              %
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono">×</span>
                          <input
                            type="number"
                            min={0}
                            step={50000}
                            value={p.tarifHotelPerMalam}
                            onChange={(e) =>
                              updateRowById(p.id, {
                                tarifHotelPerMalam: Number(e.target.value) || 0,
                              })
                            }
                            className="w-24 text-right font-mono bg-white px-1 py-0.5 border border-slate-300 rounded text-[11px]"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateRowById(p.id, {
                                  gunakanTarif30Persen: true,
                                  persenPenginapan: 30,
                                })
                              }
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                calc.persenPenginapanEfektif === 30
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-white border border-slate-300 text-slate-700'
                              }`}
                            >
                              30%
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateRowById(p.id, {
                                  gunakanTarif30Persen: false,
                                  persenPenginapan: 100,
                                })
                              }
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                calc.persenPenginapanEfektif === 100
                                  ? 'bg-blue-700 text-white'
                                  : 'bg-white border border-slate-300 text-slate-700'
                              }`}
                            >
                              100%
                            </button>
                          </div>
                          <span className="font-semibold text-amber-950">
                            {formatRupiah(calc.totalPenginapan)}
                          </span>
                        </div>
                      </td>

                      {/* Total Rincian & DPR */}
                      <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          {formatRupiah(calc.jumlahBruto)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {p.jumlahHari} hr · {p.jumlahMalam} mlm
                        </div>
                      </td>

                      {/* Aksi Cepat 3 Dokumen */}
                      <td
                        className="py-1.5 px-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenPreviewForParticipant(p.id, 'rincian')
                            }
                            className="px-1.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                          >
                            Rincian
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenPreviewForParticipant(p.id, 'riil')
                            }
                            className="px-1.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100"
                          >
                            DPR
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenPreviewForParticipant(p.id, 'sptjm')
                            }
                            className="px-1.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded hover:bg-amber-100"
                          >
                            SPTJM
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteParticipant(p.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Hapus dari tim"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'single' && activeParticipant && activeCalc ? (
          /* MODE 2: FORM DETAIL 1 ORANG */
          <div
            data-testid="efficient-single-input"
            className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start pt-1"
          >
            <div className="xl:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Edit Detail Anggota Tim:
                  </span>
                  <select
                    aria-label="Ganti Anggota Tim Aktif"
                    value={activeParticipant.id}
                    onChange={(e) => onSelectParticipant(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold bg-white border border-blue-300 rounded-lg"
                  >
                    {participants.map((p, i) => (
                      <option key={p.id} value={p.id}>
                        #{i + 1} — {p.nama || 'Pegawai Baru'}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  aria-label="Terapkan SBM Provinsi ke Pegawai Ini"
                  value=""
                  onChange={(e) => {
                    const prov = e.target.value as SbmProvinceCode;
                    if (prov) handleApplySbmToRow(activeParticipant.id, prov);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg"
                >
                  <option value="">+ Isi Tarif SBM Provinsi...</option>
                  {SBM_PROVINCE_LIST.map((code) => (
                    <option key={code} value={code}>
                      Terapkan SBM {code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-5">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Pegawai
                  </label>
                  <input
                    type="text"
                    value={activeParticipant.nama}
                    onChange={(e) =>
                      updateActiveParticipant({ nama: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP
                  </label>
                  <input
                    type="text"
                    value={activeParticipant.nip}
                    onChange={(e) =>
                      updateActiveParticipant({ nip: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={activeParticipant.jabatan}
                    onChange={(e) =>
                      updateActiveParticipant({ jabatan: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor SPD
                  </label>
                  <input
                    type="text"
                    value={activeParticipant.nomorSpd}
                    onChange={(e) =>
                      updateActiveParticipant({ nomorSpd: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal SPD
                  </label>
                  <input
                    type="date"
                    value={activeParticipant.tanggalSpd || ''}
                    onChange={(e) =>
                      updateActiveParticipant({ tanggalSpd: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-semibold text-amber-900 mb-1">
                    Tanggal PTJ (+14 Hari)
                  </label>
                  <input
                    type="date"
                    value={activeParticipant.tanggalPertanggungjawaban || ''}
                    onChange={(e) =>
                      updateActiveParticipant({
                        tanggalPertanggungjawaban: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-lg font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hari DL
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={activeParticipant.jumlahHari}
                    onChange={(e) =>
                      handleChangeRowHariDl(
                        activeParticipant.id,
                        Number(e.target.value) || 0
                      )
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-center"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Uang Harian / Hari
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={activeParticipant.tarifUangHarian}
                    onChange={(e) =>
                      updateActiveParticipant({
                        tarifUangHarian: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Uang Representatif / Hari
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={25000}
                    value={activeParticipant.uangRepresentasiPerHari}
                    onChange={(e) =>
                      updateActiveParticipant({
                        uangRepresentasiPerHari: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transpor Darat / Laut
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={activeParticipant.biayaTransporDarat}
                    onChange={(e) =>
                      updateActiveParticipant({
                        biayaTransporDarat: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tiket Pesawat (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={activeParticipant.biayaTiketPP}
                    onChange={(e) =>
                      updateActiveParticipant({
                        biayaTiketPP: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Taksi Jakarta (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={activeParticipant.biayaTaksiAsal}
                    onChange={(e) =>
                      updateActiveParticipant({
                        biayaTaksiAsal: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Taksi Tujuan (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={activeParticipant.biayaTaksiProvinsi}
                    onChange={(e) =>
                      updateActiveParticipant({
                        biayaTaksiProvinsi: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Slot Penginapan 30% */}
              <div
                data-testid="hotel-30percent-slot-box"
                className="bg-amber-50 border border-amber-300 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs"
              >
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-amber-950 mb-1">
                    Malam Hotel
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={activeParticipant.jumlahMalam}
                    onChange={(e) =>
                      updateActiveParticipant({
                        jumlahMalam: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-center"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-800 mb-1">
                    Slot Pengali (%)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={activeCalc.persenPenginapanEfektif}
                      onChange={(e) => {
                        const val = Math.min(
                          100,
                          Math.max(1, Number(e.target.value) || 30)
                        );
                        updateActiveParticipant({
                          persenPenginapan: val,
                          gunakanTarif30Persen: val !== 100,
                        });
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 text-slate-900 font-mono font-bold rounded-lg text-center"
                    />
                    <button
                      type="button"
                      data-testid="btn-slot-30persen"
                      onClick={() =>
                        updateActiveParticipant({
                          gunakanTarif30Persen: true,
                          persenPenginapan: 30,
                        })
                      }
                      className="px-2 py-1.5 text-[11px] font-bold bg-white border border-amber-300 rounded-lg"
                    >
                      30%
                    </button>
                    <button
                      type="button"
                      data-testid="btn-slot-100persen"
                      onClick={() =>
                        updateActiveParticipant({
                          gunakanTarif30Persen: false,
                          persenPenginapan: 100,
                        })
                      }
                      className="px-2 py-1.5 text-[11px] font-bold bg-white border border-amber-300 rounded-lg"
                    >
                      100%
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-amber-950 mb-1">
                    Tarif Hotel SBM (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={activeParticipant.tarifHotelPerMalam}
                    onChange={(e) =>
                      updateActiveParticipant({
                        tarifHotelPerMalam: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-3 text-right font-mono">
                  <div className="text-[10px] text-slate-600">
                    {formatRupiah(activeCalc.tarifHotelEfektifPerMalam)} / mlm
                  </div>
                  <div className="text-sm font-bold text-amber-950">
                    {formatRupiah(activeCalc.totalPenginapan)}
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 bg-slate-900 text-white rounded-xl p-4 space-y-3">
              <div className="text-xs text-slate-300">
                Total Diterima ({activeParticipant.nama || 'Pegawai'}):
              </div>
              <div className="text-2xl font-bold font-mono">
                {formatRupiah(activeCalc.jumlahBruto)}
              </div>
              <div className="text-xs text-blue-200 italic">
                &ldquo;{activeCalc.terbilangBruto}&rdquo;
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenPreviewForParticipant(activeParticipant.id, 'rincian')
                  }
                  className="py-2 px-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 rounded-lg"
                >
                  1. Rincian
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenPreviewForParticipant(activeParticipant.id, 'riil')
                  }
                  className="py-2 px-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 rounded-lg"
                >
                  2. DPR Riil
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenPreviewForParticipant(activeParticipant.id, 'sptjm')
                  }
                  className="py-2 px-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 rounded-lg"
                >
                  3. SPTJM
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MODE 3: TABEL LENGKAP 25 KOLOM (DATABASE) */
          <div data-testid="database-25col-table" className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter NIP / Nama / No SPD..."
                className="px-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRunNormalizeMacro}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  <Wand2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Auto-Nomor SPD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasteModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-blue-700" />
                  <span>Paste Excel</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-400 rounded">
              <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-200/90 text-slate-900 font-bold text-center border-b border-slate-400">
                    <th className="border-r border-slate-400 py-1.5 px-2">1. No</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">2. NIP</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">3. Nama</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">4. Jabatan</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">5. No SPD</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">6. Tgl SPD</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">7. Hari DL</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">8. Terbilang</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">9. Uang Harian</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">10. Total UH</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">11. Pesawat</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">12. Taksi Jkt</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">13. Taksi Prov</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">14. Darat</th>
                    <th className="border-r border-slate-400 py-1.5 px-2 bg-amber-100">15. Malam</th>
                    <th className="border-r border-slate-400 py-1.5 px-2 bg-amber-100">16. Hotel × Slot %</th>
                    <th className="border-r border-slate-400 py-1.5 px-2 bg-amber-100">17. Total Hotel</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">18. Representatif</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">19. Total Biaya</th>
                    <th className="border-r border-slate-400 py-1.5 px-2 bg-amber-200">20. Tgl PTJ</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">21. Diterima</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">22. ST</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">23. Tgl ST</th>
                    <th className="border-r border-slate-400 py-1.5 px-2">24. Cetak</th>
                    <th className="py-1.5 px-2">25. Transpor Darat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-mono">
                  {filteredParticipants.map((p, idx) => {
                    const calc = calculateParticipantTotals(p);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => onSelectParticipant(p.id)}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="border-r border-slate-300 py-1 px-2 text-center">
                          {idx + 1}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2">
                          {p.nip}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 font-sans font-semibold">
                          {p.nama}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 font-sans">
                          {p.jabatan}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2">
                          {p.nomorSpd}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2">
                          {p.tanggalSpd}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-center">
                          {p.jumlahHari}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-center font-sans">
                          ({terbilangHariKecil(p.jumlahHari)})
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right">
                          {formatAccountingCell(p.tarifUangHarian)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right">
                          {formatAccountingCell(calc.totalUangHarian)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right">
                          {formatAccountingCell(calc.biayaTiketPP)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right">
                          {formatAccountingCell(calc.biayaTaksiAsal)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right">
                          {formatAccountingCell(calc.biayaTaksiProvinsi)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right">
                          {formatAccountingCell(calc.biayaDaratSpd)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-center bg-amber-50">
                          {p.jumlahMalam}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right bg-amber-50">
                          {calc.persenPenginapanEfektif}% ×{' '}
                          {formatAccountingCell(p.tarifHotelPerMalam)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right bg-amber-50">
                          {formatAccountingCell(calc.totalPenginapan)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right">
                          {formatAccountingCell(calc.totalRepresentasi)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right font-bold">
                          {formatAccountingCell(calc.totalBiayaDatabase)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-center bg-amber-100">
                          {p.tanggalPertanggungjawaban}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-right">
                          {formatAccountingCell(calc.uangYangDiterima)}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2">
                          {p.nomorSuratTugas}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2">
                          {p.tanggalSuratTugas}
                        </td>
                        <td className="border-r border-slate-300 py-1 px-2 text-center font-sans">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPreviewForParticipant(p.id, 'rincian');
                            }}
                            className="text-blue-700 hover:underline font-bold"
                          >
                            Buka Dokumen
                          </button>
                        </td>
                        <td className="py-1 px-2 text-right">
                          {formatAccountingCell(calc.biayaTransporDarat)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          PRATINJAU LANGSUNG 3 DOKUMEN DI BAWAH TABEL (TANPA PERLU PINDAH TAB)
         ===================================================================== */}
      {participants.length > 0 && showInlinePreview && activeParticipant && (
        <section
          data-testid="inline-live-doc-preview"
          className="space-y-3 pt-1"
        >
          <div className="bg-slate-900 text-white rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 no-print">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-300">
                Pratinjau Langsung:
              </span>
              <select
                aria-label="Pilih Pegawai untuk Pratinjau Langsung"
                value={activeParticipant.id}
                onChange={(e) => onSelectParticipant(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-white border border-slate-700 rounded-lg"
              >
                {participants.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    #{idx + 1} — {p.nama || 'Pegawai Baru'} (
                    {formatRupiah(calculateParticipantTotals(p).jumlahBruto)})
                  </option>
                ))}
              </select>

              <div className="inline-flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setInlineDocTab('rincian')}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    inlineDocTab === 'rincian'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  1. Rincian Biaya &amp; SPPD Rampung
                </button>
                <button
                  type="button"
                  onClick={() => setInlineDocTab('riil')}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    inlineDocTab === 'riil'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  2. Daftar Pengeluaran Riil
                </button>
                <button
                  type="button"
                  onClick={() => setInlineDocTab('sptjm')}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    inlineDocTab === 'sptjm'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  3. SPTJM
                </button>
                <button
                  type="button"
                  onClick={() => setInlineDocTab('all3')}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    inlineDocTab === 'all3'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Semua 3 Dokumen
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-lg"
              >
                <Printer className="w-3.5 h-3.5 text-blue-700" />
                <span>Cetak / PDF A4 Sekarang</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {(inlineDocTab === 'rincian' || inlineDocTab === 'all3') && (
              <RincianBiayaSheet state={state} p={activeParticipant} />
            )}
            {(inlineDocTab === 'riil' || inlineDocTab === 'all3') && (
              <DaftarPengeluaranRiilSheet state={state} p={activeParticipant} />
            )}
            {(inlineDocTab === 'sptjm' || inlineDocTab === 'all3') && (
              <SptjmSheet state={state} p={activeParticipant} />
            )}
          </div>
        </section>
      )}

      {/* MODAL PASTE EXCEL */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-300 rounded-xl max-w-2xl w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Paste Baris Pegawai dari Excel / TSV
              </h3>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Nama [TAB] NIP [TAB] Golongan [TAB] Jabatan [TAB] Hari [TAB] Uang Harian [TAB] Tiket PP [TAB] Transpor Darat"
              className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPasteImport}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
              >
                Tambahkan ke Tim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
