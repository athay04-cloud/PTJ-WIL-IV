import React from 'react';
import {
  MasterKegiatan,
  KopSuratConfig,
  formatRupiah,
} from '../utils/ptjEngine';
import { KopSuratView } from './KopSuratView';
import { Building2, FileSpreadsheet, UserCheck, Stamp, Upload, ArrowRight } from 'lucide-react';

interface MasterKegiatanFormProps {
  master: MasterKegiatan;
  kopSurat: KopSuratConfig;
  onChangeMaster: (updated: MasterKegiatan) => void;
  onChangeKop: (updated: KopSuratConfig) => void;
  onGoToParticipants: () => void;
}

const MAK_PRESETS = [
  { code: '524111', label: '524111 — Belanja Perjalanan Dinas Biasa (Luar Kota)' },
  { code: '524113', label: '524113 — Belanja Perjalanan Dinas Dalam Kota' },
  { code: '524114', label: '524114 — Belanja Perjalanan Dinas Paket Meeting Dalam Kota' },
  { code: '524119', label: '524119 — Belanja Perjalanan Dinas Paket Meeting Luar Kota' },
  { code: '521211', label: '521211 — Belanja Bahan Kegiatan Operasional' },
  { code: '522151', label: '522151 — Belanja Jasa Profesi / Honorarium Narasumber' },
];

