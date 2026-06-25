import type { Pengiriman, TransferStok, CabangInventory, Shift, Pesanan } from '@/types'
import type { Produk } from '@/types'

// ─── Core ─────────────────────────────────────────────────────────────────────

function printHTML(html: string) {
  const win = window.open('', '_blank', 'width=900,height=650')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
    win.close()
  }, 300)
}

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 32px; }
  h1 { font-size: 18px; font-weight: 700; }
  h2 { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f3f4f6; text-align: left; padding: 7px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; border: 1px solid #d1d5db; }
  td { padding: 7px 10px; border: 1px solid #d1d5db; vertical-align: top; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #16a34a; padding-bottom: 16px; }
  .logo { font-size: 20px; font-weight: 800; color: #16a34a; }
  .doc-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #374151; }
  .doc-meta { font-size: 11px; color: #6b7280; margin-top: 4px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .info-block label { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; display: block; margin-bottom: 2px; }
  .info-block span { font-weight: 600; font-size: 12px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #374151; margin-bottom: 8px; border-left: 3px solid #16a34a; padding-left: 8px; }
  .check-box { display: inline-block; width: 14px; height: 14px; border: 1.5px solid #374151; margin-right: 4px; vertical-align: middle; }
  .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 40px; }
  .sig-block { border-top: 1px solid #9ca3af; padding-top: 8px; }
  .sig-block .sig-label { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; }
  .sig-block .sig-name { font-size: 11px; font-weight: 600; margin-top: 48px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  .badge-success { background: #dcfce7; color: #166534; }
  .badge-warning { background: #fef9c3; color: #854d0e; }
  .footer-note { margin-top: 20px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
  @media print { body { padding: 16px; } @page { margin: 10mm; } }
`

function formatTgl(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

// ─── Struk POS ────────────────────────────────────────────────────────────────

export function printStrukPOS(pesanan: Pesanan, namaToko = 'TaniGo') {
  const fmtRpStruk = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const tanggal = new Date(pesanan.createdAt).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const itemRows = pesanan.items.map((item) => `
    <tr>
      <td style="padding:3px 0;font-size:12px">${item.produkNama}</td>
      <td style="padding:3px 0;text-align:center;font-size:12px">${item.qty}</td>
      <td style="padding:3px 0;text-align:right;font-size:12px">${fmtRpStruk(item.hargaSatuan)}</td>
      <td style="padding:3px 0;text-align:right;font-size:12px;font-weight:600">${fmtRpStruk(item.subtotal)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Struk ${pesanan.nomorPesanan}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: monospace; font-size: 12px; color: #111; background: #fff; padding: 16px; max-width: 320px; margin: 0 auto; }
    .store-name { font-size: 16px; font-weight: 800; text-align: center; color: #16a34a; margin-bottom: 2px; }
    .center { text-align: center; }
    .divider { border-top: 1px dashed #9ca3af; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    .total-row td { font-size: 14px; font-weight: 700; padding-top: 6px; border-top: 1px dashed #9ca3af; }
    .footer { text-align: center; margin-top: 12px; font-size: 11px; color: #6b7280; }
    @media print { body { padding: 4px; } @page { margin: 4mm; size: 80mm auto; } }
  </style></head><body>
  <div class="store-name">${namaToko}</div>
  <div class="center" style="font-size:10px;color:#6b7280">Toko Perlengkapan Pertanian</div>
  <div class="divider"></div>
  <div style="font-size:11px;margin-bottom:4px">
    <div>No: <b>${pesanan.nomorPesanan}</b></div>
    <div>Tanggal: ${tanggal}</div>
    <div>Kasir: ${pesanan.kasirNama}</div>
    <div>Pelanggan: ${pesanan.pelangganNama}</div>
  </div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;font-size:11px;padding-bottom:4px">Item</th>
        <th style="text-align:center;font-size:11px;padding-bottom:4px">Qty</th>
        <th style="text-align:right;font-size:11px;padding-bottom:4px">Harga</th>
        <th style="text-align:right;font-size:11px;padding-bottom:4px">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    ${pesanan.diskon > 0 ? `<tr><td colspan="3" style="padding-top:6px;font-size:12px">Diskon</td><td style="text-align:right;font-size:12px;color:#dc2626">- ${fmtRpStruk(pesanan.diskon)}</td></tr>` : ''}
    <tr class="total-row">
      <td colspan="3">TOTAL</td>
      <td style="text-align:right">${fmtRpStruk(pesanan.total)}</td>
    </tr>
  </table>
  <div class="divider"></div>
  <div style="font-size:11px">Pembayaran: <b>${pesanan.metodePembayaran}</b></div>
  <div class="footer">
    <div style="margin-top:8px">--- Terima kasih ---</div>
    <div>Barang yang sudah dibeli</div>
    <div>tidak dapat dikembalikan</div>
  </div>
  </body></html>`

  const win = window.open('', '_blank', 'width=400,height=600')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
    win.close()
  }, 300)
}

// ─── Invoice / Faktur Tagihan (A4) ─────────────────────────────────────────────

export function printInvoicePesanan(pesanan: Pesanan, namaToko = 'TaniGo') {
  const fmtRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const tanggal = new Date(pesanan.createdAt).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const itemRows = pesanan.items.map((item, i) => `
    <tr>
      <td style="text-align:center;width:32px">${i + 1}</td>
      <td>${item.produkNama} <span style="color:#9ca3af">(${item.produkSku})</span></td>
      <td style="text-align:center;width:60px">${item.qty}</td>
      <td style="text-align:right;width:110px">${fmtRp(item.hargaSatuan)}</td>
      <td style="text-align:right;width:120px;font-weight:600">${fmtRp(item.subtotal)}</td>
    </tr>`).join('')

  const pengiriman = pesanan.metodePengiriman === 'ambil_sendiri' ? 'Ambil Sendiri' : 'Dikirim'

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${pesanan.nomorPesanan}</title><style>${BASE_CSS}</style></head><body>
    <div class="header">
      <div>
        <div class="logo">🌱 ${namaToko}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Toko Perlengkapan Pertanian</div>
      </div>
      <div style="text-align:right">
        <div class="doc-title">Invoice / Faktur Tagihan</div>
        <div class="doc-meta">No: <b>${pesanan.nomorPesanan}</b></div>
        <div class="doc-meta">Tanggal: ${tanggal}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block"><label>Ditagihkan kepada</label><span>${pesanan.pelangganNama}</span></div>
      ${pesanan.pelangganTelepon ? `<div class="info-block"><label>Telepon</label><span>${pesanan.pelangganTelepon}</span></div>` : ''}
      <div class="info-block"><label>Metode Pembayaran</label><span>${pesanan.metodePembayaran}</span></div>
      <div class="info-block"><label>Metode Pengiriman</label><span>${pengiriman}</span></div>
      ${pesanan.metodePengiriman === 'dikirim' && pesanan.alamatPengiriman ? `<div class="info-block"><label>Alamat Pengiriman</label><span>${pesanan.alamatPengiriman}</span></div>` : ''}
      <div class="info-block"><label>Dibuat oleh</label><span>${pesanan.kasirNama}</span></div>
    </div>

    <div class="section-title" style="margin-bottom:12px">Rincian Item</div>
    <table style="margin-bottom:16px">
      <thead>
        <tr>
          <th style="text-align:center">No</th>
          <th>Produk</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Harga Satuan</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end">
      <table style="width:280px">
        <tr>
          <td style="border:none;padding:4px 8px;color:#6b7280">Subtotal</td>
          <td style="border:none;padding:4px 8px;text-align:right">${fmtRp(pesanan.subtotal)}</td>
        </tr>
        ${pesanan.diskon > 0 ? `<tr>
          <td style="border:none;padding:4px 8px;color:#6b7280">Diskon</td>
          <td style="border:none;padding:4px 8px;text-align:right;color:#dc2626">- ${fmtRp(pesanan.diskon)}</td>
        </tr>` : ''}
        <tr>
          <td style="border:none;border-top:2px solid #16a34a;padding:8px;font-weight:700;font-size:13px">Total Tagihan</td>
          <td style="border:none;border-top:2px solid #16a34a;padding:8px;text-align:right;font-weight:700;font-size:13px;color:#16a34a">${fmtRp(pesanan.total)}</td>
        </tr>
      </table>
    </div>

    ${pesanan.catatan ? `<div style="margin-top:20px"><div class="section-title" style="margin-bottom:8px">Catatan</div><div style="font-size:11px;color:#374151">${pesanan.catatan}</div></div>` : ''}

    <div class="sig-grid" style="grid-template-columns:repeat(2,1fr)">
      <div class="sig-block">
        <div class="sig-label">Hormat kami</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">Penerima</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
    </div>

    <div class="footer-note">Invoice ini diterbitkan oleh sistem TaniGo sebagai dasar penagihan. Harap lakukan pembayaran sesuai metode yang tertera.</div>
  </body></html>`

  printHTML(html)
}

// ─── Formulir Stok Opname ─────────────────────────────────────────────────────

export function printFormulirStokOpname(
  cabangNama: string,
  produkList: Produk[],
  inventory: CabangInventory[],
) {
  const invMap: Record<string, number> = {}
  inventory.forEach((inv) => { invMap[inv.produkId] = inv.stok })

  const byKategori = produkList.reduce<Record<string, Produk[]>>((acc, p) => {
    ;(acc[p.kategori] ??= []).push(p)
    return acc
  }, {})

  const tanggal = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  let rowNo = 0

  const tableRows = Object.entries(byKategori).map(([kategori, items]) => {
    const produkRows = items.map((p) => {
      rowNo++
      const stokSistem = invMap[p.id] ?? 0
      return `
        <tr>
          <td style="text-align:center;color:#6b7280">${rowNo}</td>
          <td><b>${p.nama}</b></td>
          <td style="color:#6b7280;font-size:10px">${p.sku}</td>
          <td style="text-align:center">${stokSistem}</td>
          <td>${p.satuan}</td>
          <td style="background:#fafafa"></td>
          <td style="background:#fafafa"></td>
        </tr>`
    }).join('')

    return `
      <tr>
        <td colspan="7" style="background:#f3f4f6;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.04em;padding:6px 10px;color:#374151;border:1px solid #d1d5db">
          ${kategori}
        </td>
      </tr>
      ${produkRows}`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Formulir Stok Opname — ${cabangNama}</title>
  <style>${BASE_CSS}
    th, td { font-size: 11px; }
    td:nth-child(6), td:nth-child(7) { min-width: 80px; }
  </style></head><body>

  <div class="header">
    <div>
      <div class="logo">🌱 TaniGo</div>
      <div style="font-size:10px;color:#6b7280;margin-top:2px">Sistem Manajemen Toko Perlengkapan Pertanian</div>
    </div>
    <div style="text-align:right">
      <div class="doc-title">Formulir Stok Opname</div>
      <div class="doc-meta">Cabang: <b>${cabangNama}</b></div>
      <div class="doc-meta">Dicetak: ${tanggal}</div>
    </div>
  </div>

  <div class="info-grid" style="margin-bottom:16px">
    <div class="info-block"><label>Tanggal Opname</label><span>___________________________</span></div>
    <div class="info-block"><label>Petugas</label><span>___________________________</span></div>
  </div>

  <div class="section-title" style="margin-bottom:8px">Daftar Produk (${produkList.length} item)</div>
  <table>
    <thead>
      <tr>
        <th style="width:32px;text-align:center">No</th>
        <th>Nama Produk</th>
        <th style="width:90px">SKU</th>
        <th style="width:80px;text-align:center">Stok Sistem</th>
        <th style="width:60px">Satuan</th>
        <th style="width:90px;text-align:center">Stok Fisik</th>
        <th style="width:70px;text-align:center">Paraf</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="sig-grid" style="margin-top:32px">
    <div class="sig-block">
      <div class="sig-label">Petugas Penghitung</div>
      <div class="sig-name">( _________________________ )</div>
    </div>
    <div class="sig-block">
      <div class="sig-label">Diperiksa oleh</div>
      <div class="sig-name">( _________________________ )</div>
    </div>
    <div class="sig-block">
      <div class="sig-label">Disetujui oleh</div>
      <div class="sig-name">( _________________________ )</div>
    </div>
  </div>

  <div class="footer-note">
    Formulir ini dicetak dari sistem TaniGo pada ${tanggal}.
    Setelah selesai dihitung, input data ke sistem melalui menu Stok Opname → Buat Stok Opname.
  </div>
  </body></html>`

  printHTML(html)
}

// ─── Surat Jalan Pengiriman ────────────────────────────────────────────────────

export function printSuratJalanPengiriman(p: Pengiriman) {
  const blocks = p.pesananList.map((pesanan, i) => {
    const itemRows = pesanan.items?.length
      ? pesanan.items.map((it) => `
          <tr>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;font-size:11px">${it.produkNama} <span style="color:#9ca3af">(${it.produkSku})</span></td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center;font-size:11px;font-weight:700">${it.qty}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;font-size:11px">${it.satuan}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center"><span class="check-box"></span></td>
          </tr>`).join('')
      : `<tr><td colspan="4" style="padding:6px 8px;border:1px solid #e5e7eb;color:#9ca3af;font-size:11px">—</td></tr>`

    return `
      <div style="margin-bottom:20px;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;page-break-inside:avoid">
        <div style="background:#f9fafb;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #d1d5db">
          <div>
            <span style="font-weight:700;font-size:12px">${i + 1}. ${pesanan.nomorPesanan}</span>
            <span style="margin-left:12px;font-size:11px;color:#374151">${pesanan.pelangganNama}</span>
          </div>
          <div style="font-size:10px;color:#6b7280">${pesanan.alamat}</div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;text-align:left">Produk</th>
              <th style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;width:60px;text-align:center">Qty</th>
              <th style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;width:70px">Satuan</th>
              <th style="padding:5px 8px;border:1px solid #e5e7eb;font-size:10px;width:50px;text-align:center">✓</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="padding:6px 12px;background:#f9fafb;border-top:1px solid #e5e7eb;display:flex;gap:24px;font-size:11px">
          <span><span class="check-box"></span> Terkirim</span>
          <span><span class="check-box"></span> Dikembalikan</span>
          <span style="margin-left:auto;color:#6b7280">TTD penerima: ___________________________</span>
        </div>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Surat Jalan ${p.nomorPengiriman}</title><style>${BASE_CSS}</style></head><body>
    <div class="header">
      <div>
        <div class="logo">🌱 TaniGo</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Sistem Manajemen Toko Perlengkapan Pertanian</div>
      </div>
      <div style="text-align:right">
        <div class="doc-title">Surat Jalan Pengiriman</div>
        <div class="doc-meta">No: <b>${p.nomorPengiriman}</b></div>
        <div class="doc-meta">Tanggal: ${formatTgl(p.tanggalPengiriman)}</div>
      </div>
    </div>

    <div class="info-grid" style="margin-bottom:20px">
      <div class="info-block"><label>Driver / Kurir</label><span>${p.driverNama}</span></div>
      <div class="info-block"><label>Tanggal Pengiriman</label><span>${formatTgl(p.tanggalPengiriman)}</span></div>
      ${p.estimasiWaktu ? `<div class="info-block"><label>Estimasi Waktu</label><span>${p.estimasiWaktu}</span></div>` : ''}
      ${p.catatan ? `<div class="info-block"><label>Catatan</label><span>${p.catatan}</span></div>` : ''}
    </div>

    <div class="section-title" style="margin-bottom:12px">Daftar Pesanan & Barang (${p.pesananList.length} pesanan)</div>
    ${blocks}

    <div class="sig-grid">
      <div class="sig-block">
        <div class="sig-label">Disiapkan oleh</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">Kurir / Driver</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">Mengetahui</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
    </div>

    <div class="footer-note">Dokumen ini dicetak oleh sistem TaniGo. Harap simpan sebagai bukti pengiriman.</div>
  </body></html>`

  printHTML(html)
}

// ─── Surat Jalan Transfer Stok ─────────────────────────────────────────────────

export function printSuratJalanTransfer(t: TransferStok) {
  const rows = t.items.map((item, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td><b>${item.produkNama}</b><br/><span style="color:#6b7280;font-size:10px">${item.produkSku}</span></td>
      <td style="text-align:center">${item.qtyDiminta}</td>
      <td style="text-align:center">${item.qtyDisetujui ?? '—'}</td>
      <td>${item.satuan}</td>
      <td style="text-align:center">
        <span class="check-box"></span> Terkirim<br/>
        <span class="check-box"></span> Dikembalikan
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Surat Jalan ${t.nomorTransfer}</title><style>${BASE_CSS}</style></head><body>
    <div class="header">
      <div>
        <div class="logo">🌱 TaniGo</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Sistem Manajemen Toko Perlengkapan Pertanian</div>
      </div>
      <div style="text-align:right">
        <div class="doc-title">Surat Jalan Transfer Stok</div>
        <div class="doc-meta">No: <b>${t.nomorTransfer}</b></div>
        <div class="doc-meta">Tanggal: ${formatTgl(t.createdAt)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block"><label>Dari (Toko)</label><span>${t.tokNama}</span></div>
      <div class="info-block"><label>Ke (Gudang)</label><span>${t.gudangNama}</span></div>
      ${t.catatanToko ? `<div class="info-block"><label>Catatan Toko</label><span>${t.catatanToko}</span></div>` : ''}
      ${t.catatanGudang ? `<div class="info-block"><label>Catatan Gudang</label><span>${t.catatanGudang}</span></div>` : ''}
    </div>

    <div class="section-title">Daftar Item</div>
    <table>
      <thead>
        <tr>
          <th style="width:36px;text-align:center">No</th>
          <th>Produk</th>
          <th style="width:80px;text-align:center">Diminta</th>
          <th style="width:80px;text-align:center">Disetujui</th>
          <th style="width:70px">Satuan</th>
          <th style="width:140px;text-align:center">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="sig-grid">
      <div class="sig-block">
        <div class="sig-label">Disiapkan Gudang</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">Kurir / Pengantar</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">Diterima Toko</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
    </div>

    <div class="footer-note">Dokumen ini dicetak oleh sistem TaniGo. Harap simpan sebagai bukti transfer stok.</div>
  </body></html>`

  printHTML(html)
}

// ─── Laporan Export ────────────────────────────────────────────────────────────

function fmtRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(n)
}

function fmtDtShort(s: string) {
  return new Date(s).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function laporanHeader(title: string, period: string) {
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  return `
    <div class="header">
      <div>
        <div class="logo">🌱 TaniGo</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px">Sistem Manajemen Toko Perlengkapan Pertanian</div>
      </div>
      <div style="text-align:right">
        <div class="doc-title">${title}</div>
        <div class="doc-meta">Periode: <b>${period}</b></div>
        <div class="doc-meta">Dicetak: ${today}</div>
      </div>
    </div>`
}

function summaryRows(items: [string, string][]) {
  const rows = items.map(([k, v]) =>
    `<tr><td style="width:55%;font-weight:600;color:#374151;padding:6px 10px;border:1px solid #d1d5db">${k}</td><td style="padding:6px 10px;border:1px solid #d1d5db">${v}</td></tr>`
  ).join('')
  return `<table style="margin-bottom:20px;width:100%;border-collapse:collapse"><tbody>${rows}</tbody></table>`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function printLaporanPdf(tab: string, data: any, meta: { tanggalDari: string; tanggalSampai: string }) {
  const period = `${meta.tanggalDari} s/d ${meta.tanggalSampai}`
  let body = ''

  if (tab === 'stok') {
    const menipisRows = (data.itemsMenipis ?? []).map((i: { nama: string; sku: string; stok: number; threshold: number; satuan: string }) =>
      `<tr><td>${i.nama}</td><td style="color:#6b7280;font-size:10px">${i.sku}</td><td style="text-align:center;color:#d97706;font-weight:600">${i.stok} ${i.satuan}</td><td style="text-align:center">${i.threshold}</td></tr>`
    ).join('')
    const habisRows = (data.itemsHabis ?? []).map((i: { nama: string; sku: string; satuan: string }) =>
      `<tr><td>${i.nama}</td><td style="color:#6b7280;font-size:10px">${i.sku}</td><td>${i.satuan}</td></tr>`
    ).join('')
    body = `
      ${laporanHeader('Laporan Stok', period)}
      ${summaryRows([
        ['Produk Menipis', String(data.produkMenipis ?? 0)],
        ['Produk Habis', String(data.produkHabis ?? 0)],
        ['Produk Kedaluwarsa', String(data.produkKedaluwarsa ?? 0)],
      ])}
      ${menipisRows ? `
      <div class="section-title" style="margin-bottom:8px">Produk Stok Menipis</div>
      <table style="margin-bottom:20px">
        <thead><tr><th>Nama</th><th style="width:90px">SKU</th><th style="text-align:center;width:100px">Stok</th><th style="text-align:center;width:60px">Min</th></tr></thead>
        <tbody>${menipisRows}</tbody>
      </table>` : ''}
      ${habisRows ? `
      <div class="section-title" style="margin-bottom:8px">Produk Habis</div>
      <table>
        <thead><tr><th>Nama</th><th style="width:90px">SKU</th><th style="width:70px">Satuan</th></tr></thead>
        <tbody>${habisRows}</tbody>
      </table>` : ''}`
  } else if (tab === 'pembelian') {
    const sbRows = (data.statusBreakdown ?? []).map((s: { status: string; count: number }) =>
      `<tr><td>${s.status}</td><td style="text-align:center;font-weight:600">${s.count}</td></tr>`
    ).join('')
    const supRows = (data.topSupplier ?? []).map((s: { nama: string; nilai: number }) =>
      `<tr><td>${s.nama}</td><td style="text-align:right;font-weight:600">${fmtRp(s.nilai)}</td></tr>`
    ).join('')
    body = `
      ${laporanHeader('Laporan Pembelian', period)}
      ${summaryRows([
        ['Total Purchase Order', String(data.totalPO ?? 0)],
        ['Total Nilai Pembelian', fmtRp(data.totalNilai ?? 0)],
        ['Total Dibayar', fmtRp(data.totalDibayar ?? 0)],
        ['Sisa Hutang', fmtRp(data.sisaHutang ?? 0)],
      ])}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div class="section-title" style="margin-bottom:8px">Status Purchase Order</div>
          <table><thead><tr><th>Status</th><th style="text-align:center">Jumlah</th></tr></thead><tbody>${sbRows}</tbody></table>
        </div>
        <div>
          <div class="section-title" style="margin-bottom:8px">Top Supplier</div>
          <table><thead><tr><th>Supplier</th><th style="text-align:right">Total Nilai</th></tr></thead><tbody>${supRows}</tbody></table>
        </div>
      </div>`
  } else if (tab === 'pengiriman') {
    body = `
      ${laporanHeader('Laporan Pengiriman', period)}
      ${summaryRows([
        ['Total Pengiriman', String(data.totalPengiriman ?? 0)],
        ['Selesai (Terkirim)', String(data.selesai ?? 0)],
        ['Gagal', String(data.gagal ?? 0)],
        ['Success Rate', `${data.successRate ?? 0}%`],
      ])}`
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan TaniGo</title><style>${BASE_CSS}</style></head><body>${body}</body></html>`
  printHTML(html)
}

// ─── CSV Download ──────────────────────────────────────────────────────────────

function csvEsc(v: string | number | null | undefined): string {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvEsc).join(',')
}

function triggerCsv(csv: string, fileName: string) {
  const bom = '﻿'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function downloadLaporanCsv(tab: string, data: any, fileName: string) {
  let rows: string[] = []

  if (tab === 'stok') {
    rows = [
      csvRow(['Ringkasan', '']),
      csvRow(['Produk Menipis', data.produkMenipis ?? 0]),
      csvRow(['Produk Habis', data.produkHabis ?? 0]),
      csvRow(['Produk Kedaluwarsa', data.produkKedaluwarsa ?? 0]),
      '',
      csvRow(['Produk Stok Menipis']),
      csvRow(['Nama', 'SKU', 'Stok', 'Satuan', 'Min']),
      ...(data.itemsMenipis ?? []).map((i: { nama: string; sku: string; stok: number; threshold: number; satuan: string }) =>
        csvRow([i.nama, i.sku, i.stok, i.satuan, i.threshold])
      ),
      '',
      csvRow(['Produk Habis']),
      csvRow(['Nama', 'SKU', 'Satuan']),
      ...(data.itemsHabis ?? []).map((i: { nama: string; sku: string; satuan: string }) =>
        csvRow([i.nama, i.sku, i.satuan])
      ),
    ]
  } else if (tab === 'pembelian') {
    rows = [
      csvRow(['Ringkasan', '']),
      csvRow(['Total Purchase Order', data.totalPO ?? 0]),
      csvRow(['Total Nilai', data.totalNilai ?? 0]),
      csvRow(['Total Dibayar', data.totalDibayar ?? 0]),
      csvRow(['Sisa Hutang', data.sisaHutang ?? 0]),
      '',
      csvRow(['Status Purchase Order']),
      csvRow(['Status', 'Jumlah']),
      ...(data.statusBreakdown ?? []).map((s: { status: string; count: number }) =>
        csvRow([s.status, s.count])
      ),
      '',
      csvRow(['Top Supplier']),
      csvRow(['Supplier', 'Total Nilai']),
      ...(data.topSupplier ?? []).map((s: { nama: string; nilai: number }) =>
        csvRow([s.nama, s.nilai])
      ),
    ]
  } else if (tab === 'pengiriman') {
    rows = [
      csvRow(['Ringkasan', '']),
      csvRow(['Total Pengiriman', data.totalPengiriman ?? 0]),
      csvRow(['Selesai', data.selesai ?? 0]),
      csvRow(['Gagal', data.gagal ?? 0]),
      csvRow(['Success Rate (%)', data.successRate ?? 0]),
    ]
  }

  triggerCsv(rows.join('\n'), fileName)
}

// ─── Packing List Transfer Stok ────────────────────────────────────────────────

export function printPackingListTransfer(t: TransferStok) {
  const rows = t.items.map((item, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td><b>${item.produkNama}</b><br/><span style="color:#6b7280;font-size:10px">${item.produkSku}</span></td>
      <td style="text-align:center">${item.qtyDisetujui ?? item.qtyDiminta}</td>
      <td>${item.satuan}</td>
      <td style="text-align:center"><span class="check-box"></span></td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Packing List ${t.nomorTransfer}</title><style>${BASE_CSS}</style></head><body>
    <div class="header">
      <div>
        <div class="logo">🌱 TaniGo</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">Sistem Manajemen Toko Perlengkapan Pertanian</div>
      </div>
      <div style="text-align:right">
        <div class="doc-title">Packing List</div>
        <div class="doc-meta">Ref: <b>${t.nomorTransfer}</b></div>
        <div class="doc-meta">Tanggal: ${formatTgl(t.createdAt)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block"><label>Tujuan Toko</label><span>${t.tokNama}</span></div>
      <div class="info-block"><label>Gudang Pengirim</label><span>${t.gudangNama}</span></div>
    </div>

    <div class="section-title">Checklist Barang — Staf Gudang</div>
    <table>
      <thead>
        <tr>
          <th style="width:36px;text-align:center">No</th>
          <th>Produk</th>
          <th style="width:90px;text-align:center">Qty Dikirim</th>
          <th style="width:70px">Satuan</th>
          <th style="width:50px;text-align:center">✓</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:40px;">
      <div class="sig-block">
        <div class="sig-label">Disiapkan oleh (Staf Gudang)</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
      <div class="sig-block">
        <div class="sig-label">Diperiksa oleh</div>
        <div class="sig-name">( _________________________ )</div>
      </div>
    </div>

    <div class="footer-note">Dokumen internal — tidak untuk diberikan ke kurir. Simpan di arsip gudang.</div>
  </body></html>`

  printHTML(html)
}
