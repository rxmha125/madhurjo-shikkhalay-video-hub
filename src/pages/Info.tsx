
import React from 'react';

const Info = () => {
  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Sir's Profile Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
              alt="Harez Uddin Hero"
              className="w-40 h-40 rounded-full object-cover mx-auto border-4 border-blue-500/30 shadow-2xl"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-500/20 to-transparent"></div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">Harez Uddin Hero</h1>
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-8">
            Educator & Mentor
          </div>
          
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Dedicated to empowering students through innovative educational methods and 
            personalized learning experiences. Creating a bridge between traditional teaching 
            and modern digital learning platforms.
          </p>
        </div>

        {/* Information Sections */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Education Section */}
          <div className="rounded-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Education</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white">Master's in Education</h3>
                <p className="text-sm text-gray-400">University of Excellence, 2018</p>
              </div>
              <div>
                <h3 className="font-semibold text-white">Bachelor's in Mathematics</h3>
                <p className="text-sm text-gray-400">National University, 2015</p>
              </div>
              <div>
                <h3 className="font-semibold text-white">Teaching Certification</h3>
                <p className="text-sm text-gray-400">Ministry of Education, 2016</p>
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="rounded-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">💼</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Experience</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="font-semibold text-white">Senior Educator</h3>
                <p className="text-sm text-gray-400 mb-2">Ma Madhurjo Shikkhalay (2020 - Present)</p>
                <p className="text-sm">Leading educational initiatives and curriculum development</p>
              </div>
              <div>
                <h3 className="font-semibold text-white">Mathematics Teacher</h3>
                <p className="text-sm text-gray-400 mb-2">Various Institutions (2016 - 2020)</p>
                <p className="text-sm">Teaching advanced mathematics and mentoring students</p>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="rounded-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Mission</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              To revolutionize education by making quality learning accessible to every student, 
              regardless of their background or circumstances. Building a community where knowledge 
              flows freely and every learner can reach their full potential.
            </p>
          </div>

          {/* Achievements Section */}
          <div className="rounded-card p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Achievements</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>Excellence in Teaching Award 2022</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>Digital Innovation in Education 2021</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>Student Choice Award 2020</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>Community Service Recognition 2019</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-16 text-center rounded-card p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
          <p className="text-gray-300 mb-6">
            Have questions or need guidance? Feel free to reach out through the platform's 
            messaging system or during office hours.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <div>
              <span className="font-semibold text-white">Office Hours:</span> Mon-Fri, 9AM-5PM
            </div>
            <div>
              <span className="font-semibold text-white">Response Time:</span> Within 24 hours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Info;
