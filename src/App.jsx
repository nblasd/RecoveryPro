import React, { useState } from 'react';
import SetupForm from './components/SetupForm';
import Dashboard from './components/Dashboard';
import { Wallet } from 'lucide-react';

function App() {
  const [sessionConfig, setSessionConfig] = useState(null);

  const startSession = (config) => {
    setSessionConfig(config);
  };

  const resetSession = () => {
    setSessionConfig(null);
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-lg shadow-lg shadow-cyan-500/10 border border-cyan-500/20">
            <img src="/logo.png" alt="RecoveryPro Logo" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            RecoveryPro
          </h1>
        </div>
        {sessionConfig && (
          <button
            onClick={resetSession}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            End Session
          </button>
        )}
      </header>

      <main className="w-full flex justify-center">
        {!sessionConfig ? (
          <SetupForm onStart={startSession} />
        ) : (
          <Dashboard config={sessionConfig} onReset={resetSession} />
        )}
      </main>

      <footer className="mt-auto pt-12 pb-4 text-center text-slate-600 text-xs">
        <p>Use at your own risk. Trading involves significant capital risk.</p>
      </footer>
    </div>
  );
}

export default App;
