import { visit } from "unist-util-visit";
import { withFlowchartClasses } from "./mermaid-theme.mjs";

// Protect Mermaid fences from Expressive Code before rehype renders them as SVG.
export function remarkMermaid() {
	return (tree) => {
		visit(tree, "code", (node, index, parent) => {
			if (node.lang !== "mermaid" || !parent || index === undefined) return;
			parent.children[index] = {
				type: "paragraph",
				data: { hName: "div", hProperties: { className: ["mermaid-diagram"] } },
				children: [
					{
						type: "paragraph",
						data: { hName: "pre", hProperties: { className: ["mermaid"] } },
						children: [
							{ type: "text", value: withFlowchartClasses(node.value) },
						],
					},
				],
			};
		});
	};
}
