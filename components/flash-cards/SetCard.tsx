"use client";

import { Layers, ShieldCheck, User, Download, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatSubjectName, getSubjectAbbreviation } from "@/utils/subjects";

interface SetCardProps {
  id?: string;
  title: string;
  subject: string;
  isAdmin: boolean;
  cardCount: number;
  author: string;
  onClick: () => void;
  index: number;
  isRequestedByMe?: boolean;
  isOffline?: boolean;
  onToggleOffline?: (e: React.MouseEvent) => void;
}

export default function SetCard({
  title,
  subject,
  isAdmin,
  cardCount,
  author,
  onClick,
  index,
  isRequestedByMe,
  isOffline = false,
  onToggleOffline,
}: SetCardProps) {
  const SourceIcon = isAdmin ? ShieldCheck : User;
  const sourceLabel = isAdmin ? "Admin" : "You";
  const sourceColor = isAdmin ? "text-accent bg-accent/5 border-accent/20" : "text-violet-500 bg-violet-500/5 border-violet-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3, scale: 1.01 }}
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-border bg-card p-4 hover:border-accent/40 hover:shadow-md hover:shadow-accent/5 transition-all group flex flex-col justify-between h-[140px]"
    >
      <div>
        <div className="flex items-start justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary group-hover:bg-accent/10 transition-colors">
            <Layers className="h-4 w-4 text-accent" />
          </div>
          <div className="flex flex-col items-end gap-1">
            {isRequestedByMe ? (
              <Badge variant="outline" className="text-[9px] font-semibold py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                Requested
              </Badge>
            ) : (
              <Badge variant="outline" className={`text-[9px] font-semibold py-0.5 flex items-center gap-1 ${sourceColor}`}>
                <SourceIcon className="h-2.5 w-2.5" />
                {sourceLabel}
              </Badge>
            )}
          </div>
        </div>

        <h3 className="mt-3 text-sm font-semibold text-card-foreground line-clamp-2 group-hover:text-accent transition-colors" title={title}>
          {title}
        </h3>
      </div>

      <div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-[9px] font-bold py-0 bg-secondary/80 text-muted-foreground">
            {getSubjectAbbreviation(subject as any)}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{cardCount} cards</span>
            {onToggleOffline && process.env.NEXT_PUBLIC_ENABLE_OFFLINE === "true" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOffline(e);
                }}
                className="rounded-full p-1 hover:bg-secondary transition-colors"
                title={isOffline ? "Remove from offline storage" : "Save Offline"}
              >
                {isOffline ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-accent" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
