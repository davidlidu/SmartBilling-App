import React, { useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, RemoveFormatting } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
}

const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    active?: boolean;
}> = ({ onClick, icon, title, active }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded-lg transition-all duration-150 ${active
                ? 'bg-primary-100 text-primary-700 shadow-sm'
                : 'text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700'
            }`}
    >
        {icon}
    </button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Escribe aquí...',
    minHeight = '80px',
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalChange = useRef(false);

    // Sync value from props -> editor (only when value changes externally)
    useEffect(() => {
        if (editorRef.current && !isInternalChange.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value || '';
            }
        }
        isInternalChange.current = false;
    }, [value]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            isInternalChange.current = true;
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const execCommand = (command: string, value?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        handleInput();
    };

    const handleBold = () => execCommand('bold');
    const handleItalic = () => execCommand('italic');
    const handleUnderline = () => execCommand('underline');
    const handleUnorderedList = () => execCommand('insertUnorderedList');
    const handleOrderedList = () => execCommand('insertOrderedList');
    const handleRemoveFormat = () => execCommand('removeFormat');

    const handleLink = () => {
        const url = prompt('Ingrese la URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Allow Ctrl+B, Ctrl+I, Ctrl+U shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b':
                    e.preventDefault();
                    handleBold();
                    break;
                case 'i':
                    e.preventDefault();
                    handleItalic();
                    break;
                case 'u':
                    e.preventDefault();
                    handleUnderline();
                    break;
            }
        }
    };

    return (
        <div className="border border-secondary-300 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 transition-all duration-200">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 bg-secondary-50 border-b border-secondary-200">
                <ToolbarButton onClick={handleBold} icon={<Bold size={15} />} title="Negrita (Ctrl+B)" />
                <ToolbarButton onClick={handleItalic} icon={<Italic size={15} />} title="Cursiva (Ctrl+I)" />
                <ToolbarButton onClick={handleUnderline} icon={<Underline size={15} />} title="Subrayado (Ctrl+U)" />
                <div className="w-px h-5 bg-secondary-200 mx-1" />
                <ToolbarButton onClick={handleUnorderedList} icon={<List size={15} />} title="Lista" />
                <ToolbarButton onClick={handleOrderedList} icon={<ListOrdered size={15} />} title="Lista numerada" />
                <div className="w-px h-5 bg-secondary-200 mx-1" />
                <ToolbarButton onClick={handleLink} icon={<LinkIcon size={15} />} title="Insertar enlace" />
                <ToolbarButton onClick={handleRemoveFormat} icon={<RemoveFormatting size={15} />} title="Limpiar formato" />
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                data-placeholder={placeholder}
                className="px-3 py-2 text-sm text-secondary-800 outline-none wysiwyg-content"
                style={{
                    minHeight,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    position: 'relative',
                }}
                suppressContentEditableWarning
            />

            <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          position: absolute;
        }
      `}</style>
        </div>
    );
};

export default RichTextEditor;
