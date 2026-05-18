'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownViewer } from '@/components/editor/markdown-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2, Eye, PenLine } from 'lucide-react';


const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'go',
  'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css', 'sql',
  'bash', 'json', 'yaml', 'markdown', 'plaintext'
];

interface CodeBlockInsertDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (language: string, code: string) => void;
}

export function CodeBlockInsertDialog({ open, onClose, onInsert }: CodeBlockInsertDialogProps) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');

  const handleInsert = () => {
    if (code.trim()) {
      onInsert(language, code);
      setCode('');
      setLanguage('javascript');
      onClose();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Force plain text paste to strip any VSCode HTML/RTF formatting and colors
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const newCode = code.substring(0, start) + text + code.substring(end);
    setCode(newCode);
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = start + text.length;
    }, 0);
  };

  const previewMarkdown = `\`\`\`${language}\n${code}\n\`\`\``;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] lg:min-w-5xl p-0 overflow-hidden gap-0 bg-background border shadow-2xl rounded-xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/20 mx-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-brand-500/10 text-brand-500">
                <Code2 className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg font-semibold">Insert Code Snippet</DialogTitle>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">Language</span>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-35 h-8 bg-background shadow-sm border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang} className="cursor-pointer">
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="write" className="flex flex-col flex-1 h-[60vh] min-h-100">
          <div className="px-6 py-2 border-b bg-muted/5 flex items-center justify-between">
            <TabsList className="h-8 bg-muted/50 p-0.5">
              <TabsTrigger value="write" className="text-xs px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <PenLine className="w-3.5 h-3.5" />
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs px-3 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Eye className="w-3.5 h-3.5" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="write" className="flex-1 m-0 p-0 overflow-hidden outline-none data-[state=active]:flex flex-col bg-muted/5">
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Code Editor</span>
              <div className="flex-1 rounded-md border border-input bg-background shadow-sm overflow-hidden flex flex-col">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="// Paste your code here...&#10;// Formatting is automatically stripped."
                  className="flex-1 w-full font-mono text-[13px] leading-relaxed resize-none border-0 outline-none focus:ring-0 focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground p-4 overflow-auto"
                  spellCheck={false}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 m-0 p-0 overflow-hidden outline-none data-[state=active]:flex flex-col bg-muted/5">
            {code ? (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Snippet Preview</span>
                <div className="flex-1 overflow-auto rounded-md border border-input bg-background shadow-sm p-4">
                  <div className="w-full max-w-full">
                    <MarkdownViewer source={previewMarkdown} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-3">
                <Code2 className="w-10 h-10 opacity-20" />
                <p className="text-sm">Nothing to preview</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 py-4 mb-1 border-t bg-muted/20">
          <Button variant="ghost" onClick={onClose} className="hover:bg-muted/80">
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!code.trim()} className="bg-brand-500 hover:bg-brand-600 text-white shadow-sm">
            Insert Snippet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
