import { cn } from "@/lib/utils";
import React from "react";
import { Button } from "./button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between pb-4 border-b border-border/50">
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 rounded-full">
            ✕
          </Button>
        </div>
        <div className="py-4">{children}</div>
      </div>
    </div>
  );
}
