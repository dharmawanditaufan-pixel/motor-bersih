# GitHub Secrets Setup untuk Auto-Deploy

## Cara Setup GitHub Repository Secrets

### 1. Buka GitHub Repository Settings
1. Pergi ke: https://github.com/dharmawanditaufan-pixel/motor-bersih
2. Klik **Settings** (tab paling kanan)
3. Di sidebar kiri, klik **Secrets and variables** → **Actions**
4. Klik **New repository secret**

### 2. Tambahkan 3 Secrets Berikut

#### Secret 1: VERCEL_TOKEN
- **Name:** `VERCEL_TOKEN`
- **Value:** [Dapatkan dari Vercel]
  - Login ke https://vercel.com
  - Klik **Settings** (kanan atas)
  - Klik **Tokens** di sidebar
  - Klik **Create Token**
  - Beri nama: "GitHub Actions Deploy"
  - Copy token yang muncul
  - Paste di GitHub Secret

#### Secret 2: VERCEL_ORG_ID
- **Name:** `VERCEL_ORG_ID`
- **Value:** `team_k2nFyyIizP8IaFtTDTWHi6BS`
  - (Sudah didapat dari .vercel/project.json)

#### Secret 3: VERCEL_PROJECT_ID
- **Name:** `VERCEL_PROJECT_ID`
- **Value:** `prj_qTSr7Dx7D03HSeSj7o2XlfZGUdur`
  - (Sudah didapat dari .vercel/project.json)

## Verifikasi Setup

Setelah semua secrets ditambahkan:

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "Setup auto-deploy workflow"
   git push origin main
   ```

2. **Cek Workflow:**
   - Pergi ke tab **Actions** di GitHub repository
   - Klik workflow "Deploy to Vercel"
   - Pastikan berjalan tanpa error

3. **Manual Trigger:**
   - Di tab Actions, pilih workflow "Deploy to Vercel"
   - Klik **Run workflow** → **Run workflow**
   - Deploy akan berjalan otomatis

## Warning YAML Linter

⚠️ Warning "Context access might be invalid" adalah **normal** dan akan hilang setelah secrets di-setup di GitHub.

Ini bukan error code, tapi reminder dari VS Code bahwa secrets perlu dikonfigurasi di repository settings.

## Keuntungan Auto-Deploy

✅ Setiap push ke branch `main` → Auto-deploy ke Vercel production
✅ Tidak perlu jalankan `vercel --prod` manual
✅ Build artifacts tersimpan di GitHub Actions
✅ History deployment tercatat
✅ Bisa rollback dengan mudah

## Troubleshooting

**Q: Workflow gagal dengan error "Missing VERCEL_TOKEN"**
A: Pastikan semua 3 secrets sudah ditambahkan di repository settings

**Q: Deploy berhasil tapi website tidak update**
A: Cek apakah branch yang di-push adalah `main` atau `master`

**Q: Bagaimana cara disable auto-deploy?**
A: Hapus atau rename file `.github/workflows/deploy-vercel.yml`
