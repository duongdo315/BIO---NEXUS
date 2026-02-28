import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Plus, RotateCcw, X, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import MarkdownRenderer from './MarkdownRenderer';
import { generateMedicalResponse } from '../services/gemini';
import { Language, translations } from '../translations';

interface GraphNode {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}

const initialNodes: GraphNode[] = [
  { id: '1', x: 150, y: 200, label: 'Gene', color: 'bg-blue-500' },
  { id: '2', x: 300, y: 100, label: 'mRNA', color: 'bg-blue-400' },
  { id: '3', x: 300, y: 300, label: 'Epigenetics', color: 'bg-indigo-400' },
  { id: '4', x: 500, y: 100, label: 'Protein', color: 'bg-teal-500' },
  { id: '5', x: 500, y: 300, label: 'Enzyme', color: 'bg-teal-400' },
  { id: '6', x: 700, y: 200, label: 'Metabolism', color: 'bg-emerald-500' },
  { id: '7', x: 400, y: 200, label: 'Ribosome', color: 'bg-purple-500' },
  { id: '8', x: 600, y: 200, label: 'ATP', color: 'bg-amber-500' },
];

export default function KnowledgeGraph({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);

  // Sync node labels with current language
  useEffect(() => {
    setNodes(prev => prev.map(node => {
      const translatedNode = t.graphNodes.find(gn => gn.id === node.id);
      if (translatedNode) {
        return { ...node, label: translatedNode.label };
      }
      return node;
    }));
  }, [lang, t.graphNodes]);

  const handleConceptClick = async (concept: string) => {
    setSelectedConcept(concept);
    setSolution(null);
    try {
      const prompt = `Provide a detailed, advanced explanation of the biological concept: ${concept}. 
      Include its role in cellular processes, related diseases, and key textbook references (e.g., Campbell Biology, Molecular Biology of the Cell).
      Format with clear headings and bullet points.
      Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'}.`;
      const response = await generateMedicalResponse(prompt, 'Student Mode');
      setSolution(response || (lang === 'vi' ? "Không có dữ liệu." : "No data available."));
    } catch (error) {
      console.error(error);
    }
  };

  const handleNodeDrag = (e: React.MouseEvent<SVGSVGElement>, id: string) => {
    if (!draggingNodeId) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    setNodes(prev => prev.map(node => 
      node.id === id ? { ...node, x, y } : node
    ));
  };

  const handleAddNode = () => {
    if (!newNodeName.trim()) return;
    const newNode: GraphNode = {
      id: Date.now().toString(),
      x: 400,
      y: 250,
      label: newNodeName,
      color: 'bg-indigo-500'
    };
    setNodes([...nodes, newNode]);
    setNewNodeName('');
    setIsAddingNode(false);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(node => node.id !== id));
    if (selectedConcept === nodes.find(n => n.id === id)?.label) {
      setSelectedConcept(null);
    }
  };

  const handleResetGraph = () => {
    setNodes(initialNodes.map(node => {
      const translatedNode = t.graphNodes.find(gn => gn.id === node.id);
      if (translatedNode) {
        return { ...node, label: translatedNode.label };
      }
      return node;
    }));
    setSelectedConcept(null);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bio-Nexus Knowledge Graph</h2>
          <p className="text-sm text-slate-500">{t.knowledgeGraphDesc}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] text-blue-600 font-bold bg-blue-50 w-fit px-3 py-1 rounded-full">
              <Info size={12} />
              {lang === 'vi' ? 'Kéo để di chuyển, nhấp để xem chi tiết' : 'Drag to move, click for details'}
            </div>
            <button 
              onClick={() => setIsAddingNode(true)}
              className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors"
            >
              <Plus size={12} />
              {t.addNode}
            </button>
            <button 
              onClick={handleResetGraph}
              className="flex items-center gap-2 text-[10px] text-slate-600 font-bold bg-slate-50 w-fit px-3 py-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <RotateCcw size={12} />
              {t.resetGraph}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase">Genetics</span>
          <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-bold rounded-full uppercase">Physiology</span>
        </div>
      </div>

      <div className="relative h-[500px] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
        <svg 
          className="w-full h-full cursor-crosshair"
          onMouseMove={(e) => draggingNodeId && handleNodeDrag(e, draggingNodeId)}
          onMouseUp={() => setDraggingNodeId(null)}
          onMouseLeave={() => setDraggingNodeId(null)}
        >
          {/* Dynamic Lines */}
          {nodes.map((node, i) => {
            if (i === 0) return null;
            const prevNode = nodes[i - 1];
            return (
              <line 
                key={`line-${i}`}
                x1={prevNode.x} 
                y1={prevNode.y} 
                x2={node.x} 
                y2={node.y} 
                stroke="#CBD5E1" 
                strokeWidth="1" 
                strokeDasharray="4" 
                className="opacity-50"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <g 
              key={node.id} 
              className="cursor-pointer group" 
              onMouseDown={() => setDraggingNodeId(node.id)}
              onClick={(e) => {
                if (draggingNodeId) return;
                handleConceptClick(node.label);
              }}
            >
              {/* Glow Effect */}
              <circle 
                cx={node.x} 
                cy={node.y} 
                r="20" 
                className={cn(
                  "fill-current opacity-0 group-hover:opacity-20 transition-opacity blur-md",
                  node.color.replace('bg-', 'text-')
                )}
              />
              <circle 
                cx={node.x} 
                cy={node.y} 
                r="14" 
                className={cn(
                  node.color, 
                  "transition-all group-hover:r-18 shadow-lg", 
                  selectedConcept === node.label && "ring-4 ring-blue-200",
                  draggingNodeId === node.id && "scale-125 opacity-80"
                )}
              />
              <text 
                x={node.x} 
                y={node.y + 35} 
                textAnchor="middle" 
                className={cn(
                  "text-[12px] font-bold transition-colors select-none",
                  selectedConcept === node.label ? "fill-blue-600" : "fill-slate-600 group-hover:fill-blue-600"
                )}
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Add Node UI */}
        <AnimatePresence>
          {isAddingNode && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-6 left-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl z-20 flex gap-2"
            >
              <input 
                type="text" 
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder={t.nodeName}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button 
                onClick={handleAddNode}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
              >
                {t.addNode}
              </button>
              <button 
                onClick={() => setIsAddingNode(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {selectedConcept && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-6 right-6 w-80 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-2xl z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">{t.nodeDetails}</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const node = nodes.find(n => n.label === selectedConcept);
                      if (node) handleDeleteNode(node.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                    title={t.deleteNode}
                  >
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setSelectedConcept(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="prose prose-slate max-w-none text-xs leading-relaxed markdown-body">
                <MarkdownRenderer content={solution || "Loading concept details..."} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
