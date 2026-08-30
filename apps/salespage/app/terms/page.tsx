import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Pro.Chat",
  description:
    "Syarat dan ketentuan penggunaan platform Pro.Chat untuk layanan WhatsApp Business API dan Instagram DM.",
};

export default function TermsOfService() {
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
              <span className="w-7 h-7 rounded-full flex items-center justify-center bg-[#22c55e] text-white">
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
                  <path d="M12 3v18"></path>
                  <path d="m19 8 3 8a5 5 0 0 1-6 0zV7"></path>
                  <path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"></path>
                  <path d="m5 8 3 8a5 5 0 0 1-6 0zV7"></path>
                  <path d="M7 21h10"></path>
                </svg>
              </span>
              <span className="text-[#1e293b] font-semibold text-sm">Dokumen Legal</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Terms of Service
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
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-2 mb-4">1. Tentang Layanan Ini</h2>
            <p>
              Pro.Chat adalah perangkat lunak (software-as-a-service) yang membantu Anda mengelola
              percakapan pelanggan dari berbagai saluran, termasuk WhatsApp Business, Instagram Direct
              Message, dan Facebook Messenger. Kami menyediakan dashboard dan integrasi yang berjalan di
              atas API resmi milik Meta.
            </p>
            <p>
              Dengan mendaftar atau menggunakan Pro.Chat, Anda setuju dengan ketentuan ini. Kalau tidak
              setuju, mohon untuk tidak menggunakan layanan.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              2. Hubungan Anda dengan Meta (WhatsApp, Instagram, Facebook)
            </h2>
            <p>Ini bagian terpenting yang perlu Anda pahami sebelum menggunakan Pro.Chat:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Akun WhatsApp Business, akun Instagram, halaman Facebook, nomor telepon, template pesan,
                dan semua biaya yang dikenakan oleh Meta adalah{" "}
                <strong className="text-[#1e293b]">milik dan tanggung jawab Anda sepenuhnya</strong>.
              </li>
              <li>
                Anda berhubungan langsung dengan Meta untuk hal-hal seperti verifikasi bisnis, pendaftaran
                template, pembayaran biaya percakapan, dan kepatuhan terhadap kebijakan masing-masing
                platform.
              </li>
              <li>
                Pro.Chat <strong className="text-[#1e293b]">bukan</strong> pihak dalam hubungan antara Anda
                dan Meta. Kami hanya menyediakan perangkat lunak untuk mempermudah pekerjaan Anda di atas
                API yang Meta sediakan.
              </li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              3. Hal-hal yang BUKAN Tanggung Jawab Pro.Chat
            </h2>
            <p>
              Karena Pro.Chat hanyalah perangkat lunak yang berjalan di atas platform Meta, kami{" "}
              <strong className="text-[#1e293b]">tidak bertanggung jawab</strong> atas:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Penangguhan, pembatasan, atau pemblokiran akun WhatsApp Business, Instagram, atau halaman
                Facebook Anda oleh Meta
              </li>
              <li>Penolakan, penangguhan, atau penghapusan template pesan oleh Meta</li>
              <li>Penurunan messaging tier, quality rating, atau pembatasan jangkauan oleh Meta</li>
              <li>Perubahan kebijakan, harga, fitur, atau ketersediaan platform Meta</li>
              <li>
                Gangguan, downtime, atau perubahan teknis di sisi WhatsApp Cloud API, Instagram Graph API,
                atau Messenger Platform
              </li>
              <li>Konten pesan yang Anda kirimkan dan dampaknya terhadap penerima maupun bisnis Anda</li>
              <li>Konsekuensi dari ketidakpatuhan Anda terhadap kebijakan platform Meta yang relevan</li>
            </ul>
            <p>
              Semua hal di atas berada di luar kendali Pro.Chat. Keputusan ada di tangan Meta, dan kami
              tidak memiliki akses untuk membatalkan, banding, atau mempercepat proses apapun di sisi
              mereka.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">4. Akun Anda</h2>
            <p>
              Anda bertanggung jawab menjaga kerahasiaan kredensial akun Pro.Chat dan akun saluran
              (WhatsApp, Instagram, Facebook) milik Anda. Beritahu kami segera kalau ada penggunaan yang
              tidak Anda izinkan.
            </p>
            <p>
              Anda harus cukup umur dan memiliki kapasitas untuk membuat perjanjian yang mengikat.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              5. Penggunaan yang Diperbolehkan
            </h2>
            <p>
              Gunakan Pro.Chat hanya untuk tujuan yang sah dan sesuai kebijakan masing-masing platform
              Meta. Yang dilarang antara lain:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mengirim spam atau pesan massal tanpa izin penerima</li>
              <li>Konten penipuan, judi ilegal, pinjaman ilegal, hoax, atau konten dewasa</li>
              <li>
                Pelanggaran kebijakan WhatsApp Business, Messaging, Commerce, Instagram, atau Facebook
                Community Standards
              </li>
              <li>Aktivitas yang merugikan pihak lain</li>
              <li>Mencoba mengakses akun atau data pengguna Pro.Chat lain</li>
              <li>Reverse engineering atau menyalahgunakan API di luar batas yang wajar</li>
            </ul>
            <p>
              Detail praktek yang dilarang ada di halaman{" "}
              <Link href="/aup" className="text-[#22c55e] hover:underline font-semibold">
                Acceptable Use Policy
              </Link>
              . Pelanggaran bisa berakibat penangguhan atau penghentian akun Anda tanpa pengembalian biaya.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              6. Pembayaran dan Langganan
            </h2>
            <p>
              Biaya berlangganan Pro.Chat dibayarkan sesuai paket yang Anda pilih. Pembayaran diproses
              melalui penyedia pembayaran pihak ketiga.
            </p>
            <p>
              Biaya yang dikenakan oleh Meta (template, conversation, iklan, dsb.){" "}
              <strong className="text-[#1e293b]">
                dibayarkan langsung oleh Anda kepada Meta
              </strong>{" "}
              melalui billing akun bisnis Anda sendiri, terpisah dari biaya langganan Pro.Chat.
            </p>
            <p>
              Biaya langganan yang sudah dibayar untuk periode berjalan tidak dikembalikan. Kalau kami yang
              menghentikan layanan tanpa kesalahan dari pihak Anda, sisa periode yang belum terpakai akan
              kami kembalikan secara pro-rata.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              7. Ketersediaan Layanan
            </h2>
            <p>
              Kami berusaha menjaga layanan tetap berjalan baik, tapi kami tidak menjamin layanan akan
              selalu tersedia tanpa gangguan. Maintenance terjadwal akan kami informasikan sebelumnya.
            </p>
            <p>
              Gangguan yang disebabkan oleh Meta, penyedia internet, atau hal-hal di luar kendali kami
              bukan termasuk gangguan layanan Pro.Chat.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              8. Batasan Tanggung Jawab
            </h2>
            <p>
              Layanan Pro.Chat disediakan apa adanya. Kami tidak memberikan jaminan tersurat maupun
              tersirat di luar yang dinyatakan dalam ketentuan ini.
            </p>
            <p>
              Kalaupun ada kerugian yang murni disebabkan oleh kelalaian Pro.Chat sendiri (misalnya bug
              pada software kami atau downtime di sisi server kami), total tanggung jawab kami dibatasi
              maksimal sebesar biaya langganan yang Anda bayarkan kepada Pro.Chat dalam 3 bulan terakhir
              sebelum kejadian.
            </p>
            <p>
              Kami tidak bertanggung jawab atas kerugian tidak langsung seperti kehilangan keuntungan,
              kehilangan pelanggan, atau kerugian reputasi.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              9. Hak Kekayaan Intelektual
            </h2>
            <p>
              Seluruh konten, tampilan, merek, dan materi pada website maupun layanan Pro.Chat, kecuali
              dinyatakan lain, merupakan milik Pro.Chat atau pemberi lisensinya.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">10. Penghentian</h2>
            <p>Anda bisa berhenti berlangganan kapan saja.</p>
            <p>
              Kami bisa menangguhkan atau menghentikan akses Anda kalau Anda melanggar ketentuan ini,
              melanggar kebijakan platform Meta, atau menggunakan layanan dengan cara yang membahayakan
              pengguna lain atau sistem kami.
            </p>
            <p>
              Setelah berhenti, data Anda kami simpan selama 30 hari untuk memberi kesempatan ekspor, lalu
              dihapus.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              11. Perubahan Ketentuan
            </h2>
            <p>
              Kami dapat memperbarui ketentuan ini dari waktu ke waktu. Perubahan penting akan kami
              beritahukan minimal 30 hari sebelum berlaku. Penggunaan setelah perubahan berlaku berarti
              Anda menerima versi yang baru.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">
              12. Penyelesaian Masalah
            </h2>
            <p>
              Kalau ada masalah atau ketidakpuasan, hubungi kami dulu. Kami akan berusaha menyelesaikannya
              secara baik-baik melalui musyawarah.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">13. Kontak</h2>
            <p>
              Pertanyaan terkait ketentuan ini:{" "}
              <a href="mailto:support@prochat.work" className="text-[#22c55e] hover:underline font-semibold">
                support@prochat.work
              </a>.
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
                href="/aup"
                className="group flex items-start gap-4 p-5 bg-white border-2 border-[#1e293b] rounded-2xl shadow-pop hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-pop-hover transition-all duration-200"
              >
                <span className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-[#db2777] text-white border-2 border-[#1e293b]">
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
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                    <path d="M12 8v4"></path>
                    <path d="M12 16h.01"></path>
                  </svg>
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#1e293b] group-hover:text-[#22c55e] transition-colors">
                    Acceptable Use Policy
                  </h3>
                  <p className="text-sm text-[#64748b] mt-1">Praktek yang diperbolehkan dan dilarang</p>
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
