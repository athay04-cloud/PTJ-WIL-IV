import React from 'react';
import {
  PTJWorkbookState,
  ParticipantPTJ,
  calculateParticipantTotals,
  formatRupiah,
  formatAccountingCell,
  formatTanggalIndo,
  terbilangHariKecil,
} from '../utils/ptjEngine';
import { KopSuratView } from './KopSuratView';

interface PersonDocProps {
  state: PTJWorkbookState;
  p: ParticipantPTJ;
}

/**
 * Sel angka format akuntansi Indonesia (Rp di kiri, nominal atau '-' di kanan) sesuai PDF
 */
const AccountingAmountCell: React.FC<{
  amount: number;
  bold?: boolean;
  className?: string;
}> = ({ amount, bold = false, className = '' }) => (
  <div
    className={`flex items-center justify-between gap-2 font-mono tabular-nums ${
      bold ? 'font-bold' : ''
    } ${className}`}
  >
    <span>Rp</span>
    <span>{formatAccountingCell(amount)}</span>
  </div>
);

/**
 * HALAMAN 1 PDF: RINCIAN BIAYA PERJALANAN DINAS & PERHITUNGAN SPPD RAMPUNG
 */
export const RincianBiayaSheet: React.FC<PersonDocProps> = ({ state, p }) => {
  const { master, kopSurat } = state;
  const calc = calculateParticipantTotals(p);
  const hariTerbilang = terbilangHariKecil(p.jumlahHari);
  const labelTransporDarat =
    master.labelTransporDarat?.trim() || 'Transportasi Darat (Jabodetabek)';
  const asalLabel = master.lokasiAsal?.trim() || 'Jakarta';

  return (
    <div
      data-testid="sheet-rincian-biaya"
      className="bg-white border border-slate-300 shadow-xs p-8 sm:p-10 max-w-4xl mx-auto text-black print:border-0 print:shadow-none print:p-2 print:break-after-page"
    >
      <KopSuratView kop={kopSurat} />

      {/* Judul Utama */}
      <div className="text-center mb-6">
        <h3 className="text-base font-bold uppercase tracking-wide">
          RINCIAN BIAYA PERJALANAN DINAS
        </h3>
      </div>

      {/* Lampiran SPD Nomor & Tanggal */}
      <div className="grid grid-cols-12 gap-y-1 text-xs mb-4 max-w-xl">
        <div className="col-span-4">Lampiran SPD Nomor</div>
        <div className="col-span-8 font-mono">: {p.nomorSpd}</div>
        <div className="col-span-4">Tanggal</div>
        <div className="col-span-8">: {formatTanggalIndo(p.tanggalSpd || master.tanggalSpd)}</div>
      </div>

      {/* Tabel Utama Rincian Biaya */}
      <table className="w-full border-collapse border-2 border-black text-xs">
        <thead>
          <tr className="bg-slate-200/75 font-bold text-center border-b-2 border-black">
            <th className="border border-black py-2 px-2 w-12">No.</th>
            <th className="border border-black py-2 px-3">PERINCIAN BIAYA</th>
            <th className="border border-black py-2 px-3 w-40">JUMLAH</th>
            <th className="border border-black py-2 px-3 w-36">KETERANGAN</th>
          </tr>
        </thead>
        <tbody>
          {/* 1. Uang Harian Perjalanan Dinas */}
          <tr className="align-top">
            <td className="border-x border-black pt-3 pb-2 px-2 text-center">1</td>
            <td className="border-x border-black pt-3 pb-2 px-3">
              <div className="font-bold">Uang Harian Perjalanan Dinas</div>
              <div className="flex items-center justify-between gap-4 mt-0.5">
                <span>
                  {p.jumlahHari} ({hariTerbilang}) hari x
                </span>
                <div className="w-32">
                  <AccountingAmountCell amount={p.tarifUangHarian} />
                </div>
              </div>
            </td>
            <td className="border-x border-black pt-3 pb-2 px-3 align-bottom">
              <AccountingAmountCell amount={calc.totalUangHarian} />
            </td>
            <td className="border-x border-black pt-3 pb-2 px-3 text-center align-bottom">
              -
            </td>
          </tr>

          {/* 2. Transportasi */}
          <tr className="align-top">
            <td className="border-x border-black py-2 px-2 text-center">2</td>
            <td className="border-x border-black py-2 px-3 space-y-0.5">
              <div className="font-bold">Transportasi</div>
              <div>Pesawat:</div>
              <div className="flex items-center justify-between gap-4">
                <span>{asalLabel} - Tujuan PP</span>
                <div className="w-32">
                  <AccountingAmountCell amount={calc.biayaTiketPP} />
                </div>
              </div>

              <div className="pt-2">Darat:</div>
              <div className="flex items-center justify-between gap-4">
                <span>Taksi {asalLabel}</span>
                <div className="w-32">
                  <AccountingAmountCell amount={calc.biayaTaksiAsal} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Taksi Provinsi</span>
                <div className="w-32">
                  <AccountingAmountCell amount={calc.biayaTaksiProvinsi} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{labelTransporDarat}</span>
                <div className="w-32">
                  <AccountingAmountCell amount={calc.biayaTransporDarat} />
                </div>
              </div>
            </td>
            <td className="border-x border-black py-2 px-3 space-y-0.5">
              <div className="invisible">Transportasi</div>
              <div className="invisible">Pesawat:</div>
              <AccountingAmountCell amount={calc.biayaTiketPP} />
              <div className="pt-2 invisible">Darat:</div>
              <AccountingAmountCell amount={calc.biayaTaksiAsal} />
              <AccountingAmountCell amount={calc.biayaTaksiProvinsi} />
              <AccountingAmountCell amount={calc.biayaTransporDarat} />
            </td>
            <td className="border-x border-black py-2 px-3 text-center space-y-0.5">
              <div className="invisible">Transportasi</div>
              <div className="invisible">Pesawat:</div>
              <div>{calc.biayaTiketPP > 0 ? p.nomorTiketPP || '-' : ''}</div>
              <div className="pt-2 invisible">Darat:</div>
              <div className="invisible">-</div>
              <div className="invisible">-</div>
              <div>-</div>
            </td>
          </tr>

          {/* 3. Penginapan */}
          <tr className="align-top">
            <td className="border-x border-black py-2 px-2 text-center">3</td>
            <td className="border-x border-black py-2 px-3">
              <div className="font-bold">Penginapan</div>
              <div className="flex items-center justify-between gap-4 mt-0.5">
                <div className="flex items-center gap-3 pl-4">
                  <span className="font-mono">{p.jumlahMalam}</span>
                  <span>x</span>
                  {p.gunakanTarif30Persen &&
                    calc.persenPenginapanEfektif !== 100 && (
                      <>
                        <span className="font-mono">
                          {calc.persenPenginapanEfektif}%
                        </span>
                        <span>x</span>
                      </>
                    )}
                  <span className="font-mono">
                    Rp {formatAccountingCell(p.tarifHotelPerMalam)}
                  </span>
                </div>
                <div className="w-32">
                  <AccountingAmountCell
                    amount={p.jumlahMalam > 0 ? calc.tarifHotelEfektifPerMalam : 0}
                  />
                </div>
              </div>
            </td>
            <td className="border-x border-black py-2 px-3 align-bottom">
              <AccountingAmountCell amount={calc.totalPenginapan} />
            </td>
            <td className="border-x border-black py-2 px-3 text-center align-bottom">
              -
            </td>
          </tr>

          {/* 4. Uang Representatif */}
          <tr className="align-top">
            <td className="border-x border-black pt-2 pb-3 px-2 text-center">4</td>
            <td className="border-x border-black pt-2 pb-3 px-3">
              <div className="font-bold">Uang Representatif</div>
              <div className="flex items-center justify-between gap-4 mt-0.5">
                <span>
                  {p.jumlahHari} ({hariTerbilang}) hari x
                </span>
                <div className="w-32">
                  <AccountingAmountCell amount={p.uangRepresentasiPerHari} />
                </div>
              </div>
            </td>
            <td className="border-x border-black pt-2 pb-3 px-3 align-bottom">
              <AccountingAmountCell amount={calc.totalRepresentasi} />
            </td>
            <td className="border-x border-black pt-2 pb-3 px-3 text-center align-bottom">
              -
            </td>
          </tr>

          {/* Item Riil Tambahan jika ada */}
          {p.riilItems.length > 0 && (
            <tr className="align-top">
              <td className="border-x border-black pb-3 px-2 text-center">5</td>
              <td className="border-x border-black pb-3 px-3">
                <div className="font-bold">Pengeluaran Riil Lainnya</div>
                {p.riilItems.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-4 mt-0.5"
                  >
                    <span>{r.uraian}</span>
                    <div className="w-32">
                      <AccountingAmountCell amount={r.jumlah} />
                    </div>
                  </div>
                ))}
              </td>
              <td className="border-x border-black pb-3 px-3 align-bottom">
                <AccountingAmountCell amount={calc.totalRiilTambahan} />
              </td>
              <td className="border-x border-black pb-3 px-3 text-center align-bottom">
                -
              </td>
            </tr>
          )}

          {/* Baris JUMLAH */}
          <tr className="border-t-2 border-black font-bold">
            <td colSpan={2} className="border border-black py-1.5 px-3 text-center">
              JUMLAH
            </td>
            <td className="border border-black py-1.5 px-3">
              <AccountingAmountCell amount={calc.jumlahBruto} bold />
            </td>
            <td className="border border-black py-1.5 px-3"></td>
          </tr>

          {/* Baris Terbilang */}
          <tr className="border-t border-black bg-slate-200/80 font-bold">
            <td colSpan={4} className="py-1.5 px-2">
              <span>Terbilang :</span>
              <span className="ml-4">{calc.terbilangBruto}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Blok Tanda Tangan Bendahara & Penerima */}
      <div className="grid grid-cols-2 gap-8 mt-5 text-xs">
        <div className="flex flex-col">
          <div>Telah dibayar sejumlah :</div>
          <div className="font-bold font-mono flex items-center justify-between max-w-[160px] mt-0.5">
            <span>Rp</span>
            <span>{formatAccountingCell(calc.jumlahBruto)}</span>
          </div>
          <div className="mt-3 text-center">
            <div className="invisible select-none" aria-hidden="true">
              {master.kotaPenandatangan},{' '}
              {formatTanggalIndo(
                p.tanggalPertanggungjawaban || master.tanggalKuitansi
              )}
            </div>
            <div className="mt-1">Bendahara Pengeluaran</div>
            <div className="pt-14">{master.bendaharaNama}</div>
            <div>NIP {master.bendaharaNip}</div>
          </div>
        </div>

        <div className="flex flex-col">
          <div>Telah menerima jumlah uang sebesar :</div>
          <div className="font-bold font-mono flex items-center justify-between max-w-[160px] mt-0.5">
            <span>Rp</span>
            <span>{formatAccountingCell(calc.jumlahBruto)}</span>
          </div>
          <div className="mt-3 text-center">
            <div>
              {master.kotaPenandatangan},{' '}
              {formatTanggalIndo(
                p.tanggalPertanggungjawaban || master.tanggalKuitansi
              )}
            </div>
            <div className="mt-1">Yang Menerima,</div>
            <div className="pt-14">{p.nama}</div>
            <div className="font-mono">{p.nip ? `NIP ${p.nip}` : ''}</div>
          </div>
        </div>
      </div>

      {/* Garis Pemisah & Perhitungan SPPD Rampung */}
      <div className="mt-5 pt-2 border-t-2 border-black text-xs">
        <div className="text-center font-bold mb-4">Perhitungan SPPD Rampung</div>

        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-7 space-y-1">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-7">Ditetapkan sejumlah</div>
              <div className="col-span-5">
                <AccountingAmountCell amount={calc.jumlahBruto} />
              </div>
            </div>
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-7">Yang telah dibayar semula</div>
              <div className="col-span-5 border-b border-black pb-0.5">
                <AccountingAmountCell amount={calc.dibayarSemula} />
              </div>
            </div>
            <div className="grid grid-cols-12 items-center font-bold pt-0.5">
              <div className="col-span-7">Pengembalian</div>
              <div className="col-span-5">
                <AccountingAmountCell amount={calc.pengembalianRampung} bold />
              </div>
            </div>
          </div>

          <div className="col-span-5 text-center pt-10">
            <div>Pejabat Pembuat Komitmen,</div>
            <div className="pt-12 font-semibold">{master.ppkNama}</div>
            <div>NIP {master.ppkNip}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * HALAMAN 2 PDF: DAFTAR PENGELUARAN RIIL (Disesuaikan dengan Input Data Awal)
 */
