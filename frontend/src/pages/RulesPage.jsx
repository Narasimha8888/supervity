import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../services/api';
import { Bot, Check, AlertTriangle, X, Loader2, Power, PowerOff, Edit2, Trash2 } from 'lucide-react';

const SCENARIOS = [
  { id: 'S1', title: 'Sales Approval', description: 'Approve Sales expenses below $500.', text: 'Approve Sales expenses below $500.' },
  { id: 'S2', title: 'High Value Expense', description: 'Escalate expenses above $2000.', text: 'Escalate expenses above $2000.' },
  { id: 'S3', title: 'Rejection Policy', description: 'Reject Marketing expenses over $1000.', text: 'Reject Marketing expenses over $1000.' },
  { id: 'S4', title: 'Ambiguous Policy', description: 'Approve expensive Sales expenses.', text: 'Approve expensive Sales expenses.' }
];

export default function RulesPage({ onRulesChanged, onRunEvaluation, processState }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const editorRef = useRef(null);
  
  // Intake state
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [ruleText, setRuleText] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [interpretation, setInterpretation] = useState(null);
  const [intakeError, setIntakeError] = useState(null);
  const [policyToDelete, setPolicyToDelete] = useState(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await api.getRules();
      setRules(data);
      if (onRulesChanged) onRulesChanged(data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleScenarioSelect = (scenario) => {
    setActiveScenarioId(scenario.id);
    setRuleText(scenario.text);
    setInterpretation(null);
    setIntakeError(null);
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleInterpret = async (e) => {
    e.preventDefault();
    if (!ruleText.trim()) return;
    
    setInterpreting(true);
    setIntakeError(null);
    setInterpretation(null);

    try {
      const result = await api.interpretRule(ruleText);
      setInterpretation(result);
    } catch (err) {
      setIntakeError(err.message || 'Unable to interpret this policy.');
    } finally {
      setInterpreting(false);
    }
  };

  const handleSave = async () => {
    if (!interpretation || interpretation.status !== 'VALID') return;
    
    setSaving(true);
    setIntakeError(null);
    try {
      await api.createRule({
        name: `Policy-${Math.floor(Math.random() * 10000)}`,
        original_text: ruleText,
        structured_rule: interpretation.structured_rule,
        is_active: true
      });
      setRuleText('');
      setInterpretation(null);
      setActiveScenarioId(null);
      fetchRules();
    } catch (err) {
      setIntakeError(err.message || 'Policy could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await api.updateRule(rule.id, { is_active: !rule.is_active });
      fetchRules();
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    }
  };

  const handleDeleteClick = (rule) => {
    setPolicyToDelete(rule);
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;
    try {
      await api.deleteRule(policyToDelete.id);
      setPolicyToDelete(null);
      fetchRules();
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const cancelDelete = () => {
    setPolicyToDelete(null);
  };

  const resetIntake = () => {
    setRuleText('');
    setInterpretation(null);
    setActiveScenarioId(null);
  };

  const isProcessRunning = processState && processState !== 'IDLE' && processState !== 'COMPLETE';

  return (
    <div className="flex flex-col h-full bg-[var(--color-brand-bg)] relative">
      
      {/* Header */}
      <div className="px-6 pt-8 pb-4 shrink-0 border-b border-[var(--color-brand-border)]">
        <h2 className="text-[10px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-2">
          POLICY INTAKE
        </h2>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-mono text-white tracking-tight">NEW POLICY</h1>
          <span className="text-[9px] px-2 py-0.5 rounded-sm border border-gray-600 text-gray-400 uppercase tracking-widest bg-gray-800/50">
            READY
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
        {/* Scenarios */}
        <div className="px-6 py-5 border-b border-[var(--color-brand-border)]">
          <p className="text-xs text-[var(--color-brand-muted)] mb-5">
            Load a demo scenario or edit the policy text, then run the interpreter.
          </p>
          <div className="space-y-3">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario)}
                className={`w-full text-left p-4 rounded-xl border transition-all reference-card hover:border-[rgba(255,255,255,0.2)] ${
                  activeScenarioId === scenario.id 
                    ? 'border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.03)]' 
                    : 'border-[var(--color-brand-border)]'
                }`}
              >
                <div className="text-sm font-bold text-white mb-1.5">{scenario.title}</div>
                <div className="text-xs text-[var(--color-brand-muted)]">{scenario.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Policy Editor */}
        <div ref={editorRef} className="px-6 py-5 border-b border-[var(--color-brand-border)]">
          <h4 className="text-[10px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-3">POLICY TEXT</h4>
          <textarea
            value={ruleText}
            onChange={(e) => { setRuleText(e.target.value); setInterpretation(null); setIntakeError(null); }}
            placeholder='e.g. "Approve Sales expenses below $500."'
            className="w-full bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-lg p-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 font-mono resize-none h-24 mb-4 transition-colors"
            disabled={interpreting || saving}
          />
          
          <button 
            onClick={handleInterpret} 
            disabled={interpreting || !ruleText.trim()} 
            className="w-full rounded-lg py-2.5 bg-gray-800 border border-gray-700 text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center mb-2"
          >
            {interpreting ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" /> : null}
            Interpret Policy
          </button>

          {intakeError && (
            <div className="mt-4 bg-[var(--color-brand-reject-bg)] border border-[var(--color-brand-reject)] p-3 rounded-lg flex items-start">
              <X className="h-4 w-4 text-[var(--color-brand-reject)] mr-2 mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--color-brand-reject)] leading-tight">{intakeError}</p>
            </div>
          )}

          {/* Interpretation Preview */}
          {interpretation && (
            <div className="mt-5 animate-fade-in">
              
              {interpretation.status === 'VALID' && (
                <div className="bg-[var(--color-brand-bg)] rounded-xl border border-[var(--color-brand-border)] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-brand-border)]">
                    <span className="text-[10px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase">INTERPRETATION</span>
                    <span className="text-[10px] font-bold tracking-widest text-[var(--color-brand-approve)] uppercase flex items-center">
                      <Check className="h-3 w-3 mr-1"/> VALID
                    </span>
                  </div>
                  <div className="p-4 space-y-3 text-xs font-mono">
                    <div className="flex">
                      <span className="text-[10px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase w-24 font-sans mt-0.5">ACTION</span>
                      <span className="text-white">{interpretation.structured_rule.action}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[10px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase w-24 font-sans mt-0.5">CONDITIONS</span>
                      <div className="flex-1 space-y-1 text-white">
                        {interpretation.structured_rule.conditions.map((c, i) => (
                          <div key={i}>{c.field} <span className="text-[var(--color-brand-muted)]">{c.operator.replace(/_/g, ' ')}</span> {c.value}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {interpretation.status === 'AMBIGUOUS' && (
                <div className="bg-[var(--color-brand-escalate-bg)] border border-[var(--color-brand-escalate)] p-3.5 rounded-xl text-xs font-mono">
                  <div className="text-[10px] font-bold tracking-widest text-[var(--color-brand-escalate)] uppercase font-sans mb-1.5 flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5"/> AMBIGUOUS
                  </div>
                  <div className="text-[var(--color-brand-escalate)] opacity-90">{interpretation.message}</div>
                </div>
              )}

              {interpretation.status === 'UNSUPPORTED' && (
                <div className="bg-[var(--color-brand-escalate-bg)] border border-[var(--color-brand-escalate)] p-3.5 rounded-xl text-xs font-mono">
                  <div className="text-[10px] font-bold tracking-widest text-[var(--color-brand-escalate)] uppercase font-sans mb-1.5 flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5"/> UNSUPPORTED
                  </div>
                  <div className="text-[var(--color-brand-escalate)] opacity-90">{interpretation.message}</div>
                </div>
              )}

              {interpretation.status === 'INVALID' && (
                <div className="bg-[var(--color-brand-reject-bg)] border border-[var(--color-brand-reject)] p-3.5 rounded-xl text-xs font-mono">
                  <div className="text-[10px] font-bold tracking-widest text-[var(--color-brand-reject)] uppercase font-sans mb-1.5 flex items-center">
                    <X className="h-3.5 w-3.5 mr-1.5"/> INVALID
                  </div>
                  <div className="text-[var(--color-brand-reject)] opacity-90">{interpretation.message}</div>
                </div>
              )}

              {interpretation.status === 'VALID' && (
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="mt-4 w-full rounded-lg py-2.5 border border-[var(--color-brand-approve)] bg-[var(--color-brand-approve-bg)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-brand-approve)] hover:bg-[var(--color-brand-approve)] hover:text-white disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {saving ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" /> : null}
                  Save Policy
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active Policies */}
        <div className="px-6 py-5">
          <h4 className="text-[10px] font-bold tracking-widest text-[var(--color-brand-muted)] uppercase mb-4">ACTIVE POLICIES</h4>
          
          {loading ? (
             <div className="text-[10px] text-center text-gray-500 py-4 uppercase tracking-widest">LOADING...</div>
          ) : rules.length === 0 ? (
             <div className="text-[10px] text-center text-gray-500 py-4 border border-dashed border-gray-700 rounded-xl uppercase tracking-widest">NO POLICIES</div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className={`reference-card p-3.5 ${rule.is_active ? 'border-gray-700' : 'opacity-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[10px] font-mono tracking-wider text-[var(--color-brand-muted)]">POL-{rule.id.toString().padStart(3, '0')}</div>
                      <div className="text-xs text-white mt-0.5 font-bold truncate max-w-[150px]">{rule.original_text}</div>
                    </div>
                    <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm border ${rule.is_active ? 'border-[var(--color-brand-approve)] text-[var(--color-brand-approve)] bg-[var(--color-brand-approve-bg)]' : 'border-gray-600 text-gray-500'}`}>
                      {rule.structured_rule.action}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--color-brand-border)]">
                    <span className={`text-[9px] font-bold tracking-widest flex items-center ${rule.is_active ? 'text-[var(--color-brand-approve)]' : 'text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${rule.is_active ? 'bg-[var(--color-brand-approve)]' : 'bg-gray-500'}`}></span>
                      {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <div className="flex space-x-3">
                      <button onClick={() => handleToggleActive(rule)} className="text-gray-500 hover:text-white" title="Toggle">
                        {rule.is_active ? <PowerOff className="w-3.5 h-3.5"/> : <Power className="w-3.5 h-3.5"/>}
                      </button>
                      <button onClick={() => handleDeleteClick(rule)} className="text-gray-500 hover:text-[var(--color-brand-reject)]" title="Delete">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Action Area */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-[var(--color-brand-bg)] border-t border-[var(--color-brand-border)] flex items-center space-x-3">
        <button
          onClick={onRunEvaluation}
          disabled={isProcessRunning}
          className="flex-1 py-3 reference-button tracking-widest text-xs"
        >
          {isProcessRunning ? 'PROCESSING...' : 'RUN POLICY EVALUATION'}
        </button>
        <button
          onClick={resetIntake}
          disabled={interpreting || saving || isProcessRunning}
          className="px-5 py-3 rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-panel)] text-white text-xs font-bold uppercase tracking-widest hover:border-gray-500 transition-colors disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {/* Custom Delete Confirmation Modal using Portal to escape stacking context */}
      {policyToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-brand-panel)] border border-[var(--color-brand-border)] rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3 text-[var(--color-brand-reject)] mb-4">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-white">Delete Policy</h3>
            </div>
            <p className="text-xs text-[var(--color-brand-muted)] mb-6">
              Are you sure you want to delete <span className="text-white font-mono">{policyToDelete.original_text}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={cancelDelete} 
                className="px-4 py-2 rounded-lg border border-[var(--color-brand-border)] text-white text-xs font-bold hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 rounded-lg border border-[var(--color-brand-reject)] bg-[var(--color-brand-reject-bg)] text-[var(--color-brand-reject)] text-xs font-bold hover:bg-[var(--color-brand-reject)] hover:text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
