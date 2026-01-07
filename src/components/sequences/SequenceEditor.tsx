'use client';

import { useState } from 'react';
import type { SequenceWithSteps, SequenceStepWithActions, TPLinkDevice, DeviceGroupWithItems } from '@/types';

interface SequenceEditorProps {
  sequence: SequenceWithSteps;
  availableDevices: TPLinkDevice[];
  deviceGroups: DeviceGroupWithItems[];
  onUpdateName: (name: string) => void;
  onAddStep: (delayMs: number) => void;
  onUpdateStep: (stepId: string, delayMs: number) => void;
  onDeleteStep: (stepId: string) => void;
  onAddAction: (stepId: string, deviceId: string, deviceName: string, action: 'on' | 'off') => void;
  onRemoveAction: (stepId: string, actionId: string) => void;
  onClose: () => void;
}

export default function SequenceEditor({
  sequence,
  availableDevices,
  deviceGroups,
  onUpdateName,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onAddAction,
  onRemoveAction,
  onClose,
}: SequenceEditorProps) {
  const [name, setName] = useState(sequence.name);
  const [newStepDelay, setNewStepDelay] = useState(1000);
  
  const sortedSteps = [...sequence.steps].sort((a, b) => a.order_index - b.order_index);
  
  const handleSaveName = () => {
    if (name.trim() && name !== sequence.name) {
      onUpdateName(name.trim());
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Edit Sequence</h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Sequence name */}
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName}
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              placeholder="Sequence name"
            />
          </div>
        </div>
        
        {/* Steps */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {sortedSteps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                availableDevices={availableDevices}
                onUpdateDelay={(delayMs) => onUpdateStep(step.id, delayMs)}
                onDelete={() => onDeleteStep(step.id)}
                onAddAction={(deviceId, deviceName, action) => onAddAction(step.id, deviceId, deviceName, action)}
                onRemoveAction={(actionId) => onRemoveAction(step.id, actionId)}
              />
            ))}
            
            {/* Add step */}
            <div className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700">
              <input
                type="number"
                value={newStepDelay}
                onChange={(e) => setNewStepDelay(parseInt(e.target.value) || 0)}
                min={0}
                step={100}
                className="w-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              <span className="text-zinc-500 text-sm">ms delay</span>
              <button
                onClick={() => onAddStep(newStepDelay)}
                className="ml-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Add Step
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface StepCardProps {
  step: SequenceStepWithActions;
  index: number;
  availableDevices: TPLinkDevice[];
  onUpdateDelay: (delayMs: number) => void;
  onDelete: () => void;
  onAddAction: (deviceId: string, deviceName: string, action: 'on' | 'off') => void;
  onRemoveAction: (actionId: string) => void;
}

function StepCard({
  step,
  index,
  availableDevices,
  onUpdateDelay,
  onDelete,
  onAddAction,
  onRemoveAction,
}: StepCardProps) {
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedAction, setSelectedAction] = useState<'on' | 'off'>('on');
  
  const handleAddAction = () => {
    const device = availableDevices.find(d => d.deviceId === selectedDeviceId);
    if (device) {
      onAddAction(device.deviceId, device.alias, selectedAction);
      setSelectedDeviceId('');
      setShowAddDevice(false);
    }
  };
  
  return (
    <div className="bg-zinc-800 rounded-lg overflow-hidden">
      {/* Step header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <div className="flex items-center gap-4">
          <span className="w-8 h-8 flex items-center justify-center bg-zinc-700 rounded-full text-sm font-medium text-white">
            {index + 1}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-sm">Wait</span>
            <input
              type="number"
              value={step.delay_ms}
              onChange={(e) => onUpdateDelay(parseInt(e.target.value) || 0)}
              min={0}
              step={100}
              className="w-20 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
            <span className="text-zinc-400 text-sm">ms, then:</span>
          </div>
        </div>
        
        <button
          onClick={onDelete}
          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      {/* Actions */}
      <div className="p-4">
        {step.actions.length === 0 && !showAddDevice ? (
          <p className="text-sm text-zinc-500 text-center py-2">No actions in this step</p>
        ) : (
          <div className="space-y-2 mb-3">
            {step.actions.map((action) => (
              <div
                key={action.id}
                className={`flex items-center justify-between p-2 rounded ${
                  action.action === 'on' 
                    ? 'bg-emerald-900/30 border border-emerald-800/50' 
                    : 'bg-zinc-700/50 border border-zinc-600/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    action.action === 'on' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-zinc-600 text-zinc-300'
                  }`}>
                    {action.action.toUpperCase()}
                  </span>
                  <span className="text-white text-sm">{action.device_name}</span>
                </div>
                <button
                  onClick={() => onRemoveAction(action.id)}
                  className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add action form */}
        {showAddDevice ? (
          <div className="flex items-center gap-2 p-2 bg-zinc-700/50 rounded">
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              <option value="">Select device...</option>
              {availableDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.alias}
                </option>
              ))}
            </select>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as 'on' | 'off')}
              className="w-20 px-2 py-1.5 bg-zinc-700 border border-zinc-600 rounded text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
            <button
              onClick={handleAddAction}
              disabled={!selectedDeviceId}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddDevice(false)}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddDevice(true)}
            className="w-full py-2 text-sm text-amber-500 hover:text-amber-400 hover:bg-zinc-700/50 rounded transition-colors"
          >
            + Add Action
          </button>
        )}
      </div>
    </div>
  );
}