export const DaftarPengeluaranRiilSheet: React.FC<PersonDocProps> = ({ state, p }) => {
  const { master, kopSurat } = state;
  const calc = calculateParticipantTotals(p);
  const hariTerbilang = terbilangHariKecil(p.jumlahHari);
  const labelTransporDarat =
    master.labelTransporDarat?.trim() || 'Transportasi Darat (Jabodetabek)';
  const asalLabel = master.lokasiAsal?.trim() || 'Jakarta';

  let rowNo = 0;

  return (
    <div
      data-testid="sheet-daftar-pengeluaran-riil"
      className="bg-white border border-slate-300 shadow-xs p-8 sm:p-10 max-w-4xl mx-auto text-black print:border-0 print:shadow-none print:p-2 print:break-after-page"
    >
      <KopSuratView kop={kopSurat} />

      <div className="text-center mb-6">
        <h3 className="text-base font-bold uppercase tracking-wide">
          DAFTAR PENGELUARAN RIIL
        </h3>
      </div>

      <div className="text-xs space-y-1.5 mb-4">
        <div>Yang bertanda tangan dibawah ini :</div>
        <div className="grid grid-cols-12 gap-y-1 pt-2 max-w-xl">
          <div className="col-span-4">Nama</div>
          <div className="col-span-8">: {p.nama}</div>
          <div className="col-span-4">NIP</div>
          <div className="col-span-8 font-mono">: {p.nip}</div>
          <div className="col-span-4">Jabatan</div>
          <div className="col-span-8">: {p.jabatan}</div>
        </div>

        <div className="pt-3 leading-relaxed">
          Berdasarkan Surat Perintah Perjalanan Dinas (SPPD) Nomor :{' '}
          <span className="font-mono px-2">{p.nomorSpd}</span> pada tanggal{' '}
          <span>{formatTanggalIndo(p.tanggalSpd || master.tanggalSpd)}</span> dengan ini kami menyatakan
          dengan sesungguhnya bahwa :
        </div>

        <div className="flex items-start gap-4 pt-2 pl-4">
          <span>1.</span>
          <span>
            Biaya di bawah ini tidak dapat diperoleh bukti-bukti pengeluarannya, meliputi :
          </span>
        </div>
      </div>

      {/* Tabel Utama Daftar Pengeluaran Riil (Sesuai PDF) */}
      <table className="w-full border-collapse border-2 border-black text-xs mb-4">
        <thead>
          <tr className="border-b-2 border-black text-center font-medium">
            <th className="border border-black py-1.5 px-2 w-12">No.</th>
            <th className="border border-black py-1.5 px-3">Uraian</th>
            <th className="border border-black py-1.5 px-3 w-44">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {/* 1. Uang Harian */}
          <tr className="align-top">
            <td className="border-x border-black pt-3 pb-2 px-2 text-center">
              {++rowNo}
            </td>
            <td className="border-x border-black pt-3 pb-2 px-3">
              <div>Uang Harian Perjalanan Dinas</div>
              <div className="flex items-center justify-between gap-4 mt-0.5">
                <span>
                  {p.jumlahHari} ({hariTerbilang}) hari x
                </span>
                <div className="w-36">
                  <AccountingAmountCell amount={p.tarifUangHarian} />
                </div>
              </div>
            </td>
            <td className="border-x border-black pt-3 pb-2 px-3 align-bottom">
              <AccountingAmountCell amount={calc.totalUangHarian} />
            </td>
          </tr>

          {/* 2. Transportasi */}
          <tr className="align-top">
            <td className="border-x border-black py-2 px-2 text-center">
              {++rowNo}
            </td>
            <td className="border-x border-black py-2 px-3 space-y-0.5">
              <div className="font-bold">Transportasi</div>
              <div>Pesawat:</div>
              <div className="flex items-center justify-between gap-4">
                <span>{asalLabel} - Tujuan PP</span>
                <div className="w-36">
                  <AccountingAmountCell amount={calc.biayaTiketPP} />
                </div>
              </div>

              <div className="pt-2">Darat:</div>
              <div className="flex items-center justify-between gap-4">
                <span>Taksi {asalLabel}</span>
                <div className="w-36">
                  <AccountingAmountCell amount={calc.biayaTaksiAsal} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Taksi Provinsi</span>
                <div className="w-36">
                  <AccountingAmountCell amount={calc.biayaTaksiProvinsi} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{labelTransporDarat}</span>
                <div className="w-36">
                  <AccountingAmountCell amount={calc.biayaTransporDarat} />
                </div>
              </div>
            </td>
            <td className="border-x border-black py-2 px-3 space-y-0.5">
              <div className="invisible">Transportasi</div>
              <div className="invisible">Pesawat:</div>
              <AccountingAmountCell amount={calc.biayaTiketPP} />
              <div className="pt-2 invisible">Darat:</div>
              <AccountingAmountCell amount={calc.biayaTaksiAsal} />
              <AccountingAmountCell amount={calc.biayaTaksiProvinsi} />
              <AccountingAmountCell amount={calc.biayaTransporDarat} />
            </td>
          </tr>

          {/* 3. Penginapan (Dengan Slot Pengali 30% sesuai DPR_DLL.pdf) */}
          <tr className="align-top" data-testid="dpr-row-penginapan">
            <td className="border-x border-black py-2 px-2 text-center">
              {++rowNo}
            </td>
            <td className="border-x border-black py-2 px-3">
              <div>Penginapan</div>
              <div className="flex items-center justify-between gap-4 mt-0.5">
                <div className="flex items-center gap-3 pl-4">
                  <span className="font-mono">{p.jumlahMalam}</span>
                  <span>x</span>
                  {p.gunakanTarif30Persen &&
                    calc.persenPenginapanEfektif !== 100 && (
                      <>
                        <span className="font-mono">
                          {calc.persenPenginapanEfektif}%
                        </span>
                        <span>x</span>
                      </>
                    )}
                  <span className="font-mono">
                    Rp {formatAccountingCell(p.tarifHotelPerMalam)}
                  </span>
                </div>
                <div className="w-36">
                  <AccountingAmountCell
                    amount={p.jumlahMalam > 0 ? calc.tarifHotelEfektifPerMalam : 0}
                  />
                </div>
              </div>
            </td>
            <td className="border-x border-black py-2 px-3 align-bottom">
              <AccountingAmountCell amount={calc.totalPenginapan} />
            </td>
          </tr>

          {/* 4. Uang Representatif */}
          <tr className="align-top" data-testid="dpr-row-representatif">
            <td className="border-x border-black pt-2 pb-2 px-2 text-center">
              {++rowNo}
            </td>
            <td className="border-x border-black pt-2 pb-2 px-3">
              <div className="font-bold">Uang Representatif</div>
              <div className="flex items-center justify-between gap-4 mt-0.5">
                <span>
                  {p.jumlahHari} ({hariTerbilang}) hari x
                </span>
                <div className="w-36">
                  <AccountingAmountCell amount={p.uangRepresentasiPerHari} />
                </div>
              </div>
            </td>
            <td className="border-x border-black pt-2 pb-2 px-3 align-bottom">
              <AccountingAmountCell amount={calc.totalRepresentasi} />
            </td>
          </tr>

          {/* Item Riil Tambahan jika ada */}
          {p.riilItems.length > 0 && (
            <tr className="align-top">
              <td className="border-x border-black pb-2 px-2 text-center">
                {++rowNo}
              </td>
              <td className="border-x border-black pb-2 px-3">
                <div className="font-bold">Pengeluaran Riil Lainnya</div>
                {p.riilItems.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-4 mt-0.5"
                  >
                    <span>{r.uraian}</span>
                    <div className="w-36">
                      <AccountingAmountCell amount={r.jumlah} />
                    </div>
                  </div>
                ))}
              </td>
              <td className="border-x border-black pb-2 px-3 align-bottom">
                <AccountingAmountCell amount={calc.totalRiilTambahan} />
              </td>
            </tr>
          )}

          {/* Footer Jumlah */}
          <tr className="border-t-2 border-black">
            <td colSpan={2} className="border border-black py-1.5 px-3 text-center">
              Jumlah
            </td>
            <td className="border border-black py-1.5 px-3">
              <AccountingAmountCell amount={calc.daftarPengeluaranRiilTotal} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Klausul 2 & Penutup */}
      <div className="text-xs space-y-3 mb-6">
        <div className="flex items-start gap-4 pl-4">
          <span>2.</span>
          <span>
            Jumlah uang tersebut pada angka 1 diatas benar-benar dikeluarkan untuk
            pelaksanaan perjalanan dinas dimaksud
          </span>
        </div>
        <div>
          Demikian pernyataan ini kami buat dengan sebenarnya, untuk dipergunakan
          sebagaimana mestinya
        </div>
      </div>

      {/* Blok Tanda Tangan PPK & Pelaksana */}
      <div className="text-xs">
        <div className="grid grid-cols-2 gap-8 text-center">
          <div>
            <div className="invisible select-none mb-1" aria-hidden="true">
              {master.kotaPenandatangan},{' '}
              {formatTanggalIndo(
                p.tanggalPertanggungjawaban || master.tanggalKuitansi
              )}
            </div>
            <div>Pejabat Pembuat Komitmen,</div>
            <div className="pt-14">{master.ppkNama}</div>
            <div>NIP {master.ppkNip}</div>
          </div>
          <div>
            <div className="mb-1">
              {master.kotaPenandatangan},{' '}
              {formatTanggalIndo(
                p.tanggalPertanggungjawaban || master.tanggalKuitansi
              )}
            </div>
            <div>Yang Melakukan Perjalanan Dinas</div>
            <div className="pt-14">{p.nama}</div>
            <div className="font-mono">{p.nip ? `NIP ${p.nip}` : ''}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * RENCANA BIAYA PERJALANAN DINAS (Disinkronkan dengan Input Data Awal & Perhitungan SPPD Rampung)
 */
