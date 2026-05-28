from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from datetime import date

# ── Output path ──────────────────────────────────────────────────────────────
OUTPUT = "/Users/devfe/Documents/dev/tani-go-luwu/docs/TaniGo-Dokumentasi-Sistem.pdf"

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN       = colors.HexColor("#16a34a")
GREEN_LIGHT = colors.HexColor("#f0fdf4")
GREEN_MID   = colors.HexColor("#bbf7d0")
GRAY_900    = colors.HexColor("#111827")
GRAY_600    = colors.HexColor("#4b5563")
GRAY_400    = colors.HexColor("#9ca3af")
GRAY_100    = colors.HexColor("#f3f4f6")
GRAY_200    = colors.HexColor("#e5e7eb")
WHITE       = colors.white

# ── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def style(name, **kw):
    return ParagraphStyle(name, **kw)

TITLE_S   = style("DocTitle",   fontSize=28, leading=34, textColor=WHITE,       fontName="Helvetica-Bold", alignment=TA_LEFT)
SUBTITLE_S= style("DocSub",     fontSize=13, leading=18, textColor=GREEN_MID,   fontName="Helvetica",      alignment=TA_LEFT)
META_S    = style("DocMeta",    fontSize=9,  leading=14, textColor=GREEN_MID,   fontName="Helvetica",      alignment=TA_LEFT)

H1        = style("H1",         fontSize=16, leading=22, textColor=GREEN,       fontName="Helvetica-Bold", spaceBefore=18, spaceAfter=6)
H2        = style("H2",         fontSize=12, leading=17, textColor=GRAY_900,    fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=4)
H3        = style("H3",         fontSize=10, leading=15, textColor=GRAY_600,    fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=3)
BODY      = style("Body",       fontSize=9,  leading=14, textColor=GRAY_600,    fontName="Helvetica",      spaceAfter=4)
BODY_SM   = style("BodySm",     fontSize=8,  leading=12, textColor=GRAY_600,    fontName="Helvetica")
LABEL     = style("Label",      fontSize=8,  leading=12, textColor=WHITE,       fontName="Helvetica-Bold")
TH        = style("TH",         fontSize=8,  leading=11, textColor=WHITE,       fontName="Helvetica-Bold", alignment=TA_CENTER)
TD        = style("TD",         fontSize=8,  leading=11, textColor=GRAY_900,    fontName="Helvetica",      alignment=TA_LEFT)
TD_C      = style("TD_C",       fontSize=8,  leading=11, textColor=GRAY_900,    fontName="Helvetica",      alignment=TA_CENTER)
CAPTION   = style("Caption",    fontSize=7,  leading=10, textColor=GRAY_400,    fontName="Helvetica-Oblique", alignment=TA_CENTER)

# ── Role badge colours ────────────────────────────────────────────────────────
ROLE_COLORS = {
    "Superadmin":  colors.HexColor("#7c3aed"),
    "Admin":       colors.HexColor("#dc2626"),
    "Manajer":     colors.HexColor("#2563eb"),
    "Kasir":       colors.HexColor("#d97706"),
    "Staf Gudang": colors.HexColor("#059669"),
}

# ── Helper: checkmark / dash cells ───────────────────────────────────────────
def ck(yes=True):
    return Paragraph("<b>✓</b>" if yes else "–", TD_C)

def role_pill(role):
    c = ROLE_COLORS.get(role, GREEN)
    return Paragraph(f'<font color="white"><b>{role}</b></font>', TD_C)

# ── Table style factory ───────────────────────────────────────────────────────
def base_ts(header_rows=1):
    cmds = [
        ("BACKGROUND",   (0, 0), (-1, header_rows - 1), GREEN),
        ("ROWBACKGROUNDS",(0, header_rows), (-1, -1), [WHITE, GRAY_100]),
        ("GRID",         (0, 0), (-1, -1), 0.4, GRAY_200),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]
    return TableStyle(cmds)

# ── Cover page ────────────────────────────────────────────────────────────────
COVER_BG      = colors.HexColor("#052e16")   # very dark green
COVER_ACCENT  = colors.HexColor("#16a34a")   # bright green
COVER_TITLE   = style("CoverTitle",  fontSize=30, leading=36, textColor=colors.white,
                       fontName="Helvetica-Bold", alignment=TA_LEFT)
COVER_SUB     = style("CoverSub",    fontSize=13, leading=19, textColor=colors.HexColor("#86efac"),
                       fontName="Helvetica", alignment=TA_LEFT)
COVER_META    = style("CoverMeta",   fontSize=9,  leading=14, textColor=colors.HexColor("#4ade80"),
                       fontName="Helvetica", alignment=TA_LEFT)
COVER_CHIP    = style("CoverChip",   fontSize=9,  leading=13, textColor=colors.HexColor("#16a34a"),
                       fontName="Helvetica-Bold", alignment=TA_LEFT)
COVER_FOOT    = style("CoverFoot",   fontSize=8,  leading=12, textColor=colors.HexColor("#4ade80"),
                       fontName="Helvetica", alignment=TA_LEFT)

