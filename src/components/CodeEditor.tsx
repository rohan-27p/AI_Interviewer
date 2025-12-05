'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
    code: string;
    onChange: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
    return (
        <div className="w-full h-full">
            <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(value) => onChange(value || '')}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: '"Fira Code", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    renderLineHighlight: 'line',
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                    wordWrap: 'off',
                    scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                        useShadows: false,
                        verticalHasArrows: false,
                        horizontalHasArrows: false,
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                    },
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                    tabSize: 4,
                    insertSpaces: true,
                    folding: true,
                    bracketPairColorization: { enabled: true },
                }}
            />
        </div>
    );
};

export default CodeEditor;