export const RencanaBiayaSheet: React.FC<PersonDocProps> = ({ state, p }) => {
  const { master, kopSurat } = state;
  const calc = calculateParticipantTotals(p);
  const hariTerbilang = terbilangHariKecil(p.jumlahHari);
  const labelTransporDarat =
    master.labelTransporDarat?.trim() || 'Transportasi Darat (Jabodetabek)';
  const asalLabel = master.lokasiAsal?.trim() || 'Jakarta';

  return (
    <div
      data-testid="sheet-rencana-biaya"
      className="bg-white border border-slate-300 shadow-xs p-8 sm:p-10 max-w-4xl mx-auto text-black print:border-0 print:shadow-none print:p-2 print:break-after-page"
    >
      <KopSuratView kop={kopSurat} />

      <div className="text-center mb-6">
        <h3 className="text-base font-bold uppercase tracking-wide">
          RENCANA BIAYA PERJALANAN DINAS
        </h3>
      </div>

      <div className="grid grid-cols-12 gap-y-1 text-xs mb-4">
        <div className="col-span-3">Dasar Surat Tugas</div>
        <div className="col-span-9 font-mono">
          : {p.nomorSuratTugas || master.nomorSuratTugas} (
          {formatTanggalIndo(p.tanggalSuratTugas || master.tanggalSuratTugas)})
        </div>
        <div className="col-span-3">Nomor SPPD</div>
        <div className="col-span-9 font-mono">
          : {p.nomorSpd} ({formatTanggalIndo(p.tanggalSpd || master.tanggalSpd)})
        </div>
        <div className="col-span-3">Pelaksana / NIP</div>
        <div className="col-span-9">
          : <strong>{p.nama}</strong> / NIP {p.nip} ({p.jabatan})
        </div>
        <div className="col-span-3">Tujuan / Waktu</div>
        <div className="col-span-9">
          : {master.lokasiAsal} – {master.lokasiTujuan} ({p.jumlahHari} hari:{' '}
          {formatTanggalIndo(master.tanggalMulai)} s.d.{' '}
          {formatTanggalIndo(master.tanggalSelesai)})
        </div>
      </div>

      <table className="w-full border-collapse border-2 border-black text-xs">
        <thead>
          <tr className="bg-slate-200/75 font-bold text-center border-b-2 border-black">
            <th className="border border-black py-2 px-2 w-12">No.</th>
            <th className="border border-black py-2 px-3">RINCIAN RENCANA BIAYA</th>
            <th className="border border-black py-2 px-3 w-40">JUMLAH RENCANA</th>
            <th className="border border-black py-2 px-3 w-36">AKUN / MAK</th>
          </tr>
        </thead>
        <tbody>
          <tr className="align-top">
            <td className="border-x border-black pt-3 pb-2 px-2 text-center">1</td>
            <td className="border-x border-black pt-3 pb-2 px-3">
              <div className="font-bold">Uang Harian Perjalanan Dinas</div>
              <div className="flex items-center justify-between gap-4 mt-0.5">
                <span>
                  {p.jumlahHari} ({hariTerbilang}) hari x
                </span>
                <div className="w-32">
                  <AccountingAmountCell amount={p.tarifUangHarian} />
                </div>
              </div>
            </td>
            <td className="border-x border-black pt-3 pb-2 px-3 align-bottom">
              <AccountingAmountCell amount={calc.totalUangHarian} />
            </td>
            <td className="border-x border-black pt-3 pb-2 px-3 text-center font-mono align-bottom">
              {master.kodeMak}
            </td>
          </tr>

          <tr className="align-top">
            <td className="border-x border-black py-2 px-2 text-center">2</td>
            <td className="border-x border-black py-2 px-3 space-y-0.5">
              <div className="font-bold">Transportasi</div>
              <div>Pesawat:</div>
              <div className="flex items-center justify-between gap-4">
                <span>{asalLabel} - Tujuan PP</span>
                <div className="w-32">
                  <AccountingAmountCell amount={calc.biayaTiketPP} />
                </div>
              </div>
              <div className="pt-2">Darat:</div>
              <div className="flex items-center justify-between gap-4">
                <span>Taksi {asalLabel}</span>
                <div className="w-32">
                  <AccountingAmountCell amount={calc.biayaTaksiAsal} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Taksi Provinsi</span>
                <div className="w-32">
                  <AccountingAmountCell amount={calc.biayaTaksiProvinsi} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>{labelTransporDarat}</span>
                <div className="w-32">
                  <AccountingAmountCell amount={calc.biayaTransporDarat} />
                </div>
              </div>
            </td>
            <td className="border-x border-black py-2 px-3 space-y-0.5">
              <div className="invisible">Transportasi</div>
              <div className="invisible">Pesawat:</div>
              <AccountingAmountCell amount={calc.biayaTiketPP} />
              <div className="pt-2 invisible">Darat:</div>
              <AccountingAmountCell amount={calc.biayaTaksiAsal} />
              <AccountingAmountCell amount={calc.biayaTaksiProvinsi} />
              <AccountingAmountCell amount={calc.biayaTransporDarat} />
            </td>
            <td className="border-x border-black py-2 px-3 text-center font-mono align-bottom">
              {master.kodeMak}
            </td>
          </tr>

          <tr className="align-top">
            <td className="border-x border-black py-2 px-2 text-center">3</td>
            <td className="border-x border-black py-2 px-3">
              <div className="font-bold">Penginapan</div>
              <div className="flex items-center justify-between gap-4 mt-0.5">
                <div className="flex items-center gap-3 pl-4">
                  <span className="font-mono">{p.jumlahMalam}</span>
                  <span>x</span>
                  {p.gunakanTarif30Persen &&
                    calc.persenPenginapanEfektif !== 100 && (
                      <>
                        <span className="font-mono">
                          {calc.persenPenginapanEfektif}%
                        </span>
                        <span>x</span>
                      </>
                    )}
                  <span className="font-mono">
                    Rp {formatAccountingCell(p.tarifHotelPerMalam)}
                  </span>
                </div>
                <div className="w-32">
                  <AccountingAmountCell
                    amount={p.jumlahMalam > 0 ? calc.tarifHotelEfektifPerMalam : 0}
                  />
                </div>
              </div>
            </td>
            <td className="border-x border-black py-2 px-3 align-bottom">
              <AccountingAmountCell amount={calc.totalPenginapan} />
            </td>
            <td className="border-x border-black py-2 px-3 text-center font-mono align-bottom">
              {master.kodeMak}
            </td>
          </tr>

          <tr className="align-top">
            <td className="border-x border-black pt-2 pb-3 px-2 text-center">4</td>
            <td className="border-x border-black pt-2 pb-3 px-3">
              <div className="font-bold">Uang Representatif</div>
              <div className="flex items-center justify-between gap-4 mt-0.5">
                <span>
                  {p.jumlahHari} ({hariTerbilang}) hari x
                </span>
                <div className="w-32">
                  <AccountingAmountCell amount={p.uangRepresentasiPerHari} />
                </div>
              </div>
            </td>
            <td className="border-x border-black pt-2 pb-3 px-3 align-bottom">
              <AccountingAmountCell amount={calc.totalRepresentasi} />
            </td>
            <td className="border-x border-black pt-2 pb-3 px-3 text-center font-mono align-bottom">
              {master.kodeMak}
            </td>
          </tr>

          <tr className="border-t-2 border-black font-bold">
            <td colSpan={2} className="border border-black py-1.5 px-3 text-center">
              JUMLAH RENCANA BIAYA (DIBAYAR SEMULA)
            </td>
            <td className="border border-black py-1.5 px-3">
              <AccountingAmountCell amount={calc.dibayarSemula} bold />
            </td>
            <td className="border border-black py-1.5 px-3 text-center font-mono">
              DIPA {master.tahunAnggaran}
            </td>
          </tr>

          <tr className="border-t border-black bg-slate-200/80 font-bold">
            <td colSpan={4} className="py-1.5 px-2">
              <span>Terbilang :</span>
              <span className="ml-4">{calc.terbilangRencana}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-8 mt-6 text-xs text-center">
        <div>
          <div>Menyetujui Rencana Biaya,</div>
          <div className="font-semibold">Pejabat Pembuat Komitmen,</div>
          <div className="pt-14 font-bold">{master.ppkNama}</div>
          <div>NIP {master.ppkNip}</div>
        </div>
        <div>
          <div>
            {master.kotaPenandatangan}, {formatTanggalIndo(master.tanggalSpd)}
          </div>
          <div className="font-semibold">Pelaksana Perjalanan Dinas,</div>
          <div className="pt-14 font-bold">{p.nama}</div>
          <div className="font-mono">{p.nip}</div>
        </div>
      </div>
    </div>
  );
};

