import { useState, useEffect } from "react";

const GOOFY_FACTS = [
  "A group of flamingos is called a flamboyance.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
  "Oxford University is older than the Aztec Empire.",
  "A day on Venus is longer than a year on Venus.",
  "Wombats produce cube-shaped poop. Scientists still don't fully understand how.",
  "The inventor of the Pringles can is buried in one.",
  "Butterflies taste with their feet.",
  "A shrimp's heart is in its head.",
  "There are more possible iterations of a game of chess than there are atoms in the observable universe.",
  "The shortest war in history lasted 38–45 minutes (Anglo-Zanzibar War, 1896).",
  "Crows can recognise and remember human faces, and hold grudges.",
  "Honey never spoils. Edible honey was found in 3000-year-old Egyptian tombs.",
  "A blue whale's heart is so large a human could crawl through its arteries.",
  "Octopuses have three hearts, blue blood, and can edit their own RNA.",
  "The moon is slowly drifting away from Earth at about 3.8 cm per year.",
  "Sharks are older than trees. Sharks: ~450M years old. Trees: ~350M years old.",
  "There are more trees on Earth than stars in the Milky Way.",
  "A single bolt of lightning contains enough energy to toast 100,000 slices of bread.",
  "The human nose can detect over 1 trillion different scents.",
  "Finland has more saunas than cars.",
  "Bananas are berries. Strawberries are not.",
  "The Eiffel Tower grows about 15 cm taller in summer due to thermal expansion.",
  "An octopus can open a jar, solve mazes, and recognise individual humans.",
  "The average person walks the equivalent of 5 times around the Earth in their lifetime.",
  "A group of owls is called a parliament.",
  "There are more possible shuffles of a deck of cards than seconds since the Big Bang.",
  "Pineapples take about 2 years to grow.",
  "Sea otters hold hands while sleeping so they don't drift apart.",
  "The Hawaiian alphabet has only 13 letters.",
  "A day on Mars is 24 hours, 37 minutes — almost exactly like Earth's.",
];

/* ── API endpoints ── */
const OPENALEX  = "https://api.openalex.org/works";
const GROQ_API  = "https://api.groq.com/openai/v1/chat/completions";
const MODEL     = "llama-3.3-70b-versatile";

const GAP_TYPE_COLORS = {
  Conceptual:        "#6b5ca5",
  Methodological:    "#4a7a9b",
  Data:              "#5a7a5a",
  Population:        "#4a8c6c",
  Interdisciplinary: "#9b5070",
  Temporal:          "#8c6444",
};

const PROPOSAL_COLORS = {
  "Novel Direction":            "#3a6a9b",
  "High-Risk Hypothesis":       "#8a3020",
  "Interdisciplinary Approach": "#5a4a8a",
};

const EXPLORATION_STATUS = {
  unexplored: {
    label: "Unexplored",
    color: "#7a2418",
    bg: "#fff0eb",
    border: "#d8a090",
  },
  partially_explored: {
    label: "Partially explored",
    color: "#8a6030",
    bg: "#fff8ec",
    border: "#d8c090",
  },
  established_but_incomplete: {
    label: "Established but incomplete",
    color: "#2f5f54",
    bg: "#eef8f4",
    border: "#9fc8bc",
  },
};

const TOPIC_STATUS_META = {
  no_direct_literature: {
    label: "No direct literature",
    color: "#7a2418",
    bg: "#fff2ee",
    border: "#d8a090",
  },
  adjacent_only: {
    label: "Only adjacent literature",
    color: "#8a6030",
    bg: "#fff8ec",
    border: "#d8c090",
  },
  emerging_sparse: {
    label: "Emerging but sparse",
    color: "#8a6030",
    bg: "#fff8ec",
    border: "#d8c090",
  },
  established_niche: {
    label: "Established niche",
    color: "#3d5f7f",
    bg: "#eef5fb",
    border: "#abc2d8",
  },
  saturated: {
    label: "Saturated area",
    color: "#2f5f54",
    bg: "#eef8f4",
    border: "#9fc8bc",
  },
};

const SATURATION_LEVEL_META = {
  very_low: { label: "Very low", color: "#7a2418" },
  low: { label: "Low", color: "#8a6030" },
  moderate: { label: "Moderate", color: "#8a6a30" },
  high: { label: "High", color: "#3d5f7f" },
  very_high: { label: "Very high", color: "#2f5f54" },
};

const GAP_STATUS_META = {
  not_found_directly: { label: "Not found directly", color: "#7a2418", bg: "#fff2ee", border: "#d8a090" },
  weakly_studied: { label: "Weakly studied", color: "#8a6030", bg: "#fff8ec", border: "#d8c090" },
  fragmented_evidence: { label: "Fragmented evidence", color: "#8a6a30", bg: "#fff9ef", border: "#e0c79a" },
  saturated_but_narrow: { label: "Saturated but narrow", color: "#2f5f54", bg: "#eef8f4", border: "#9fc8bc" },
};

const REFRESH_MODES = [
  { id: "alternative_angles", label: "Refresh suggestions", prompt: "Generate a meaningfully different set of proposals from the same evidence base." },
  { id: "safer", label: "Safer ideas", prompt: "Prioritize lower-risk, more feasible proposals with strong grounding in the evidence." },
  { id: "bolder", label: "Bolder ideas", prompt: "Prioritize more ambitious, unconventional proposals while remaining evidence-aware." },
];

/* ── Reconstruct abstract from OpenAlex inverted index ── */
function rebuildAbstract(inv) {
  if (!inv) return null;
  const words = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.join(" ");
}

function stripHtml(s) {
  return s ? s.replace(/<[^>]*>/g, "").trim() : null;
}

function normKey(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
}

function isUsablePaper(paper) {
  return Boolean(paper?.title && paper?.abstract && paper.abstract.length > 80);
}

function sortPapers(a, b) {
  const dc = (b.citationCount ?? 0) - (a.citationCount ?? 0);
  return dc !== 0 ? dc : (b.year ?? 0) - (a.year ?? 0);
}

function dedupePapers(papers) {
  const seen = new Set();
  return papers.filter(isUsablePaper).filter((paper) => {
    const key = normKey(paper.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ── Source 1: OpenAlex (8 pages × 100) ── */
async function fromOpenAlex(topic) {
  const pages = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map(async (page) => {
    try {
      const params = new URLSearchParams({ search: topic, "per-page": "100", page: String(page) });
      const r = await fetch(`${OPENALEX}?${params}`);
      if (!r.ok) return [];
      const d = await r.json();
      return (d.results || []).map(p => ({
        title:         p.title,
        abstract:      rebuildAbstract(p.abstract_inverted_index),
        year:          p.publication_year,
        citationCount: p.cited_by_count ?? 0,
        authors:       (p.authorships || []).slice(0, 3).map(a => ({ name: a.author?.display_name })).filter(a => a.name),
        url:           p.doi || p.primary_location?.landing_page_url || p.id || null,
        source:        "OpenAlex",
      }));
    } catch { return []; }
  }));
  return pages.flat();
}

/* ── Source 2: Europe PMC (up to 1000 papers, biomedical focus) ── */
async function fromEuropePMC(topic) {
  try {
    const params = new URLSearchParams({
      query:      topic,
      format:     "json",
      pageSize:   "1000",
      resultType: "core",
      sort:       "CITED desc",
    });
    const r = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?${params}`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d.resultList?.result || []).map(p => ({
      title:         stripHtml(p.title),
      abstract:      stripHtml(p.abstractText),
      year:          p.pubYear ? parseInt(p.pubYear) : null,
      citationCount: p.citedByCount ?? 0,
      authors:       (p.authorList?.author || []).slice(0, 3).map(a => ({
        name: [a.firstName, a.lastName].filter(Boolean).join(" "),
      })),
      url:           p.doi
        ? `https://doi.org/${p.doi}`
        : `https://europepmc.org/article/${p.source}/${p.id}`,
      source:        "Europe PMC",
    }));
  } catch { return []; }
}

/* ── Source 3: PubMed (NCBI E-utilities — best for biomedical) ── */
function parseMedline(text) {
  const papers = [];
  const blocks = text.split(/\nPMID- /).filter(b => b.trim());
  for (const block of blocks) {
    const lines = ("PMID- " + block).split("\n");
    const fields = {};
    let tag = null;
    for (const line of lines) {
      const m = line.match(/^([A-Z]{2,4})\s*- (.+)/);
      if (m) {
        tag = m[1];
        if (!fields[tag]) fields[tag] = [];
        fields[tag].push(m[2]);
      } else if (tag && line.startsWith("      ")) {
        fields[tag][fields[tag].length - 1] += " " + line.trim();
      }
    }
    const title    = fields["TI"]?.[0];
    const abstract = fields["AB"]?.[0];
    if (!title || !abstract || abstract.length < 80) continue;
    const pmid  = fields["PMID"]?.[0]?.trim();
    const doi   = fields["AID"]?.find(a => a.includes("[doi]"))?.replace(" [doi]", "").trim();
    const year  = fields["DP"]?.[0]?.match(/\d{4}/)?.[0];
    papers.push({
      title, abstract,
      year:          year ? parseInt(year) : null,
      citationCount: 0,
      authors:       (fields["AU"] || []).slice(0, 3).map(a => ({ name: a })),
      url:           doi ? `https://doi.org/${doi}` : (pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null),
      source:        "PubMed",
    });
  }
  return papers;
}

