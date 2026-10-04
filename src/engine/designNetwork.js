/**
 * designNetwork.js — the full pipeline:
 * Requirements → Analyze (rules) → Segments → VLSM → Graph → Explain → Summary
 */
import { validateRequirements } from './validation.js';
import { evaluateRules } from './ruleEngine.js';
import { buildSegments } from './segments.js';
import { calculateVlsm } from './vlsm.js';
import { buildGraph } from './graphBuilder.js';
import { explainDesign } from './explainer.js';
import { computeSummary } from './summary.js';

export function designNetwork(req) {
  const { errors, warnings } = validateRequirements(req);
  if (errors.length) return { ok: false, errors, warnings };

  const design = evaluateRules(req);
  const segments = buildSegments(req, design);
  const vlsm = calculateVlsm(req.baseNetwork, segments);
  const graph = buildGraph(req, design, segments, vlsm);
  const summary = computeSummary(graph, vlsm);
  const explanation = explainDesign(req, design, segments, vlsm, graph);
  return { ok: true, errors: [], warnings, requirements: req, design, segments, vlsm, graph, summary, explanation };
}
