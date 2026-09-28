import assert from "node:assert/strict";
import test from "node:test";
import { withFlowchartClasses } from "../src/plugins/mermaid-theme.mjs";
import { remarkMermaid } from "../src/plugins/remark-mermaid.mjs";

test("shared classes precede diagram-local overrides", () => {
	const result = withFlowchartClasses(
		"flowchart TD\n A[Work]:::process\n classDef process fill:#ffffff;",
	);
	assert.match(result, /^flowchart TD\n/);
	assert.ok(result.indexOf("classDef storage") < result.indexOf("A[Work]"));
	assert.ok(
		result.indexOf("classDef process") < result.lastIndexOf("classDef process"),
	);
});

test("frontmatter, comments, and the graph alias keep their order", () => {
	const prefix = "---\nconfig:\n  theme: base\n---\n%% Example\ngraph LR\n";
	const result = withFlowchartClasses(`${prefix} A --> B`);
	assert.ok(result.startsWith(prefix));
	assert.match(result, /classDef decision/);
	assert.ok(result.endsWith(" A --> B"));
});

test("other Mermaid grammars are unchanged", () => {
	for (const source of [
		"sequenceDiagram\n participant A\n A->>B: Request",
		"classDiagram\n A <|-- B",
		"stateDiagram-v2\n [*] --> Ready",
	]) {
		assert.equal(withFlowchartClasses(source), source);
	}
});

test("Markdown preserves ordinary code and special characters in labels", () => {
	const ordinary = { type: "code", lang: "js", value: "const x = 1;" };
	const source = 'flowchart TD\n A["<tag> & text"] --> B';
	const tree = {
		type: "root",
		children: [ordinary, { type: "code", lang: "mermaid", value: source }],
	};
	remarkMermaid()(tree);
	assert.equal(tree.children[0], ordinary);
	const renderedSource = tree.children[1].children[0].children[0].value;
	assert.ok(renderedSource.includes('A["<tag> & text"] --> B'));
	assert.match(renderedSource, /classDef process/);
});
