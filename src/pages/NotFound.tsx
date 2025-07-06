
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="rounded-card p-12">
          <div className="text-8xl mb-6">🔍</div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Page Not Found
          </h1>
          
          <p className="text-gray-400 mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back to exploring educational content.
          </p>
          
          <div className="space-y-4">
            <Link 
              to="/" 
              className="btn-primary inline-block"
            >
              Go Back Home
            </Link>
            
            <div>
              <Link 
                to="/info" 
                className="text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                Visit Sir's Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