async function fromPubMed(query) {
  try {
    const search = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?` +
      new URLSearchParams({ db: "pubmed", term: query, retmax: "200", retmode: "json", sort: "relevance" })
    );
    if (!search.ok) return [];
    const ids = (await search.json()).esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    const fetch_ = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?` +
      new URLSearchParams({ db: "pubmed", id: ids.join(","), rettype: "medline", retmode: "text" })
    );
    if (!fetch_.ok) return [];
    return parseMedline(await fetch_.text());
  } catch { return []; }
}

/* ── Step 1: use LLM to decompose topic into 5 targeted search queries ── */
async function extractQueries(topic, key) {
  try {
    const res = await fetch(GROQ_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [{
          role: "user",
          content:
`You are a biomedical research librarian expert in PubMed search strategy. Given a research topic, generate 12 targeted PubMed-style search queries that will find the most relevant existing literature.

Topic: "${topic}"

Rules:
- Each query must combine exactly 2 closely related concepts using natural terms (no MeSH notation needed)
- Queries must be specific: aim for papers directly relevant to one aspect of the topic
- Cover different pairs of concepts across the 12 queries
- Use synonyms where useful (e.g. "LLM OR language model", "nursing home OR residential care")
- Keep each query 3-6 words

Return ONLY a JSON array of 12 strings. No markdown, no explanation.

Example for "LLM for detecting Parkinson gait from wearables":
["language model clinical text analysis", "gait analysis Parkinson disease", "wearable sensor neurological monitoring", "NLP electronic health records", "Parkinson motor progression biomarker", "deep learning movement disorder detection"]`,
        }],
      }),
    });
    if (!res.ok) return [topic];
    const d = await res.json();
    const raw = (d.choices?.[0]?.message?.content ?? "").trim()
      .replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed.slice(0, 12) : [topic];
  } catch {
    return [topic];
  }
}

function selectAnalysisPapers(papers) {
  const cited = papers.filter(p => p.citationCount > 0)
    .sort((a, b) => b.citationCount - a.citationCount)
    .slice(0, 95);
  const recent = papers.filter(p => p.citationCount === 0)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 60);
  const seen = new Set(cited.map(p => normKey(p.title)));
  return [...cited, ...recent.filter(p => !seen.has(normKey(p.title)))];
}

