'use client';

import { Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ComposerToolbarProps {
  onCodeBlockClick: () => void;
  disabled?: boolean;
}

export function ComposerToolbar({ onCodeBlockClick, disabled }: ComposerToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 px-1 py-1 border-b border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCodeBlockClick}
              disabled={disabled}
              className="h-7 w-7 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Insert code block (Ctrl+Shift+C)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
