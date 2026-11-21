import React from 'react';
import { PTJWorkbookState } from '../utils/ptjEngine';
import {
  RincianBiayaSheet,
  DaftarPengeluaranRiilSheet,
  SptjmSheet,
} from './PersonDocSheets';
import { Printer, Layers, CheckSquare } from 'lucide-react';

export type DocTemplateType =
  | 'rincian'
  | 'riil'
  | 'sptjm'
  | 'bundle_all'
  | 'bundle_team'
  | 'rencana'
  | 'kuitansi'
  | 'nominatif';

interface DocumentPreviewGeneratorProps {
  state: PTJWorkbookState;
  activeDocType: DocTemplateType;
  selectedParticipantId: string;
  onChangeDocType: (doc: DocTemplateType) => void;
  onSelectParticipant: (id: string) => void;
  onToggleKopOnRincianDpr?: (show: boolean) => void;
  onPrint: () => void;
}

const DOC_TABS: { id: DocTemplateType; label: string }[] = [
  { id: 'rincian', label: '1. RINCIAN BIAYA PERJALANAN DINAS & Perhitungan SPPD Rampung' },
  { id: 'riil', label: '2. DAFTAR PENGELUARAN RIIL' },
  { id: 'sptjm', label: '3. SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)' },
  { id: 'bundle_all', label: '4. Gabungan 3 Dokumen (1 Orang)' },
  { id: 'bundle_team', label: '5. Cetak Seluruh Tim Sekaligus (Semua Anggota)' },
];

export const DocumentPreviewGenerator: React.FC<DocumentPreviewGeneratorProps> = ({
  state,
  activeDocType,
  selectedParticipantId,
  onChangeDocType,
  onSelectParticipant,
  onToggleKopOnRincianDpr,
  onPrint,
}) => {
  const { kopSurat, participants } = state;

  const activeParticipant =
    participants.find((p) => p.id === selectedParticipantId) ||
    participants[0];

  const effectiveDocType: DocTemplateType =
    activeDocType === 'rincian' ||
    activeDocType === 'riil' ||
    activeDocType === 'sptjm' ||
    activeDocType === 'bundle_all' ||
    activeDocType === 'bundle_team'
      ? activeDocType
      : 'rincian';

  return (
    <div className="space-y-6">
      {/* Control Toolbar (Hidden on Print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-700 shrink-0" />
              <span>
                Cetak Dokumen PTJ: Rincian Biaya & SPPD Rampung, Daftar Pengeluaran Riil, dan SPTJM
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Seluruh dokumen otomatis mengambil data dari baris pelaksana pada tabel <strong>DATABASE</strong> (termasuk Tanggal SPD, Hari DL, Transportasi Darat, dan Tanggal Pertanggungjawaban).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onToggleKopOnRincianDpr && (
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={kopSurat.tampilkanKopDiRincianDpr}
                  onChange={(e) => onToggleKopOnRincianDpr(e.target.checked)}
                  className="rounded border-slate-300 text-blue-700"
                />
                <CheckSquare className="w-3.5 h-3.5 text-blue-700 hidden" />
                <span>Tampilkan Kop Kemenkum di Rincian & DPR</span>
              </label>
            )}

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF A4</span>
            </button>
          </div>
        </div>

        {/* Document Type Switcher */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
          {DOC_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeDocType(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                effectiveDocType === tab.id
                  ? 'bg-white text-blue-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Participant Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="select-person-preview"
              className="text-xs font-semibold text-slate-700"
            >
              Pilih Pegawai dari Database ({participants.length} Orang):
            </label>
            <select
              id="select-person-preview"
              value={activeParticipant?.id || ''}
              onChange={(e) => onSelectParticipant(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {participants.map((p, idx) => (
                <option key={p.id} value={p.id}>
                  {idx + 1}. {p.nama} — NIP {p.nip || '-'} (SPD: {p.nomorSpd || '0'} · {p.jumlahHari} Hari)
                </option>
              ))}
            </select>
          </div>

          {activeParticipant && (
            <div className="text-xs text-slate-600 font-mono">
              Baris #{activeParticipant.noUrut} · SPD: <strong>{activeParticipant.nomorSpd}</strong> · Tgl PTJ:{' '}
              <strong>{activeParticipant.tanggalPertanggungjawaban || state.master.tanggalKuitansi}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Rendered A4 Paper Sheets */}
      {participants.length === 0 ? (
        <div
          data-testid="empty-preview-state"
          className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-2 no-print"
        >
          <div className="text-sm font-bold text-slate-800">
            Belum Ada Pegawai di Tabel Input (Saat Ini: 0 Orang)
          </div>
          <p className="text-xs text-slate-600 max-w-lg mx-auto">
            Silakan kembali ke tab <strong>1. Database Input</strong>, lalu cari dan pilih pegawai satu per satu dari kotak pencarian untuk mulai mencetak Rincian Biaya, Daftar Pengeluaran Riil, dan SPTJM.
          </p>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {effectiveDocType === 'rincian' && activeParticipant && (
            <RincianBiayaSheet state={state} p={activeParticipant} />
          )}
          {effectiveDocType === 'riil' && activeParticipant && (
            <DaftarPengeluaranRiilSheet state={state} p={activeParticipant} />
          )}
          {effectiveDocType === 'sptjm' && activeParticipant && (
            <SptjmSheet state={state} p={activeParticipant} />
          )}

          {effectiveDocType === 'bundle_all' && activeParticipant && (
            <div className="space-y-8 print:space-y-0">
              <RincianBiayaSheet state={state} p={activeParticipant} />
              <DaftarPengeluaranRiilSheet state={state} p={activeParticipant} />
              <SptjmSheet state={state} p={activeParticipant} />
            </div>
          )}

          {effectiveDocType === 'bundle_team' && (
            <div className="space-y-10 print:space-y-0">
              {participants.map((member) => (
                <div key={member.id} className="space-y-8 print:space-y-0">
                  <RincianBiayaSheet state={state} p={member} />
                  <DaftarPengeluaranRiilSheet state={state} p={member} />
                  <SptjmSheet state={state} p={member} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

