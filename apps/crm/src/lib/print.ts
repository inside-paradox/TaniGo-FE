import type { Pengiriman, TransferStok, CabangInventory } from '@/types'
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
