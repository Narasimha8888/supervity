import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Check, X, AlertTriangle, FileText, Shield, Database, Scale, CheckCircle, RotateCcw } from 'lucide-react';

const WORKFLOW_STAGES = [
  { id: 'S1', title: 'Policy Interpreter', desc: 'Converts plain-English policy into structured configuration', icon: FileText },
  { id: 'S2', title: 'Policy Validator', desc: 'Validates structured policy against supported fields/operators', icon: Shield },
  { id: 'S3', title: 'Deterministic Rule Engine', desc: 'Evaluates conditions using Python', icon: Database },
  { id: 'S4', title: 'Claim Decision', desc: 'APPROVE / REJECT / ESCALATE', icon: Scale },
];

export default function ClaimsPage({ processState, setProcessState, registerTrigger }) {
  const [batchData, setBatchData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const traceRef = useRef(null);

  useEffect(() => {
    let timer;
    if (processState !== 'IDLE' && processState !== 'COMPLETE') {
      timer = setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (processState === 'IDLE') {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [processState]);

  const handleReset = () => {
    setProcessState('IDLE');
    setBatchData(null);
    setSelectedClaim(null);
    setElapsed(0);
    setError(null);
  };

  const handleProcess = async () => {
    setProcessState('PENDING');
    setError(null);
    setBatchData(null);
    setSelectedClaim(null);
    setElapsed(0);
    
    // Simulate orchestration sequence visually
    const timer1 = setTimeout(() => setProcessState('RUN_1'), 500);
    const timer2 = setTimeout(() => setProcessState('RUN_2'), 1500);
    const timer3 = setTimeout(() => setProcessState('RUN_3'), 2500);
    const timer4 = setTimeout(() => setProcessState('RUN_4'), 3500);
    
    try {
      const result = await api.processClaimsBatch();
      setTimeout(() => {
        setBatchData(result);
        setProcessState('COMPLETE');
      }, 4500);
    } catch (err) {
      clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4);
      setError(err.message || 'Claims could not be processed.');
      setProcessState('IDLE');
    }
  };

  useEffect(() => {
    if (registerTrigger) {
      registerTrigger(() => handleProcess);
    }
  }, [registerTrigger]);

  const getStageStatus = (stageIndex) => {
    if (processState === 'IDLE') return 'IDLE';
    if (processState === 'PENDING') return 'PENDING';
    if (processState === 'COMPLETE') return 'COMPLETE';
    
    const currentRunIdx = parseInt(processState.replace('RUN_', ''));
    if (stageIndex < currentRunIdx) return 'COMPLETE';
    if (stageIndex === currentRunIdx) return 'RUNNING';
    return 'PENDING';
  };

  const renderStatusPill = (status) => {
    switch(status) {
      case 'COMPLETE': return <span className="text-[9px] px-2.5 py-1 rounded-full border border-[var(--color-brand-approve)] text-[var(--color-brand-approve)] bg-[var(--color-brand-approve-bg)] uppercase tracking-widest font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all">COMPLETE</span>;
      case 'RUNNING': return <span className="text-[9px] px-2.5 py-1 rounded-full border border-blue-500 text-blue-400 bg-blue-500/10 uppercase tracking-widest animate-pulse font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)]">RUNNING</span>;
      case 'PENDING': return <span className="text-[9px] px-2.5 py-1 rounded-full border border-gray-600 text-gray-400 bg-gray-800/50 uppercase tracking-widest font-bold">PENDING</span>;
      default: return <span className="text-[9px] px-2.5 py-1 rounded-full border border-[var(--color-brand-border)] text-gray-500 uppercase tracking-widest font-bold">READY</span>;
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'APPROVE': return <Check className="h-3.5 w-3.5 text-[var(--color-brand-approve)]" />;
      case 'REJECT': return <X className="h-3.5 w-3.5 text-[var(--color-brand-reject)]" />;
      case 'ESCALATE': return <AlertTriangle className="h-3.5 w-3.5 text-[var(--color-brand-escalate)]" />;
      default: return null;
    }
  };

  const getDecisionStyle = (decision) => {
    switch (decision) {
      case 'APPROVE': return 'border-[var(--color-brand-approve)] bg-[var(--color-brand-approve-bg)] text-[var(--color-brand-approve)]';
      case 'REJECT': return 'border-[var(--color-brand-reject)] bg-[var(--color-brand-reject-bg)] text-[var(--color-brand-reject)]';
      case 'ESCALATE': return 'border-[var(--color-brand-escalate)] bg-[var(--color-brand-escalate-bg)] text-[var(--color-brand-escalate)]';
      default: return 'border-[var(--color-brand-border)] text-[var(--color-brand-muted)]';
    }
  };

  const renderTrace = (claimResult) => {
    if (!claimResult) return null;
    let stepCount = 1;
    const steps = [];
    
    steps.push(
      <div key={`step-${stepCount}`} className="flex space-x-6 relative">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center text-[10px] font-mono text-gray-400 font-bold z-10 shadow-md">{String(stepCount++).padStart(2, '0')}</div>
          <div className="w-px h-full bg-[var(--color-brand-border)] my-2 min-h-[40px]"></div>
        </div>
        <div className="pb-8 pt-1.5">
          <div className="flex items-center space-x-2 text-white font-bold text-sm mb-1">
            <FileText className="w-4 h-4 text-[var(--color-brand-muted)]" />
            <span>Policy interpreted</span>
          </div>
          <div className="text-[10px] text-[var(--color-brand-muted)] uppercase tracking-widest">Plain-English policy converted to structured rule</div>
        </div>
      </div>
    );
    
    steps.push(
      <div key={`step-${stepCount}`} className="flex space-x-6 relative">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center text-[10px] font-mono text-gray-400 font-bold z-10 shadow-md">{String(stepCount++).padStart(2, '0')}</div>
          <div className="w-px h-full bg-[var(--color-brand-border)] my-2 min-h-[40px]"></div>
        </div>
        <div className="pb-8 pt-1.5">
          <div className="flex items-center space-x-2 text-white font-bold text-sm mb-1">
            <Shield className="w-4 h-4 text-[var(--color-brand-muted)]" />
            <span>Policy validated</span>
          </div>
          <div className="text-[10px] text-[var(--color-brand-muted)] uppercase tracking-widest">Structured rule accepted</div>
        </div>
      </div>
    );

    steps.push(
      <div key={`step-${stepCount}`} className="flex space-x-6 relative">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center text-[10px] font-mono text-gray-400 font-bold z-10 shadow-md">{String(stepCount++).padStart(2, '0')}</div>
          <div className="w-px h-full bg-[var(--color-brand-border)] my-2 min-h-[40px]"></div>
        </div>
        <div className="pb-8 pt-1.5">
          <div className="flex items-center space-x-2 text-white font-bold text-sm mb-1">
            <Database className="w-4 h-4 text-[var(--color-brand-muted)]" />
            <span>Claim evaluated</span>
          </div>
          <div className="text-[10px] text-[var(--color-brand-muted)] uppercase tracking-widest font-mono">CLAIM {claimResult.claim_id}</div>
        </div>
      </div>
    );
    
    if (claimResult.matched_rules && claimResult.matched_rules.length > 0) {
      claimResult.matched_rules.forEach(ruleRes => {
        ruleRes.condition_results.forEach(cond => {
          steps.push(
            <div key={`step-${stepCount}`} className="flex space-x-6 relative">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center text-[10px] font-mono text-gray-400 font-bold z-10 shadow-md">{String(stepCount++).padStart(2, '0')}</div>
                <div className="w-px h-full bg-[var(--color-brand-border)] my-2 min-h-[60px]"></div>
              </div>
              <div className="pb-8 pt-1.5 w-full max-w-md">
                <div className="flex items-center space-x-2 text-white font-bold text-sm mb-2.5">
                  <CheckCircle className="w-4 h-4 text-[var(--color-brand-muted)]" />
                  <span>Condition checked</span>
                </div>
                <div className="bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-xl p-4 text-xs font-mono">
                  <div className="text-gray-300 mb-3">{cond.field} {cond.operator.replace(/_/g, ' ')} {cond.expected}</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] tracking-widest uppercase border-t border-[var(--color-brand-border)] pt-3">
                    <div className="text-[var(--color-brand-muted)]">Expected: <span className="text-white">{cond.expected}</span></div>
                    <div className="text-[var(--color-brand-muted)]">Actual: <span className="text-white">{cond.actual}</span></div>
                  </div>
                  <div className={`mt-3 font-bold ${cond.matched ? 'text-[var(--color-brand-approve)]' : 'text-[var(--color-brand-reject)]'}`}>
                    {cond.matched ? 'MATCH' : 'FAILED'}
                  </div>
                </div>
              </div>
            </div>
          );
        });
      });
    } else {
       steps.push(
        <div key={`step-${stepCount}`} className="flex space-x-6 relative">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] flex items-center justify-center text-[10px] font-mono text-gray-400 font-bold z-10 shadow-md">{String(stepCount++).padStart(2, '0')}</div>
            <div className="w-px h-full bg-[var(--color-brand-border)] my-2 min-h-[40px]"></div>
          </div>
          <div className="pb-8 pt-1.5">
            <div className="flex items-center space-x-2 text-white font-bold text-sm mb-1">
              <CheckCircle className="w-4 h-4 text-[var(--color-brand-muted)]" />
              <span>Condition checked</span>
            </div>
            <div className="text-[10px] text-[var(--color-brand-muted)] uppercase tracking-widest">No matching policies found for this claim</div>
          </div>
        </div>
      );
    }
    
    steps.push(
      <div key={`step-${stepCount}`} className="flex space-x-6 relative">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-[10px] font-mono text-white font-bold z-10 shadow-md">{String(stepCount++).padStart(2, '0')}</div>
        </div>
        <div className="pt-1.5">
          <div className="flex items-center space-x-2 text-white font-bold text-sm mb-1">
            <Scale className="w-4 h-4 text-[var(--color-brand-muted)]" />
            <span>Final decision</span>
          </div>
          <div className={`inline-block mt-2.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border
            ${claimResult.decision === 'APPROVE' ? 'bg-[var(--color-brand-approve-bg)] text-[var(--color-brand-approve)] border-[var(--color-brand-approve)]' : 
              claimResult.decision === 'REJECT' ? 'bg-[var(--color-brand-reject-bg)] text-[var(--color-brand-reject)] border-[var(--color-brand-reject)]' : 
              'bg-[var(--color-brand-escalate-bg)] text-[var(--color-brand-escalate)] border-[var(--color-brand-escalate)]'}`}>
            {claimResult.decision}
          </div>
        </div>
      </div>
    );
    
    return steps;
  };

  return (
    <div className="flex flex-col w-full h-full pb-20">
      {/* Workspace Header */}
      <div className="px-8 py-6 border-b border-[var(--color-brand-border)] flex flex-col sm:flex-row sm:items-center justify-between bg-transparent shrink-0">
        <div>
          <h2 className="text-[10px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-2">
            SUPERVITY AI EMPLOYEE
          </h2>
          <div className="flex items-baseline space-x-3">
            <h1 className="text-xl font-mono text-white tracking-tight">Orchestration Graph</h1>
            <span className="text-[11px] text-[var(--color-brand-muted)] font-medium">
              Policy-to-decision • {batchData ? batchData.total : 0} claims processed
            </span>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-12">
          <div className="text-right">
             <div className="text-[9px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-1">VALUE</div>
             <div className="text-sm font-mono font-bold text-white">${batchData ? (batchData.total * 350).toLocaleString() : '0'}.00</div>
          </div>
          <div className="text-right">
             <div className="text-[9px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-1">ELAPSED</div>
             <div className="text-sm font-mono font-bold text-white">{elapsed}s</div>
          </div>
          
          <div className="ml-4 flex items-center space-x-4">
             {processState === 'COMPLETE' && (
               <button 
                 onClick={handleReset} 
                 title="Reset Workflow" 
                 className="text-[var(--color-brand-muted)] hover:text-white transition-all p-1.5 rounded-full hover:bg-[rgba(255,255,255,0.05)] border border-transparent hover:border-[var(--color-brand-border)] flex items-center justify-center"
               >
                 <RotateCcw className="w-4 h-4" />
               </button>
             )}
             {renderStatusPill(processState === 'COMPLETE' ? 'COMPLETE' : processState === 'IDLE' ? 'IDLE' : 'RUNNING')}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center">
        
        {error && (
          <div className="w-full max-w-4xl mx-auto mt-8 bg-[var(--color-brand-reject-bg)] border border-[var(--color-brand-reject)] p-4 rounded-xl text-xs font-mono text-[var(--color-brand-reject)]">
            {error}
          </div>
        )}

        {/* Orchestration Graph */}
        <div className="relative mt-12 mb-16 pt-4 w-full max-w-4xl flex justify-center">
          {/* Vertical connector line */}
          <div className="absolute left-1/2 top-4 bottom-4 w-px bg-[var(--color-brand-border)] -translate-x-1/2 z-0"></div>
          
          <div className="space-y-8 relative z-10 w-full max-w-2xl">
            {WORKFLOW_STAGES.map((stage, idx) => {
              const status = getStageStatus(idx + 1);
              const active = status === 'RUNNING' || status === 'COMPLETE';
              const Icon = stage.icon;
              return (
                <div key={stage.id} className="w-full mx-auto reference-card p-5 shadow-2xl flex items-center justify-between transition-colors duration-500 relative bg-[var(--color-brand-panel)]">
                  {active && <div className="absolute inset-0 bg-[rgba(255,255,255,0.02)] rounded-xl pointer-events-none"></div>}
                  <div className="flex items-center space-x-5 relative z-10">
                    <div className={`p-3 rounded-xl border ${active ? 'bg-[var(--color-brand-border)] border-gray-600 text-gray-300' : 'bg-transparent border-[var(--color-brand-border)] text-[var(--color-brand-border)]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-2.5">
                        <span className={`text-[10px] font-mono ${active ? 'text-[var(--color-brand-muted)]' : 'text-gray-700'}`}>0{idx+1}</span>
                        <h3 className={`text-base font-bold ${active ? 'text-white' : 'text-gray-600'}`}>{stage.title}</h3>
                      </div>
                      <p className={`text-[11px] mt-1.5 max-w-[340px] leading-relaxed ${active ? 'text-[var(--color-brand-muted)]' : 'text-gray-700'}`}>{stage.desc}</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    {renderStatusPill(status)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim Results List */}
        {batchData && processState === 'COMPLETE' && (
          <div className="w-full max-w-4xl mx-auto px-6 mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-[var(--color-brand-border)] pb-3">
              <h3 className="text-[10px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-3 sm:mb-0">
                BATCH EVALUATION RESULTS ({batchData.total})
              </h3>
              <div className="flex space-x-6 text-[10px] font-bold tracking-widest uppercase bg-[var(--color-brand-bg)] px-4 py-1.5 rounded-full border border-[var(--color-brand-border)]">
                <span className="text-[var(--color-brand-approve)]">APPROVE: {batchData.approved || 0}</span>
                <span className="text-[var(--color-brand-reject)]">REJECT: {batchData.rejected || 0}</span>
                <span className="text-[var(--color-brand-escalate)]">ESCALATE: {batchData.escalated || 0}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batchData.results.map((result) => (
                <div 
                  key={result.claim_id} 
                  onClick={() => {
                    setSelectedClaim(result);
                    setTimeout(() => {
                      traceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className={`group bg-[var(--color-brand-panel)] border rounded-xl p-4 cursor-pointer transition-colors flex flex-col justify-between h-full ${selectedClaim?.claim_id === result.claim_id ? 'border-gray-500 bg-[rgba(255,255,255,0.03)]' : 'border-[var(--color-brand-border)] hover:border-gray-600'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] tracking-widest text-[var(--color-brand-muted)] uppercase mb-1">CLAIM ID</span>
                      <span className="text-xs font-mono text-white">{result.claim_id}</span>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full border flex items-center space-x-1.5 ${getDecisionStyle(result.decision)}`}>
                      {getDecisionIcon(result.decision)}
                      <span className="text-[9px] font-bold tracking-widest uppercase">
                        {result.decision}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-auto border-t border-[var(--color-brand-border)] pt-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] tracking-widest text-[var(--color-brand-muted)] uppercase mb-1">EMPLOYEE</span>
                      <span className="text-xs font-bold text-[var(--color-brand-text)] truncate">{result.claim_data.employee}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] tracking-widest text-[var(--color-brand-muted)] uppercase mb-1">AMOUNT</span>
                      <span className="text-xs font-mono text-[var(--color-brand-text)]">${result.claim_data.amount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrated Execution Trace */}
        <div ref={traceRef} className="w-full max-w-4xl mx-auto px-6 mt-8 mb-24 relative pt-4">
           <h3 className="text-[10px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-8 border-b border-[var(--color-brand-border)] pb-3">
             EXECUTION TRACE {selectedClaim ? `- CLAIM ${selectedClaim.claim_id}` : ''}
           </h3>
           
           {!selectedClaim && processState === 'IDLE' && (
             <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-[var(--color-brand-border)] rounded-2xl bg-[var(--color-brand-bg)]">
                <Database className="w-8 h-8 text-[var(--color-brand-border)] mb-4" />
                <p className="text-[11px] text-[var(--color-brand-muted)] tracking-widest uppercase">Run the workflow to see execution trace</p>
             </div>
           )}

           {processState === 'COMPLETE' && !selectedClaim && (
             <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-gray-800 rounded-2xl bg-[var(--color-brand-bg)] cursor-pointer hover:border-gray-600 transition-colors" onClick={() => setSelectedClaim(batchData.results[0])}>
                <CheckCircle className="w-8 h-8 text-gray-700 mb-4" />
                <p className="text-[11px] text-[var(--color-brand-muted)] tracking-widest uppercase">Select a claim above to view its execution trace</p>
             </div>
           )}

           {selectedClaim && (
             <div className="bg-[var(--color-brand-panel)] border border-[var(--color-brand-border)] rounded-2xl p-8 shadow-2xl animate-fade-in relative z-10">
               {renderTrace(selectedClaim)}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
