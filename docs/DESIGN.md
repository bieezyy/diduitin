# DESIGN.md — diduitin Visual Guidelines

## 1. Konsep & Karakter
- **Tema**: *Clean Neo-Brutalism Gen-Z*.
- **Mood**: Tegas, jujur, playful, tidak bertele-tele, kontras tinggi, modern.
- **Dials (Anti-Slop Standard)**:
  - **ENERGY**: 2 (Balanced - Punchy & modern, tidak heboh berlebihan).
  - **RHYTHM**: 2 (Consistent hierarchy dengan visual accent cards).
  - **MOTION**: 1 (Micro-interaction tegas: instant snap hover, active tap compression).

## 2. Warna & Palet (Neo-Brutalist Palette)
- **Canvas Base**: `#F9F9FB` (Light cool paper) / `#FFFFFF`.
- **Ink / Line**: `#121214` (Solid pitch dark border & text).
- **Hard Border**: `2px` atau `3px` solid `#121214`.
- **Hard Box Shadows**: `3px 3px 0px #121214` atau `4px 4px 0px #121214` (tanpa blur gaussian).
- **Aksen Fungsional**:
  - **Neo Lime** (`#A3E635` / `#BEF264`): Status aman, pemasukan (+), tombol konfirmasi utama.
  - **Cyber Yellow** (`#FDE047` / `#FACC15`): Status waspada, highlight saldo, filter aktif.
  - **Punch Coral / Red** (`#FB7185` / `#F43F5E`): Pengeluaran (-), peringatan boncos/limit terlampaui.
  - **Electric Lavender** (`#C084FC` / `#DDD6FE`): Aksen transfer & kategori sekunder.
  - **Sky Blue** (`#38BDF8` / `#BAE6FD`): Aksen dompet digital / tabulasi.

## 3. Tipografi
- **Headline / Display**: Sans-serif geometric tebal (`font-black` / `font-bold`), uppercase pada tag & label singkat.
- **Numbers / Currencies**: Tabular numbers dengan tracking ketat (`font-mono` atau sans tebal) agar mudah dibaca cepat saat scrolling.
- **Body**: Clean readable sans (`Inter`, `Plus Jakarta Sans`, atau system-ui sans).

## 4. Komponen & Anti-Slop Safeguards
- **Bukan Bento-Grid Basi**: Tiap card dirancang proporsional sesuai fungsinya, bukan kumpulan kotak ukuran random tanpa hierarki.
- **Tombol & Tap Target**: Minimal 48px tinggi tap target untuk kenyamanan sentuhan jari di HP. Efek tekan (*active state*): `transform: translate(2px, 2px)` dengan reduksi shadow.
- **Tagar Kategori**: Pill badges dengan border tipis hitam dan background warna pastel aksen.
- **Tidak Ada Slop**:
  - Dilarang memakai gradient ungu-biru generik AI.
  - Dilarang teks abu-abu pudar di atas putih (WCAG AA Contrast minimum 4.5:1 terjamin).
  - Dilarang efek blur kaca (glassmorphism) yang membebani rendering HP.
