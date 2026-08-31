import { redirect } from 'next/navigation';

// Redirect root path directly to default locale login
export default function RootPage() {
  redirect('/en/login');
}

