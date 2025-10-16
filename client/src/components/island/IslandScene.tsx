import React from "react";

type BiomeId = "forest" | "tropics" | "desert" | "coast";

type BiomeNode = {
  id: BiomeId;
  x: number;
  y: number;
};

type IslandSceneProps = {
  lap: number;
  nodes: BiomeNode[];
  onClickBiome: (id: BiomeId) => void;
  progressById: Record<string, { done: number; total: number }>;
};

const BiomeSVG = ({ id }: { id: BiomeId }) => {
  if (id === "forest") {
    return (
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        <circle cx="30" cy="60" r="18" fill="#86efac" />
        <circle cx="50" cy="55" r="22" fill="#4ade80" />
        <circle cx="70" cy="60" r="18" fill="#86efac" />
        <rect x="45" y="70" width="10" height="20" fill="#78716c" />
      </svg>
    );
  }

  if (id === "tropics") {
    return (
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        <circle cx="70" cy="25" r="12" fill="#fde047" opacity="0.6" />
        <line
          x1="50"
          y1="80"
          x2="50"
          y2="40"
          stroke="#78716c"
          strokeWidth="3"
        />
        <ellipse
          cx="40"
          cy="35"
          rx="20"
          ry="8"
          fill="#4ade80"
          transform="rotate(-30 40 35)"
        />
        <ellipse
          cx="60"
          cy="45"
          rx="20"
          ry="8"
          fill="#22c55e"
          transform="rotate(30 60 45)"
        />
      </svg>
    );
  }

  if (id === "desert") {
    return (
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        <circle cx="30" cy="20" r="15" fill="#fbbf24" />
        <ellipse cx="30" cy="70" rx="40" ry="20" fill="#fcd34d" />
        <ellipse cx="70" cy="75" rx="35" ry="18" fill="#fde047" />
      </svg>
    );
  }

  if (id === "coast") {
    return (
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        <path
          d="M10 60 Q30 55, 50 60 T90 60"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3"
        />
        <path
          d="M10 70 Q30 65, 50 70 T90 70"
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="3"
        />
        <path
          d="M10 80 Q30 75, 50 80 T90 80"
          fill="none"
          stroke="#0284c7"
          strokeWidth="3"
        />
      </svg>
    );
  }

  return null;
};

const BiomeNode = ({
  node,
  progress,
  onClick,
}: {
  node: BiomeNode;
  progress: { done: number; total: number };
  onClick: () => void;
}) => {
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
      data-testid={`biome-${node.id}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="relative w-36 h-36 rounded-full bg-white/90 backdrop-blur-sm shadow-xl border-4 border-amber-200 flex items-center justify-center hover:scale-105 transition-transform">
        <BiomeSVG id={node.id} />
        <div
          className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500 text-white shadow-sm"
          data-testid={`progress-${node.id}`}
        >
          {progress.done}/{progress.total}
        </div>
      </div>
    </div>
  );
};

const WindingRoad = () => {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        d="M 28 30 Q 50 20, 72 30 Q 50 40, 28 70 Q 50 60, 72 70"
        fill="none"
        stroke="#d4a574"
        strokeWidth="0.8"
        strokeDasharray="2 1"
        opacity="0.5"
      />
    </svg>
  );
};

export default function IslandScene({
  lap,
  nodes,
  onClickBiome,
  progressById,
}: IslandSceneProps) {
  return (
    <div className="relative w-full min-h-[70vh] rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-2xl border-4 border-amber-200">
      {/* Parchment texture overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(120,53,15,0.1)_100%)]" />

      {/* Winding road */}
      <WindingRoad />

      {/* Biome nodes */}
      {nodes.map((node) => (
        <BiomeNode
          key={node.id}
          node={node}
          progress={progressById[node.id] || { done: 0, total: 3 }}
          onClick={() => onClickBiome(node.id)}
        />
      ))}
    </div>
  );
}
