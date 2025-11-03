import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ThemeProvider } from '../components/common/ThemeProvider';
import TopBar from '../components/common/TopBar';
import { HiddenColorClasses } from '../components/common/HiddenColorClasses';

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
    { href: '/app', label: 'Simulation Tool' },
    // { href: '/explainer', label: 'Explainer' },
    { href: '/about', label: 'About' },
  ];

  return (
    <html lang="en">
      <body className={`${inter.className} bg-light-background-secondary dark:bg-dark-background-secondary text-light-text-secondary dark:text-dark-text-secondary`}>
        <ThemeProvider>
        <HiddenColorClasses />
          <TopBar links={links} />
          <main className="container mx-auto mt-0">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}