def cover_page():
    W, H = A4
    usable_w = W - 4 * cm   # left+right margin 2cm each

    # ── top accent stripe ────────────────────────────────────────────────────
    stripe = Table([[""]], colWidths=[usable_w], rowHeights=[0.35*cm])
    stripe.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), COVER_ACCENT),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
    ]))

    # ── chip ─────────────────────────────────────────────────────────────────
    chip = Table([[Paragraph("TANIGO SYSTEM", COVER_CHIP)]], colWidths=[4.5*cm])
    chip.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), colors.HexColor("#14532d")),
        ("TOPPADDING",   (0,0),(-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
        ("LEFTPADDING",  (0,0),(-1,-1), 10),
        ("RIGHTPADDING", (0,0),(-1,-1), 10),
        ("BOX",          (0,0),(-1,-1), 0.5, COVER_ACCENT),
    ]))

    # ── divider line ─────────────────────────────────────────────────────────
    divider = Table([[""]], colWidths=[usable_w], rowHeights=[0.06*cm])
    divider.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), colors.HexColor("#166534")),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
    ]))

    # ── main cover block (dark bg) ────────────────────────────────────────────
    inner = [
        stripe,
        Spacer(1, 3.5*cm),
        chip,
        Spacer(1, 0.7*cm),
        Paragraph("Dokumentasi Sistem", COVER_TITLE),
        Spacer(1, 0.4*cm),
        Paragraph("Panduan lengkap fitur, role pengguna,<br/>dan alur kerja sistem TaniGo", COVER_SUB),
        Spacer(1, 1.2*cm),
        divider,
        Spacer(1, 0.6*cm),
        Paragraph(f"Versi 1.0  ·  {date.today().strftime('%d %B %Y')}  ·  Confidential", COVER_META),
        Spacer(1, 0.8*cm),
        # role list
        Paragraph("Mencakup role: Superadmin · Admin · Manajer · Kasir · Staf Gudang", COVER_FOOT),
        Spacer(1, 0.3*cm),
        Paragraph("Aplikasi: TaniGo CRM  &amp;  TaniGo POS", COVER_FOOT),
    ]

    cover_table = Table([[inner]], colWidths=[usable_w],
                        rowHeights=[H - 5.5*cm])   # full usable height with buffer
    cover_table.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), COVER_BG),
        ("VALIGN",       (0,0),(-1,-1), "TOP"),
        ("LEFTPADDING",  (0,0),(-1,-1), 0.8*cm),
        ("RIGHTPADDING", (0,0),(-1,-1), 0.8*cm),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("BOX",          (0,0),(-1,-1), 0, COVER_BG),
    ]))

    return [cover_table]

# ── Section divider ───────────────────────────────────────────────────────────
def section_divider(title, subtitle=""):
    items = [
        HRFlowable(width="100%", thickness=1.5, color=GREEN, spaceAfter=6),
        Paragraph(title, H1),
    ]
    if subtitle:
        items.append(Paragraph(subtitle, BODY))
    return items

# ── Highlight box ─────────────────────────────────────────────────────────────
def info_box(text, color=GREEN_LIGHT, border=GREEN):
    data = [[Paragraph(text, BODY)]]
    t = Table(data, colWidths=[16.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), color),
        ("LINEAFTER",    (0,0),(0,-1),  2, border),
        ("LEFTPADDING",  (0,0),(-1,-1), 12),
        ("RIGHTPADDING", (0,0),(-1,-1), 8),
        ("TOPPADDING",   (0,0),(-1,-1), 8),
        ("BOTTOMPADDING",(0,0),(-1,-1), 8),
    ]))
    return t

