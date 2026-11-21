import React, { useState } from 'react';
import {
  PTJWorkbookState,
  calculateWorkbookSummary,
  generate57SheetManifest,
  formatRupiah,
  VirtualSheetInfo,
} from '../utils/ptjEngine';
import { DocTemplateType } from './DocumentPreviewGenerator';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface RecapAndSheetManifestProps {
  state: PTJWorkbookState;
  onExportExcel: () => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
  onResetDummyData: () => void;
  onOpenSheetFromManifest: (sheet: VirtualSheetInfo) => void;
  onBatchPrintAll: (docType: DocTemplateType) => void;
}

export const RecapAndSheetManifest: React.FC<RecapAndSheetManifestProps> = ({
  state,
  onExportExcel,
  onExportJson,
  onImportJsonFile,
  onResetDummyData,
  onOpenSheetFromManifest,
  onBatchPrintAll,
}) => {
  const summary = calculateWorkbookSummary(state);
  const manifest = generate57SheetManifest(state);

  const [sheetQuery, setSheetQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [hideEmptySlots, setHideEmptySlots] = useState<boolean>(false);

  const filteredSheets = manifest.filter((s) => {
    if (hideEmptySlots && s.status === 'EMPTY_SLOT') return false;
    if (categoryFilter !== 'ALL' && s.sheetCategory !== categoryFilter) return false;
    if (!sheetQuery.trim()) return true;
    const q = sheetQuery.toLowerCase();
    return (
      s.sheetCode.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      (s.participantName || '').toLowerCase().includes(q)
    );
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJsonFile(file);
      e.target.value = '';
    }
  };

  const componentBreakdown = [
    {
      label: 'Uang Harian & Representasi',
      amount: summary.totalUangHarian + summary.totalRepresentasi,
      color: 'bg-blue-700',
    },
    {
      label: 'Transportasi (Tiket PP & Taksi)',
      amount: summary.totalTransportasi,
      color: 'bg-sky-600',
    },
    {
      label: 'Penginapan / Hotel',
      amount: summary.totalPenginapan,
      color: 'bg-indigo-600',
    },
    {
      label: 'Pengeluaran Riil (DPR)',
      amount: summary.totalPengeluaranRiil,
      color: 'bg-slate-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Section 1: Export, Backup & Restore Hub */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-700 shrink-0" />
              <span>Rekapitulasi Konsolidasi, Export Excel (.xlsx) & Manajemen Backup</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Unduh rekapitulasi nominatif dan rincian biaya ke format Microsoft Excel (.xlsx) atau simpan cadangan data (.json).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Rekap ke Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Simpan Template / Backup (.json)</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors whitespace-nowrap">
              <Upload className="w-3.5 h-3.5 text-blue-700" />
              <span>Muat Data (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Muat Data JSON"
              />
            </label>

            <button
              type="button"
              onClick={onResetDummyData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Muat Contoh Data (Dummy PTJ)</span>
            </button>
          </div>
        </div>

        {/* Financial Distribution & Pagu Absorption */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Realisasi terhadap Pagu MAK ({state.master.kodeMak})
              </span>
              <span className="font-mono font-bold text-blue-700 tabular-nums">
                {summary.persentaseSerapan.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-700 transition-all"
                style={{ width: `${Math.min(100, summary.persentaseSerapan)}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono tabular-nums">
              <div>
                <div className="text-slate-500 font-sans text-[11px]">Pagu MAK Tersedia</div>
                <div className="font-semibold text-slate-900">
                  {formatRupiah(state.master.paguAnggaranMak)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 font-sans text-[11px]">Sisa Pagu Setelah PTJ</div>
                <div
                  className={`font-semibold ${
                    summary.sisaPagu >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {formatRupiah(summary.sisaPagu)}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-2.5">
            <div className="text-xs font-semibold text-slate-700">
              Proporsi Komponen Belanja Perjalanan Dinas (Total Bruto: {formatRupiah(summary.grandTotalBruto)})
            </div>
            {componentBreakdown.map((item) => {
              const pct =
                summary.grandTotalBruto > 0
                  ? (item.amount / summary.grandTotalBruto) * 100
                  : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700">{item.label}</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatRupiah(item.amount)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2: 57-Worksheet Automation Manifest */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Peta Otomasi 57 Lembar Kerja (Pengganti 57 Sheet pada 1. TEMPLATE PTJ.xlsm)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Seluruh 57 tab worksheet pada file Excel asli kini dikonsolidasikan secara dinamis. Klik &ldquo;Buka Lembar&rdquo; untuk melihat pratinjau cetaknya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={sheetQuery}
                onChange={(e) => setSheetQuery(e.target.value)}
                placeholder="Cari kode sheet / nama..."
                aria-label="Cari Lembar Kerja 57 Sheet"
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter Kategori Sheet"
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            >
              <option value="ALL">Semua Kategori (57 Sheet)</option>
              <option value="MASTER & DB">Master & Database (3 Sheet)</option>
              <option value="REKAP & SURAT">Rekap, Nominatif & SPTJM (6 Sheet)</option>
              <option value="KUITANSI">Kuitansi Pembayaran (12 Sheet)</option>
              <option value="RINCIAN BIAYA">Rincian Biaya SPD (12 Sheet)</option>
              <option value="PENGELUARAN RIIL">Daftar Pengeluaran Riil (12 Sheet)</option>
              <option value="SPD & VISUM">Lembar SPD & Visum (12 Sheet)</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none px-2 py-1">
              <input
                type="checkbox"
                checked={hideEmptySlots}
                onChange={(e) => setHideEmptySlots(e.target.checked)}
                className="rounded border-slate-300 text-blue-700"
              />
              <span>Sembunyikan Slot Kosong</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-700 z-10">
              <tr>
                <th className="py-2.5 px-3 w-16">Sheet #</th>
                <th className="py-2.5 px-3 w-40">Kode Tab Excel</th>
                <th className="py-2.5 px-3 w-36">Kategori</th>
                <th className="py-2.5 px-3">Judul Dokumen / Pelaksana</th>
                <th className="py-2.5 px-3 text-right">Nilai (Rp)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Navigasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredSheets.map((s) => (
                <tr key={s.sheetCode} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono tabular-nums text-slate-500">
                    #{String(s.sheetNumber).padStart(2, '0')}
                  </td>
                  <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                    {s.sheetCode}
                  </td>
                  <td className="py-2 px-3 text-slate-600">{s.sheetCategory}</td>
                  <td className="py-2 px-3 text-slate-800">{s.title}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {s.totalAmount > 0 ? formatRupiah(s.totalAmount) : '-'}
                  </td>
                  <td className="py-2 px-3">
                    {s.status === 'READY' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Siap Cetak</span>
                      </span>
                    ) : s.status === 'NEEDS_FIX' ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Perlu Dilengkapi</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Slot Cadangan</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    {s.status !== 'EMPTY_SLOT' && (
                      <button
                        type="button"
                        onClick={() => onOpenSheetFromManifest(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded transition-colors"
                      >
                        <span>Buka Lembar</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            Menampilkan <strong>{filteredSheets.length}</strong> dari total <strong>57 lembar kerja</strong> pada arsitektur <span className="font-mono">1. TEMPLATE PTJ.xlsm</span>.
          </div>
          <button
            type="button"
            onClick={() => onBatchPrintAll('bundle_all')}
            className="text-blue-700 font-semibold hover:underline"
          >
            Buka Bundel Cetak Seluruh Lampiran Aktif &rarr;
          </button>
        </div>
      </section>
    </div>
  );
};
