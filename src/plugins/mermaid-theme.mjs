// Keep diagram styling in Mermaid so the generated SVG is self-contained.
export const mermaidConfig = {
	theme: "base",
	securityLevel: "strict",
	themeVariables: {
		fontFamily: "Arial, sans-serif",
		fontSize: "14px",
		background: "#ffffff",
		primaryColor: "#eff6ff",
		primaryTextColor: "#1e293b",
		primaryBorderColor: "#64748b",
		secondaryColor: "#f0fdfa",
		secondaryTextColor: "#1e293b",
		secondaryBorderColor: "#0f766e",
		tertiaryColor: "#f8fafc",
		tertiaryTextColor: "#1e293b",
		tertiaryBorderColor: "#94a3b8",
		lineColor: "#64748b",
		textColor: "#1e293b",
		edgeLabelBackground: "#ffffff",
		noteBkgColor: "#fffbeb",
		noteTextColor: "#1e293b",
		noteBorderColor: "#a16207",
	},
	flowchart: {
		htmlLabels: false,
		nodeSpacing: 24,
		rankSpacing: 24,
		padding: 8,
		curve: "linear",
	},
};

// These are flowchart classDef statements, not CSS rules for the website.
export const flowchartClassDefs = `
    classDef default fill:#eff6ff,stroke:#64748b,color:#1e293b,stroke-width:1px;
    classDef process fill:#eff6ff,stroke:#64748b,color:#1e293b,stroke-width:1px;
    classDef decision fill:#fffbeb,stroke:#a16207,color:#713f12,stroke-width:1px;
    classDef storage fill:#f0fdfa,stroke:#0f766e,color:#134e4a,stroke-width:1px;
    classDef terminal fill:#f8fafc,stroke:#94a3b8,color:#475569,stroke-width:1px,stroke-dasharray:4 3;
`;

export function withFlowchartClasses(source) {
	// Allow YAML frontmatter and Mermaid comments before the graph declaration.
	// Inject after that declaration so local classDef statements can override ours.
	const header =
		/^(\s*(?:---\r?\n[\s\S]*?\r?\n---\s*)?(?:%%[^\n]*\n\s*)*(?:flowchart|graph)\s+(?:TD|TB|BT|LR|RL)\b[^\n]*)(?:\n|$)/;
	return source.replace(header, `$1\n${flowchartClassDefs}\n`);
}
