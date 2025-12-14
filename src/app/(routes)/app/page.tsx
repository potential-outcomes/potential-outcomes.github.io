"use client";

import React from "react";
import { SimulationProvider } from "@/contexts/SimulationContext";
import DataInput from "@/components/DataInput/DataInput";
import PlotDisplay from "@/components/PlotDisplay/PlotDisplay";
import SimulationControls from "@/components/SimulationControls/SimulationControls";

const FeedbackButton = () => (
  <a
    href="https://forms.gle/myATHmX3pAu2c8QS6"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-4 right-4 z-50 flex items-center bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 group"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
    <span className="w-0 overflow-hidden whitespace-nowrap group-hover:w-20 transition-all duration-300">
      &nbsp;Feedback
    </span>
  </a>
);

const SimulationPage: React.FC = () => {
  return (
    <SimulationProvider>
      <div className="flex flex-col min-h-screen py-3 px-1 sm:px-2 md:px-3 lg:px-4">
        <div className="flex flex-col lg:flex-row gap-4 flex-grow h-[calc(100vh-6rem)] items-stretch">
          {/* Left Column: Data Entry */}
          <div className="flex-shrink w-full lg:w-1/2 flex flex-col">
            <Card>
              <DataInput />
            </Card>
          </div>

          {/* Right Column: Controls + Plot */}
          <div className="flex-shrink w-full lg:w-1/2 flex flex-col gap-4">
            <Card>
              <SimulationControls />
            </Card>
            <Card className="flex flex-col flex-grow max-h-[600px]">
              <div className="flex-grow">
                <PlotDisplay />
              </div>
            </Card>
          </div>
        </div>
        <FeedbackButton />
      </div>
    </SimulationProvider>
  );
};

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-light-background dark:bg-dark-background shadow-lg rounded-xl p-2 sm:p-3 md:p-4 border border-light-background-tertiary dark:border-dark-background-tertiary ${className}`}
  >
    {children}
  </div>
);

export default SimulationPage;
