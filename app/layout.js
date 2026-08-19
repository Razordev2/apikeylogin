import './globals.css';

export const metadata = {
  title: 'API Key Admin Panel | Management & Verification Dashboard',
  description: 'Manage users, API key durations, extend active days, and validate API keys with serverless Vercel support.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
