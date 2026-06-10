"use client";

import { useState } from "react";
import { LineIcon } from "../shared/line-icon";

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0b0b0e] border border-white/[0.08] rounded-xl overflow-hidden my-4 relative font-mono group">
      {/* Code Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.06] text-[10px] text-auth-text-3 select-none">
        <span className="uppercase font-bold tracking-wider">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 active:bg-white/10 text-auth-text-2 hover:text-white transition-all cursor-pointer"
        >
          <LineIcon name={copied ? "checkmark-circle" : "copy"} className={`h-3 w-3 ${copied ? "text-auth-accent" : ""}`} />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code Area */}
      <pre className="p-4 overflow-x-auto text-xs text-emerald-400/90 leading-relaxed whitespace-pre font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const elements: React.ReactNode[] = [];
  const lines = content.split("\n");
  let inList = false;
  let listItems: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  const renderInlineText = (str: string) => {
    const parts: React.ReactNode[] = [];
    let currentText = str;

    while (currentText) {
      const boldIdx = currentText.indexOf("**");
      const italicIdx = currentText.indexOf("*");
      const codeIdx = currentText.indexOf("`");

      const indices = [boldIdx, italicIdx, codeIdx].filter((idx) => idx >= 0);
      if (indices.length === 0) {
        parts.push(currentText);
        break;
      }

      const minIdx = Math.min(...indices);

      if (minIdx > 0) {
        parts.push(currentText.slice(0, minIdx));
      }

      if (minIdx === boldIdx) {
        const endIdx = currentText.indexOf("**", boldIdx + 2);
        if (endIdx >= 0) {
          const boldText = currentText.slice(boldIdx + 2, endIdx);
          parts.push(
            <strong key={parts.length} className="text-white font-semibold">
              {boldText}
            </strong>
          );
          currentText = currentText.slice(endIdx + 2);
        } else {
          parts.push("**");
          currentText = currentText.slice(boldIdx + 2);
        }
      } else if (minIdx === italicIdx) {
        const endIdx = currentText.indexOf("*", italicIdx + 1);
        if (endIdx >= 0) {
          const italicText = currentText.slice(italicIdx + 1, endIdx);
          parts.push(
            <em key={parts.length} className="italic text-auth-text-2">
              {italicText}
            </em>
          );
          currentText = currentText.slice(endIdx + 1);
        } else {
          parts.push("*");
          currentText = currentText.slice(italicIdx + 1);
        }
      } else {
        // codeIdx
        const endIdx = currentText.indexOf("`", codeIdx + 1);
        if (endIdx >= 0) {
          const codeText = currentText.slice(codeIdx + 1, endIdx);
          parts.push(
            <code
              key={parts.length}
              className="bg-white/5 border border-white/10 px-1 py-0.5 rounded font-mono text-[11px] text-amber-400"
            >
              {codeText}
            </code>
          );
          currentText = currentText.slice(endIdx + 1);
        } else {
          parts.push("`");
          currentText = currentText.slice(codeIdx + 1);
        }
      }
    }
    return parts;
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-3 space-y-1.5 text-sm text-auth-text-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineText(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block check
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        const codeText = codeLines.join("\n");
        elements.push(
          <CodeBlock key={`code-${i}`} code={codeText} language={codeLang} />
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        flushList(i);
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("###")) {
      flushList(i);
      const level = line.startsWith("####") ? 4 : 3;
      const cleanLine = line
        .replace(/^####?\s*(\*\*|)?/, "")
        .replace(/(\*\*|)?\s*$/, "")
        .trim();
      if (level === 3) {
        elements.push(
          <h3
            key={`h3-${i}`}
            className="text-base font-extrabold text-white mt-6 mb-2.5 pb-1 border-b border-white/[0.04]"
          >
            {renderInlineText(cleanLine)}
          </h3>
        );
      } else {
        elements.push(
          <h4 key={`h4-${i}`} className="text-sm font-bold text-white mt-4 mb-2">
            {renderInlineText(cleanLine)}
          </h4>
        );
      }
      continue;
    }

    // Bullet lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      inList = true;
      const cleanLine = line.trim().slice(2).trim();
      listItems.push(cleanLine);
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      flushList(i);
      continue;
    }

    // Regular paragraphs
    flushList(i);
    elements.push(
      <p key={`p-${i}`} className="text-sm text-auth-text-2 leading-relaxed mb-3">
        {renderInlineText(line)}
      </p>
    );
  }

  // Flush remaining list items
  flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
}
