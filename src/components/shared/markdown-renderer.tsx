"use client";

import { useState } from "react";
import { LineIcon } from "./line-icon";

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Clipboard copy failed: ", err);
        });
    } else {
      // Fallback copy using temporary textarea
      try {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Fallback copy failed: ", err);
      }
    }
  };

  return (
    <div className="ai-markdown-code group">
      {/* Code Header bar */}
      <div className="ai-markdown-code-header">
        <span>{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="ai-markdown-copy"
        >
          <LineIcon name={copied ? "checkmark-circle" : "copy"} className={`h-3 w-3 ${copied ? "text-auth-accent" : ""}`} />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code Area */}
      <pre className="ai-markdown-code-body">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const elements: React.ReactNode[] = [];
  const lines = content.split("\n");
  let listType: "ordered" | "unordered" | null = null;
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
      const linkMatch = currentText.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
      const linkIdx = linkMatch?.index ?? -1;

      const indices = [boldIdx, italicIdx, codeIdx, linkIdx].filter((idx) => idx >= 0);
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
            <strong key={parts.length} className="ai-markdown-strong">
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
            <em key={parts.length} className="ai-markdown-emphasis">
              {italicText}
            </em>
          );
          currentText = currentText.slice(endIdx + 1);
        } else {
          parts.push("*");
          currentText = currentText.slice(italicIdx + 1);
        }
      } else if (minIdx === codeIdx) {
        // codeIdx
        const endIdx = currentText.indexOf("`", codeIdx + 1);
        if (endIdx >= 0) {
          const codeText = currentText.slice(codeIdx + 1, endIdx);
          parts.push(
            <code
              key={parts.length}
              className="ai-markdown-inline-code"
            >
              {codeText}
            </code>
          );
          currentText = currentText.slice(endIdx + 1);
        } else {
          parts.push("`");
          currentText = currentText.slice(codeIdx + 1);
        }
      } else if (linkMatch) {
        parts.push(
          <a
            key={parts.length}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="ai-markdown-link"
          >
            {linkMatch[1]}
          </a>
        );
        currentText = currentText.slice(linkIdx + linkMatch[0].length);
      }
    }
    return parts;
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      const items = listItems.map((item, idx) => (
        <li key={idx}>{renderInlineText(item)}</li>
      ));
      elements.push(
        listType === "ordered" ? (
          <ol key={`list-${key}`} className="ai-markdown-list ai-markdown-list-ordered">
            {items}
          </ol>
        ) : (
          <ul key={`list-${key}`} className="ai-markdown-list ai-markdown-list-unordered">
            {items}
          </ul>
        )
      );
      listItems = [];
      listType = null;
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
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList(i);
      const level = headingMatch[1].length;
      const cleanLine = headingMatch[2].replace(/^\*\*|\*\*$/g, "").trim();
      if (level === 1) {
        elements.push(
          <h1 key={`h1-${i}`} className="ai-markdown-h1">
            {renderInlineText(cleanLine)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={`h2-${i}`} className="ai-markdown-h2">
            {renderInlineText(cleanLine)}
          </h2>
        );
      } else if (level === 3) {
        elements.push(
          <h3 key={`h3-${i}`} className="ai-markdown-h3">
            {renderInlineText(cleanLine)}
          </h3>
        );
      } else {
        elements.push(
          <h4 key={`h4-${i}`} className="ai-markdown-h4">
            {renderInlineText(cleanLine)}
          </h4>
        );
      }
      continue;
    }

    // Lists
    const unorderedMatch = line.trim().match(/^[-*]\s+(.+)$/);
    const orderedMatch = line.trim().match(/^\d+[.)]\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      const nextListType = orderedMatch ? "ordered" : "unordered";
      if (listType && listType !== nextListType) flushList(i);
      listType = nextListType;
      const cleanLine = line.trim().slice(2).trim();
      listItems.push(orderedMatch ? orderedMatch[1] : cleanLine);
      continue;
    }

    // Quotes and separators
    if (line.trim().startsWith("> ")) {
      flushList(i);
      elements.push(
        <blockquote key={`quote-${i}`} className="ai-markdown-quote">
          {renderInlineText(line.trim().slice(2))}
        </blockquote>
      );
      continue;
    }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      flushList(i);
      elements.push(<hr key={`rule-${i}`} className="ai-markdown-rule" />);
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
      <p key={`p-${i}`} className="ai-markdown-paragraph">
        {renderInlineText(line)}
      </p>
    );
  }

  // Flush remaining list items
  flushList(lines.length);

  // Flush unclosed streaming code blocks
  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <CodeBlock key="code-unclosed" code={codeLines.join("\n")} language={codeLang} />
    );
  }

  return <div className="ai-markdown">{elements}</div>;
}
