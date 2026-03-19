'use client';

import React from 'react';

/**
 * Simple markdown renderer for pipeline output (assessment_doc, meeting_prep_doc).
 * Handles: headings, bold, italic, unordered/ordered lists, paragraphs, code blocks.
 * No external dependencies.
 */
export function MarkdownContent({ content }: { content: string }) {
  const elements = parseMarkdown(content);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-[var(--color-muted-light)]">
      {elements}
    </div>
  );
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: { text: string; ordered: boolean }[] = [];
  let codeBlock: string[] | null = null;
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const ordered = listItems[0].ordered;
    const Tag = ordered ? 'ol' : 'ul';
    elements.push(
      <Tag
        key={key++}
        className={`space-y-1 ${ordered ? 'list-decimal' : 'list-disc'} list-inside`}
      >
        {listItems.map((item, i) => (
          <li key={i}>{formatInline(item.text)}</li>
        ))}
      </Tag>
    );
    listItems = [];
  };

  for (const line of lines) {
    // Code block boundaries
    if (line.trimStart().startsWith('```')) {
      if (codeBlock !== null) {
        elements.push(
          <pre
            key={key++}
            className="bg-[var(--color-admin-bg)] rounded-lg p-3 text-xs overflow-x-auto font-mono"
          >
            {codeBlock.join('\n')}
          </pre>
        );
        codeBlock = null;
      } else {
        flushList();
        codeBlock = [];
      }
      continue;
    }

    if (codeBlock !== null) {
      codeBlock.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={key++} className="text-lg font-semibold text-[var(--color-foreground-strong)] mt-4 first:mt-0">
          {formatInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-base font-semibold text-[var(--color-foreground-strong)] mt-3">
          {formatInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-sm font-semibold text-[var(--color-foreground-strong)] mt-2">
          {formatInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={key++} className="text-sm font-medium text-[var(--color-foreground-strong)] mt-2">
          {formatInline(line.slice(5))}
        </h4>
      );
    }
    // Unordered list
    else if (/^[-*]\s/.test(line.trimStart())) {
      listItems.push({ text: line.replace(/^\s*[-*]\s/, ''), ordered: false });
    }
    // Ordered list
    else if (/^\d+\.\s/.test(line.trimStart())) {
      listItems.push({ text: line.replace(/^\s*\d+\.\s/, ''), ordered: true });
    }
    // Blank line
    else if (line.trim() === '') {
      flushList();
    }
    // Paragraph
    else {
      flushList();
      elements.push(
        <p key={key++}>{formatInline(line)}</p>
      );
    }
  }

  flushList();
  return elements;
}

function formatInline(text: string): React.ReactNode {
  // Split on **bold** and *italic* markers
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-[var(--color-foreground-strong)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    // Inline code
    const codeParts = part.split(/(`[^`]+`)/g);
    if (codeParts.length > 1) {
      return codeParts.map((cp, j) => {
        if (cp.startsWith('`') && cp.endsWith('`')) {
          return (
            <code
              key={`${i}-${j}`}
              className="px-1 py-0.5 bg-[var(--color-admin-bg)] rounded text-xs font-mono"
            >
              {cp.slice(1, -1)}
            </code>
          );
        }
        return cp;
      });
    }
    return part;
  });
}

/**
 * Structured rendering for the Visionary research brief JSON.
 */
export function ResearchBriefView({ data }: { data: Record<string, unknown> }) {
  // Fallback for raw research text
  if (data.raw_research) {
    return <MarkdownContent content={String(data.raw_research)} />;
  }

  const sections: { key: string; title: string }[] = [
    { key: 'individual', title: 'The Individual' },
    { key: 'company', title: 'The Company' },
    { key: 'industry', title: 'The Industry' },
    { key: 'stated_problem', title: 'Stated Problem' },
    { key: 'ai_readiness', title: 'AI Readiness' },
    { key: 'potential_solutions', title: 'Potential Solutions' },
  ];

  return (
    <div className="space-y-4">
      {sections.map(({ key, title }) => {
        const section = data[key] as Record<string, unknown> | undefined;
        if (!section) return null;
        return (
          <div key={key} className="bg-[var(--color-admin-bg)] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--color-foreground-strong)] mb-2">
              {title}
            </h3>
            <div className="space-y-2">
              {Object.entries(section).map(([field, value]) => (
                <div key={field}>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    {field.replace(/_/g, ' ')}
                  </span>
                  <p className="text-xs text-[var(--color-muted-light)] mt-0.5">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Red flags */}
      {Array.isArray(data.red_flags) && data.red_flags.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-400 mb-2">Red Flags</h3>
          <ul className="space-y-1">
            {data.red_flags.map((flag: unknown, i: number) => (
              <li key={i} className="text-xs text-[var(--color-muted-light)] flex gap-2">
                <span className="text-red-400 shrink-0">&bull;</span>
                {String(flag)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Discovery questions */}
      {Array.isArray(data.discovery_questions) && data.discovery_questions.length > 0 && (
        <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-[var(--color-accent)] mb-2">
            Discovery Questions
          </h3>
          <ol className="space-y-1 list-decimal list-inside">
            {data.discovery_questions.map((q: unknown, i: number) => (
              <li key={i} className="text-xs text-[var(--color-muted-light)]">
                {String(q)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
