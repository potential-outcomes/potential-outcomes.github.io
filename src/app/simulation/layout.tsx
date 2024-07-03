// src/app/simulation/layout.tsx
import { SimulationProvider } from '../contexts/SimulationContext';
import DataInput from '../components/DataInput';
import SimulationDisplay from '../components/SimulationDisplay';

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SimulationProvider>
      <div className="flex flex-col lg:flex-row gap-4 p-3 bg-light-background-secondary dark:bg-dark-background-secondary min-h-screen">
        <div className="w-full lg:w-1/2">
          <div className="bg-light-background dark:bg-dark-background shadow-lg rounded-xl p-6 border border-light-background-tertiary dark:border-dark-background-tertiary">
            <DataInput />
          </div>
        </div>
        <div className="w-full lg:w-1/2">
          <div className="bg-light-background dark:bg-dark-background shadow-lg rounded-xl p-6 border border-light-background-tertiary dark:border-dark-background-tertiary">
            <SimulationDisplay />
          </div>
        </div>
      </div>
      {children}
    </SimulationProvider>
  );
}