export const KuitansiSheet: React.FC<PersonDocProps> = ({ state, p }) => {
  const { master, kopSurat } = state;
  const calc = calculateParticipantTotals(p);

  return (
    <div className="bg-white border border-slate-300 shadow-xs p-8 max-w-4xl mx-auto text-slate-900 print:border-0 print:shadow-none print:p-2 print:break-after-page">
      <KopSuratView kop={kopSurat} />

      <div className="flex justify-between items-start text-xs mb-4">
        <div className="space-y-0.5">
          <div>Satuan Kerja: {master.namaSatker}</div>
          <div>Nomor DIPA: {master.nomorDipa}</div>
        </div>
        <div className="border border-slate-800 p-2 font-mono text-[11px] space-y-0.5">
          <div>Tahun Anggaran : {master.tahunAnggaran}</div>
          <div>Nomor Bukti : {p.nomorKuitansi}</div>
          <div>Kode Akun / MAK : {master.kodeMak}</div>
        </div>
      </div>

      <div className="text-center my-4">
        <h3 className="text-base font-bold underline tracking-wide uppercase">
          KUITANSI / BUKTI PEMBAYARAN
        </h3>
      </div>

      <div className="space-y-3 text-xs leading-relaxed border-t border-b border-slate-300 py-4">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3 font-semibold">Sudah Terima Dari</div>
          <div className="col-span-9">
            : Pejabat Pembuat Komitmen {master.namaSatker}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-3 font-semibold">Jumlah Uang (Bersih)</div>
          <div className="col-span-9">
            <span className="inline-block font-mono font-bold text-sm bg-slate-100 border border-slate-400 px-3 py-1">
              {formatRupiah(calc.jumlahBersih)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3 font-semibold">Terbilang</div>
          <div className="col-span-9 italic font-medium bg-slate-50 border border-slate-200 px-2.5 py-1.5">
            # {calc.terbilangBersih} #
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-3 font-semibold">Untuk Pembayaran</div>
          <div className="col-span-9">
            : Biaya perjalanan dinas dalam rangka {master.namaKegiatan}, dari{' '}
            {master.lokasiAsal} ke {master.lokasiTujuan} selama {p.jumlahHari} (
            {terbilangHariKecil(p.jumlahHari)}) hari, sesuai SPPD Nomor {p.nomorSpd}{' '}
            tanggal {formatTanggalIndo(master.tanggalSpd)} a.n.{' '}
            <strong>{p.nama}</strong>.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 text-xs">
        <div className="border-r border-slate-200 pr-3 flex flex-col justify-between min-h-[130px]">
          <div>
            <div className="font-semibold">
              Setuju dibebankan pada mata anggaran berkenaan,
            </div>
            <div className="font-semibold mt-1">{master.ppkJabatan}</div>
          </div>
          <div className="pt-12">
            <div className="font-bold underline">{master.ppkNama}</div>
            <div className="font-mono text-[11px]">NIP {master.ppkNip}</div>
          </div>
        </div>

        <div className="border-r border-slate-200 px-3 flex flex-col justify-between min-h-[130px]">
          <div>
            <div className="font-semibold">
              Lunas dibayar tanggal {formatTanggalIndo(master.tanggalKuitansi)}
            </div>
            <div className="font-semibold mt-1">{master.bendaharaJabatan}</div>
          </div>
          <div className="pt-12">
            <div className="font-bold underline">{master.bendaharaNama}</div>
            <div className="font-mono text-[11px]">NIP {master.bendaharaNip}</div>
          </div>
        </div>

        <div className="pl-3 flex flex-col justify-between min-h-[130px]">
          <div>
            <div>
              {master.kotaPenandatangan}, {formatTanggalIndo(master.tanggalKuitansi)}
            </div>
            <div className="font-semibold mt-1">Yang Menerima,</div>
          </div>
          <div className="pt-12">
            <div className="font-bold underline">{p.nama}</div>
            <div className="font-mono text-[11px]">{p.nip}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM) — Sesuai Format Resmi SPTJM_78456032.pdf
 */
export const SptjmSheet: React.FC<PersonDocProps> = ({ state, p }) => {
  const { master, kopSurat } = state;

  return (
    <div
      data-testid="sheet-sptjm-resmi"
      className="bg-white border border-slate-300 shadow-xs p-10 sm:p-14 max-w-4xl mx-auto text-black print:border-0 print:shadow-none print:p-4 print:break-after-page"
    >
      <KopSuratView kop={kopSurat} />

      <div className="text-center my-6">
        <h3 className="text-sm sm:text-[15px] font-bold uppercase tracking-wide">
          SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK
        </h3>
      </div>

      <div className="text-xs sm:text-[13px] leading-relaxed space-y-4">
        <div>Yang bertanda tangan di bawah ini:</div>

        <div className="grid grid-cols-12 gap-y-1 max-w-xl">
          <div className="col-span-3">Nama</div>
          <div className="col-span-9">: &nbsp;{p.nama}</div>
          <div className="col-span-3">NIP</div>
          <div className="col-span-9">: &nbsp;{p.nip}</div>
          <div className="col-span-3">Jabatan</div>
          <div className="col-span-9">: &nbsp;{p.jabatan}</div>
        </div>

        <div className="pt-1">Menyatakan dengan sesungguhnya bahwa:</div>

        <ol className="space-y-4 pl-1">
          <li className="flex items-start gap-3">
            <span className="shrink-0">1.</span>
            <span>
              Sehubungan dengan Surat Perintah Inspektur Jenderal Nomor{' '}
              {p.nomorSuratTugas ? `${p.nomorSuratTugas} ` : ''}tanggal{' '}
              {p.tanggalSuratTugas
                ? `${formatTanggalIndo(p.tanggalSuratTugas)} `
                : ''}
              maka saya menyatakan dengan sesungguhnya benar telah melaksanakan
              perjalanan dinas dimaksud;
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="shrink-0">2.</span>
            <span>
              Benar bahwa biaya perjalanan dinas telah sesuai dengan yang tercantum
              pada rincian biaya perjalanan dinas;
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="shrink-0">3.</span>
            <span>
              Apabila di kemudian hari terdapat kesalahan perhitungan atau kelebihan
              atas pembayaran tersebut, kami bersedia untuk menyetor kelebihan
              tersebut ke Kas Negara.
            </span>
          </li>
        </ol>

        <div className="pt-1">
          Demikian pernyataan ini kami buat dengan sebenar-benarnya.
        </div>
      </div>

      {/* Blok Tanda Tangan Mengetahui PPK & Pegawai yang Melakukan Perjalanan Dinas */}
      <div className="grid grid-cols-12 gap-6 mt-12 text-xs sm:text-[13px] leading-snug">
        <div className="col-span-6 pl-6 pt-5">
          <div>Mengetahui,</div>
          <div>{master.ppkJabatan || 'Pejabat Pembuat Komitmen'}</div>
          <div className="pt-16 uppercase">{master.ppkNama}</div>
          <div>NIP {master.ppkNip}</div>
        </div>

        <div className="col-span-6 pl-4">
          <div className="mb-5">
            {master.kotaPenandatangan},{' '}
            {formatTanggalIndo(p.tanggalPertanggungjawaban || master.tanggalKuitansi)}
          </div>
          <div>Pegawai yang Melakukan Perjalanan Dinas</div>
          <div className="pt-16">{p.nama}</div>
          <div>{p.nip}</div>
        </div>
      </div>
    </div>
  );
};

