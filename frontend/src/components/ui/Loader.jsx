import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ fullPage = false }) => {
  return (
    <div
      className={`flex justify-center items-center w-full ${
        fullPage ? 'h-screen' : 'min-h-[300px]'
      }`}
    >
      <Loader2 className="h-10 w-10 text-google-blue animate-spin" />
    </div>
  );
};

export default Loader;