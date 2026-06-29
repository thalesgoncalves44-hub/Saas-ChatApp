'use client';
import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'bg-[#1a1a2e] border border-[#2d2d4f] rounded-2xl shadow-2xl',
            'w-full max-w-lg max-h-[90vh] overflow-y-auto',
            'animate-in fade-in slide-in-from-bottom-4',
            className,
          )}
        >
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-[#2d2d4f]">
              <div>
                <Dialog.Title className="text-lg font-semibold text-white">{title}</Dialog.Title>
                {description && <Dialog.Description className="text-sm text-gray-400 mt-1">{description}</Dialog.Description>}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#2d2d4f] text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
