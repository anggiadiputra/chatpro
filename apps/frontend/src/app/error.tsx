'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="h-svh w-full">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">Oops!</h1>
        <span className="font-medium">Terjadi Kesalahan</span>
        <p className="text-muted-foreground text-center">
          Mohon maaf, terjadi kesalahan yang tidak terduga.<br />
          Silakan coba lagi atau kembali ke beranda.
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={reset}>
            Coba Lagi
          </Button>
          <Button asChild>
            <Link href="/">Ke Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
