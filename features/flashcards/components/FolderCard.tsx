"use client";

import { Folder, ChevronRight, Tag, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface FolderCardProps {
  name: string;
  tag: string;
  setCount: number;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  index: number;
}

export default function FolderCard({ name, tag, setCount, onClick, onDelete, index }: FolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -3, scale: 1.01 }}
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-border bg-card p-4 hover:border-accent/40 hover:shadow-md hover:shadow-accent/5 transition-all group flex flex-col justify-between h-[130px]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
          <Folder className="h-4 w-4 text-accent" />
        </div>
        <div className="flex items-center gap-1">
          {onDelete && (
            <div 
              onClick={onDelete}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete folder"
            >
              <Trash2 className="h-4 w-4" />
            </div>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-card-foreground truncate group-hover:text-accent transition-colors" title={name}>
          {name}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[9px] py-0.5 border-accent/20 text-accent bg-accent/5 flex items-center gap-1 font-medium">
            <Tag className="h-2 w-2" />
            {tag || "General"}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
            {setCount} {setCount === 1 ? "set" : "sets"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
