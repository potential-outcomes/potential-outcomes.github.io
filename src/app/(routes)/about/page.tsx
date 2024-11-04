import React from "react";
import Image from "next/image";
import Link from "next/link";

const AboutPage = () => {
  const creators = [
    {
      name: "Ignacio Fernandez",
      url: "https://www.linkedin.com/in/ignacio-fernandez-h/",
      image: "images/ignacio_fernandez.jpeg",
      description: `Ignacio Fernandez is a junior studying Computer Science at Stanford University on the Artificial Intelligence track. His technical experience spans robotics and full-stack development projects. Outside of his coursework, he explores interests in linguistics and is currently learning Turkish.`,
      role: "Student Researcher",
    },
    {
      name: "Dennis Sun",
      url: "https://dlsun.github.io/",
      image: "images/dennis_sun.jpg",
      description: `Dennis Sun is the Director of the Program in Data Science at Stanford, overseeing the Data Science B.S., Data Science & Social Systems B.A., and Data Science minor programs. His research focuses on making statistics and data science more accessible through improved teaching methods and software tools. Outside of school, he enjoys trivia, hiking, and classical music.`,
      role: "Faculty Mentor",
    },
  ];

  return (
    <div className="py-4 px-8 max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-4">About Us</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
          This applet was developed by Professor Dennis Sun and student
          researcher Ignacio Fernandez as part of a project under the SURP-Stats
          program. It is meant to help students visualize and understand the
          Potential Outcomes Model for randomized experiments.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {creators.map((creator, index) => (
          <div
            key={index}
            className="bg-light-background dark:bg-dark-background shadow-lg rounded-xl py-4 border border-light-background-tertiary dark:border-dark-background-tertiary"
          >
            <div
              className={`flex flex-col ${
                index % 2 === 0
                  ? "pr-10 md:flex-row"
                  : "pl-10 md:flex-row-reverse"
              } gap-4 items-center`}
            >
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="w-48 h-64 rounded-lg overflow-hidden relative">
                  <Image
                    src={creator.image}
                    alt={creator.name}
                    fill
                    sizes="(max-width: 768px) 192px, 192px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
              <div className="w-full md:w-2/3 text-center md:text-left">
                <h2 className="text-2xl font-semibold mb-2 flex items-center justify-center md:justify-start gap-1">
                  <Link
                    href={creator.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    {creator.name}
                  </Link>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {creator.role}
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {creator.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutPage;
