import React, { useState, useEffect } from 'react';
import {
  PTJWorkbookState,
  createDummyPTJState,
  createInitialTeamPTJState,
  calculateWorkbookSummary,
  validatePTJWorkbook,
  runMacroNormalizeNumbering,
  formatRupiah,
  ValidationIssue,
  VirtualSheetInfo,
} from './utils/ptjEngine';
import { exportPTJToExcel, exportPTJBackupJson } from './utils/exportPtj';
import { MasterKegiatanForm } from './components/MasterKegiatanForm';
import { ParticipantManager } from './components/ParticipantManager';
import {
  DocumentPreviewGenerator,
  DocTemplateType,
} from './components/DocumentPreviewGenerator';
import { RecapAndSheetManifest } from './components/RecapAndSheetManifest';
import {
  Printer,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

type ActiveModuleTab = 'participants' | 'preview' | 'master' | 'recap';

const STORAGE_KEY = 'siptj_pro_workbook_v6';

export default function App() {
  const [state, setState] = useState<PTJWorkbookState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.master && Array.isArray(parsed.participants)) {
          if (parsed.kopSurat?.teleponEmail) {
            parsed.kopSurat.teleponEmail = parsed.kopSurat.teleponEmail.replace(
              'Faksimile021-5252975',
              'Faksimile: 021-5252975'
            );
          }
          return parsed;
        }
      }
    } catch {
      // ignore corrupted storage
    }
    return createInitialTeamPTJState([]);
  });

  const [activeTab, setActiveTab] = useState<ActiveModuleTab>('participants');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(
    () => state.participants[0]?.id || ''
  );
  const [activeDocType, setActiveDocType] = useState<DocTemplateType>('rincian');
  const [validationBanner, setValidationBanner] = useState<{
    visible: boolean;
    issues: ValidationIssue[];
    message: string;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  const summary = calculateWorkbookSummary(state);

  const handleBatchPrint = () => {
    window.print();
  };

  const handleImportJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result === 'string') {
          const parsed = JSON.parse(reader.result) as PTJWorkbookState;
          if (parsed && parsed.master && Array.isArray(parsed.participants)) {
            setState({
              ...parsed,
              lastSavedAt: new Date().toISOString(),
            });
            if (parsed.participants[0]) {
              setSelectedParticipantId(parsed.participants[0].id);
            }
            setValidationBanner({
              visible: true,
              issues: [],
              message: `Berhasil memuat file backup Database PTJ (${parsed.participants.length} pegawai).`,
            });
          }
        }
      } catch {
        setValidationBanner({
          visible: true,
          issues: [
            {
              id: 'json-err',
              severity: 'error',
              module: 'MASTER',
              field: 'File Backup JSON',
              message: 'Format file .json tidak valid atau rusak.',
            },
          ],
          message: 'Gagal memuat file JSON.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDummyPTJ = () => {
    const fresh = createDummyPTJState();
    setState(fresh);
    setSelectedParticipantId(
      fresh.participants.find((p) => p.nama.includes('Falentina'))?.id ||
        fresh.participants[0]?.id ||
        ''
    );
    setValidationBanner({
      visible: true,
      issues: [],
      message:
        'Database Awal (27 Pegawai Inspektorat Wilayah IV — Kemenkum RI) berhasil dimuat.',
    });
  };

  const handleOpenSheetFromManifest = (sheet: VirtualSheetInfo) => {
    if (sheet.sheetCategory === 'MASTER & DB') {
      if (sheet.sheetCode === '02_DB_PELAKSANA') {
        setActiveTab('participants');
      } else {
        setActiveTab('master');
      }
      return;
    }
    if (sheet.participantId) {
      setSelectedParticipantId(sheet.participantId);
    }
    if (
      sheet.docType === 'rincian' ||
      sheet.docType === 'riil' ||
      sheet.docType === 'sptjm'
    ) {
      setActiveDocType(sheet.docType);
    } else {
      setActiveDocType('rincian');
    }
    setActiveTab('preview');
  };

  const navItems: {
    id: ActiveModuleTab;
    shortLabel: string;
  }[] = [
    {
      id: 'participants',
      shortLabel: '1. Input Tim & SBM',
    },
    {
      id: 'preview',
      shortLabel: '2. Cetak Rincian / DPR / SPTJM',
    },
    {
      id: 'master',
      shortLabel: '3. Kop & Pejabat',
    },
    {
      id: 'recap',
      shortLabel: '4. Export & Backup',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar: 3 clean zones */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-6 no-print">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('participants');
          }}
          className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          SiPTJ Inspektorat Jenderal
        </a>

        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-300"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === item.id
                  ? 'text-white border-blue-400 font-semibold'
                  : 'border-transparent hover:text-white'
              }`}
            >
              {item.shortLabel}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportPTJToExcel(state)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-100 bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={handleBatchPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF A4</span>
          </button>
        </div>
      </header>

      {/* Full-Width Main Workspace */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1680px] w-full mx-auto space-y-3">
        {/* Official Header Instansi Sesuai Gambar image_1e1f04df.png (KEMENTERIAN HUKUM REPUBLIK INDONESIA - INSPEKTORAT JENDERAL) */}
        <div
          data-testid="official-kemenkum-header"
          className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs no-print"
        >
          <div className="border-t-[3px] border-blue-700 text-center text-black text-xs">
            <div className="py-0.5 px-4 border-b border-slate-300 bg-white font-normal tracking-wide uppercase">
              {state.kopSurat.kementerian ||
                'KEMENTERIAN HUKUM REPUBLIK INDONESIA'}
            </div>
            <div className="py-0.5 px-4 border-b-2 border-emerald-800 bg-white font-bold tracking-wide uppercase">
              {state.kopSurat.eselon1 || 'INSPEKTORAT JENDERAL'}
            </div>
            <div className="py-0.5 px-4 border-b border-slate-400/60 bg-[#d9d9d9] text-black">
              {state.kopSurat.alamat ||
                'Jalan H.R. Rasuna Said Kav. 6-7, Kuningan Jakarta Selatan'}
            </div>
            <div className="py-0.5 px-4 border-b border-slate-400/60 bg-[#d9d9d9] text-black">
              {(
                state.kopSurat.teleponEmail ||
                'Telepon: 021-5252975; Faksimile: 021-5252975'
              ).replace('Faksimile021-5252975', 'Faksimile: 021-5252975')}
            </div>
            <div className="py-0.5 px-4 border-b-2 border-emerald-800 bg-white text-black">
              {state.kopSurat.website ||
                'Laman: http://www.itjen.kemenkum.go.id, Pos-ell: itjen@kemenkum.go.id'}
            </div>
          </div>

          {/* Fast Tab Strip: Input Tim + 3 Dokumen + Backup */}
          <div className="px-3.5 py-2 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('participants')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  activeTab === 'participants'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                INPUT TIM &amp; SBM ({summary.totalParticipants} Orang)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDocType('rincian');
                  setActiveTab('preview');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  activeTab === 'preview' && activeDocType === 'rincian'
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                }`}
              >
                1. RINCIAN BIAYA &amp; SPPD RAMPUNG
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDocType('riil');
                  setActiveTab('preview');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  activeTab === 'preview' && activeDocType === 'riil'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                2. DAFTAR PENGELUARAN RIIL
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDocType('sptjm');
                  setActiveTab('preview');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  activeTab === 'preview' && activeDocType === 'sptjm'
                    ? 'bg-amber-700 text-white border-amber-700'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                3. SPTJM
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-slate-600">
                Total SPPD + DPR:{' '}
                <strong className="text-blue-800">
                  {formatRupiah(summary.grandTotalBersih)}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => exportPTJBackupJson(state)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Simpan .json</span>
              </button>
              <label className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Muat .json</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportJsonFile(f);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Validation Banner */}
        {validationBanner?.visible && (
          <div
            className={`border rounded-xl p-3 no-print ${
              validationBanner.issues.length === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                {validationBanner.issues.length === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs">
                  <div className="font-bold">{validationBanner.message}</div>
                  {validationBanner.issues.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-amber-900 pt-1">
                      {validationBanner.issues.map((issue) => (
                        <li key={issue.id}>
                          <strong>{issue.field}:</strong> {issue.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidationBanner(null)}
                aria-label="Tutup Notifikasi Validasi"
                className="p-1 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Active View Content */}
        {activeTab === 'participants' && (
          <ParticipantManager
            state={state}
            selectedParticipantId={selectedParticipantId}
            onSelectParticipant={setSelectedParticipantId}
            onUpdateParticipants={(participants) =>
              setState((prev) => ({
                ...prev,
                lastSavedAt: new Date().toISOString(),
                participants,
              }))
            }
            onUpdateMaster={(updatedMaster) =>
              setState((prev) => ({
                ...prev,
                lastSavedAt: new Date().toISOString(),
                master: updatedMaster,
              }))
            }
            onRunNormalizeMacro={() => {
              const next = runMacroNormalizeNumbering(state);
              setState(next);
              setValidationBanner({
                visible: true,
                issues: [],
                message:
                  'Nomor urut, Nomor SPD, dan Nomor Kuitansi seluruh pelaksana telah dinormalisasi.',
              });
            }}
            onOpenPreviewForParticipant={(participantId, docType) => {
              setSelectedParticipantId(participantId);
              setActiveDocType(docType);
              setActiveTab('preview');
            }}
          />
        )}

        {activeTab === 'preview' && (
          <DocumentPreviewGenerator
            state={state}
            activeDocType={activeDocType}
            selectedParticipantId={selectedParticipantId}
            onChangeDocType={setActiveDocType}
            onSelectParticipant={setSelectedParticipantId}
            onToggleKopOnRincianDpr={(show) =>
              setState((prev) => ({
                ...prev,
                kopSurat: {
                  ...prev.kopSurat,
                  tampilkanKopDiRincianDpr: show,
                },
              }))
            }
            onPrint={() => window.print()}
          />
        )}

        {activeTab === 'master' && (
          <MasterKegiatanForm
            master={state.master}
            kopSurat={state.kopSurat}
            onChangeMaster={(updated) =>
              setState((prev) => ({
                ...prev,
                lastSavedAt: new Date().toISOString(),
                master: updated,
              }))
            }
            onChangeKop={(updated) =>
              setState((prev) => ({
                ...prev,
                lastSavedAt: new Date().toISOString(),
                kopSurat: updated,
              }))
            }
            onGoToParticipants={() => setActiveTab('participants')}
          />
        )}

        {activeTab === 'recap' && (
          <RecapAndSheetManifest
            state={state}
            onExportExcel={() => exportPTJToExcel(state)}
            onExportJson={() => exportPTJBackupJson(state)}
            onImportJsonFile={handleImportJsonFile}
            onResetDummyData={handleLoadDummyPTJ}
            onOpenSheetFromManifest={handleOpenSheetFromManifest}
            onBatchPrintAll={(docType) => {
              setActiveDocType(docType);
              setActiveTab('preview');
            }}
          />
        )}
      </main>
    </div>
  );
}