function buildPaperList(papers, abstractLimit = 320) {
  return papers
    .map((p, i) =>
      `[${i + 1}] ${p.title} (${p.year ?? "n.d."} · ${p.citationCount > 0 ? `${p.citationCount} citations` : p.source})\n` +
      `${p.abstract.slice(0, abstractLimit)}…`
    )
    .join("\n\n---\n\n");
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function buildAnalysisContext(papers, exactTopicPapers) {
  const candidates = [
    { analysisCount: 110, exactCount: 15, abstractLimit: 220 },
    { analysisCount: 90, exactCount: 12, abstractLimit: 190 },
    { analysisCount: 72, exactCount: 10, abstractLimit: 170 },
    { analysisCount: 56, exactCount: 8, abstractLimit: 150 },
    { analysisCount: 42, exactCount: 6, abstractLimit: 130 },
  ];

  for (const candidate of candidates) {
    const selected = papers.slice(0, candidate.analysisCount);
    const directSelected = exactTopicPapers.slice(0, candidate.exactCount);
    const list = buildPaperList(selected, candidate.abstractLimit);
    const directList = directSelected.length
      ? buildPaperList(directSelected, candidate.abstractLimit)
      : "No direct exact-topic hits were retrieved from the search stage.";
    if (estimateTokens(list) + estimateTokens(directList) <= 7000) {
      return {
        ...candidate,
        selected,
        directSelected,
        list,
        directList,
      };
    }
  }

  const fallbackSelected = papers.slice(0, 32);
  const fallbackDirect = exactTopicPapers.slice(0, 5);
  return {
    analysisCount: fallbackSelected.length,
    exactCount: fallbackDirect.length,
    abstractLimit: 110,
    selected: fallbackSelected,
    directSelected: fallbackDirect,
    list: buildPaperList(fallbackSelected, 110),
    directList: fallbackDirect.length
      ? buildPaperList(fallbackDirect, 110)
      : "No direct exact-topic hits were retrieved from the search stage.",
  };
}

function buildPrompt(topic, papers, searchMeta, context, options = {}) {
  const excludedTitles = (options.excludeProposalTitles || []).filter(Boolean);
  const focusAreaInstruction = options.focusArea
    ? `\nAREA PREFERENCE:\nThe user wants the analysis to prioritize this area when the topic spans multiple areas: "${options.focusArea}". Keep the topic itself intact, but weigh this area more strongly when ranking gaps and proposals.\n`
    : "";
  const refreshInstruction = options.refreshPrompt
    ? `\nADDITIONAL INSTRUCTION FOR THIS RUN:\n${options.refreshPrompt}\n`
    : "";
  const exclusionInstruction = excludedTitles.length
    ? `\nDo not repeat or paraphrase these already-shown proposal titles:\n${excludedTitles.map((title, i) => `${i + 1}. ${title}`).join("\n")}\n`
    : "";

  return `You are a meta-research scientist specialized in identifying scientific opportunity spaces.

Topic: "${topic}"

You have been given:
- ${papers.length} unique papers in total
- ${searchMeta?.exactTopicCount ?? 0} direct exact-topic hits from the exact-topic search
- ${searchMeta?.componentCount ?? 0} papers from component and adjacent searches
- ${context.analysisCount} papers selected for the current LLM analysis window

You must decide whether the exact topic is absent, sparse, emerging, established, or saturated. Do not assume novelty. First evaluate direct evidence for the exact topic, then use adjacent/component literature to infer opportunity spaces where appropriate.

Follow this analytical framework:

STEP 1 — DECOMPOSE: Identify 4–7 fundamental scientific concepts constituting this topic.
STEP 2 — INTERSECT: Identify all research fields relevant to this topic, including non-obvious adjacent fields.
STEP 3 — RECONSTRUCT LANDSCAPE: 2–3 sentences on the current state of the literature and the dominant paradigm.
STEP 4 — ASSESS THE TOPIC ITSELF:
  • Decide whether the exact topic has no direct literature, only adjacent literature, sparse direct literature, an established niche literature, or a saturated literature
  • Estimate whether the topic belongs to a saturated area overall
  • Explain which parts of the user's prompt are already covered and which parts remain weak or absent
STEP 5 — DETECT GAPS across these 6 types (find the most significant gaps, any number per type):
  • Conceptual — missing theoretical frameworks or unproven mechanistic links
  • Methodological — techniques or approaches not yet applied to this problem
  • Data — missing datasets, measurement modalities, or validation cohorts
  • Population — understudied groups, settings, or clinical contexts
  • Interdisciplinary — unexplored combinations of fields that have not been brought together
  • Temporal — longitudinal, dynamic, developmental, or time-series aspects not yet captured
STEP 6 — UNEXPLORED COMBINATIONS: Identify 2–3 specific field combinations not yet explored together in this context.
STEP 7 — PROPOSE (generate at least 2 per category):
  • Novel Direction — grounded, feasible extensions of current work
  • High-Risk Hypothesis — bold claims that would transform the field if confirmed
  • Interdisciplinary Approach — methods or frameworks imported from adjacent or distant fields

For EACH proposal, classify how explored it already is:
- "unexplored" = no meaningful direct evidence in the supplied papers that this exact direction has already been attempted
- "partially_explored" = adjacent or incomplete work exists, but the exact combination or question remains underexplored
- "established_but_incomplete" = there is already a recognisable literature thread, but important limitations still justify the proposal

Be conservative about novelty. If evidence is weak or only indirect, say so explicitly.

EXACT-TOPIC HITS:
${context.directList}

COMPONENT AND ADJACENT LITERATURE:
${context.list}
${focusAreaInstruction}${refreshInstruction}${exclusionInstruction}
Return ONLY valid JSON — no markdown fences, no preamble:
{
  "topic_assessment": {
    "verdict": "no_direct_literature",
    "saturation_level": "very_low",
    "confidence": 8,
    "summary": "2–4 sentences on whether the exact topic exists, how saturated it is, and why.",
    "direct_evidence": "State whether the exact topic appears directly in the literature supplied, and cite [N] papers if it does.",
    "covered_aspects": ["aspect already covered in the literature"],
    "underexplored_aspects": ["aspect still weak, absent, or indirect"],
    "recommended_positioning": "1–2 sentences on how the user should frame the topic: as a new topic, a narrow extension, or a gap inside a saturated area."
  },
  "landscape": {
    "fundamental_concepts": ["concept1", "concept2", "concept3"],
    "intersecting_fields": ["field1", "field2", "field3"],
    "current_state": "2–3 sentence summary of what exists and the dominant paradigm"
  },
  "gaps": [
    {
      "type": "Conceptual",
      "title": "concise gap title (6–10 words)",
      "gap_status": "not_found_directly",
      "topic_connection": "1–2 sentences explaining exactly how this gap relates to the user's prompt",
      "description": "2–3 sentences: what is missing and why it remains unaddressed",
      "evidence": "cite papers [N] that reveal this gap",
      "impact_score": 9
    }
  ],
  "proposals": [
    {
      "category": "Novel Direction",
      "title": "concise proposal title (6–10 words)",
      "rationale": "2–3 sentences: scientific justification and which gaps this addresses",
      "how_to_explore": "2–3 sentences: concrete study design, dataset, or method",
      "addresses_gaps": ["Conceptual", "Methodological"],
      "exploration_status": "unexplored",
      "exploration_rationale": "1–2 sentences explaining whether this has not been explored at all, has only partial precedent, or already exists in limited form",
      "evidence_summary": "brief note citing [N] papers that justify the exploration_status, or say that no direct evidence appears in the supplied set",
      "novelty": 8,
      "feasibility": 6,
      "impact_score": 9,
      "difficulty": "Medium"
    }
  ]
}

Rules:
- verdict must be exactly one of: "no_direct_literature", "adjacent_only", "emerging_sparse", "established_niche", "saturated"
- saturation_level must be exactly one of: "very_low", "low", "moderate", "high", "very_high"
- category must be exactly: "Novel Direction", "High-Risk Hypothesis", or "Interdisciplinary Approach"
- type must be exactly: "Conceptual", "Methodological", "Data", "Population", "Interdisciplinary", or "Temporal"
- gap_status must be exactly: "not_found_directly", "weakly_studied", "fragmented_evidence", or "saturated_but_narrow"
- exploration_status must be exactly: "unexplored", "partially_explored", or "established_but_incomplete"
- Order gaps by impact_score descending. Order proposals by impact_score descending.
- Scores: integers 1–10. Be specific to THIS topic. No generic statements. Cite [N] where possible.`;
}

/* ── Step 2: search exact topic + decomposed queries, then deduplicate ── */
async function getPapers(topic, key, onProgress, onQueries) {
  onProgress("Decomposing the topic into targeted search components...");
  const componentQueries = await extractQueries(topic, key);
  onQueries(componentQueries);

  onProgress("Searching the exact topic across PubMed, OpenAlex, and Europe PMC...");
  const exactBatches = await Promise.all([fromPubMed(topic), fromOpenAlex(topic), fromEuropePMC(topic)]);
  const exactTopicPapers = dedupePapers(exactBatches.flat()).sort(sortPapers);

  onProgress(`Searching ${componentQueries.length} supporting components across the literature...`);
  const componentBatches = await Promise.all(
    componentQueries.flatMap(q => [fromPubMed(q), fromOpenAlex(q), fromEuropePMC(q)])
  );
  const componentPapers = dedupePapers(componentBatches.flat()).sort(sortPapers);

  const combined = dedupePapers([...exactTopicPapers, ...componentPapers]).sort(sortPapers);
  onProgress(`${combined.length} unique papers found`);

  if (combined.length === 0) {
    throw new Error("No papers were found. Try reformulating the topic.");
  }

  return {
    papers: combined,
    searchMeta: {
      exactTopicQuery: topic,
      componentQueries,
      exactTopicCount: exactTopicPapers.length,
      componentCount: componentPapers.length,
      totalUniqueCount: combined.length,
      exactTopicPapers: exactTopicPapers.slice(0, 25),
    },
  };
}

/* ── Analyse with Groq — meta-research scientist framework ── */
async function getGaps(topic, papers, key, searchMeta, options = {}) {
  const top = selectAnalysisPapers(papers);
  let context = buildAnalysisContext(top, searchMeta?.exactTopicPapers ?? []);
  let prompt = buildPrompt(topic, papers, searchMeta, context, options);

  let res;
  try {
    res = await fetch(GROQ_API, {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, messages: [{ role: "user", content: prompt }] }),
    });
  } catch (e) {
    throw new Error(`Groq is unreachable: ${e.message}. Check that your key is correct and that you have an internet connection.`);
  }

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    const message = e.error?.message || `Groq API ${res.status}`;
    if (/Request too large|tokens per minute|reduce your message size/i.test(message)) {
      context = {
        ...context,
        selected: top.slice(0, 24),
        directSelected: (searchMeta?.exactTopicPapers ?? []).slice(0, 4),
        analysisCount: Math.min(24, top.length),
        exactCount: Math.min(4, (searchMeta?.exactTopicPapers ?? []).length),
        list: buildPaperList(top.slice(0, 24), 90),
        directList: (searchMeta?.exactTopicPapers ?? []).length
          ? buildPaperList((searchMeta?.exactTopicPapers ?? []).slice(0, 4), 90)
          : "No direct exact-topic hits were retrieved from the search stage.",
      };
      prompt = buildPrompt(topic, papers, searchMeta, context, options);
      const retry = await fetch(GROQ_API, {
        method: "POST",
        headers: { "content-type": "application/json", "authorization": `Bearer ${key}` },
        body: JSON.stringify({ model: MODEL, max_tokens: 3072, messages: [{ role: "user", content: prompt }] }),
      });
      if (!retry.ok) {
        const retryErr = await retry.json().catch(() => ({}));
        throw new Error(retryErr.error?.message || message);
      }
      res = retry;
    } else {
      throw new Error(message);
    }
  }

  const d     = await res.json();
  const raw   = (d.choices?.[0]?.message?.content ?? "").trim();
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch { throw new Error("Groq returned an invalid response format. Please try again."); } }
    else throw new Error("Groq returned an invalid response format. Please try again.");
  }

  return {
    topicAssessment: normalizeTopicAssessment(parsed.topic_assessment),
    landscape: parsed.landscape ?? null,
    gaps:      Array.isArray(parsed.gaps)      ? parsed.gaps.map(normalizeGap).filter(Boolean)      : [],
    proposals: Array.isArray(parsed.proposals) ? parsed.proposals.map(normalizeProposal).filter(Boolean) : [],
  };
}

/* ── Helpers ── */
function impactColor(s) {
  if (s >= 9) return "#8a2820";
  if (s >= 7) return "#9a5020";
  if (s >= 5) return "#7a6020";
  return "#4a7060";
}
function impactLabel(s) {
  if (s >= 9) return "critical impact";
  if (s >= 7) return "high impact";
  if (s >= 5) return "moderate impact";
  return "limited impact";
}

function normalizeExplorationStatus(status) {
  if (status === "unexplored" || status === "partially_explored" || status === "established_but_incomplete") {
    return status;
  }
  return "partially_explored";
}

function normalizeTopicVerdict(verdict) {
  return TOPIC_STATUS_META[verdict] ? verdict : "adjacent_only";
}

function normalizeSaturationLevel(level) {
  return SATURATION_LEVEL_META[level] ? level : "moderate";
}

function normalizeGapStatus(status) {
  return GAP_STATUS_META[status] ? status : "weakly_studied";
}

function normalizeTopicAssessment(assessment) {
  if (!assessment || typeof assessment !== "object") return null;
  return {
    verdict: normalizeTopicVerdict(assessment.verdict),
    saturation_level: normalizeSaturationLevel(assessment.saturation_level),
    confidence: Number.isFinite(assessment.confidence) ? assessment.confidence : 0,
    summary: assessment.summary ?? "",
    direct_evidence: assessment.direct_evidence ?? "",
    covered_aspects: Array.isArray(assessment.covered_aspects) ? assessment.covered_aspects : [],
    underexplored_aspects: Array.isArray(assessment.underexplored_aspects) ? assessment.underexplored_aspects : [],
    recommended_positioning: assessment.recommended_positioning ?? "",
  };
}

