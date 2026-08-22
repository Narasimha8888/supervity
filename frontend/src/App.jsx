import { useState, useCallback } from 'react';
import Header from './components/Header';
import RulesPage from './pages/RulesPage';
import ClaimsPage from './pages/ClaimsPage';

function App() {
  const [activeRulesCount, setActiveRulesCount] = useState(0);
  const [processState, setProcessState] = useState('IDLE');
  
  // Callback that ClaimsPage will register to expose its internal run method
  const [triggerEvaluation, setTriggerEvaluation] = useState(null);

  const handleRunEvaluation = () => {
    if (triggerEvaluation) triggerEvaluation();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--color-brand-bg)] text-[var(--color-brand-text)] overflow-hidden">
      <Header activeRulesCount={activeRulesCount} />
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden border-t border-[var(--color-brand-border)]">
        
        {/* Left Panel: Policy Control */}
        <section className="w-full lg:w-[400px] xl:w-[420px] flex-shrink-0 flex flex-col border-r border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] z-10 overflow-hidden shadow-2xl shadow-black/50">
          <RulesPage 
            onRulesChanged={(count) => setActiveRulesCount(count)} 
            onRunEvaluation={handleRunEvaluation}
            processState={processState}
          />
        </section>

        {/* Right Panel: Decision Workspace */}
        <section className="flex-1 flex flex-col bg-[var(--color-brand-bg)] min-w-0 overflow-y-auto hide-scrollbar relative">
          <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-80" />
          <div className="relative z-10 flex flex-col min-h-full">
            <ClaimsPage 
              processState={processState}
              setProcessState={setProcessState}
              registerTrigger={setTriggerEvaluation}
            />
          </div>
        </section>
        
      </main>
    </div>
  );
}

export default App;
