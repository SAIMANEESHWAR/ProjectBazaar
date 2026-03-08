import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

export interface DiagramNode {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    fill: string;
    icon?: string; // Lucide icon name
    lottieUrl?: string; // Lottie JSON URL for animation
}

export interface DiagramEdge {
    from: string;
    to: string;
    label: string;
    dashed: boolean;
}

export interface DiagramLegend {
    color: string;
    label: string;
}

export interface DiagramData {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    legend: DiagramLegend[];
    subtitle?: string;
}

interface SDDiagramRendererProps {
    data: DiagramData;
}

const LottieIcon = ({ url, size }: { url: string; size: number }) => {
    const [animationData, setAnimationData] = useState<any>(null);

    useEffect(() => {
        if (!url) return;
        fetch(url)
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error("Error loading Lottie:", err));
    }, [url]);

    if (!animationData) return null;

    return (
        <Lottie
            animationData={animationData}
            loop={true}
            style={{ width: size, height: size }}
        />
    );
};

export default function SDDiagramRenderer({ data }: SDDiagramRendererProps) {
    const { nodes, edges, legend, subtitle } = data;

    // Calculate viewBox
    const minX = Math.min(...nodes.map(n => n.x)) - 50;
    const minY = Math.min(...nodes.map(n => n.y)) - 50;
    const maxX = Math.max(...nodes.map(n => n.x + n.w)) + 50;
    const maxY = Math.max(...nodes.map(n => n.y + n.h)) + 50;
    const width = maxX - minX;
    const height = maxY - minY;

    const getNode = (id: string) => nodes.find(n => n.id === id);

    return (
        <div className="bg-gray-900/40 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm shadow-2xl overflow-hidden group">
            {subtitle && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-medium text-orange-400/80 mb-6 tracking-wide uppercase"
                >
                    {subtitle}
                </motion.p>
            )}

            <div className="relative w-full overflow-x-auto scrollbar-hide pb-4">
                <svg
                    viewBox={`${minX} ${minY} ${width} ${height}`}
                    className="w-full h-auto min-w-[600px] drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
                >
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                        <marker id="arrowhead-orange" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
                        </marker>
                    </defs>

                    {/* Edges */}
                    {edges.map((edge, i) => {
                        const from = getNode(edge.from);
                        const to = getNode(edge.to);
                        if (!from || !to) return null;

                        const x1 = from.x + from.w / 2;
                        const y1 = from.y + from.h / 2;
                        const x2 = to.x + to.w / 2;
                        const y2 = to.y + to.h / 2;

                        return (
                            <g key={`edge-${i}`}>
                                <motion.line
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke={edge.dashed ? "#f97316" : "#475569"} // Orange for flow
                                    strokeWidth="2"
                                    strokeDasharray={edge.dashed ? "5,5" : "none"}
                                    markerEnd={edge.dashed ? "url(#arrowhead-orange)" : "url(#arrowhead)"}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{
                                        pathLength: 1,
                                        opacity: 1,
                                        strokeDashoffset: edge.dashed ? [0, -10] : 0
                                    }}
                                    transition={{
                                        pathLength: { duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" },
                                        opacity: { duration: 0.3, delay: 0.5 + i * 0.1 },
                                        strokeDashoffset: {
                                            duration: 0.5,
                                            repeat: Infinity,
                                            ease: "linear",
                                            repeatType: "loop"
                                        }
                                    }}
                                />
                                {edge.label && (
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <rect
                                            x={(x1 + x2) / 2 - 40}
                                            y={(y1 + y2) / 2 - 10}
                                            width="80"
                                            height="20"
                                            rx="4"
                                            fill="#111827"
                                            fillOpacity="0.8"
                                        />
                                        <text
                                            x={(x1 + x2) / 2}
                                            y={(y1 + y2) / 2 + 4}
                                            textAnchor="middle"
                                            fill="#94a3b8"
                                            fontSize="10"
                                            fontWeight="600"
                                            className="pointer-events-none"
                                        >
                                            {edge.label}
                                        </text>
                                    </motion.g>
                                )}
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node, i) => {
                        const IconComponent = node.icon ? (LucideIcons as any)[node.icon] : null;
                        const delay = i * 0.1;

                        return (
                            <motion.g
                                key={node.id}
                                className="cursor-default group/node"
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.5, delay, ease: "backOut" }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <motion.rect
                                    x={node.x} y={node.y} width={node.w} height={node.h}
                                    rx="8"
                                    fill={node.fill}
                                    stroke="#ffffff20"
                                    strokeWidth="1.5"
                                    className="transition-all duration-300 group-hover/node:stroke-orange-500/50 group-hover/node:filter group-hover/node:blur-[0.5px]"
                                    whileHover={{ fillOpacity: 0.9 }}
                                />

                                {node.lottieUrl ? (
                                    <foreignObject x={node.x + 6} y={node.y + (node.h - 22) / 2} width="22" height="22">
                                        <LottieIcon url={node.lottieUrl} size={22} />
                                    </foreignObject>
                                ) : IconComponent ? (
                                    <motion.g
                                        transform={`translate(${node.x + 8}, ${node.y + (node.h - 16) / 2})`}
                                        animate={{
                                            y: [0, -2, 0],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: Math.random() * 2
                                        }}
                                    >
                                        <IconComponent size={16} color="white" strokeWidth={2.5} />
                                    </motion.g>
                                ) : null}

                                <text
                                    x={(node.lottieUrl || IconComponent) ? node.x + 32 : node.x + node.w / 2}
                                    y={node.y + node.h / 2 + 5}
                                    textAnchor={(node.lottieUrl || IconComponent) ? "start" : "middle"}
                                    fill="white"
                                    fontSize="12"
                                    fontWeight="700"
                                    className="pointer-events-none select-none text-[11px]"
                                >
                                    {node.label}
                                </text>
                            </motion.g>
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            {legend && legend.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="mt-8 flex flex-wrap gap-6 pt-6 border-t border-gray-800/80"
                >
                    {legend.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 group/legend">
                            <motion.div
                                whileHover={{ scale: 1.2, rotate: 90 }}
                                className="w-4 h-4 rounded-md shadow-lg transition-transform"
                                style={{ backgroundColor: item.color, border: '1px solid #ffffff20' }}
                            />
                            <span className="text-sm font-medium text-gray-400 group-hover/legend:text-gray-300 transition-colors uppercase tracking-wider">{item.label}</span>
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
