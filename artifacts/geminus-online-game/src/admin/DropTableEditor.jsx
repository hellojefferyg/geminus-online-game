import React, { useState } from 'react';
import { useStudioStore } from '../../stores/StudioStore';
import { Save, Package, GitMerge, Trash2, Plus, Sword, Shield, Gem } from 'lucide-react';
import './admin.css';

export default function DropTableEditor() {
    const { masterData, updateData } = useStudioStore();
    const tables = masterData.dropTables || {};
    
    const [selectedId, setSelectedId] = useState(Object.keys(tables)[0] || null);

    const handlePoolUpdate = (newPool) => {
        // STRICT SCHEMA ENFORCEMENT: Guarantee a clean array of strings for CombatManager
        const sanitizedPool = (Array.isArray(newPool) ? newPool : [])
            .map(item => String(item).trim())
            .filter(item => item !== "");
            
        updateData('dropTables', selectedId, { ...(tables[selectedId] || {}), pool: sanitizedPool });
    };

    const handleAddEntry = () => {
        const input = prompt("Enter Item Key(s) or Category (comma-separated for multiple, e.g., 'sword, AXE-T01'):");
        if (input) {
            // Parses bulk comma-separated entries securely
            const newItems = input.split(',').map(item => item.trim()).filter(item => item !== "");
            const currentPool = Array.isArray(tables[selectedId]?.pool) ? tables[selectedId].pool : [];
            handlePoolUpdate([...currentPool, ...newItems]);
        }
    };

    return (
        <div className="editor-container">
            <div className="editor-sidebar">
                <div className="sidebar-header">
                    <Package size={18} className="text-orange-400" />
                    <span className="sidebar-title">LOOT MASTER</span>
                </div>
                <div className="sidebar-list">
                    {Object.entries(tables).map(([id, t]) => (
                        <div key={id} onClick={() => setSelectedId(id)} className={`sidebar-item ${selectedId === id ? 'active' : ''}`}>
                            <span className="font-mono text-[9px] opacity-40 mr-2">{id}</span>
                            {t.name}
                        </div>
                    ))}
                </div>
            </div>

            <div className="editor-main">
                {selectedId ? (
                    <div className="editor-content">
                        <div className="content-header">
                            <div className="flex flex-col w-1/2">
                                <label className="text-[9px] text-orange-500 font-black uppercase mb-1">Drop Table Name</label>
                                <input 
                                    value={tables[selectedId].name || ''} 
                                    onChange={(e) => updateData('dropTables', selectedId, { ...tables[selectedId], name: e.target.value })}
                                    className="bg-transparent text-xl font-cinzel text-orange-100 tracking-widest outline-none border-b border-transparent focus:border-orange-500/50"
                                />
                            </div>
                            <div className="flex gap-2 items-end">
                                <button className="action-button reset"><Trash2 size={14} /></button>
                                <button className="action-button save"><Save size={14} /> Commit Tables</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mt-8">
                            <div className="editor-section">
                                <h3 className="section-title"><Package size={14}/> Active Loot Pool</h3>
                                <div className="space-y-2 bg-black/20 p-4 rounded-xl min-h-[300px]">
                                    {(Array.isArray(tables[selectedId].pool) ? tables[selectedId].pool : []).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-[#1a1c23] px-3 py-2 rounded border border-orange-900/10 group">
                                            <span className="text-xs text-gray-300 font-mono">{item}</span>
                                            <button onClick={() => handlePoolUpdate(tables[selectedId].pool.filter((_, i) => i !== idx))}
                                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={handleAddEntry} className="w-full py-2 mt-4 border border-dashed border-orange-900/30 text-orange-500 text-[10px] uppercase font-bold hover:bg-orange-500/10 transition-all">
                                        <Plus size={12} className="inline mr-1" /> Append Item Category
                                    </button>
                                </div>
                            </div>

                            <div className="editor-section border-l border-orange-900/30 pl-8">
                                <h3 className="section-title"><GitMerge size={14}/> Cross-Drop Logic</h3>
                                <div className="editor-field-group">
                                    <label>Linked Drop Table (CrossDrop)</label>
                                    <select value={tables[selectedId].crossDrop || ""} 
                                        onChange={e => updateData('dropTables', selectedId, { ...tables[selectedId], crossDrop: e.target.value || null })}>
                                        <option value="">None (Terminal Table)</option>
                                        {Object.keys(tables).filter(id => id !== selectedId).map(id => (
                                            <option key={id} value={id}>{id}: {tables[id].name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-gray-500 italic mt-2 leading-relaxed">
                                        If the RNG roll fails the primary pool, the engine will cascade into the Linked Table for a fallback item generation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-10"><Package size={120} /></div>
                )}
            </div>
        </div>
    );
}