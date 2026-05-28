"use client";

import React from "react";
import * as AntIcons from "@ant-design/icons";

// Map custom string keys to the corresponding Ant Design icon component names.
// This prevents compile-time errors for keys that do not translate directly.
const ALIAS_MAP: Record<string, string> = {
  // --- Original aliases ---
  "brain-alt": "BulbOutlined",
  "comment-text": "MessageOutlined",
  "comment": "MessageOutlined",
  "layers": "BlockOutlined",
  "target": "AimOutlined",
  "checkmark-circle": "CheckCircleOutlined",
  "spinner": "LoadingOutlined",
  "alarm": "ClockCircleOutlined",
  "clock": "ClockCircleOutlined",
  "grid-alt": "AppstoreOutlined",
  "list": "UnorderedListOutlined",
  "control-panel": "SlidersOutlined",
  "xmark": "CloseOutlined",
  "bolt": "ThunderboltOutlined",
  "checkmark": "CheckOutlined",
  "exit": "LogoutOutlined",
  "world": "GlobalOutlined",
  "popup": "ExportOutlined",
  "grow": "RiseOutlined",
  "text": "LineHeightOutlined",

  // --- Chevron → Ant Design directional arrows ---
  "chevron-right": "RightOutlined",
  "chevron-left": "LeftOutlined",
  "chevron-up": "UpOutlined",
  "chevron-down": "DownOutlined",

  // --- File & document icons ---
  "files": "CopyOutlined",
  "clipboard": "SnippetsOutlined",
  "bookmark": "BookOutlined",
  "quotation": "FileTextOutlined",

  // --- Action icons ---
  "trash": "DeleteOutlined",
  "pencil": "EditOutlined",
  "gear": "SettingOutlined",
  "envelope": "MailOutlined",

  // --- Status & indicator icons ---
  "xmark-circle": "CloseCircleOutlined",
  "questionmark-circle": "QuestionCircleOutlined",
  "signal": "WifiOutlined",
  "dot": "MinusOutlined",
  "infinite": "SwapOutlined",

  // --- Tech & hardware icons ---
  "cpu": "DesktopOutlined",
  "pin": "PushpinOutlined",
  "package": "InboxOutlined",
  "pulse": "HeartOutlined",
  "shield": "SafetyCertificateOutlined",

  // --- Misc ---
  "comment-alt": "MessageOutlined",
  "hash": "NumberOutlined",
};

// Dynamically look up the Ant Design Outlined icon component.
const getAntIcon = (name: string): React.ComponentType<any> => {
  const targetName = ALIAS_MAP[name] || name;

  // Convert kebab-case names to PascalCase (e.g. arrow-right -> ArrowRightOutlined)
  let componentName = targetName;
  if (!componentName.endsWith("Outlined")) {
    componentName = componentName
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
    
    // Check if the PascalCase name exists, otherwise append "Outlined"
    if (!(AntIcons as any)[componentName] && (AntIcons as any)[componentName + "Outlined"]) {
      componentName += "Outlined";
    }
  }

  const IconComponent = (AntIcons as any)[componentName];
  if (IconComponent) return IconComponent;

  // Fallback to QuestionOutlined if the icon name is completely unknown
  return AntIcons.QuestionCircleOutlined;
};

interface LineIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  className?: string;
  size?: number;
}

export function LineIcon({ name, className = "", size, ...props }: LineIconProps) {
  const IconComponent = getAntIcon(name);
  const style = size ? { fontSize: size } : undefined;
  return <IconComponent className={className} style={style} {...props} />;
}

// Aliases for future compatibility
export { LineIcon as AntIcon, LineIcon as PulseIcon };
