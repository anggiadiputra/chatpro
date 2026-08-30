import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | Pro.Chat",
  description:
    "Kebijakan penggunaan yang dapat diterima (AUP) untuk platform Pro.Chat, panduan praktek yang diperbolehkan dan dilarang.",
};

export default function AcceptableUsePolicy() {
  return (
    <>
      <section className="relative pt-8 pb-12 lg:pt-12 lg:pb-16 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#22c55e]/8 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-20 w-32 h-32 bg-[#db2777]/15 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-[#f59e0b]/20 rounded-full blur-xl"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 badge-pill bg-[#dcfce7] border-[#22c55e] mb-6">
              <span className="w-7 h-7 rounded-full flex items-center justify-center bg-[#db2777] text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                  <path d="M12 8v4"></path>
                  <path d="M12 16h.01"></path>
                </svg>
              </span>
              <span className="text-[#1e293b] font-semibold text-sm">Dokumen Legal</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Acceptable Use Policy
            </h1>

            {/* Last updated */}
            <p className="text-sm text-[#64748b]">
              Terakhir diperbarui: <span className="font-medium text-[#1e293b]">4 Juni 2026</span>
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 lg:px-8 max-w-6xl pb-16">
        <article className="bg-white border-2 border-[#1e293b] rounded-2xl p-6 md:p-10 lg:p-12 shadow-pop max-w-4xl mx-auto">
          <div className="space-y-6 text-[#64748b]">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-2 mb-4">1. Mengapa AUP Ini Ada</h2>
            <p>
              Pro.Chat adalah perangkat lunak yang berjalan di atas platform Meta (WhatsApp Business,
              Instagram, dan Facebook Messenger). Kebijakan ini menjelaskan apa yang boleh dan tidak boleh
              Anda lakukan saat menggunakan Pro.Chat, supaya:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Akun saluran Anda tetap dalam kondisi baik di sisi Meta</li>
              <li>Pengguna Pro.Chat lain tidak terdampak oleh penyalahgunaan</li>
              <li>Penerima pesan tidak dirugikan</li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">2. Praktek yang Dilarang</h2>
            <p>Anda dilarang menggunakan Pro.Chat untuk:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-[#1e293b]">Spam</strong> &mdash; mengirim pesan massal kepada orang yang tidak memberi izin untuk dihubungi
              </li>
              <li>
                <strong className="text-[#1e293b]">Penipuan</strong> &mdash; phishing, scam, penyamaran sebagai brand/orang lain, skema cepat kaya
              </li>
              <li>
                <strong className="text-[#1e293b]">Judi ilegal</strong> &mdash; promosi atau operasional perjudian yang tidak berlisensi
              </li>
              <li>
                <strong className="text-[#1e293b]">Pinjaman ilegal</strong> &mdash; pinjol tanpa izin OJK, debt collection yang melanggar etika
              </li>
              <li>
                <strong className="text-[#1e293b]">Hoax</strong> &mdash; penyebaran informasi palsu yang sengaja menyesatkan
              </li>
              <li>
                <strong className="text-[#1e293b]">Konten dewasa</strong> &mdash; pornografi atau konten seksual eksplisit
              </li>
              <li>
                <strong className="text-[#1e293b]">Kekerasan &amp; kebencian</strong> &mdash; ajakan kekerasan, ujaran kebencian, intimidasi
              </li>
              <li>
                <strong className="text-[#1e293b]">Narkoba &amp; barang ilegal</strong> &mdash; penjualan zat terlarang atau barang yang tidak boleh diperjualbelikan
              </li>
              <li>
                <strong className="text-[#1e293b]">MLM piramida</strong> &mdash; skema yang pendapatannya bergantung pada rekrutmen, bukan penjualan produk nyata
              </li>
              <li>
                <strong className="text-[#1e293b]">Pelanggaran hak orang lain</strong> &mdash; pelanggaran hak cipta, merek, privasi, atau hak pribadi
              </li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              3. Tanggung Jawab Anda atas Kepatuhan Platform Meta
            </h2>
            <p>
              Karena Anda yang memiliki akun di Meta, Anda yang bertanggung jawab penuh untuk mematuhi
              kebijakan masing-masing platform, antara lain:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>WhatsApp Business Policy, Messaging Policy, dan Commerce Policy</li>
              <li>Instagram Community Guidelines dan Platform Policy</li>
              <li>Facebook Community Standards dan Messenger Platform Policy</li>
            </ul>
            <p>
              Pastikan setiap penerima pesan sudah memberi izin (opt-in) sebelum Anda mengirim pesan kepada
              mereka. Sediakan cara mudah untuk berhenti berlangganan (opt-out) dan hormati permintaan
              tersebut.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              4. Praktek Teknis yang Dilarang
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mencoba mengakses akun, organisasi, atau data pengguna Pro.Chat lain</li>
              <li>Reverse engineering, dekompilasi, atau upaya membuka source code Pro.Chat</li>
              <li>Membebani API atau infrastruktur Pro.Chat di luar batas yang wajar</li>
              <li>Menggunakan bot atau automation untuk membuat banyak akun fiktif</li>
              <li>Menjual kembali akses Pro.Chat dengan cara yang menyamarkan asal layanan</li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              5. Tentang Ban / Suspend dari Meta
            </h2>
            <p>
              Meta adalah yang menentukan status akun Anda di WhatsApp Business, Instagram, dan Facebook.
              Mereka bisa membatasi, menangguhkan, atau memblokir akun Anda berdasarkan kebijakan mereka
              sendiri, dengan atau tanpa pemberitahuan, dengan atau tanpa alasan yang diungkap kepada Anda.
            </p>
            <p>
              Pro.Chat <strong className="text-[#1e293b]">tidak punya kendali</strong> atas keputusan
              tersebut dan <strong className="text-[#1e293b]">tidak bisa</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Membatalkan ban atau suspend yang sudah dijatuhkan Meta</li>
              <li>Mengajukan banding atas nama Anda</li>
              <li>Memberi tahu alasan spesifik di balik keputusan Meta</li>
              <li>Mempercepat proses review di sisi Meta</li>
              <li>Mengganti kerugian yang Anda alami akibat keputusan Meta</li>
            </ul>
            <p>
              Kalau akun Anda kena ban atau suspend, jalur penyelesaiannya adalah langsung kepada Meta
              melalui Help Center platform yang bersangkutan.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              6. Konsekuensi Pelanggaran AUP
            </h2>
            <p>Kalau kami menemukan indikasi pelanggaran AUP ini, kami bisa:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Memberi peringatan dan meminta penjelasan</li>
              <li>Menangguhkan akun untuk sementara selama investigasi</li>
              <li>Membatasi fitur tertentu</li>
              <li>Menghentikan akun secara permanen untuk pelanggaran berat atau berulang</li>
            </ul>
            <p>
              Untuk pelanggaran yang dilakukan dengan sengaja atau berdampak luas, kami bisa langsung
              menghentikan akun tanpa peringatan. Biaya langganan untuk periode berjalan tidak dikembalikan
              dalam kasus pelanggaran.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">7. Pelaporan</h2>
            <p>
              Kalau Anda menemukan pengguna Pro.Chat yang melanggar kebijakan ini, laporkan ke{" "}
              <a href="mailto:support@prochat.work" className="text-[#22c55e] hover:underline font-semibold">
                support@prochat.work
              </a>{" "}
              dengan menyertakan bukti terkait.
            </p>
          </div>
        </article>
      </div>

      {/* Cross links */}
      <section className="relative bg-[#f1f5f9]/30 py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 right-10 w-48 h-48 bg-[#22c55e]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#8b5cf6]/10 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Dokumen Legal Lainnya</h2>
              <p className="text-[#64748b]">Baca juga dokumen pendukung yang melengkapi halaman ini.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <Link
                href="/privacy-policy"
                className="group flex items-start gap-4 p-5 bg-white border-2 border-[#1e293b] rounded-2xl shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-pop-hover transition-all duration-200"
              >
                <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[#8b5cf6] text-white border-2 border-[#1e293b]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
                    <path d="M14 2v5a1 1 0 0 0 1 1h5"></path>
                    <path d="M10 9H8"></path>
                    <path d="M16 13H8"></path>
                    <path d="M16 17H8"></path>
                  </svg>
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1e293b] group-hover:text-[#22c55e] transition-colors">
                    Privacy Policy
                  </h3>
                  <p className="text-sm text-[#64748b] mt-1">Bagaimana data Anda dikumpulkan dan dilindungi</p>
                </div>
              </Link>

              <Link
                href="/terms"
                className="group flex items-start gap-4 p-5 bg-white border-2 border-[#1e293b] rounded-2xl shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-pop-hover transition-all duration-200"
              >
                <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[#22c55e] text-white border-2 border-[#1e293b]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3v18"></path>
                    <path d="m19 8 3 8a5 5 0 0 1-6 0zV7"></path>
                    <path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"></path>
                    <path d="m5 8 3 8a5 5 0 0 1-6 0zV7"></path>
                    <path d="M7 21h10"></path>
                  </svg>
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1e293b] group-hover:text-[#22c55e] transition-colors">
                    Terms of Service
                  </h3>
                  <p className="text-sm text-[#64748b] mt-1">Syarat dan ketentuan penggunaan layanan</p>
                </div>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center text-sm text-[#64748b]">
              <span className="inline-flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                </svg>
                Pertanyaan terkait dokumen legal?
              </span>
              <a href="mailto:support@prochat.work" className="font-semibold text-[#22c55e] hover:underline">
                support@prochat.work
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