export const MasterKegiatanForm: React.FC<MasterKegiatanFormProps> = ({
  master,
  kopSurat,
  onChangeMaster,
  onChangeKop,
  onGoToParticipants,
}) => {
  const handleField = <K extends keyof MasterKegiatan>(key: K, val: MasterKegiatan[K]) => {
    onChangeMaster({
      ...master,
      [key]: val,
    });
  };

  const handleDateChange = (key: 'tanggalMulai' | 'tanggalSelesai', val: string) => {
    const next = { ...master, [key]: val };
    if (next.tanggalMulai && next.tanggalSelesai) {
      const start = new Date(next.tanggalMulai);
      const end = new Date(next.tanggalSelesai);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0 && diffDays <= 60) {
        next.lamaHariDefault = diffDays;
      }
    }
    onChangeMaster(next);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeKop({
          ...kopSurat,
          logoPreset: 'custom',
          customLogoDataUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Header Instansi & Anggaran (DIPA & MAK) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-700 shrink-0" />
              <span>01. Identitas Satuan Kerja & Pembebanan Anggaran (DIPA / MAK)</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Menggantikan Sheet <span className="font-mono">01_MASTER_PTJ</span> — Data di bawah ini otomatis terhubung ke seluruh 57 lembar dokumen PTJ/SPJ.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Pagu MAK: <strong className="text-slate-900">{formatRupiah(master.paguAnggaranMak)}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <label htmlFor="namaKementerian" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kementerian / Lembaga
            </label>
            <input
              id="namaKementerian"
              type="text"
              value={master.namaKementerian}
              onChange={(e) => handleField('namaKementerian', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Contoh: Kementerian Keuangan Republik Indonesia"
            />
          </div>

          <div className="md:col-span-4">
            <label htmlFor="namaSatker" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Satuan Kerja (Satker)
            </label>
            <input
              id="namaSatker"
              type="text"
              value={master.namaSatker}
              onChange={(e) => handleField('namaSatker', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Nama Satuan Kerja"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="kodeSatker" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kode Satker (6 Digit)
            </label>
            <input
              id="kodeSatker"
              type="text"
              value={master.kodeSatker}
              onChange={(e) => handleField('kodeSatker', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="527094"
            />
          </div>

          <div className="md:col-span-5">
            <label htmlFor="nomorDipa" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nomor SP DIPA
            </label>
            <input
              id="nomorDipa"
              type="text"
              value={master.nomorDipa}
              onChange={(e) => handleField('nomorDipa', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="SP DIPA-015.08.2.527094/2026"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="tanggalDipa" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tanggal DIPA
            </label>
            <input
              id="tanggalDipa"
              type="date"
              value={master.tanggalDipa}
              onChange={(e) => handleField('tanggalDipa', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="tahunAnggaran" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tahun Anggaran
            </label>
            <input
              id="tahunAnggaran"
              type="text"
              value={master.tahunAnggaran}
              onChange={(e) => handleField('tahunAnggaran', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="2026"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="kodeMak" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kode MAK / Akun
            </label>
            <input
              id="kodeMak"
              type="text"
              value={master.kodeMak}
              onChange={(e) => handleField('kodeMak', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono font-semibold tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="524111"
            />
          </div>

          <div className="md:col-span-4">
            <label htmlFor="makPresetSelect" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Cepat Standar Akun Belanja (MAK)
            </label>
            <select
              id="makPresetSelect"
              value={MAK_PRESETS.some((m) => m.code === master.kodeMak) ? master.kodeMak : ''}
              onChange={(e) => {
                const chosen = MAK_PRESETS.find((m) => m.code === e.target.value);
                if (chosen) {
                  onChangeMaster({
                    ...master,
                    kodeMak: chosen.code,
                    uraianMak: chosen.label.split(' — ')[1] || master.uraianMak,
                  });
                }
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Pilih Referensi Kode MAK --</option>
              {MAK_PRESETS.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5">
            <label htmlFor="uraianMak" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Uraian Akun / Subkomponen Belanja
            </label>
            <input
              id="uraianMak"
              type="text"
              value={master.uraianMak}
              onChange={(e) => handleField('uraianMak', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Belanja Perjalanan Dinas Biasa"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="paguAnggaranMak" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pagu Anggaran MAK (Rp)
            </label>
            <input
              id="paguAnggaranMak"
              type="number"
              min={0}
              step={100000}
              value={master.paguAnggaranMak}
              onChange={(e) => handleField('paguAnggaranMak', Number(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Detail Kegiatan, Surat Tugas (ST), dan SPD */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-700 shrink-0" />
            <span>02. Rincian Kegiatan, Lokasi Tujuan & Dasar Penugasan (ST / SPD)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Uraian kegiatan dan nomor surat di bawah ini akan mengisi otomatis Kuitansi, Rincian Biaya, SPD, Daftar Nominatif, serta SPTJM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-12">
            <label htmlFor="namaKegiatan" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Kegiatan / Maksud Perjalanan Dinas
            </label>
            <textarea
              id="namaKegiatan"
              rows={2}
              value={master.namaKegiatan}
              onChange={(e) => handleField('namaKegiatan', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Tuliskan maksud lengkap pelaksanaan perjalanan dinas..."
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="lokasiAsal" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tempat Berangkat (Asal)
            </label>
            <input
              id="lokasiAsal"
              type="text"
              value={master.lokasiAsal}
              onChange={(e) => handleField('lokasiAsal', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="lokasiTujuan" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tempat Tujuan (Kota/Kab)
            </label>
            <input
              id="lokasiTujuan"
              type="text"
              value={master.lokasiTujuan}
              onChange={(e) => handleField('lokasiTujuan', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="provinsiTujuan" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Provinsi Tujuan
            </label>
            <input
              id="provinsiTujuan"
              type="text"
              value={master.provinsiTujuan}
              onChange={(e) => handleField('provinsiTujuan', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="tanggalMulai" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tgl Berangkat
            </label>
            <input
              id="tanggalMulai"
              type="date"
              value={master.tanggalMulai}
              onChange={(e) => handleDateChange('tanggalMulai', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="tanggalSelesai" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tgl Kembali ({master.lamaHariDefault} Hari)
            </label>
            <input
              id="tanggalSelesai"
              type="date"
              value={master.tanggalSelesai}
              onChange={(e) => handleDateChange('tanggalSelesai', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-4">
            <label htmlFor="nomorSuratTugas" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nomor Surat Tugas (ST)
            </label>
            <input
              id="nomorSuratTugas"
              type="text"
              value={master.nomorSuratTugas}
              onChange={(e) => handleField('nomorSuratTugas', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="tanggalSuratTugas" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tanggal ST
            </label>
            <input
              id="tanggalSuratTugas"
              type="date"
              value={master.tanggalSuratTugas}
              onChange={(e) => handleField('tanggalSuratTugas', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="tanggalSpd" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tanggal SPD / SPPD
            </label>
            <input
              id="tanggalSpd"
              type="date"
              value={master.tanggalSpd}
              onChange={(e) => handleField('tanggalSpd', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="kotaPenandatangan" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kota Penandatangan
            </label>
            <input
              id="kotaPenandatangan"
              type="text"
              value={master.kotaPenandatangan}
              onChange={(e) => handleField('kotaPenandatangan', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="tanggalKuitansi" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tgl Pengesahan / Lunas
            </label>
            <input
              id="tanggalKuitansi"
              type="date"
              value={master.tanggalKuitansi}
              onChange={(e) => handleField('tanggalKuitansi', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-6">
            <label htmlFor="labelTransporDarat" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Label Baris Transportasi Darat (Pada Rincian Biaya & DPR)
            </label>
            <input
              id="labelTransporDarat"
              type="text"
              value={master.labelTransporDarat || 'Transportasi Darat (Jabodetabek)'}
              onChange={(e) => handleField('labelTransporDarat', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Transportasi Darat (Jabodetabek)"
            />
          </div>

          <div className="md:col-span-6">
            <label htmlFor="nomorSpdPrefix" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Format Awalan Nomor SPPD (Untuk Auto-Nomor)
            </label>
            <input
              id="nomorSpdPrefix"
              type="text"
              value={master.nomorSpdPrefix}
              onChange={(e) => handleField('nomorSpdPrefix', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="ITJ.1-KU.03.02-"
            />
          </div>

          <div className="md:col-span-12">
            <label htmlFor="ringkasanHasilKegiatan" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ringkasan Hasil Pelaksanaan Tugas (Untuk Lampiran Laporan Singkat PTJ)
            </label>
            <textarea
              id="ringkasanHasilKegiatan"
              rows={2}
              value={master.ringkasanHasilKegiatan}
              onChange={(e) => handleField('ringkasanHasilKegiatan', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </section>

      {/* Section 3: Pejabat Penandatangan (PPK, Bendahara, Ketua Tim) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-700 shrink-0" />
            <span>03. Pejabat Penandatangan (PPK, Bendahara Pengeluaran & Pejabat ST/Ketua Tim)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Otomatis mengisi blok pengesahan pada Kuitansi, Rincian Biaya, Daftar Pengeluaran Riil, Daftar Nominatif, SPD, dan SPTJM.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PPK */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Pejabat Pembuat Komitmen (PPK)
            </div>
            <div>
              <label htmlFor="ppkNama" className="block text-xs font-medium text-slate-700 mb-1">
                Nama Lengkap & Gelar PPK
              </label>
              <input
                id="ppkNama"
                type="text"
                value={master.ppkNama}
                onChange={(e) => handleField('ppkNama', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ppkNip" className="block text-xs font-medium text-slate-700 mb-1">
                NIP PPK (18 Digit)
              </label>
              <input
                id="ppkNip"
                type="text"
                value={master.ppkNip}
                onChange={(e) => handleField('ppkNip', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ppkJabatan" className="block text-xs font-medium text-slate-700 mb-1">
                Nomenklatur Jabatan PPK
              </label>
              <input
                id="ppkJabatan"
                type="text"
                value={master.ppkJabatan}
                onChange={(e) => handleField('ppkJabatan', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Bendahara */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Bendahara Pengeluaran / BPP
            </div>
            <div>
              <label htmlFor="bendaharaNama" className="block text-xs font-medium text-slate-700 mb-1">
                Nama Lengkap & Gelar Bendahara
              </label>
              <input
                id="bendaharaNama"
                type="text"
                value={master.bendaharaNama}
                onChange={(e) => handleField('bendaharaNama', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="bendaharaNip" className="block text-xs font-medium text-slate-700 mb-1">
                NIP Bendahara (18 Digit)
              </label>
              <input
                id="bendaharaNip"
                type="text"
                value={master.bendaharaNip}
                onChange={(e) => handleField('bendaharaNip', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="bendaharaJabatan" className="block text-xs font-medium text-slate-700 mb-1">
                Nomenklatur Jabatan Bendahara
              </label>
              <input
                id="bendaharaJabatan"
                type="text"
                value={master.bendaharaJabatan}
                onChange={(e) => handleField('bendaharaJabatan', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Ketua Tim / KPA */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider">
              Ketua Tim / Pejabat Penerbit ST
            </div>
            <div>
              <label htmlFor="ketuaTimNama" className="block text-xs font-medium text-slate-700 mb-1">
                Nama Lengkap & Gelar
              </label>
              <input
                id="ketuaTimNama"
                type="text"
                value={master.ketuaTimNama}
                onChange={(e) => handleField('ketuaTimNama', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ketuaTimNip" className="block text-xs font-medium text-slate-700 mb-1">
                NIP (18 Digit)
              </label>
              <input
                id="ketuaTimNip"
                type="text"
                value={master.ketuaTimNip}
                onChange={(e) => handleField('ketuaTimNip', e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="ketuaTimJabatan" className="block text-xs font-medium text-slate-700 mb-1">
                Jabatan Struktural / Fungsional
              </label>
              <input
                id="ketuaTimJabatan"
                type="text"
                value={master.ketuaTimJabatan}
                onChange={(e) => handleField('ketuaTimJabatan', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Kop Surat (Letterhead) Customizer */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stamp className="w-5 h-5 text-blue-700 shrink-0" />
              <span>04. Kustomisasi Kop Surat Resmi (Menggantikan 27 Objek Gambar/Kop di Excel)</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Sesuaikan teks Kop Surat atau unggah logo instansi Anda untuk ditampilkan pada seluruh cetakan dokumen A4.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Logo Instansi</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                aria-label="Unggah Logo Instansi"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 space-y-3">
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Jenis Lambang / Logo Kop Surat
              </span>
              <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => onChangeKop({ ...kopSurat, logoPreset: 'pengayoman' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    kopSurat.logoPreset === 'pengayoman'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Logo Pengayoman (Kemenkum)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeKop({ ...kopSurat, logoPreset: 'garuda' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    kopSurat.logoPreset === 'garuda'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lambang Garuda / Negara
                </button>
                <button
                  type="button"
                  onClick={() => onChangeKop({ ...kopSurat, logoPreset: 'instansi' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    kopSurat.logoPreset === 'instansi'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Emblem Perisai Instansi
                </button>
                {kopSurat.customLogoDataUrl && (
                  <button
                    type="button"
                    onClick={() => onChangeKop({ ...kopSurat, logoPreset: 'custom' })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      kopSurat.logoPreset === 'custom'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Logo Unggahan Kustom
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="kopKementerian" className="block text-xs font-medium text-slate-700 mb-1">
                  Baris 1 (Kementerian / Lembaga)
                </label>
                <input
                  id="kopKementerian"
                  type="text"
                  value={kopSurat.kementerian}
                  onChange={(e) => onChangeKop({ ...kopSurat, kementerian: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="kopEselon1" className="block text-xs font-medium text-slate-700 mb-1">
                  Baris 2 (Unit Eselon I / Ditjen)
                </label>
                <input
                  id="kopEselon1"
                  type="text"
                  value={kopSurat.eselon1}
                  onChange={(e) => onChangeKop({ ...kopSurat, eselon1: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label htmlFor="kopSatker" className="block text-xs font-medium text-slate-700 mb-1">
                Baris 3 (Nama Satuan Kerja Utama)
              </label>
              <input
                id="kopSatker"
                type="text"
                value={kopSurat.satkerName}
                onChange={(e) => onChangeKop({ ...kopSurat, satkerName: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="kopAlamat" className="block text-xs font-medium text-slate-700 mb-1">
                  Alamat Lengkap Kantor
                </label>
                <input
                  id="kopAlamat"
                  type="text"
                  value={kopSurat.alamat}
                  onChange={(e) => onChangeKop({ ...kopSurat, alamat: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="kopKontak" className="block text-xs font-medium text-slate-700 mb-1">
                  Telepon, Faksimile & Surel
                </label>
                <input
                  id="kopKontak"
                  type="text"
                  value={kopSurat.teleponEmail}
                  onChange={(e) => onChangeKop({ ...kopSurat, teleponEmail: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Live Preview of Kop Surat */}
          <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-5">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">
              Pratinjau Langsung Kop Surat A4:
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded">
              <KopSuratView kop={kopSurat} compact />
              <div className="text-center text-xs text-slate-400 italic py-2">
                [Isi Dokumen Kuitansi / Rincian Biaya / SPTJM akan tercetak di bawah Kop Surat ini]
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onGoToParticipants}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Lanjut ke Daftar Pelaksana & Rincian Biaya</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