function normalizeGap(gap) {
  if (!gap || typeof gap !== "object") return null;
  return {
    type: gap.type ?? "Conceptual",
    title: gap.title ?? "Untitled gap",
    gap_status: normalizeGapStatus(gap.gap_status),
    topic_connection: gap.topic_connection ?? "",
    description: gap.description ?? "",
    evidence: gap.evidence ?? "",
    impact_score: Number.isFinite(gap.impact_score) ? gap.impact_score : 0,
  };
}

function normalizeProposal(proposal) {
  if (!proposal || typeof proposal !== "object") return null;
  return {
    category: proposal.category ?? "Novel Direction",
    title: proposal.title ?? "Untitled proposal",
    rationale: proposal.rationale ?? "",
    how_to_explore: proposal.how_to_explore ?? "",
    addresses_gaps: Array.isArray(proposal.addresses_gaps) ? proposal.addresses_gaps : [],
    novelty: Number.isFinite(proposal.novelty) ? proposal.novelty : 0,
    feasibility: Number.isFinite(proposal.feasibility) ? proposal.feasibility : 0,
    impact_score: Number.isFinite(proposal.impact_score) ? proposal.impact_score : 0,
    difficulty: proposal.difficulty ?? "Unknown",
    exploration_status: normalizeExplorationStatus(proposal.exploration_status),
    exploration_rationale: proposal.exploration_rationale ?? "",
    evidence_summary: proposal.evidence_summary ?? "",
  };
}

