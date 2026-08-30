import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Pro.Chat",
  description:
    "Kebijakan privasi Pro.Chat yang menjelaskan cara informasi dikumpulkan, digunakan, dan dilindungi.",
};

export default function PrivacyPolicy() {
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
              <span className="w-7 h-7 rounded-full flex items-center justify-center bg-[#8b5cf6] text-white">
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
                  <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
                  <path d="M14 2v5a1 1 0 0 0 1 1h5"></path>
                  <path d="M10 9H8"></path>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                </svg>
              </span>
              <span className="text-[#1e293b] font-semibold text-sm">Dokumen Legal</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Privacy Policy
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
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-2 mb-4">1. Peran Pro.Chat</h2>
            <p>
              Pro.Chat adalah perangkat lunak yang Anda gunakan untuk mengelola percakapan dari WhatsApp
              Business, Instagram Direct Message, dan Facebook Messenger milik Anda sendiri. Akun saluran,
              daftar kontak, dan isi pesan adalah milik Anda. Kami menyimpan dan memprosesnya hanya supaya
              dashboard dan integrasi Pro.Chat bisa bekerja untuk Anda.
            </p>
            <p>
              Apa yang terjadi pada data Anda di sisi Meta tunduk pada kebijakan Meta sendiri dan berada
              di luar kontrol Pro.Chat.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">2. Informasi yang Kami Kumpulkan</h2>
            <p>Saat Anda mendaftar dan menggunakan Pro.Chat, kami mengumpulkan:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nama, alamat email, nomor telepon, dan nama bisnis</li>
              <li>Data organisasi dan anggota tim</li>
              <li>Kredensial akun WhatsApp Business, Instagram, dan Facebook (disimpan dalam keadaan terenkripsi)</li>
              <li>Daftar kontak, percakapan, dan isi pesan yang Anda kirim/terima melalui platform</li>
              <li>Log penggunaan dashboard dan API (metadata, bukan dibaca manusia secara rutin)</li>
              <li>Informasi pembayaran (diproses oleh penyedia pembayaran pihak ketiga)</li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">3. Bagaimana Kami Menggunakan Informasi</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Menyediakan dan memelihara layanan platform</li>
              <li>Mengirim notifikasi terkait akun, billing, atau perubahan layanan</li>
              <li>Memperbaiki bug dan mengembangkan fitur baru</li>
              <li>Mendeteksi dan mencegah penyalahgunaan</li>
              <li>Menjawab pertanyaan dukungan Anda</li>
            </ul>
            <p>
              Kami tidak membaca isi percakapan Anda untuk keperluan apapun di luar yang Anda minta secara
              eksplisit (misalnya saat Anda meminta bantuan support yang melibatkan inspeksi percakapan
              tertentu).
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">4. Keamanan Data</h2>
            <p>
              Kami berupaya melindungi data dengan langkah teknis dan operasional yang wajar, termasuk
              enkripsi kredensial saluran, kontrol akses berbasis prinsip least privilege, serta monitoring
              untuk mencegah penyalahgunaan.
            </p>
            <p>
              Tidak ada sistem yang sepenuhnya kebal. Kami tidak bisa menjamin keamanan absolut dari setiap
              kemungkinan risiko digital.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">5. Penyimpanan Pesan</h2>
            <p>
              Isi pesan disimpan supaya fitur dashboard (riwayat percakapan, pencarian, statistik) bisa
              berfungsi. Anda dapat menghapus percakapan kapan saja, dan seluruh data Anda dihapus permanen
              30 hari setelah akun dihentikan.
            </p>
            <p>
              Kami juga menyimpan backup operasional untuk pemulihan bencana. Backup di-rotasi dan ikut
              terhapus mengikuti jadwal retensi normal.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">6. Berbagi Data dengan Pihak Ketiga</h2>
            <p>
              Kami tidak menjual data Anda. Data hanya dibagikan dengan pihak yang memang diperlukan supaya
              layanan jalan:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-[#1e293b]">Meta</strong> &mdash; untuk mengirim dan menerima pesan via
                WhatsApp Cloud API, Instagram Graph API, dan Messenger Platform. Begitu pesan terkirim,
                isinya juga tunduk pada kebijakan privasi Meta.
              </li>
              <li>
                <strong className="text-[#1e293b]">Penyedia pembayaran</strong> &mdash; untuk memproses biaya langganan.
              </li>
              <li>
                <strong className="text-[#1e293b]">Penyedia infrastruktur</strong> &mdash; untuk hosting, database, dan layanan operasional pendukung.
              </li>
            </ul>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">7. Cookie dan Teknologi Serupa</h2>
            <p>
              Website ini dapat menggunakan cookie atau teknologi serupa untuk analitik, keamanan, dan
              peningkatan pengalaman penggunaan. Anda dapat mengatur preferensi cookie melalui browser yang
              Anda gunakan.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">8. Hak Anda</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mengakses data pribadi yang kami simpan</li>
              <li>Meminta koreksi data yang tidak akurat</li>
              <li>Meminta penghapusan akun dan data terkait</li>
              <li>Mengekspor data Anda dalam format yang dapat dibaca mesin</li>
            </ul>
            <p>Hubungi kami di alamat di bawah untuk menggunakan hak ini.</p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">9. Data di Sisi Meta</h2>
            <p>
              Pesan yang Anda kirim melalui Pro.Chat pada akhirnya melewati infrastruktur Meta (WhatsApp,
              Instagram, atau Facebook). Cara Meta menyimpan, memproses, dan menampilkan data tersebut
              tunduk pada kebijakan Meta, bukan kebijakan ini. Untuk informasi terkait data Anda di sisi
              Meta, silakan rujuk kebijakan privasi resmi dari masing-masing platform.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">10. Perubahan Kebijakan</h2>
            <p>
              Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan signifikan akan kami
              informasikan melalui email atau pemberitahuan di dashboard.
            </p>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mt-8 mb-4">11. Kontak</h2>
            <p>
              Pertanyaan terkait privasi:{" "}
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
