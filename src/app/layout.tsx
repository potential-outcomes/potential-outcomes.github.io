import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';
import TopBar from './components/TopBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Potential Outcomes Simulation Tool',
  description: 'A tool for running simulations under the potential outcomes model',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const links = [
    { href: '/simulation', label: 'Simulation Tool' },
    { href: '/explainer', label: 'Explainer' },
    { href: '/about', label: 'About' },
  ];

  return (
    <html lang="en">
      <body className={`${inter.className} bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text`}>
        <ThemeProvider>
          <TopBar links={links} />
          <main className="container mx-auto mt-0 px-2">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}