/* ── Export to Markdown ── */
function toMarkdown(topic, papers, topicAssessment, landscape, gaps, proposals, searchMeta) {
  const lines = [
    `# Research Frontier Analysis: ${topic}`,
    ``,
    `> ${papers.length} papers analysed · ${gaps.length} gaps detected · ${proposals.length} proposals`,
    ``,
  ];

  if (searchMeta) {
    lines.push(`## Search Coverage`);
    lines.push(``);
    lines.push(`- Exact-topic hits: ${searchMeta.exactTopicCount}`);
    lines.push(`- Component-query hits: ${searchMeta.componentCount}`);
    lines.push(`- Total unique papers: ${searchMeta.totalUniqueCount}`);
    if (searchMeta.componentQueries?.length) {
      lines.push(`- Component queries: ${searchMeta.componentQueries.join(" · ")}`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  if (topicAssessment) {
    const verdict = TOPIC_STATUS_META[topicAssessment.verdict]?.label || topicAssessment.verdict;
    const saturation = SATURATION_LEVEL_META[topicAssessment.saturation_level]?.label || topicAssessment.saturation_level;
    lines.push(`## Topic Assessment`);
    lines.push(``);
    lines.push(`**Verdict:** ${verdict}`);
    lines.push(`**Saturation:** ${saturation}`);
    if (topicAssessment.confidence) lines.push(`**Confidence:** ${topicAssessment.confidence}/10`);
    lines.push(``);
    if (topicAssessment.summary) lines.push(topicAssessment.summary);
    if (topicAssessment.direct_evidence) {
      lines.push(``);
      lines.push(`**Direct evidence:** ${topicAssessment.direct_evidence}`);
    }
    if (topicAssessment.covered_aspects?.length) {
      lines.push(``);
      lines.push(`**Covered aspects:** ${topicAssessment.covered_aspects.join(" · ")}`);
    }
    if (topicAssessment.underexplored_aspects?.length) {
      lines.push(``);
      lines.push(`**Underexplored aspects:** ${topicAssessment.underexplored_aspects.join(" · ")}`);
    }
    if (topicAssessment.recommended_positioning) {
      lines.push(``);
      lines.push(`**Recommended positioning:** ${topicAssessment.recommended_positioning}`);
    }
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  if (landscape) {
    lines.push(`## Research Landscape`);
    lines.push(``);
    if (landscape.fundamental_concepts?.length)
      lines.push(`**Fundamental Concepts:** ${landscape.fundamental_concepts.join(" · ")}`);
    if (landscape.intersecting_fields?.length)
      lines.push(`**Intersecting Fields:** ${landscape.intersecting_fields.join(" · ")}`);
    if (landscape.current_state) { lines.push(``); lines.push(landscape.current_state); }
    lines.push(``); lines.push(`---`); lines.push(``);
  }

  if (gaps.length) {
    lines.push(`## Detected Gaps`); lines.push(``);
    gaps.forEach((g, i) => {
      lines.push(`### ${i + 1}. ${g.title}`);
      lines.push(`**Type:** ${g.type} · **Status:** ${GAP_STATUS_META[g.gap_status]?.label || g.gap_status} · **Impact:** ${g.impact_score}/10`);
      lines.push(``);
      if (g.topic_connection) {
        lines.push(`**Relation to topic:** ${g.topic_connection}`);
        lines.push(``);
      }
      lines.push(g.description);
      if (g.evidence) { lines.push(``); lines.push(`*Evidence: ${g.evidence}*`); }
      lines.push(``); lines.push(`---`); lines.push(``);
    });
  }

  if (proposals.length) {
    lines.push(`## Research Proposals`); lines.push(``);
    proposals.forEach((p, i) => {
      lines.push(`### ${i + 1}. ${p.title}`);
      lines.push(`**${p.category}** · Novelty: ${p.novelty}/10 · Feasibility: ${p.feasibility}/10 · Potential Impact: ${p.impact_score}/10 · Difficulty: ${p.difficulty}`);
      lines.push(``);
      if (p.exploration_status) {
        lines.push(`**Exploration status:** ${EXPLORATION_STATUS[p.exploration_status]?.label || p.exploration_status}`);
        if (p.exploration_rationale) lines.push(p.exploration_rationale);
        if (p.evidence_summary) lines.push(`**Evidence summary:** ${p.evidence_summary}`);
        lines.push(``);
      }
      lines.push(p.rationale);
      lines.push(``);
      lines.push(`**How to explore:** ${p.how_to_explore}`);
      if (p.addresses_gaps?.length) { lines.push(``); lines.push(`*Addresses: ${p.addresses_gaps.join(", ")} gaps*`); }
      lines.push(``); lines.push(`---`); lines.push(``);
    });
  }

  return lines.join("\n");
}

/* ── CSS ── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #f6f0e6; }

  .lgf {
    min-height: 100vh;
    background: #f6f0e6;
    font-family: 'Cormorant Garamond', Georgia, serif;
    color: #2a1f0a;
    padding-bottom: 80px;
  }

  /* ── Header ── */
  .lgf-header {
    background: #2a1f0a;
    color: #f6f0e6;
    padding: 44px 48px 32px;
  }
  .lgf-header-inner {
    max-width: 880px; margin: 0 auto;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;
  }
  .lgf-title {
    font-size: 2.6rem; font-weight: 300; line-height: 1.1; letter-spacing: 0.01em;
  }
  .lgf-title em { font-style: italic; color: #c8a050; }
  .lgf-subtitle {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem; letter-spacing: 0.06em;
    color: #806040; margin-top: 10px;
    line-height: 1.7;
  }
  .lgf-back {
    font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.06em;
    color: #806040; text-decoration: none;
    border: 1px solid #4a3820; padding: 7px 16px; border-radius: 2px;
    white-space: nowrap; margin-top: 6px; flex-shrink: 0;
    transition: color 0.2s, border-color 0.2s;
  }
  .lgf-back:hover { color: #f6f0e6; border-color: #8a6030; }

  /* ── Body ── */
  .lgf-body { max-width: 880px; margin: 0 auto; padding: 44px 48px 0; }

  /* ── API Key ── */
  .lgf-key-toggle {
    background: none; border: none; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 0.74rem; letter-spacing: 0.05em;
    color: #7a6030; display: flex; align-items: center; gap: 6px; padding: 0;
  }
  .lgf-key-toggle:hover { color: #2a1f0a; }
  .lgf-key-saved { color: #4a7050; }
  .lgf-key-panel {
    margin-top: 12px; padding: 20px 22px;
    background: #fffcf5; border: 1px solid #d8ccb0; border-radius: 4px;
  }
  .lgf-key-label {
    font-family: 'DM Mono', monospace; font-size: 0.68rem; letter-spacing: 0.07em;
    color: #7a6030; display: block; margin-bottom: 8px; text-transform: uppercase;
  }
  .lgf-key-row { display: flex; gap: 10px; }
  .lgf-key-input {
    flex: 1; font-family: 'DM Mono', monospace; font-size: 0.82rem;
    padding: 10px 14px; background: #f6f0e6;
    border: 1px solid #c8c0a8; border-radius: 3px; color: #2a1f0a; outline: none;
    transition: border-color 0.2s;
  }
  .lgf-key-input:focus { border-color: #8a6030; }
  .lgf-key-btn {
    font-family: 'DM Mono', monospace; font-size: 0.74rem; letter-spacing: 0.05em;
    padding: 10px 18px; background: #2a1f0a; color: #f6f0e6;
    border: none; border-radius: 3px; cursor: pointer; transition: background 0.2s;
  }
  .lgf-key-btn:hover { background: #4a3820; }
  .lgf-key-hint {
    font-family: 'DM Mono', monospace; font-size: 0.65rem; color: #a09070; margin-top: 8px;
  }

  /* ── Form ── */
  .lgf-form { margin: 32px 0 36px; }
  .lgf-form-label {
    font-size: 1.05rem; font-weight: 400; color: #4a3820;
    display: block; margin-bottom: 10px; letter-spacing: 0.02em;
  }
  .lgf-textarea {
    width: 100%;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.15rem; font-weight: 300;
    padding: 14px 18px;
    background: #fffcf5; border: 1px solid #c8c0a8; border-radius: 4px;
    color: #2a1f0a; outline: none; resize: none;
    transition: border-color 0.2s; line-height: 1.5;
  }
  .lgf-textarea:focus { border-color: #8a6030; }
  .lgf-textarea::placeholder { color: #b0a888; font-style: italic; }
  .lgf-form-row {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; margin-top: 12px;
  }
  .lgf-form-hint {
    font-family: 'DM Mono', monospace; font-size: 0.68rem; color: #a09070; letter-spacing: 0.03em;
  }
  .lgf-submit {
    font-family: 'DM Mono', monospace; font-size: 0.76rem; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 12px 28px;
    background: #2a1f0a; color: #f0e8d0;
    border: none; border-radius: 3px; cursor: pointer;
    transition: background 0.2s; white-space: nowrap;
  }
  .lgf-submit:hover:not(:disabled) { background: #4a3820; }
  .lgf-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Loading ── */
  .lgf-loading { padding: 56px 0; text-align: center; }
  .lgf-spinner {
    width: 28px; height: 28px;
    border: 2px solid #d8ccb0; border-top-color: #8a6030;
    border-radius: 50%; animation: spin 0.85s linear infinite;
    margin: 0 auto 18px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .lgf-loading-label {
    font-family: 'DM Mono', monospace; font-size: 0.8rem; color: #6a5030; letter-spacing: 0.04em;
  }
  .lgf-loading-step {
    font-family: 'DM Mono', monospace; font-size: 0.68rem; color: #a09070; margin-top: 6px; letter-spacing: 0.03em;
  }
  .lgf-fact-box {
    margin: 28px auto 0; max-width: 480px;
    padding: 18px 22px;
    background: #fffcf5; border: 1px solid #d8ccb0; border-radius: 4px;
  }
  .lgf-fact-label {
    font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.1em;
    text-transform: uppercase; color: #b0a080; display: block; margin-bottom: 8px;
  }
  .lgf-fact-text {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.05rem; font-weight: 300; line-height: 1.6; color: #2a1f0a;
    font-style: italic;
    animation: fact-fade 0.5s ease;
  }
  @keyframes fact-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

  /* ── Error ── */
  .lgf-error {
    padding: 16px 20px; background: #fff5f2;
    border: 1px solid #e8a898; border-radius: 4px;
    font-family: 'DM Mono', monospace; font-size: 0.78rem; color: #8a2820; letter-spacing: 0.02em;
  }

  /* ── Results meta bar ── */
  .lgf-meta {
    display: flex; flex-wrap: wrap; gap: 20px;
    font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.04em; color: #6a5030;
    padding: 14px 0; border-top: 1px solid #d8ccb0; border-bottom: 1px solid #d8ccb0;
    margin-bottom: 36px;
  }
  .lgf-meta-actions {
    margin-left: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .lgf-meta-export {
    background: none; border: 1px solid #c8c0a8; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 0.68rem; letter-spacing: 0.05em;
    color: #6a5030; padding: 4px 14px; border-radius: 2px; transition: all 0.2s;
  }
  .lgf-meta-export:hover { background: #2a1f0a; color: #f6f0e6; border-color: #2a1f0a; }
  .lgf-refresh-select {
    background: #fffcf5;
    border: 1px solid #c8c0a8;
    border-radius: 2px;
    color: #6a5030;
    padding: 6px 10px;
    font-family: 'DM Mono', monospace;
    font-size: 0.66rem;
    letter-spacing: 0.04em;
  }

  /* ── Gap cards ── */
  .lgf-gaps { display: flex; flex-direction: column; gap: 24px; }

  .lgf-gap {
    background: #fffcf5; border: 1px solid #d8ccb0; border-radius: 6px;
    padding: 26px 28px 22px; transition: box-shadow 0.2s;
  }
  .lgf-gap:hover { box-shadow: 0 4px 20px rgba(42,31,10,0.08); }

  .lgf-gap-top {
    display: flex; align-items: flex-start; gap: 14px; margin-bottom: 12px;
  }
  .lgf-gap-rank {
    font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.08em;
    color: #b0a080; flex-shrink: 0; margin-top: 5px;
  }
  .lgf-gap-title {
    font-size: 1.32rem; font-weight: 400; line-height: 1.25; flex: 1;
  }
  .lgf-impact-pill {
    font-family: 'DM Mono', monospace; font-size: 0.67rem; letter-spacing: 0.04em;
    padding: 4px 10px; border-radius: 2px; flex-shrink: 0; margin-top: 3px;
  }

  .lgf-bar {
    height: 2px; background: #e8e0d0; border-radius: 1px; margin-bottom: 20px; overflow: hidden;
  }
  .lgf-bar-fill { height: 100%; border-radius: 1px; }

  .lgf-section { margin-bottom: 14px; }
  .lgf-section-label {
    font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.09em;
    text-transform: uppercase; color: #a09070; display: block; margin-bottom: 4px;
  }
  .lgf-section-text {
    font-size: 0.98rem; font-weight: 300; line-height: 1.7; color: #2a1f0a;
  }

  .lgf-gap-footer {
    display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
    margin-top: 16px; padding-top: 14px; border-top: 1px solid #ece4d0;
  }
  .lgf-cat { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.06em; padding: 3px 10px; border-radius: 2px; color: #fff; }
  .lgf-diff { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.06em; padding: 3px 10px; border-radius: 2px; border: 1px solid #c8c0a8; color: #6a5030; }
  .lgf-scores { margin-left: auto; font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.03em; color: #9a8860; }

  /* ── Papers list ── */
  .lgf-papers-toggle {
    margin-top: 48px; background: none; border: none; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 0.72rem; letter-spacing: 0.05em;
    color: #7a6030; display: flex; align-items: center; gap: 6px; padding: 0;
  }
  .lgf-papers-toggle:hover { color: #2a1f0a; }
  .lgf-papers-list {
    margin-top: 16px; display: flex; flex-direction: column; gap: 10px;
  }
  .lgf-paper {
    padding: 14px 18px; background: #fffcf5; border: 1px solid #e4dcc8; border-radius: 4px;
  }
  .lgf-paper-title { font-size: 0.95rem; font-weight: 400; margin-bottom: 3px; }
  .lgf-paper-meta { font-family: 'DM Mono', monospace; font-size: 0.64rem; color: #a09070; letter-spacing: 0.03em; }
  .lgf-paper-link { color: #2a1f0a; text-decoration: underline; text-underline-offset: 2px; text-decoration-color: #c8c0a8; }
  .lgf-paper-link:hover { color: #8a6030; text-decoration-color: #8a6030; }

  /* ── Landscape card ── */
  .lgf-landscape {
    margin-bottom: 40px; padding: 24px 28px;
    background: #fffcf5; border: 1px solid #d8ccb0; border-radius: 4px;
  }
  .lgf-landscape-title {
    font-family: 'DM Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.12em; text-transform: uppercase; color: #8a6a30; margin-bottom: 18px;
  }
  .lgf-landscape-group { margin-bottom: 14px; }
  .lgf-landscape-group-label {
    font-family: 'DM Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.08em; text-transform: uppercase; color: #a09070; margin-bottom: 7px;
  }
  .lgf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .lgf-chip {
    font-family: 'DM Mono', monospace; font-size: 0.67rem;
    padding: 3px 10px; border-radius: 2px;
    background: #f0e8d4; border: 1px solid #c8c0a0; color: #5a4820;
  }
  .lgf-chip.field { background: #e8f0ee; border-color: #a0b8b0; color: #2a5048; }
  .lgf-landscape-state {
    margin-top: 16px; padding-top: 16px;
    border-top: 1px solid #e8e0cc;
    font-size: 1rem; font-weight: 300; color: #4a3820;
    line-height: 1.7; font-style: italic;
  }

  /* ── Section headers ── */
  .lgf-section-hdr {
    display: flex; align-items: baseline; gap: 12px;
    margin: 40px 0 20px; padding-bottom: 10px;
    border-bottom: 1px solid #d8ccb0;
  }
  .lgf-section-hdr-label {
    font-family: 'DM Mono', monospace; font-size: 0.72rem;
    letter-spacing: 0.12em; text-transform: uppercase; color: #4a3820;
  }
  .lgf-section-hdr-count {
    font-family: 'DM Mono', monospace; font-size: 0.65rem; color: #a09070;
  }

  /* ── Proposal cards ── */
  .lgf-proposals { display: flex; flex-direction: column; gap: 18px; }
  .lgf-proposal {
    padding: 22px 24px 0;
    background: #fffcf5; border: 1px solid #d8ccb0; border-radius: 4px;
    transition: border-color 0.2s;
  }
  .lgf-proposal:hover { border-color: #a09070; }
  .lgf-proposal-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
  .lgf-proposal-cat {
    font-family: 'DM Mono', monospace; font-size: 0.58rem;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 2px; color: #fff; flex-shrink: 0; margin-top: 4px;
  }
  .lgf-proposal-title {
    font-size: 1.2rem; font-weight: 400; color: #2a1f0a; line-height: 1.3; flex: 1;
  }
  .lgf-proposal-section { margin-bottom: 12px; }
  .lgf-proposal-section-label {
    font-family: 'DM Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #a09070; margin-bottom: 4px; display: block;
  }
  .lgf-proposal-text {
    font-size: 1rem; color: #4a3820; line-height: 1.65; font-weight: 300;
  }
  .lgf-proposal-gaps { display: flex; flex-wrap: wrap; gap: 5px; margin: 10px 0 16px; }
  .lgf-proposal-gap-chip {
    font-family: 'DM Mono', monospace; font-size: 0.58rem;
    padding: 2px 7px; border-radius: 2px;
    background: #f0e8d4; color: #5a4820; border: 1px solid #c8c0a0;
  }
  .lgf-exploration-box {
    margin-bottom: 14px;
    padding: 12px 14px;
    border-radius: 4px;
    border: 1px solid #d8ccb0;
  }
  .lgf-exploration-pill {
    display: inline-block;
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 999px;
    margin-bottom: 8px;
  }
  .lgf-exploration-text {
    font-size: 0.97rem;
    color: #4a3820;
    line-height: 1.65;
    font-weight: 300;
  }
  .lgf-score-row {
    display: flex; margin-top: 0;
    border-top: 1px solid #ece4d0;
  }
  .lgf-score-item {
    flex: 1; text-align: center; padding: 14px 0;
    border-right: 1px solid #ece4d0;
  }
  .lgf-score-item:last-child { border-right: none; }
  .lgf-score-label {
    font-family: 'DM Mono', monospace; font-size: 0.57rem;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #a09070; display: block; margin-bottom: 4px;
  }
  .lgf-score-val {
    font-family: 'DM Mono', monospace; font-size: 1.1rem; color: #4a3820;
  }
  .lgf-assessment {
    margin-bottom: 28px;
    padding: 24px 28px;
    background: #fffcf5;
    border: 1px solid #d8ccb0;
    border-radius: 6px;
  }
  .lgf-assessment-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }
  .lgf-assessment-title {
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #8a6a30;
  }
  .lgf-assessment-pill {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 6px 10px;
    border-radius: 999px;
  }
  .lgf-assessment-summary,
  .lgf-assessment-text {
    font-size: 1rem;
    font-weight: 300;
    line-height: 1.7;
    color: #4a3820;
  }
  .lgf-assessment-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-top: 18px;
  }
  .lgf-assessment-box {
    padding: 14px 16px;
    background: #fcf8ef;
    border: 1px solid #e7dcc5;
    border-radius: 4px;
  }
  .lgf-assessment-box ul {
    margin: 8px 0 0 18px;
  }
  .lgf-assessment-box li {
    margin-bottom: 6px;
    font-size: 0.95rem;
    line-height: 1.55;
    color: #4a3820;
  }
  .lgf-search-box {
    margin-bottom: 24px;
    padding: 20px 24px;
    background: #fffcf5;
    border: 1px solid #d8ccb0;
    border-radius: 6px;
  }
  .lgf-search-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 14px;
  }
  .lgf-search-stat {
    padding: 12px 14px;
    background: #fcf8ef;
    border: 1px solid #e7dcc5;
    border-radius: 4px;
  }
  .lgf-search-stat-value {
    font-family: 'DM Mono', monospace;
    font-size: 1.15rem;
    color: #4a3820;
  }
  .lgf-search-stat-label {
    display: block;
    margin-top: 5px;
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9a8860;
  }
  .lgf-query-list {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lgf-focus-box {
    margin-bottom: 24px;
    padding: 20px 24px;
    background: #fffcf5;
    border: 1px solid #d8ccb0;
    border-radius: 6px;
  }
  .lgf-focus-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-top: 14px;
  }
  .lgf-focus-select {
    min-width: 220px;
    background: #fcf8ef;
    border: 1px solid #c8c0a8;
    border-radius: 4px;
    color: #4a3820;
    padding: 10px 12px;
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.04em;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .lgf-header { padding: 32px 20px 24px; }
    .lgf-body   { padding: 32px 20px 0; }
    .lgf-gap    { padding: 20px 18px 16px; }
    .lgf-title  { font-size: 2rem; }
    .lgf-gap-top { flex-wrap: wrap; }
    .lgf-form-row { flex-direction: column; align-items: flex-end; }
    .lgf-header-inner { flex-direction: column; }
    .lgf-search-grid,
    .lgf-assessment-grid { grid-template-columns: 1fr; }
    .lgf-meta-actions { margin-left: 0; }
    .lgf-focus-row { align-items: stretch; }
  }
`;

/* ════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════ */
export default function LiteratureGapFinder() {
  const [keyDraft, setKeyDraft]   = useState(() => localStorage.getItem("lgf-key") || "");
  const [apiKey,   setApiKey]     = useState(() => localStorage.getItem("lgf-key") || "");
  const [keyOpen,  setKeyOpen]    = useState(() => !localStorage.getItem("lgf-key"));

  const [topic,            setTopic]            = useState("");
  const [status,           setStatus]           = useState("idle");
  const [step,             setStep]             = useState("");
  const [papers,           setPapers]           = useState([]);
  const [searchMeta,       setSearchMeta]       = useState(null);
  const [topicAssessment,  setTopicAssessment]  = useState(null);
  const [landscape,        setLandscape]        = useState(null);
  const [gaps,             setGaps]             = useState([]);
  const [proposals,        setProposals]        = useState([]);
  const [error,            setError]            = useState("");
  const [showPapers, setShowPapers] = useState(false);
  const [copied,           setCopied]           = useState(false);
  const [factIdx,          setFactIdx]          = useState(() => Math.floor(Math.random() * GOOFY_FACTS.length));
  const [queries,          setQueries]          = useState([]);
  const [refreshMode,      setRefreshMode]      = useState(REFRESH_MODES[0].id);
  const [refreshingIdeas,  setRefreshingIdeas]  = useState(false);
  const [proposalHistory,  setProposalHistory]  = useState([]);
  const [preferredArea,    setPreferredArea]    = useState("");
  const [applyingAreaFocus, setApplyingAreaFocus] = useState(false);

  useEffect(() => {
    if (status !== "loading") return;
    const id = setInterval(() => {
      setFactIdx(i => (i + 1) % GOOFY_FACTS.length);
    }, 6000);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (!landscape?.intersecting_fields?.length) {
      setPreferredArea("");
      return;
    }
    if (preferredArea && !landscape.intersecting_fields.includes(preferredArea)) {
      setPreferredArea("");
    }
  }, [landscape, preferredArea]);

  function saveKey() {
    localStorage.setItem("lgf-key", keyDraft);
    setApiKey(keyDraft);
    setKeyOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!topic.trim() || !apiKey) return;
    if (topic.trim().length > 500) { setError("Topic is too long (max. 500 characters)."); return; }

    setStatus("loading");
    setError("");
    setSearchMeta(null);
    setTopicAssessment(null);
    setLandscape(null);
    setGaps([]);
    setProposals([]);
    setPapers([]);
    setProposalHistory([]);
    setPreferredArea("");
    setShowPapers(false);

    try {
      setQueries([]);
      const { papers: found, searchMeta: nextSearchMeta } = await getPapers(topic.trim(), apiKey, setStep, setQueries);
      setPapers(found);
      setSearchMeta(nextSearchMeta);
      setStep(`Analysing ${found.length} papers with Groq (${MODEL})...`);
      const {
        topicAssessment: nextAssessment,
        landscape: land,
        gaps: foundGaps,
        proposals: foundProposals,
      } = await getGaps(topic.trim(), found, apiKey, nextSearchMeta);
      setTopicAssessment(nextAssessment);
      setLandscape(land);
      setGaps(foundGaps);
      setProposals(foundProposals);
      setProposalHistory(foundProposals.map((proposal) => proposal.title));
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  async function handleRefreshSuggestions() {
    if (!topic.trim() || !apiKey || papers.length === 0 || !searchMeta) return;
    setRefreshingIdeas(true);
    setError("");
    try {
      const mode = REFRESH_MODES.find((item) => item.id === refreshMode) || REFRESH_MODES[0];
      const {
        topicAssessment: nextAssessment,
        landscape: nextLandscape,
        gaps: nextGaps,
        proposals: nextProposals,
      } = await getGaps(topic.trim(), papers, apiKey, searchMeta, {
        focusArea: preferredArea || undefined,
        refreshPrompt: mode.prompt,
        excludeProposalTitles: proposalHistory,
      });
      setTopicAssessment(nextAssessment);
      setLandscape(nextLandscape);
      setGaps(nextGaps);
      setProposals(nextProposals);
      setProposalHistory((prev) => [...prev, ...nextProposals.map((proposal) => proposal.title)]);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshingIdeas(false);
    }
  }

  async function handleApplyAreaFocus() {
    if (!preferredArea || !topic.trim() || !apiKey || papers.length === 0 || !searchMeta) return;
    setApplyingAreaFocus(true);
    setError("");
    try {
      const {
        topicAssessment: nextAssessment,
        landscape: nextLandscape,
        gaps: nextGaps,
        proposals: nextProposals,
      } = await getGaps(topic.trim(), papers, apiKey, searchMeta, {
        focusArea: preferredArea,
        refreshPrompt: "Refocus the analysis and ranking around the user's chosen area preference while keeping the full topic in view.",
        excludeProposalTitles: [],
      });
      setTopicAssessment(nextAssessment);
      setLandscape(nextLandscape);
      setGaps(nextGaps);
      setProposals(nextProposals);
      setProposalHistory(nextProposals.map((proposal) => proposal.title));
    } catch (err) {
      setError(err.message);
    } finally {
      setApplyingAreaFocus(false);
    }
  }

  function handleExport() {
    const md = toMarkdown(topic, papers, topicAssessment, landscape, gaps, proposals, searchMeta);
    const blob = new Blob([md], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url,
      download: `frontier-${topic.slice(0, 40).replace(/\s+/g, "-")}.md`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopy() {
    navigator.clipboard.writeText(toMarkdown(topic, papers, topicAssessment, landscape, gaps, proposals, searchMeta))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); })
      .catch(() => setError("Could not copy. Use the .md export button instead."));
  }

  return (
    <div className="lgf">
      <style>{css}</style>

      {/* ── Header ── */}
      <header className="lgf-header">
        <div className="lgf-header-inner">
          <div>
            <h1 className="lgf-title">Research <em>Frontier</em> Finder</h1>
            <p className="lgf-subtitle">
              enter a scientific topic · map what is already covered · identify what is still missing · suggest next research directions
            </p>
          </div>
          <a href="/" className="lgf-back">← mariana</a>
        </div>
      </header>

      <main className="lgf-body">

        {/* ── API Key ── */}
        <div style={{ marginBottom: 28 }}>
          <button className="lgf-key-toggle" onClick={() => setKeyOpen(o => !o)}>
            {keyOpen ? "▾" : "▸"} Groq API key
            {apiKey && !keyOpen && <span className="lgf-key-saved"> · saved ✓</span>}
          </button>
          {keyOpen && (
            <div className="lgf-key-panel">
              <label className="lgf-key-label">Groq API key</label>
              <div className="lgf-key-row">
                <input
                  className="lgf-key-input"
                  type="password"
                  placeholder="gsk_..."
                  value={keyDraft}
                  onChange={e => setKeyDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveKey()}
                />
                <button className="lgf-key-btn" onClick={saveKey}>Save</button>
              </div>
              <p className="lgf-key-hint">
                Stored only in your browser via localStorage. It is not sent anywhere except the APIs used by this tool.
              </p>
            </div>
          )}
        </div>

        {/* ── Search form ── */}
        <form className="lgf-form" onSubmit={handleSubmit}>
          <label className="lgf-form-label">Scientific topic</label>
          <textarea
            className="lgf-textarea"
            rows={2}
            placeholder="ex: evoked potentials in Parkinson's disease · mathematical models of neural oscillations · EEG biomarkers for neurological disorders"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
            }}
          />
          <div className="lgf-form-row">
            <span className="lgf-form-hint">
              The more specific the topic, the better · Shift+Enter for a new line
            </span>
            <button
              className="lgf-submit"
              type="submit"
              disabled={!topic.trim() || !apiKey || status === "loading"}
            >
              {status === "loading" ? "Analysing..." : "Analyse literature"}
            </button>
          </div>
        </form>

        {/* ── Loading ── */}
        {status === "loading" && (
          <div className="lgf-loading">
            <div className="lgf-spinner" />
            <div className="lgf-loading-label">Processing</div>
            <div className="lgf-loading-step">{step}</div>
            <div className="lgf-fact-box" style={{ marginTop: 18 }}>
              <span className="lgf-fact-label">useless fact while you wait</span>
              <p key={factIdx} className="lgf-fact-text">{GOOFY_FACTS[factIdx]}</p>
            </div>
            {queries.length > 0 && (
              <div className="lgf-fact-box" style={{ marginBottom: 16, textAlign: "left" }}>
                <span className="lgf-fact-label">component queries</span>
                {queries.map((q, i) => (
                  <div key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.74rem", color: "#6a5030", marginTop: 4 }}>
                    → {q}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {status === "error" && (
          <div className="lgf-error">⚠ {error}</div>
        )}

        {/* ── Results ── */}
        {status === "done" && (topicAssessment || landscape || gaps.length > 0 || proposals.length > 0) && (
          <>
            <div className="lgf-meta">
              <span>📄 {papers.length} papers analysed</span>
              <span>◈ {gaps.length} gaps · {proposals.length} proposals</span>
              <span style={{ fontStyle: "italic", color: "#9a8860" }}>"{topic}"</span>
              <div className="lgf-meta-actions">
                <select
                  className="lgf-refresh-select"
                  value={refreshMode}
                  onChange={(e) => setRefreshMode(e.target.value)}
                >
                  {REFRESH_MODES.map((mode) => (
                    <option key={mode.id} value={mode.id}>{mode.label}</option>
                  ))}
                </select>
                <button className="lgf-meta-export" onClick={handleRefreshSuggestions} disabled={refreshingIdeas}>
                  {refreshingIdeas ? "Refreshing..." : "Refresh suggestions"}
                </button>
                <button className="lgf-meta-export" onClick={handleExport}>↓ .md</button>
                <button className="lgf-meta-export" onClick={handleCopy}>
                  {copied ? "✓ copied" : "copy"}
                </button>
              </div>
            </div>

            {searchMeta && (
              <div className="lgf-search-box">
                <div className="lgf-landscape-title">Search coverage</div>
                <div className="lgf-search-grid">
                  <div className="lgf-search-stat">
                    <div className="lgf-search-stat-value">{searchMeta.exactTopicCount}</div>
                    <span className="lgf-search-stat-label">Exact-topic hits</span>
                  </div>
                  <div className="lgf-search-stat">
                    <div className="lgf-search-stat-value">{searchMeta.componentCount}</div>
                    <span className="lgf-search-stat-label">Component-query hits</span>
                  </div>
                  <div className="lgf-search-stat">
                    <div className="lgf-search-stat-value">{searchMeta.totalUniqueCount}</div>
                    <span className="lgf-search-stat-label">Unique papers retained</span>
                  </div>
                </div>
                {searchMeta.componentQueries?.length > 0 && (
                  <div className="lgf-query-list">
                    {searchMeta.componentQueries.map((query, index) => (
                      <span key={index} className="lgf-chip">{query}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {landscape?.intersecting_fields?.length > 1 && (
              <div className="lgf-focus-box">
                <div className="lgf-landscape-title">Area preference</div>
                <p className="lgf-assessment-text">
                  This topic spans multiple areas. Which one should the app prioritize when ranking the gaps and research directions?
                </p>
                <div className="lgf-focus-row">
                  <select
                    className="lgf-focus-select"
                    value={preferredArea}
                    onChange={(e) => setPreferredArea(e.target.value)}
                  >
                    <option value="">Choose a preferred area</option>
                    {landscape.intersecting_fields.map((field) => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  <button
                    className="lgf-meta-export"
                    onClick={handleApplyAreaFocus}
                    disabled={!preferredArea || applyingAreaFocus}
                  >
                    {applyingAreaFocus ? "Refocusing..." : "Apply area focus"}
                  </button>
                </div>
              </div>
            )}

            {topicAssessment && (
              <div
                className="lgf-assessment"
                style={{
                  background: TOPIC_STATUS_META[topicAssessment.verdict].bg,
                  borderColor: TOPIC_STATUS_META[topicAssessment.verdict].border,
                }}
              >
                <div className="lgf-assessment-top">
                  <div>
                    <div className="lgf-assessment-title">Topic assessment</div>
                    <p className="lgf-assessment-summary" style={{ marginTop: 10 }}>
                      {topicAssessment.summary}
                    </p>
                  </div>
                  <span
                    className="lgf-assessment-pill"
                    style={{
                      background: TOPIC_STATUS_META[topicAssessment.verdict].color,
                      color: "#fff",
                    }}
                  >
                    {TOPIC_STATUS_META[topicAssessment.verdict].label}
                  </span>
                </div>

                <div className="lgf-assessment-grid">
                  <div className="lgf-assessment-box">
                    <span className="lgf-section-label">Direct evidence</span>
                    <p className="lgf-assessment-text">{topicAssessment.direct_evidence}</p>
                  </div>
                  <div className="lgf-assessment-box">
                    <span className="lgf-section-label">Saturation estimate</span>
                    <p className="lgf-assessment-text">
                      <strong style={{ fontWeight: 400, color: SATURATION_LEVEL_META[topicAssessment.saturation_level].color }}>
                        {SATURATION_LEVEL_META[topicAssessment.saturation_level].label}
                      </strong>
                      {topicAssessment.confidence ? ` · confidence ${topicAssessment.confidence}/10` : ""}
                    </p>
                    {topicAssessment.recommended_positioning && (
                      <p className="lgf-assessment-text" style={{ marginTop: 10 }}>
                        {topicAssessment.recommended_positioning}
                      </p>
                    )}
                  </div>
                  <div className="lgf-assessment-box">
                    <span className="lgf-section-label">Covered aspects of your prompt</span>
                    <ul>
                      {(topicAssessment.covered_aspects.length ? topicAssessment.covered_aspects : ["No clearly covered aspects were identified."]).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="lgf-assessment-box">
                    <span className="lgf-section-label">Underexplored or missing aspects</span>
                    <ul>
                      {(topicAssessment.underexplored_aspects.length ? topicAssessment.underexplored_aspects : ["No specific underexplored aspects were identified."]).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ── Landscape ── */}
            {landscape && (
              <div className="lgf-landscape">
                <div className="lgf-landscape-title">Research landscape</div>
                {landscape.fundamental_concepts?.length > 0 && (
                  <div className="lgf-landscape-group">
                    <div className="lgf-landscape-group-label">Fundamental concepts</div>
                    <div className="lgf-chips">
                      {landscape.fundamental_concepts.map((c, i) => (
                        <span key={i} className="lgf-chip">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {landscape.intersecting_fields?.length > 0 && (
                  <div className="lgf-landscape-group">
                    <div className="lgf-landscape-group-label">Intersecting fields</div>
                    <div className="lgf-chips">
                      {landscape.intersecting_fields.map((f, i) => (
                        <span key={i} className="lgf-chip field">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {landscape.current_state && (
                  <p className="lgf-landscape-state">{landscape.current_state}</p>
                )}
              </div>
            )}

            {/* ── Gaps ── */}
            {gaps.length > 0 && (
              <>
                <div className="lgf-section-hdr">
                  <span className="lgf-section-hdr-label">Detected gaps</span>
                  <span className="lgf-section-hdr-count">{gaps.length} identified</span>
                </div>
                <div className="lgf-gaps">
                  {gaps.map((g, i) => {
                    const col     = impactColor(g.impact_score);
                    const typeCol = GAP_TYPE_COLORS[g.type] || "#808080";
                    const gapMeta = GAP_STATUS_META[g.gap_status] || GAP_STATUS_META.weakly_studied;
                    return (
                      <article className="lgf-gap" key={i}>
                        <div className="lgf-gap-top">
                          <h2 className="lgf-gap-title">{g.title}</h2>
                          <div className="lgf-impact-pill" style={{ background: col + "18", color: col, border: `1px solid ${col}35` }}>
                            {g.impact_score}/10 · {impactLabel(g.impact_score)}
                          </div>
                        </div>
                        <div className="lgf-bar">
                          <div className="lgf-bar-fill" style={{ width: `${(g.impact_score / 10) * 100}%`, background: col }} />
                        </div>
                        <div className="lgf-section">
                          <span className="lgf-section-label">How this gap relates to your topic</span>
                          <p className="lgf-section-text">{g.topic_connection}</p>
                        </div>
                        <div className="lgf-section">
                          <span className="lgf-section-label">Gap description</span>
                          <p className="lgf-section-text">{g.description}</p>
                        </div>
                        {g.evidence && (
                          <div className="lgf-section">
                            <span className="lgf-section-label">Evidence in the literature</span>
                            <p className="lgf-section-text">{g.evidence}</p>
                          </div>
                        )}
                        <div className="lgf-gap-footer">
                          <span className="lgf-cat" style={{ background: typeCol }}>{g.type}</span>
                          <span className="lgf-diff" style={{ color: gapMeta.color, borderColor: gapMeta.border, background: gapMeta.bg }}>{gapMeta.label}</span>
                          <div className="lgf-scores">impact {g.impact_score}/10</div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Proposals ── */}
            {proposals.length > 0 && (
              <>
                <div className="lgf-section-hdr">
                  <span className="lgf-section-hdr-label">Research proposals</span>
                  <span className="lgf-section-hdr-count">{proposals.length} proposals</span>
                </div>
                <div className="lgf-proposals">
                  {proposals.map((p, i) => {
                    const catCol = PROPOSAL_COLORS[p.category] || "#4a6a9b";
                    const explorationMeta = EXPLORATION_STATUS[p.exploration_status] || EXPLORATION_STATUS.partially_explored;
                    return (
                      <article className="lgf-proposal" key={i}>
                        <div className="lgf-proposal-top">
                          <span className="lgf-proposal-cat" style={{ background: catCol }}>{p.category}</span>
                          <h2 className="lgf-proposal-title">{p.title}</h2>
                        </div>
                        <div
                          className="lgf-exploration-box"
                          style={{ background: explorationMeta.bg, borderColor: explorationMeta.border }}
                        >
                          <span
                            className="lgf-exploration-pill"
                              style={{ background: explorationMeta.color, color: "#fff" }}
                          >
                            {explorationMeta.label}
                          </span>
                          {p.exploration_rationale && (
                            <p className="lgf-exploration-text">{p.exploration_rationale}</p>
                          )}
                          {p.evidence_summary && (
                            <p className="lgf-exploration-text" style={{ marginTop: 8 }}>
                              <strong style={{ fontWeight: 400 }}>Evidence base:</strong> {p.evidence_summary}
                            </p>
                          )}
                        </div>
                        <div className="lgf-proposal-section">
                          <span className="lgf-proposal-section-label">Rationale</span>
                          <p className="lgf-proposal-text">{p.rationale}</p>
                        </div>
                        <div className="lgf-proposal-section">
                          <span className="lgf-proposal-section-label">How to explore</span>
                          <p className="lgf-proposal-text">{p.how_to_explore}</p>
                        </div>
                        {p.addresses_gaps?.length > 0 && (
                          <div className="lgf-proposal-gaps">
                            {p.addresses_gaps.map((gap, j) => (
                              <span key={j} className="lgf-proposal-gap-chip">{gap}</span>
                            ))}
                          </div>
                        )}
                        <div className="lgf-score-row">
                          <div className="lgf-score-item">
                            <span className="lgf-score-label">Novelty</span>
                            <span className="lgf-score-val">{p.novelty}/10</span>
                          </div>
                          <div className="lgf-score-item">
                            <span className="lgf-score-label">Feasibility</span>
                            <span className="lgf-score-val">{p.feasibility}/10</span>
                          </div>
                          <div className="lgf-score-item">
                            <span className="lgf-score-label">Potential impact</span>
                            <span className="lgf-score-val">{p.impact_score}/10</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Papers list (collapsible) ── */}
            <button className="lgf-papers-toggle" onClick={() => setShowPapers(p => !p)}>
              {showPapers ? "▾" : "▸"} Analysed papers ({papers.length})
            </button>
            {showPapers && (
              <div className="lgf-papers-list">
                {papers
                  .sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0))
                  .map((p, i) => (
                    <div className="lgf-paper" key={i}>
                      <div className="lgf-paper-title">
                        {p.url
                          ? <a href={p.url} target="_blank" rel="noreferrer" className="lgf-paper-link">{p.title}</a>
                          : p.title}
                      </div>
                      <div className="lgf-paper-meta">
                        {p.year ?? "n.d."} · {p.citationCount ?? 0} citations
                        {p.authors?.[0]?.name && ` · ${p.authors[0].name}${p.authors.length > 1 ? " et al." : ""}`}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