# ── Build document ─────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm,  bottomMargin=2 * cm,
        title="TaniGo - Dokumentasi Sistem",
        author="TaniGo",
        subject="Dokumentasi Fitur dan Role Pengguna",
    )

    W = A4[0] - 4 * cm   # usable width

    story = []

    # ── COVER ─────────────────────────────────────────────────────────────────
    story += cover_page()
    story.append(PageBreak())

    # ── 1. PENDAHULUAN ────────────────────────────────────────────────────────
    story += section_divider("1. Pendahuluan", "Gambaran umum sistem TaniGo")
    story.append(Paragraph(
        "TaniGo adalah sistem manajemen bisnis pertanian yang terdiri dari dua aplikasi utama: "
        "<b>TaniGo CRM</b> (berbasis web, untuk operasional kantor dan gudang) dan "
        "<b>TaniGo POS</b> (point-of-sale di kasir toko). Keduanya terhubung ke backend yang sama "
        "sehingga data stok, pesanan, dan laporan selalu sinkron secara real-time.", BODY))
    story.append(Spacer(1, 0.3 * cm))

    plat_data = [
        [Paragraph("Aplikasi", TH), Paragraph("Platform", TH), Paragraph("Deskripsi", TH)],
        [Paragraph("TaniGo CRM", TD), Paragraph("Web Browser", TD),
         Paragraph("Dashboard manajemen: produk, inventori, pesanan, pengiriman, laporan, dll.", TD)],
        [Paragraph("TaniGo POS", TD), Paragraph("Web Browser (tablet/PC)", TD),
         Paragraph("Kasir toko: transaksi langsung, shift, retur barang, mode offline.", TD)],
    ]
    plat = Table(plat_data, colWidths=[4*cm, 4*cm, 8.5*cm])
    plat.setStyle(base_ts())
    story.append(plat)
    story.append(Spacer(1, 0.4*cm))

    # ── 2. ROLE PENGGUNA ─────────────────────────────────────────────────────
    story.append(PageBreak())
    story += section_divider("2. Role Pengguna", "TaniGo memiliki 5 role dengan hak akses berbeda")
    story.append(info_box(
        "Setiap pengguna memiliki satu role. Role menentukan menu yang tampil, "
        "data yang bisa dilihat atau diubah, dan tipe cabang yang bersangkutan (toko atau gudang)."
    ))
    story.append(Spacer(1, 0.4*cm))

    roles = [
        ("Superadmin", "Seluruh jaringan", "–",
         "Akses penuh ke semua fitur dan semua cabang. Mengelola cabang, pengguna, produk, dan melihat performa seluruh toko."),
        ("Admin", "Cabang (gudang)", "gudang",
         "Mengelola operasional gudang: purchase order, transfer stok, inventori, stok opname, laporan, pengaturan cabang."),
        ("Manajer", "Cabang (toko)", "toko",
         "Memantau operasional toko: pesanan, pengiriman, pelanggan VIP, inventori, laporan, pengaturan toko."),
        ("Kasir", "Cabang (toko)", "toko",
         "Melayani transaksi di POS, melihat pesanan, pengiriman, dan laporan shift."),
        ("Staf Gudang", "Cabang (gudang)", "gudang",
         "Membantu operasional gudang: inventori, transfer stok, purchase order, stok opname."),
    ]

    for role, scope, tipe, desc in roles:
        color = ROLE_COLORS.get(role, GREEN)
        badge_data = [[Paragraph(role, style(f"b_{role}", fontSize=9, textColor=WHITE,
                       fontName="Helvetica-Bold"))]]
        badge = Table(badge_data, colWidths=[3*cm])
        badge.setStyle(TableStyle([
            ("BACKGROUND",   (0,0),(-1,-1), color),
            ("TOPPADDING",   (0,0),(-1,-1), 3),
            ("BOTTOMPADDING",(0,0),(-1,-1), 3),
            ("LEFTPADDING",  (0,0),(-1,-1), 8),
        ]))

        detail_data = [
            [Paragraph("<b>Lingkup:</b>", BODY_SM), Paragraph(scope, BODY_SM),
             Paragraph("<b>Tipe Cabang:</b>", BODY_SM), Paragraph(tipe, BODY_SM)],
        ]
        detail = Table(detail_data, colWidths=[2.5*cm, 5*cm, 3*cm, 6*cm])
        detail.setStyle(TableStyle([
            ("TOPPADDING",  (0,0),(-1,-1), 2),
            ("BOTTOMPADDING",(0,0),(-1,-1),2),
            ("LEFTPADDING", (0,0),(-1,-1), 0),
        ]))

        block = KeepTogether([
            badge,
            Spacer(1, 0.15*cm),
            Paragraph(desc, BODY),
            detail,
            Spacer(1, 0.35*cm),
        ])
        story.append(block)

    # ── 3. MATRIKS AKSES ──────────────────────────────────────────────────────
    story.append(PageBreak())
    story += section_divider("3. Matriks Akses Fitur",
                              "Ringkasan hak akses setiap role terhadap fitur di TaniGo CRM")

    # Column headers clarify tipe cabang per role
    hdrs = ["Fitur", "Superadmin", "Admin\n(gudang)", "Manajer\n(toko)", "Kasir\n(toko)", "Staf Gudang\n(gudang)"]
    matrix_rows = [
        # (fitur, SA, Admin/gudang, Manajer/toko, Kasir/toko, StafGudang)
        # tipeCabang filter applied:
        #   pesanan/pelanggan-vip/pengiriman → toko only  → Admin(gudang) blocked
        #   purchase-order                   → gudang only → Manajer(toko) blocked
        ("Dashboard",          True,  True,  True,  True,  True),
        ("Cabang",             True,  False, False, False, False),
        ("Pengguna",           True,  False, False, False, False),
        ("Produk",             True,  True,  True,  False, True),
        ("Inventori",          False, True,  True,  False, True),
        ("Purchase Order",     False, True,  False, False, True),   # tipeCabang: gudang
        ("Transfer Stok",      False, True,  True,  False, True),
        ("Stok Opname",        True,  True,  True,  False, True),
        ("Pesanan",            False, False, True,  True,  False),  # tipeCabang: toko
        ("Pelanggan VIP",      False, False, True,  False, False),  # tipeCabang: toko
        ("Pengiriman",         False, False, True,  True,  False),  # tipeCabang: toko
        ("Laporan",            False, True,  True,  True,  False),
        ("Log Audit",          False, True,  False, False, False),
        ("Notifikasi",         True,  True,  True,  True,  True),
        ("Pengaturan",         False, True,  True,  False, False),
        ("Profil & Password",  True,  True,  True,  True,  True),
    ]

    th_row = [Paragraph(h, TH) for h in hdrs]
    mat_data = [th_row]
    for i, (fitur, sa, adm, mgr, ksr, stf) in enumerate(matrix_rows):
        mat_data.append([
            Paragraph(fitur, TD),
            ck(sa), ck(adm), ck(mgr), ck(ksr), ck(stf),
        ])

    col_w = [5.5*cm, 2.2*cm, 2.2*cm, 2.2*cm, 2.0*cm, 2.4*cm]
    mat = Table(mat_data, colWidths=col_w, repeatRows=1)
    ts = base_ts()
    # green check styling
    ts.add("TEXTCOLOR",  (1,1), (-1,-1), GREEN)
    ts.add("FONTNAME",   (1,1), (-1,-1), "Helvetica-Bold")
    mat.setStyle(ts)
    story.append(mat)
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("✓ = memiliki akses   –  = tidak memiliki akses", CAPTION))
    story.append(Spacer(1, 0.2*cm))
    story.append(info_box(
        "<b>Catatan tipe cabang:</b> Beberapa fitur dibatasi berdasarkan tipe cabang pengguna, bukan hanya role. "
        "Pesanan, Pelanggan VIP, dan Pengiriman hanya muncul untuk pengguna di cabang <b>toko</b>. "
        "Purchase Order hanya muncul untuk pengguna di cabang <b>gudang</b>. "
        "Meskipun role Admin atau Manajer secara teknis terdaftar, "
        "sistem akan menyembunyikan menu tersebut jika tipe cabang tidak sesuai."
    ))

    # ── 4. FITUR DETAIL — CRM ────────────────────────────────────────────────
    story.append(PageBreak())
    story += section_divider("4. Detail Fitur — TaniGo CRM")

    features = [
        ("4.1 Dashboard", [
            ("Superadmin", [
                "Ringkasan jaringan: total toko, gudang, pendapatan & transaksi 7 hari",
                "Grafik batang pendapatan per toko",
                "Tabel performa per toko: pendapatan, transaksi, % pertumbuhan",
                "Status cabang (aktif / nonaktif)",
            ]),
            ("Admin / Staf Gudang", [
                "Ringkasan stok: total produk, stok menipis, stok habis, kedaluwarsa 30 hari",
                "Aktivitas gudang: PO menunggu, transfer masuk, siap dikirim",
            ]),
            ("Manajer / Kasir", [
                "Penjualan 7 hari: pendapatan, jumlah transaksi, rata-rata transaksi",
                "Grafik area penjualan harian & pie chart metode pembayaran",
                "Operasional hari ini: pengiriman, pesanan baru, tagihan jatuh tempo, transfer stok pending",
                "Stok menipis & habis di cabang sendiri",
            ]),
        ]),
        ("4.2 Manajemen Cabang", [
            ("Superadmin", [
                "Melihat daftar semua cabang (toko & gudang)",
                "Menambah cabang baru (nama, tipe, alamat, status aktif)",
                "Mengedit informasi cabang",
                "Mengaktifkan / menonaktifkan cabang",
            ]),
        ]),
        ("4.3 Manajemen Pengguna", [
            ("Superadmin", [
                "Melihat daftar semua pengguna lintas cabang",
                "Membuat pengguna baru (nama, email, password min. 8 karakter, role, cabang)",
                "Mengedit role dan cabang pengguna",
                "Reset password pengguna",
                "Menghapus pengguna",
            ]),
        ]),
        ("4.4 Produk & Kategori", [
            ("Superadmin", [
                "Menambah, mengedit, menonaktifkan produk",
                "Kelola kategori produk",
                "Generate SKU otomatis",
            ]),
            ("Admin / Manajer / Staf Gudang", [
                "Melihat daftar produk (read-only)",
                "Filter berdasarkan kategori, status stok, satuan",
            ]),
        ]),
        ("4.5 Inventori", [
            ("Admin / Manajer / Staf Gudang", [
                "Tab Stok: lihat stok per produk di cabang sendiri",
                "Tab Riwayat Pergerakan: masuk, keluar, penyesuaian stok",
                "Tab Supplier: tambah, edit, hapus data supplier",
                "Penyesuaian stok manual (koreksi, rusak, hilang, sampel, lainnya)",
                "Summary card: total produk, stok menipis, stok habis, kedaluwarsa",
            ]),
        ]),
        ("4.6 Purchase Order (PO)", [
            ("Admin / Staf Gudang  —  hanya cabang gudang", [
                "Membuat PO baru ke supplier",
                "Melihat daftar PO (filter status: Draft, Dikirim, Diterima Sebagian, Selesai, Dibatalkan)",
                "Detail PO: item, harga, status pembayaran",
                "Konfirmasi penerimaan barang (goods receipt)",
                "Pencatatan pembayaran PO",
                "Membatalkan PO",
                "Kirim PO ke supplier",
            ]),
        ]),
        ("4.7 Transfer Stok", [
            ("Admin / Manajer / Staf Gudang", [
                "Membuat permintaan transfer dari gudang ke toko",
                "Melihat daftar transfer (Menunggu Persetujuan, Disetujui, Dikirim, Diterima, Ditolak)",
                "Detail transfer: produk, jumlah, toko tujuan",
                "Menyetujui / menolak / mengirim / menerima transfer",
            ]),
        ]),
        ("4.8 Stok Opname", [
            ("Superadmin / Admin / Manajer / Staf Gudang", [
                "Membuat sesi stok opname baru",
                "Input jumlah fisik per produk",
                "Submit untuk review",
                "Approve stok opname (rekonsiliasi selisih otomatis)",
                "Riwayat stok opname yang pernah dilakukan",
            ]),
        ]),
        ("4.9 Pesanan", [
            ("Manajer / Kasir  —  hanya cabang toko", [
                "Tab Transaksi POS: lihat transaksi dari aplikasi kasir",
                "Tab Pesanan Manual: buat pesanan langsung dari CRM",
                "Filter status: Baru, Diproses, Siap Kirim, Dalam Pengiriman, Selesai, Dibatalkan",
                "Detail pesanan: item, pelanggan, total, metode bayar, retur",
                "Cetak struk & surat jalan",
                "Update status pesanan",
                "Proses retur pesanan",
            ]),
        ]),
        ("4.10 Pelanggan VIP", [
            ("Manajer  —  hanya cabang toko", [
                "Daftar pelanggan VIP dengan filter piutang (ada hutang, mendekati jatuh tempo, overdue)",
                "Summary card: total piutang, mendekati jatuh tempo, sudah jatuh tempo",
                "Detail pelanggan: info kontak, riwayat transaksi, daftar tagihan",
                "Tambah pelanggan VIP baru (kredit limit, jatuh tempo default)",
                "Catat pembayaran piutang",
                "Indikator badge per baris: overdue / mendekati JT",
            ]),
        ]),
        ("4.11 Pengiriman", [
            ("Manajer / Kasir  —  hanya cabang toko", [
                "Membuat jadwal pengiriman baru",
                "Daftar pengiriman (filter status: Dijadwalkan, Dalam Perjalanan, Selesai, Gagal)",
                "Detail pengiriman: pesanan yang dibawa, driver, biaya, checklist",
                "Update status pengiriman",
                "Upload bukti pengiriman",
                "Input biaya pengiriman",
            ]),
        ]),
        ("4.12 Laporan", [
            ("Admin / Manajer / Kasir", [
                "Laporan Penjualan: grafik area, metode pembayaran, filter rentang tanggal",
                "Laporan Stok: produk menipis & habis, pergerakan stok",
                "Laporan Shift: ringkasan per shift kasir, selisih kas",
                "Laporan Pembelian (gudang): PO dan penerimaan barang",
                "Laporan Pelanggan VIP: piutang dan pembayaran",
                "Laporan Pengiriman: rekap per periode",
                "Export PDF & Excel untuk semua jenis laporan",
            ]),
        ]),
        ("4.13 Log Audit", [
            ("Admin", [
                "Melihat semua aktivitas pengguna di sistem (create, update, delete)",
                "Filter berdasarkan pengguna, aksi, dan waktu",
            ]),
        ]),
        ("4.14 Notifikasi", [
            ("Semua Role", [
                "Menerima notifikasi real-time (stok menipis, PO baru, transfer masuk, dll.)",
                "Tandai notifikasi sebagai sudah dibaca",
                "Tandai semua sebagai sudah dibaca sekaligus",
                "Hapus notifikasi",
            ]),
        ]),
        ("4.15 Pengaturan", [
            ("Admin / Manajer", [
                "Update info toko/cabang: nama, alamat, nomor telepon",
                "Kelola kategori produk",
            ]),
        ]),
        ("4.16 Profil & Keamanan", [
            ("Semua Role", [
                "Ubah nama dan email profil",
                "Ganti password (wajib minimal 8 karakter, harus cocok dengan konfirmasi)",
            ]),
        ]),
    ]

    for feat_title, role_groups in features:
        story.append(KeepTogether([Paragraph(feat_title, H2)]))
        for role_name, items in role_groups:
            story.append(Paragraph(f"Dapat diakses oleh: <b>{role_name}</b>", H3))
            for item in items:
                story.append(Paragraph(f"• {item}", BODY))
            story.append(Spacer(1, 0.1*cm))

    # ── 5. TANIGO POS ─────────────────────────────────────────────────────────
    story.append(PageBreak())
    story += section_divider("5. Aplikasi TaniGo POS",
                              "Aplikasi kasir khusus untuk transaksi langsung di toko")

    story.append(info_box(
        "TaniGo POS digunakan oleh kasir toko. Semua transaksi di POS secara otomatis "
        "tercatat sebagai pesanan di CRM dan memengaruhi stok cabang secara real-time."
    ))
    story.append(Spacer(1, 0.4*cm))

    pos_features = [
        ("Halaman Transaksi", [
            "Grid produk: pencarian real-time, scan barcode, kartu produk dengan nama, harga, stok",
            "Produk stok habis ditampilkan disabled (tidak dapat dipilih)",
            "Keranjang belanja: tambah/kurangi qty, input desimal untuk satuan kg/liter",
            "Diskon per item",
            "Hold transaksi (tahan) dan resume (lanjutkan) — untuk melayani antrian",
            "Split payment: 3 metode sekaligus (Tunai, QRIS, Transfer Bank)",
            "Hitung kembalian otomatis untuk pembayaran tunai",
            "Struk digital: cetak printer & kirim via WhatsApp",
        ]),
        ("Manajemen Shift", [
            "Buka shift: input saldo awal kas",
            "Ringkasan shift aktif: total transaksi, pendapatan per metode pembayaran, diskon, retur",
            "Tutup shift: input saldo akhir aktual, hitung selisih kas otomatis",
            "Cetak laporan shift",
        ]),
        ("Retur Transaksi", [
            "Cari transaksi berdasarkan ID transaksi",
            "Pilih item yang akan diretur dan atur jumlah retur",
            "Pilih metode refund: Tunai atau Kredit",
            "Ringkasan total nilai refund sebelum konfirmasi",
        ]),
        ("Mode Offline", [
            "Aplikasi tetap berfungsi saat koneksi internet terputus",
            "Transaksi tersimpan di perangkat (IndexedDB)",
            "Sinkronisasi otomatis ke server saat koneksi pulih",
            "Banner status online/offline/sinkronisasi di bagian atas layar",
            "Tombol sync manual di sidebar",
        ]),
        ("Keamanan & Autentikasi", [
            "Login dengan email & password",
            "Token JWT dengan refresh otomatis",
            "Halaman terlindungi — redirect ke login jika belum masuk",
            "Mode Demo tersedia untuk keperluan demo tanpa backend",
        ]),
    ]

    for title, items in pos_features:
        story.append(Paragraph(title, H2))
        for item in items:
            story.append(Paragraph(f"• {item}", BODY))
        story.append(Spacer(1, 0.2*cm))

    # ── 6. ALUR KERJA UTAMA ────────────────────────────────────────────────────
    story.append(PageBreak())
    story += section_divider("6. Alur Kerja Utama", "End-to-end flow transaksi dalam sistem TaniGo")

    flows = [
        ("Alur Transaksi Toko (POS → CRM)", [
            ("1", "Kasir membuka shift di TaniGo POS (input saldo awal kas)"),
            ("2", "Kasir memilih produk, input qty, tambahkan ke keranjang"),
            ("3", "Kasir memproses pembayaran (tunai / QRIS / transfer, bisa split)"),
            ("4", "Sistem mencetak/mengirim struk, memotong stok cabang secara real-time"),
            ("5", "Transaksi tercatat di CRM → menu Pesanan (tab Transaksi POS)"),
            ("6", "Kasir menutup shift, input saldo akhir, cetak laporan shift"),
        ]),
        ("Alur Pesanan Manual (CRM → Pengiriman)", [
            ("1", "Manajer/Kasir membuat pesanan baru di CRM (pilih pelanggan, produk, qty)"),
            ("2", "Status pesanan: Baru → Diproses → Siap Kirim"),
            ("3", "Manajer membuat jadwal pengiriman, assign driver"),
            ("4", "Driver berangkat → status: Dalam Perjalanan"),
            ("5", "Konfirmasi pengiriman selesai → upload bukti → status: Selesai"),
        ]),
        ("Alur Pengadaan Stok Gudang", [
            ("1", "Admin/Staf membuat Purchase Order ke supplier"),
            ("2", "Kirim PO ke supplier → status: Dikirim"),
            ("3", "Barang datang → konfirmasi penerimaan (goods receipt)"),
            ("4", "Stok gudang bertambah otomatis"),
            ("5", "Pembayaran PO dicatat"),
        ]),
        ("Alur Transfer Stok Gudang → Toko", [
            ("1", "Toko mengajukan permintaan transfer stok ke gudang"),
            ("2", "Gudang menerima notifikasi, meninjau permintaan"),
            ("3", "Gudang menyetujui dan mengirim stok"),
            ("4", "Toko mengkonfirmasi penerimaan → stok toko bertambah"),
        ]),
        ("Alur Piutang Pelanggan VIP", [
            ("1", "Pelanggan VIP membeli dengan metode kredit"),
            ("2", "Tagihan tercatat di sistem dengan tanggal jatuh tempo"),
            ("3", "Sistem memberi peringatan (badge/filter) saat mendekati/melewati jatuh tempo"),
            ("4", "Pelanggan melakukan pembayaran → dicatat di CRM"),
            ("5", "Saldo piutang berkurang otomatis"),
        ]),
    ]

    for flow_title, steps in flows:
        story.append(Paragraph(flow_title, H2))
        step_data = [[Paragraph(no, style(f"sno", fontSize=8, textColor=WHITE, fontName="Helvetica-Bold",
                       alignment=TA_CENTER)),
                      Paragraph(desc, BODY)] for no, desc in steps]
        step_table = Table(step_data, colWidths=[0.8*cm, 15.7*cm])
        step_table.setStyle(TableStyle([
            ("BACKGROUND",   (0,0), (0,-1), GREEN),
            ("VALIGN",       (0,0), (-1,-1), "TOP"),
            ("TOPPADDING",   (0,0), (-1,-1), 4),
            ("BOTTOMPADDING",(0,0), (-1,-1), 4),
            ("LEFTPADDING",  (0,0), (-1,-1), 5),
            ("RIGHTPADDING", (0,0), (-1,-1), 5),
            ("ROWBACKGROUNDS",(1,0), (1,-1), [WHITE, GRAY_100]),
            ("LINEBELOW",    (0,0), (-1,-2), 0.3, GRAY_200),
        ]))
        story.append(step_table)
        story.append(Spacer(1, 0.4*cm))

    # ── 7. BAGAIMANA PRODUK BISA TAMPIL DI POS ───────────────────────────────
    story.append(PageBreak())
    story += section_divider(
        "7. Bagaimana Produk Bisa Tampil di POS",
        "Alur lengkap dari pengadaan barang hingga produk tersedia di kasir toko"
    )

    story.append(info_box(
        "Produk di TaniGo POS hanya tampil jika <b>stok cabang toko > 0</b>. "
        "Stok toko tidak bisa diisi langsung — harus melalui alur pengadaan yang terstruktur. "
        "Ada tiga jalur yang bisa menambah atau mengoreksi stok toko."
    ))
    story.append(Spacer(1, 0.5*cm))

    # ── Diagram overview ──────────────────────────────────────────────────────
    story.append(Paragraph("Gambaran Alur Keseluruhan", H2))

    chain_data = [
        [
            Paragraph("Superadmin\nbuat produk\ndi katalog", style("ch0", fontSize=8, fontName="Helvetica-Bold",
                       textColor=WHITE, alignment=TA_CENTER)),
            Paragraph("→", style("arr", fontSize=14, fontName="Helvetica-Bold", textColor=GRAY_400, alignment=TA_CENTER)),
            Paragraph("Gudang terima\nstok dari\nsupplier (PO)", style("ch1", fontSize=8, fontName="Helvetica-Bold",
                       textColor=WHITE, alignment=TA_CENTER)),
            Paragraph("→", style("arr2", fontSize=14, fontName="Helvetica-Bold", textColor=GRAY_400, alignment=TA_CENTER)),
            Paragraph("Toko terima\nstok dari\ngudang", style("ch2", fontSize=8, fontName="Helvetica-Bold",
                       textColor=WHITE, alignment=TA_CENTER)),
            Paragraph("→", style("arr3", fontSize=14, fontName="Helvetica-Bold", textColor=GRAY_400, alignment=TA_CENTER)),
            Paragraph("Produk\ntampil\ndi POS", style("ch3", fontSize=8, fontName="Helvetica-Bold",
                       textColor=WHITE, alignment=TA_CENTER)),
        ]
    ]
    chain = Table(chain_data, colWidths=[3.2*cm, 0.8*cm, 3.2*cm, 0.8*cm, 3.2*cm, 0.8*cm, 3.2*cm])
    chain.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (0,0), colors.HexColor("#7c3aed")),  # superadmin purple
        ("BACKGROUND",   (2,0), (2,0), colors.HexColor("#dc2626")),  # gudang red
        ("BACKGROUND",   (4,0), (4,0), colors.HexColor("#2563eb")),  # toko blue
        ("BACKGROUND",   (6,0), (6,0), GREEN),                        # POS green
        ("BACKGROUND",   (1,0), (1,0), WHITE),
        ("BACKGROUND",   (3,0), (3,0), WHITE),
        ("BACKGROUND",   (5,0), (5,0), WHITE),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN",        (0,0), (-1,-1), "CENTER"),
        ("TOPPADDING",   (0,0), (-1,-1), 10),
        ("BOTTOMPADDING",(0,0), (-1,-1), 10),
    ]))
    story.append(chain)
    story.append(Spacer(1, 0.5*cm))

    # ── Jalur 1: PO Supplier ──────────────────────────────────────────────────
    story.append(Paragraph("Jalur 1 — Pengadaan dari Supplier (Purchase Order)", H2))
    story.append(Paragraph(
        "Jalur utama untuk mengisi stok gudang. Dilakukan oleh Admin atau Staf Gudang.", BODY))

    po_steps = [
        ("1", "Superadmin mendaftarkan produk baru di katalog (nama, SKU, satuan, kategori, harga)"),
        ("2", "Admin/Staf Gudang membuat Purchase Order (PO) ke supplier — memilih produk dan jumlah yang dipesan"),
        ("3", "PO dikirim ke supplier → status berubah menjadi <b>Dikirim</b>"),
        ("4", "Barang tiba di gudang → Admin/Staf melakukan konfirmasi penerimaan (goods receipt)"),
        ("5", "Stok gudang bertambah otomatis sesuai jumlah yang diterima"),
        ("6", "Pembayaran ke supplier dicatat di sistem"),
    ]

    po_table = Table(
        [[Paragraph(no, style(f"pno{no}", fontSize=8, textColor=WHITE, fontName="Helvetica-Bold",
                    alignment=TA_CENTER)),
          Paragraph(desc, BODY)] for no, desc in po_steps],
        colWidths=[0.8*cm, 15.7*cm]
    )
    po_table.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(0,-1), colors.HexColor("#dc2626")),
        ("VALIGN",       (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 5),
        ("RIGHTPADDING", (0,0),(-1,-1), 5),
        ("ROWBACKGROUNDS",(1,0),(1,-1), [WHITE, GRAY_100]),
        ("LINEBELOW",    (0,0),(-1,-2), 0.3, GRAY_200),
    ]))
    story.append(po_table)
    story.append(Spacer(1, 0.5*cm))

    # ── Jalur 2: Transfer Stok ────────────────────────────────────────────────
    story.append(Paragraph("Jalur 2 — Transfer Stok dari Gudang ke Toko", H2))
    story.append(Paragraph(
        "Setelah stok ada di gudang, toko mengajukan permintaan transfer. "
        "Inilah jalur utama agar produk bisa muncul di POS kasir.", BODY))

    ts_steps = [
        ("1", "Manajer/Staf Toko mengajukan permintaan transfer stok melalui menu Transfer Stok di CRM"),
        ("2", "Gudang menerima notifikasi permintaan transfer"),
        ("3", "Admin/Staf Gudang meninjau dan <b>menyetujui</b> permintaan → status: Disetujui"),
        ("4", "Gudang mengirim barang ke toko → status: Dikirim — stok gudang berkurang"),
        ("5", "Toko mengkonfirmasi penerimaan barang → status: Diterima — <b>stok toko bertambah</b>"),
        ("6", "Produk kini tampil di TaniGo POS dengan stok yang tersedia untuk dijual"),
    ]

    ts_table = Table(
        [[Paragraph(no, style(f"tsno{no}", fontSize=8, textColor=WHITE, fontName="Helvetica-Bold",
                    alignment=TA_CENTER)),
          Paragraph(desc, BODY)] for no, desc in ts_steps],
        colWidths=[0.8*cm, 15.7*cm]
    )
    ts_table.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(0,-1), colors.HexColor("#2563eb")),
        ("VALIGN",       (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 5),
        ("RIGHTPADDING", (0,0),(-1,-1), 5),
        ("ROWBACKGROUNDS",(1,0),(1,-1), [WHITE, GRAY_100]),
        ("LINEBELOW",    (0,0),(-1,-2), 0.3, GRAY_200),
    ]))
    story.append(ts_table)
    story.append(Spacer(1, 0.5*cm))

    # ── Jalur 3: Stok Opname ─────────────────────────────────────────────────
    story.append(Paragraph("Jalur 3 — Koreksi Stok via Stok Opname", H2))
    story.append(Paragraph(
        "Stok opname digunakan untuk mencocokkan stok sistem dengan kondisi fisik di lapangan. "
        "Ini bukan jalur utama pengisian stok, tetapi bisa menambah atau mengurangi stok "
        "jika ditemukan selisih antara catatan sistem dan jumlah fisik sebenarnya.", BODY))

    so_steps = [
        ("1", "Admin/Manajer/Staf membuat sesi stok opname baru di CRM"),
        ("2", "Input jumlah fisik aktual per produk (hasil hitung di lapangan)"),
        ("3", "Submit sesi untuk di-review — sistem menghitung selisih (sistem vs fisik)"),
        ("4", "Admin/Superadmin meng-approve stok opname"),
        ("5", "Stok sistem diperbarui otomatis sesuai jumlah fisik — selisih positif menambah stok, negatif mengurangi"),
        ("6", "Jika stok bertambah akibat opname, produk otomatis tersedia di POS"),
    ]

    so_table = Table(
        [[Paragraph(no, style(f"sono{no}", fontSize=8, textColor=WHITE, fontName="Helvetica-Bold",
                    alignment=TA_CENTER)),
          Paragraph(desc, BODY)] for no, desc in so_steps],
        colWidths=[0.8*cm, 15.7*cm]
    )
    so_table.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(0,-1), colors.HexColor("#d97706")),
        ("VALIGN",       (0,0),(-1,-1), "TOP"),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 5),
        ("RIGHTPADDING", (0,0),(-1,-1), 5),
        ("ROWBACKGROUNDS",(1,0),(1,-1), [WHITE, GRAY_100]),
        ("LINEBELOW",    (0,0),(-1,-2), 0.3, GRAY_200),
    ]))
    story.append(so_table)
    story.append(Spacer(1, 0.4*cm))

    # ── Summary table ─────────────────────────────────────────────────────────
    story.append(Paragraph("Ringkasan Tiga Jalur", H2))
    summary_data = [
        [Paragraph("Jalur", TH), Paragraph("Pelaku", TH),
         Paragraph("Hasil", TH), Paragraph("Keterangan", TH)],
        [Paragraph("Purchase Order", TD),
         Paragraph("Admin / Staf Gudang", TD),
         Paragraph("Stok gudang bertambah", TD),
         Paragraph("Jalur utama pengadaan dari supplier eksternal", TD)],
        [Paragraph("Transfer Stok", TD),
         Paragraph("Toko → Gudang", TD),
         Paragraph("Stok toko bertambah", TD),
         Paragraph("Jalur utama agar produk muncul di POS", TD)],
        [Paragraph("Stok Opname", TD),
         Paragraph("Admin / Manajer / Staf", TD),
         Paragraph("Koreksi stok (±)", TD),
         Paragraph("Penyesuaian jika ada selisih fisik vs sistem", TD)],
    ]
    summary_tbl = Table(summary_data, colWidths=[3.5*cm, 3.5*cm, 4*cm, 5.5*cm])
    summary_tbl.setStyle(base_ts())
    story.append(summary_tbl)
    story.append(Spacer(1, 0.3*cm))
    story.append(info_box(
        "<b>Catatan:</b> Produk harus terlebih dahulu didaftarkan oleh Superadmin di menu Produk "
        "sebelum bisa masuk ke alur PO atau Transfer Stok. Produk tanpa stok di cabang toko "
        "akan tetap tampil di POS namun dalam kondisi disabled (tidak bisa dipilih)."
    ))

    # ── 8. STATUS & TERMINOLOGI ────────────────────────────────────────────────
    story.append(PageBreak())
    story += section_divider("8. Status & Terminologi", "Referensi status yang digunakan dalam sistem")

    status_groups = [
        ("Status Pesanan", [
            ("Baru",              "Pesanan baru masuk, belum diproses"),
            ("Diproses",          "Sedang disiapkan/dikemas"),
            ("Siap Kirim",        "Sudah dikemas, menunggu pengiriman"),
            ("Dalam Pengiriman",  "Sedang dalam perjalanan ke pelanggan"),
            ("Selesai",           "Pesanan diterima pelanggan"),
            ("Dibatalkan",        "Pesanan dibatalkan"),
        ]),
        ("Status Pengiriman", [
            ("Dijadwalkan",       "Pengiriman sudah dibuat, belum berangkat"),
            ("Dalam Perjalanan",  "Driver sedang dalam perjalanan"),
            ("Selesai",           "Barang sudah diterima pelanggan"),
            ("Gagal",             "Pengiriman gagal (pelanggan tidak ada, dll.)"),
        ]),
        ("Status Purchase Order", [
            ("Draft",             "PO dibuat, belum dikirim ke supplier"),
            ("Dikirim",           "PO sudah dikirim ke supplier"),
            ("Diterima Sebagian", "Sebagian barang sudah diterima"),
            ("Selesai",           "Semua barang sudah diterima"),
            ("Dibatalkan",        "PO dibatalkan"),
        ]),
        ("Status Transfer Stok", [
            ("Menunggu Persetujuan", "Permintaan transfer belum disetujui gudang"),
            ("Disetujui",            "Gudang sudah menyetujui permintaan"),
            ("Dikirim",              "Stok sudah dikirim dari gudang"),
            ("Diterima",             "Toko sudah menerima stok"),
            ("Ditolak",              "Permintaan transfer ditolak gudang"),
        ]),
        ("Status Stok", [
            ("Tersedia",   "Stok di atas batas minimum"),
            ("Menipis",    "Stok di bawah batas minimum, perlu restock"),
            ("Habis",      "Stok = 0, produk tidak tersedia"),
        ]),
        ("Status Piutang VIP", [
            ("Ada Hutang",            "Pelanggan memiliki tagihan yang belum lunas"),
            ("Mendekati Jatuh Tempo", "Tagihan jatuh tempo dalam waktu dekat"),
            ("Jatuh Tempo / Overdue", "Tagihan sudah melewati tanggal jatuh tempo"),
        ]),
    ]

    for group_title, statuses in status_groups:
        story.append(Paragraph(group_title, H2))
        s_data = [[Paragraph("Status", TH), Paragraph("Keterangan", TH)]]
        for s, desc in statuses:
            s_data.append([Paragraph(s, TD), Paragraph(desc, TD)])
        s_table = Table(s_data, colWidths=[5*cm, 11.5*cm])
        s_table.setStyle(base_ts())
        story.append(s_table)
        story.append(Spacer(1, 0.35*cm))

    # ── PAGE NUMBERS ─────────────────────────────────────────────────────────
    def on_page(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(GRAY_400)
        canvas.drawRightString(A4[0] - 2*cm, 1.2*cm,
                               f"TaniGo Dokumentasi Sistem  ·  Halaman {doc.page}")
        canvas.drawString(2*cm, 1.2*cm, "© TaniGo — Confidential")
        canvas.restoreState()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF generated: {OUTPUT}")

build()
