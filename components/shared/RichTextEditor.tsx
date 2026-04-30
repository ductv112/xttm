'use client';

/**
 * Rich text editor based on Tiptap v3.
 *
 * SECURITY NOTE (T-02-03-01 — XSS via Tiptap output):
 * Tiptap StarterKit ko expose `<script>`/iframe nodes by default — output HTML
 * coi như "structured rich text". TUY NHIEN: any downstream component rendering
 * editor output qua `dangerouslySetInnerHTML` PHẢI sanitize trước (eg DOMPurify)
 * hoặc render trong iframe sandbox. Caller chịu trách nhiệm — `value` được lưu
 * vào DB như plain text/HTML và chỉ trust khi server-side sanitize.
 */

import * as React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Braces,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export type VariableMenuItem = {
  /** Variable key — sẽ được insert dạng `{{key}}` */
  key: string;
  /** Human-readable label hiển thị trong picker */
  label: string;
  /** Optional example value rendered faded */
  example?: string;
};

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  variables?: VariableMenuItem[];
  /** Optional callback fired khi user insert 1 variable. Default behavior tự động insert {{key}} */
  onVariableInsert?: (variable: VariableMenuItem) => void;
  /** Editor area min-height in pixels. Default: 200 */
  minHeight?: number;
  /** Read-only mode — toolbar disabled, content not editable */
  readOnly?: boolean;
  className?: string;
  /** ID for label association */
  id?: string;
};

/**
 * Rich text editor với toolbar bold/italic/list/link/headings + variable insertion.
 *
 * @example
 *   <RichTextEditor
 *     value={form.bodyHtml}
 *     onChange={(html) => form.setValue('bodyHtml', html)}
 *     variables={[
 *       { key: 'tenChuongTrinh', label: 'Tên chương trình', example: 'CT XTTM 2026' },
 *       { key: 'namKy', label: 'Năm kỳ', example: '2026' },
 *     ]}
 *   />
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  variables,
  onVariableInsert,
  minHeight = 200,
  readOnly = false,
  className,
  id,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Headings cấu hình tone formal — chỉ allow h2/h3 (h1 reserved cho page title)
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none p-4 focus:outline-none',
          'prose-headings:font-semibold prose-headings:text-slate-900',
          'prose-p:text-slate-700 prose-li:text-slate-700',
          'prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline',
          'prose-strong:text-slate-900'
        ),
        'aria-label': placeholder,
        ...(id ? { id } : {}),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Sync external value changes (eg form.reset)
  React.useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-md border border-slate-200 bg-white',
          className
        )}
      >
        <div className="h-12 border-b border-slate-200 bg-slate-50" />
        <div
          className="animate-pulse bg-slate-50"
          style={{ minHeight: `${minHeight}px` }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-slate-200 bg-white',
        readOnly && 'opacity-80',
        className
      )}
      data-slot="rich-text-editor"
    >
      {!readOnly ? (
        <Toolbar
          editor={editor}
          variables={variables}
          onVariableInsert={onVariableInsert}
        />
      ) : null}
      <div style={{ minHeight: `${minHeight}px` }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

type ToolbarProps = {
  editor: Editor;
  variables?: VariableMenuItem[];
  onVariableInsert?: (variable: VariableMenuItem) => void;
};

function Toolbar({ editor, variables, onVariableInsert }: ToolbarProps) {
  return (
    <div className="flex h-12 items-center gap-1 border-b border-slate-200 bg-slate-50 px-2">
      <ToolbarButton
        ariaLabel="In đậm"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="In nghiêng"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Tiêu đề lớn"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Tiêu đề nhỏ"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Danh sách dấu chấm"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Danh sách số thứ tự"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Trích dẫn"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>

      <Separator />

      <LinkButton editor={editor} />

      {variables && variables.length > 0 ? (
        <>
          <Separator />
          <VariableMenu
            editor={editor}
            variables={variables}
            onVariableInsert={onVariableInsert}
          />
        </>
      ) : null}

      <div className="flex-1" />

      <ToolbarButton
        ariaLabel="Hoàn tác"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Làm lại"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" aria-hidden="true" />
      </ToolbarButton>
    </div>
  );
}

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({
  active,
  disabled,
  ariaLabel,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8',
        active && 'bg-slate-200 text-slate-900 hover:bg-slate-200'
      )}
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Separator() {
  return (
    <div className="mx-1 h-6 w-px bg-slate-300" aria-hidden="true" />
  );
}

// ---------------------------------------------------------------------------
// Link button — toggle or set link via prompt-style popover
// ---------------------------------------------------------------------------

function LinkButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState('');

  React.useEffect(() => {
    if (open) {
      const previous = (editor.getAttributes('link').href as string | undefined) ?? '';
      setUrl(previous);
    }
  }, [open, editor]);

  const isActive = editor.isActive('link');

  const handleApply = () => {
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setOpen(false);
  };

  const handleRemove = () => {
    editor.chain().focus().unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8',
            isActive && 'bg-slate-200 text-slate-900 hover:bg-slate-200'
          )}
          aria-label="Chèn liên kết"
          aria-pressed={isActive}
        >
          <LinkIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">
            URL liên kết
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApply();
              }
            }}
          />
          <div className="flex justify-end gap-2 pt-2">
            {isActive ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
              >
                Xóa liên kết
              </Button>
            ) : null}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleApply}
            >
              Áp dụng
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Variable menu — insert {{key}} placeholders
// ---------------------------------------------------------------------------

type VariableMenuProps = {
  editor: Editor;
  variables: VariableMenuItem[];
  onVariableInsert?: (variable: VariableMenuItem) => void;
};

function VariableMenu({ editor, variables, onVariableInsert }: VariableMenuProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (variable: VariableMenuItem) => {
    editor.chain().focus().insertContent(`{{${variable.key}}}`).run();
    onVariableInsert?.(variable);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-sm font-normal"
          aria-label="Chèn biến"
        >
          <Braces className="h-4 w-4" aria-hidden="true" />
          Chèn biến
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Tìm biến..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy biến phù hợp</CommandEmpty>
            <CommandGroup>
              {variables.map((variable) => (
                <CommandItem
                  key={variable.key}
                  value={`${variable.key} ${variable.label}`}
                  onSelect={() => handleSelect(variable)}
                  className="flex flex-col items-start gap-0.5"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-mono text-xs text-blue-700">
                      {`{{${variable.key}}}`}
                    </span>
                    <span className="text-sm text-slate-700">
                      {variable.label}
                    </span>
                  </div>
                  {variable.example ? (
                    <span className="text-xs text-slate-500">
                      Ví dụ: {variable.example}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default RichTextEditor;
