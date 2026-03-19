'use client';

import React from 'react';

/**
 * Markdown renderer for public blog posts.
 * Styled for the public theme (not admin). Adds anchor IDs to headings for ToC links.
 */
export function BlogPostContent({ content }: { content: string }) {
  const elements = parseMarkdown(content);
  return (
    <div className="prose-blog space-y-4 text-base leading-[1.8] text-muted-light">
      {elements}
    </div>
  );
}

function headingId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
        className={`space-y-2 my-4 ${ordered ? 'list-decimal' : 'list-disc'} list-inside`}
      >
        {listItems.map((item, i) => (
          <li key={i} className="text-muted-light">{formatInline(item.text)}</li>
        ))}
      </Tag>
    );
    listItems = [];
  };

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      if (codeBlock !== null) {
        elements.push(
          <pre key={key++} className="bg-surface rounded-xl p-5 text-sm overflow-x-auto font-mono text-foreground my-6">
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

    if (line.startsWith('# ')) {
      flushList();
      const text = line.slice(2);
      elements.push(
        <h1 key={key++} id={headingId(text)} className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl font-semibold text-foreground-strong mt-10 mb-4 first:mt-0">
          {formatInline(text)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      const text = line.slice(3);
      elements.push(
        <h2 key={key++} id={headingId(text)} className="font-[family-name:var(--font-serif)] text-xl md:text-2xl font-semibold text-foreground-strong mt-10 mb-4">
          {formatInline(text)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      const text = line.slice(4);
      elements.push(
        <h3 key={key++} id={headingId(text)} className="font-[family-name:var(--font-serif)] text-lg md:text-xl font-semibold text-foreground-strong mt-8 mb-3">
          {formatInline(text)}
        </h3>
      );
    } else if (line.startsWith('#### ')) {
      flushList();
      const text = line.slice(5);
      elements.push(
        <h4 key={key++} id={headingId(text)} className="text-base font-semibold text-foreground-strong mt-6 mb-2">
          {formatInline(text)}
        </h4>
      );
    } else if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={key++} className="border-l-2 border-accent pl-5 my-6 text-muted-light italic">
          {formatInline(line.slice(2))}
        </blockquote>
      );
    } else if (/^[-*]\s/.test(line.trimStart())) {
      listItems.push({ text: line.replace(/^\s*[-*]\s/, ''), ordered: false });
    } else if (/^\d+\.\s/.test(line.trimStart())) {
      listItems.push({ text: line.replace(/^\s*\d+\.\s/, ''), ordered: true });
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(<p key={key++}>{formatInline(line)}</p>);
    }
  }

  flushList();
  return elements;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+?\*|`[^`]+`|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground-strong">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-surface rounded text-sm font-mono">{part.slice(1, -1)}</code>;
    }
    // Links [text](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const isExternal = linkMatch[2].startsWith('http');
      return (
        <a
          key={i}
          href={linkMatch[2]}
          className="text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
