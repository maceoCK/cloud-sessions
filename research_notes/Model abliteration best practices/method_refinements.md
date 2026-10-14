# Algorithmic refinements and variants of abliteration (refusal-direction ablation / weight orthogonalization) after Arditi et al. 2024

Scope note: covers work dated Oct 2024 – Oct 2026. Evidence tiers used throughout:
- **[PEER]** peer-reviewed / accepted at a venue (ICML, ICLR, AAAI, EMNLP, ACL Findings)
- **[PREPRINT]** arXiv only, no venue found
- **[SELF]** self-reported in a blog post, model card, README, or GitHub PR by the method's author
- **[3P]** third-party, single-author/single-run community benchmark (not peer-reviewed)

Baseline being refined ("conventional abliteration"): a difference-in-means (DIM) refusal direction r = mean(harmful activations) − mean(harmless activations) is computed and orthogonalized out of the weights that write to the residual stream (attention out-projection `o_proj` and MLP `down_proj`), i.e. W ← (I − r̂r̂ᵀ)W — [Heretic README](https://github.com/p-e-w/heretic); [Surgical Refusal Ablation, arXiv 2601.08489](https://arxiv.org/html/2601.08489) (writes the rank-one update as W′ = (I − γvvᵀ)W).

---

## 1. Projected abliteration (Jim Lai / "grimjim", Oct 2025)

### Takeaway
Projected abliteration removes from the refusal direction its component along the (unit-normalized) harmless-mean direction, so that only the part of r orthogonal to "compliance" is ablated. It is motivated by a geometric observation and by Zhao et al. (2025), but the original post reports **no quantitative metrics** [SELF]. A competing tool author initially found it converged to slightly worse scores, yet Heretic later made it the default for its directional-ablation path.

### Cited Findings
- **Date/source:** Hugging Face community article "Projected Abliteration," Jim Lai (grimjim), published **25 Oct 2025** [SELF] — [HF blog](https://huggingface.co/blog/grimjim/projected-abliteration)
- **Formula:** conventional r⃗ = μ⃗_H − μ⃗_A (μ_H = mean harmful/refusal activations, μ_A = mean harmless/acceptance activations). With μ̂_A unit-normalized, the projected direction is **r⃗_proj = r⃗ − (r⃗ · μ̂_A) μ̂_A**, i.e. the component of r orthogonal to the harmless mean — [HF blog](https://huggingface.co/blog/grimjim/projected-abliteration)
- **Rationale:** measured cosine similarities across layers of Gemma 3 12B Instruct showed the refusal direction aligned positively with the harmful mean and **negatively with the harmless mean**; the author interprets refusal as "a push toward refusal plus a push away from compliance," and treats the μ_A-parallel component as a possible confound (coupling, confound or sampling noise) whose removal should leave a more refusal-specific vector. The author explicitly acknowledges this is a theoretical argument, not a proof — [HF blog](https://huggingface.co/blog/grimjim/projected-abliteration)
- **Hyperparameters (Gemma 3 12B Instruct, 48 layers, repeating 5 local-attention + 1 global-attention blocks):** measurement at global-attention layers **23 and 29**; the layer-23 direction applied to layers **11–23**, the layer-29 direction to layers **24–41**; symmetric **Winsorization at the 0.995 percentile** of activations before Welford accumulation of means (found empirically, not optimized; without it conventional abliteration of Gemma 3 produced incoherent output); fp32 intermediate math, bf16 weights; activations measured on a 4-bit bitsandbytes quant and directions applied to full bf16 weights; batch size 32 — [HF blog](https://huggingface.co/blog/grimjim/projected-abliteration)
- Mistral-Nemo-Instruct-2407 (12B) was also measured at both 4-bit and full precision with closely tracking per-layer cosine similarities; Nemo did not need Winsorization (author attributes Gemma's need to GeGLU-related outliers) — [HF blog](https://huggingface.co/blog/grimjim/projected-abliteration)
- **Reported results:** qualitative only — refusal bypassed on harmful test prompts, while the model retained harm awareness (adds caveats/disclaimers while complying), which the author links to Zhao et al. 2025 (harmfulness and refusal encoded separately). No refusal rate, KL or benchmark numbers in the text — [HF blog](https://huggingface.co/blog/grimjim/projected-abliteration)
- **Dissent:** in the post comments, p-e-w (Heretic author) reported the idea **converged to slightly worse scores** in his optimization-based engine and questioned the theoretical justification — [HF blog comments](https://huggingface.co/blog/grimjim/projected-abliteration)
- **Later adoption:** Heretic's configuration now exposes `orthogonalize_direction` ("subtracts only the component of the refusal direction orthogonal to the good direction") with **default `true`** — [Heretic configuration docs](https://heretic-project.org/configuration); [config.default.toml](https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml)
- Implementation: `--projected` flag in `measure.py` and `sharded_ablate.py` of jim-plus/llm-abliteration ("orthogonalizes the refusal direction against the harmless direction"); off by default = conventional abliteration — [GitHub jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration)
- Precursor idea (orthogonalizing one refusal-related vector against another before ablation): Wang, Hu, Röttger, Plank, "Surgical, Cheap, and Flexible: Mitigating False Refusal in Language Models via Single Vector Ablation," ICLR 2025 [PEER] — extracts and ablates a "false refusal vector," training-free, claims reduced false refusal while preserving safety and capabilities; cited by grimjim as a reference — [arXiv 2410.03415](https://arxiv.org/abs/2410.03415); [HF blog](https://huggingface.co/blog/grimjim/projected-abliteration)

### Inferences
- Mathematically, projected abliteration is a rank-1 ablation of a different (orthogonalized) vector; when r has a large negative component along μ̂_A (as reported for Gemma 3), removing it shrinks the direction that gets ablated and should reduce disturbance of harmless activations' mean. This is the same "protect a reference direction" idea later generalized by SRA (ridge-residualizing r against many "concept atoms") and by ACE (reference-mean anchoring).
- Its standalone benefit is unproven quantitatively; the strongest evidence of value is indirect (Heretic adopting it as default after initially reporting slightly worse optimizer scores), and it is usually deployed only together with norm preservation (Section 2).

### Gaps
- No refusal-rate, KL or benchmark numbers isolate projection alone vs. conventional DIM. The UGI benchmark images linked in later comments were not readable.
- I found no Heretic changelog explaining why `orthogonalize_direction` became default (no quantified ablation of on vs. off).

---

## 2. Norm-preserving biprojected abliteration / MPOA (grimjim, Nov 2025)

### Takeaway
"Norm-preserving biprojected abliteration," renamed **Magnitude-Preserving Orthogonal Ablation (MPOA)** on 18 Nov 2025, combines (a) projected directions (also re-projected against the *target* layer's harmless direction when a direction measured at one layer is applied at another) with (b) a magnitude/direction decomposition of each weight row so that rank-1 ablation acts only on row directions and original row L2 norms are restored. The only quantitative evidence from the author is one UGI Leaderboard row on Gemma-3-12B (UGI 32.61 vs. 32.08 for standard abliteration; NatInt 21.33 vs. 18.64 standard and 18.72 base) [SELF]. Heretic independently implemented both components as defaults, but no peer-reviewed replication exists.

### Cited Findings
- **Dates:** blog "Norm-Preserving Biprojected Abliteration" published **6 Nov 2025** [SELF] — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration). Renamed to **MPOA** in a HF post dated **18 Nov 2025**, a rename only, with no technical change; the author claims it "potentially unlocks reasoning capacity previously occupied with safety refusal processing" — [HF post](https://huggingface.co/posts/grimjim/803126534676334)
- **Biprojection:** beyond projected abliteration, when the refusal direction is measured at one layer and applied to another, the component along the *target* layer's harmless direction is also removed, to avoid disturbing the harmless direction there. The blog notes some refusal returned under this method (before norm preservation was added) — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- **Norm-preserving math (as written):** r ∈ ℝ^{d_out} (biprojected), scale α ∈ [0,1]:
  1. r̂ = r/‖r‖₂
  2. Row magnitudes m_i = ‖W_{i,:}‖₂; row directions Ŵ_{i,:} = W_{i,:}/‖W_{i,:}‖₂; M = diag(m_1…m_{d_out}), Ŵ = M⁻¹W
  3. p = r̂ᵀŴ ∈ ℝ^{d_in}; Ŵ_ablated = Ŵ − α·r̂pᵀ; Ŵ_new = normalize(Ŵ_ablated, dim=1)
  4. W_new = M·Ŵ_new (each row keeps its original ℓ2 norm)
  Applied to `self_attn.o_proj` and `mlp.down_proj` — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- **Stated motivations** (author's claims about conventional abliteration): the subtracted direction contains a magnitude component as well as a directional one; subtraction ignores relative neuron importance, causing unpredictable scale effects; it disturbs weight-matrix geometry unpredictably. The author suggests magnitude preservation matters for Gemma 3 because high-magnitude outliers likely encode important behavior (citing Sun et al. 2024, "Massive Activations") — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- **Layer-selection heuristic:** directions measured at all layers in one pass; scored by SNR = ‖r‖ / max(‖harmful_mean‖, ‖harmless_mean‖), cosine dissimilarity = 1 − cos(harmful_mean, harmless_mean), and **quality = SNR × (1 − cos_sim)**; plus cross-layer cosine stability. Author calls this heuristic, "partly empirical and bespoke" — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- **Setup (Gemma-3-12B-it, layers 0–47):** measurement layers 23 and 29; ablated layers **11–41** at scale factor **1.0**; magnitude sparsification at 0.995 during measurement; fp32 intermediates; measured on 4-bit bnb quant, assembled on bf16; per author comment, the layer-29 direction was ablated across 11–41 and sparsity 0.001 was applied to layers 35–41 ("may not have been necessary") — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- **Reported results (UGI Leaderboard)** [SELF]:

  | Gemma-3-12B variant | UGI | NatInt |
  |---|---|---|
  | Base instruct | 19.58 | 18.72 |
  | Standard abliterated | 32.08 | 18.64 |
  | Norm-preserved biprojected | **32.61** | **21.33** |

  No KL, refusal rate, W/10 or other benchmarks reported — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- The author frames the NatInt gain as a possible removal of the "Safety Tax" (Huang et al. 2025, arXiv 2503.00555) and flags it as needing more investigation; cites the Hydra effect (McGrath et al. 2023) to justify editing many layers ("rank-2L intervention across L targeted layers"); notes the number of edited layers works as a crude compliance/safety knob (fewer layers → more self-repair → more refusal retained) — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- Author comment: the harmless direction was treated as a "boundary condition to clamp to"; both projection and magnitude preservation aim to minimize perturbation near it — [HF blog comments](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- **Repo caveat:** `--normpreserve` flag in `sharded_ablate.py`; README warns "some models may not respond well to norm preservation"; README reports no benchmark results — [GitHub jim-plus/llm-abliteration](https://github.com/jim-plus/llm-abliteration)
- **Later model cards (no metrics):** grimjim/Nemo-Instruct-2407-MPOA-v2-12B applies MPOA to `mlp.down_proj` and `self_attn.o_proj` on "many of the layers," states "Compliance was not maximized," the model "appears to be near an edge of chaos with regard to some safety refusals"; no benchmarks/KL/refusal reported [SELF] — [HF model card](https://huggingface.co/grimjim/Nemo-Instruct-2407-MPOA-v2-12B)
- **Third-party adoption without numbers:** Arli AI's GLM-4.6-Derestricted-v3 uses the method and claims it avoids the "Safety Tax" and maintains reasoning, but shows no benchmarks for the derestricted model (benchmark chart on the card is the original GLM-4.6's) [SELF/3P, unverified] — [HF model card](https://huggingface.co/ArliAI/GLM-4.6-Derestricted-v3)
- **Independent re-implementation:** Heretic's directional-ablation path now has `row_normalization` = `"none"` / `"pre"` (LoRA relative to row-normalized weights) / `"full"` (renormalize to preserve original row magnitudes), default `"full"`, implemented as a **rank-3 LoRA approximation** (`full_normalization_lora_rank = 3`), plus `orthogonalize_direction = true`; README credits Lai for both projected and norm-preserving biprojected abliteration — [Heretic configuration](https://heretic-project.org/configuration); [config.default.toml](https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml); [Heretic README](https://github.com/p-e-w/heretic)
- A community model card describes a "V2" built with "traditional directional abliteration (orthogonalize_direction + full row normalization, rank-3 LoRA merged into full BF16 weights)" after a V1 built with ARA — [search result summary referencing HF model card brainnxdomain/Hemmingway-1-Heretic-MTP-GGUF-V2](https://huggingface.co/brainnxdomain/Hemmingway-1-Heretic-MTP-GGUF-V2)
- In a Heretic PR discussion, contributor kabachuha ranked methods **MPOA < SOMPOA < ARA** (i.e. MPOA weakest of the three) [SELF/3P, informal] — [Heretic PR #211](https://github.com/p-e-w/heretic/pull/211)
- A third-party benchmark of Qwen3.5-4B abliterations explicitly states "Heretic's MPOA and ARA methods were not tested" — [DreamFast benchmark](https://friendli.ai/models/DreamFast/Qwen3.5-4B-Uncensored-HauhauCS-Aggressive-Safetensor-Benchmark)

### Inferences
- (Own math check) Because each row of Ŵ_ablated is renormalized by a *different* factor, r̂ᵀW_new is in general **not exactly zero**: MPOA trades exact orthogonality to r̂ for norm preservation (and Heretic further approximates it with a rank-3 LoRA). It is therefore not a strict projection, which may explain why some refusal can survive and why tools pair it with optimization over layer weights.
- The evidence for MPOA's capability retention is thin: one leaderboard row on one model (single run, self-reported, UGI/NatInt is a private benchmark), with the "NatInt above base" result plausibly within run-to-run noise. Its broad adoption (Heretic default, Arli AI, many HF model cards) reflects practitioner consensus rather than controlled evidence.
- For ranking: MPOA is best thought of as a low-cost "hygiene" modification of DIM abliteration (protects harmless direction + preserves row norms) that composes with better direction-finding (SOM/multi-direction) and better layer/strength selection (Heretic optimization), rather than a stand-alone state of the art.

### Gaps
- No peer-reviewed or controlled replication of the UGI/NatInt result; no KL-divergence or refusal-count numbers for MPOA vs. DIM on the same model/prompts.
- No ablation separating biprojection's effect from norm preservation's effect.
- The precise meaning of "some refusal returned" under biprojection-without-norm-preservation is not quantified.

---

## 3. Multi-direction / geometric approaches (concept cones, RDO, RepInd, SOM, SVD, Gabliteration)

### Takeaway
Peer-reviewed work now establishes that refusal is mediated by **multi-dimensional cones/subspaces** (up to 5-D cones; Wollschläger et al., ICML 2025) and that ablating **several** directions can greatly raise attack success over single-DIM ablation (SOM multi-direction ablation, AAAI 2026: e.g. Llama-3-8B HarmBench ASR 88.05 vs 15.09 for single direction). Gradient-optimized single directions (RDO) give roughly equal ASR to DIM but **fewer side effects** (e.g., TruthfulQA error cut ~40%). Simpler SVD-based multi-direction (Gabliteration, preprint) shows lower KL than DIM on most of 8 small models, with exceptions. A March 2026 negative result shows direction quality depends heavily on the contrast set (topic-matched harmless prompts fail).

### Cited Findings
**Wollschläger et al. — "The Geometry of Refusal in LLMs: Concept Cones and Representational Independence"** (Wollschläger, Elstner, Geisler, Cohen-Addad, Günnemann, Gasteiger; arXiv v1 24 Feb 2025, v2 8 Feb 2026; **ICML 2025** [PEER]) — [arXiv](https://arxiv.org/abs/2502.17420); venue per [ML Anthology / ICML listing search](https://mlanthology.org/authors/w/wollschlager-tom/)
- **RDO loss:** L = λ_abl·L_ablation + λ_add·L_addition + λ_ret·L_retain, where L_ablation = CE(f_ablate(r)(p_harm), t_answer) (ablated model should answer harmful prompts); L_addition = CE(f_add(αr̂, l_add)(p_safe), t_refusal) (adding the direction should induce refusal on harmless prompts); L_retain = KL(f_ablate(r)(p_safe) ‖ f(p_safe)) over the last 30 tokens (ablation should not change harmless outputs). Hyperparameters: λ_abl = 1.0, λ_add = 0.2, λ_ret = 1.0; AdamW lr 0.01, wd 0, batch 16, grad-accum 16. ASR > 80% across λ_abl = 1 − λ_add ∈ [0.2, 0.8] on Llama-3-8B — [arXiv HTML](https://arxiv.org/html/2502.17420v2)
- **Refusal cones:** optimized orthonormal basis (Gram–Schmidt after each step), losses on Monte Carlo samples in the positive orthant of the cone; **cones up to 5 dimensions** mediate refusal across all tested models; Gemma 2 2B degrades at dim 5 (4-D cone used; ASR plateaus at 4 dims); smaller Qwen 2.5 models degrade faster with dimension — [arXiv HTML](https://arxiv.org/html/2502.17420v2)
- **Representational independence (RepInd):** two directions are RepInd if, at every layer in a set, the cosine similarity of activations with each direction is unchanged when the other is ablated (ablation reapplied each layer, capturing non-linear downstream effects). Loss averages squared cosine changes at the last token over the first 90% of layers, λ_ind = 200. Motivation: orthogonal RDO and DIM directions still affected each other's representations in later layers, so **orthogonality ≠ independence under intervention**. Ablating the top-k RepInd directions raises ASR monotonically on Gemma 2 2B and **surpasses DIM at k ≥ 4** — [arXiv HTML](https://arxiv.org/html/2502.17420v2)
- **ASR (directional ablation / activation subtraction), RDO vs DIM:** mixed — e.g., Llama 3 8B JailbreakBench DIM 79.7/74.1 vs RDO 80.3/79.0; StrongREJECT 81.5/81.4 vs 83.8/84.7; Gemma 2 9B StrongREJECT (subtraction) DIM 82.7 vs RDO 75.4; Qwen 2.5 14B JailbreakBench 76.2/66.6 vs 75.7/75.6 — [arXiv HTML](https://arxiv.org/html/2502.17420v2)
- **Side effects:** TruthfulQA (DIM / RDO / base): Gemma 2 2B 47.8 / 51.4 / 55.8; Gemma 2 9B 52.8 / 56.7 / 61.1; Llama 3 8B 48.7 / 51.0 / 52.8; Qwen 2.5 14B 63.3 / 67.9 / 70.8 — **~40% average reduction in TruthfulQA error** induced by ablation. Qwen 2.5 14B (base / DIM / RDO): MMLU 76.9 / 75.7 / 76.6; ARC-C 52.8 / 51.4 / 52.2; GSM8K 81.7 / 80.2 / 81.3. Llama 3 8B MMLU drop −2.6% (DIM) vs −0.1% (RDO). No standalone KL/perplexity values reported — [arXiv HTML](https://arxiv.org/html/2502.17420v2)
- Models: Gemma 2 2B/9B, Llama 3 8B, Qwen 2.5 1.5B/3B/7B/14B (instruct) — [arXiv HTML](https://arxiv.org/html/2502.17420v2)

**Piras et al. — "SOM Directions are Better than One: Multi-Directional Refusal Suppression in Language Models"** (Piras, Mura, Brau, Oneto, Roli, Biggio; arXiv 11 Nov 2025; **AAAI 2026** [PEER]) — [arXiv](https://arxiv.org/abs/2511.08379)
- Method: train a 4×4 hexagonal **Self-Organizing Map** (16 neurons, 10,000 iterations) on 4,000 harmful SorryBench prompt representations; each neuron minus the harmless centroid (6,000 Alpaca prompts) = a candidate refusal direction; authors argue DIM is a special case of a SOM. Select a subset of k ∈ {2..7} directions by Bayesian optimization (Optuna TPE; 128 trials for k ≤ 3, 512 for k > 3; 25% random start), objective = HarmBench validation ASR judged by HarmBench-Llama-2-13B-cls. Each direction applied as Π_r(x) = x − x r̂r̂ᵀ, composed sequentially at every layer; directions are **not orthonormalized** — [arXiv HTML](https://arxiv.org/html/2511.08379v2)
- Layer l* chosen where single-direction ablation most reduces refusal-token probability (e.g., Llama3-8B 11/32, Gemma2-9B 23/42, Qwen2.5-7B 18/28) — [arXiv HTML](https://arxiv.org/html/2511.08379v2)
- **HarmBench ASR, multi-direction (MD best) vs single-direction DIM (SD) vs RDO vs GCG vs SAA:** Llama2-7B 59.11 / 0.0 / 1.25 / 32.70 / 57.90; **Llama3-8B 88.05 / 15.09 / 32.07 / 1.90 / 91.20**; Qwen-14B 91.82 / 74.84 / 45.91 / 82.40 / 83.01; Qwen2.5-7B 95.97 / 77.98 / 76.10 / 38.36 / 94.30; Gemma2-9B 96.27 / 38.93 / 91.82 / 5.03 / 93.71; Mistral-7B-RR (circuit-breaker defended) 25.79 / 5.03 / 1.25 / 0.6 / 1.6. MD beats SD and RDO on all 8 models; beats GCG/SAA except Llama3-8B (SAA 91.20) — [arXiv HTML](https://arxiv.org/html/2511.08379v2)
- ASR vs number of directions: Llama3-8B 0 → 82.38 (k=2) → 88.05 (k=7); Llama2-7B 0 → 7.5 (k=2) → 59.11 (k=7); most models saturate by k ≈ 3–5 — [arXiv HTML](https://arxiv.org/html/2511.08379v2)
- Note: authors could not reproduce Arditi et al.'s 22.60 SD ASR on Llama2-7B (got 0.0) — [arXiv HTML](https://arxiv.org/html/2511.08379v2)
- Utility metrics (MMLU/KL) not found in the portion read — [arXiv HTML](https://arxiv.org/html/2511.08379v2)
- SOM multi-direction was ported to Heretic by contributor kabachuha (PR #196, "SOMA"; "SOMPOA" = SOM + MPOA), described by p-e-w as ARA's "only serious competitor" — [Heretic PR #211](https://github.com/p-e-w/heretic/pull/211)

**Gülmez — "Gabliteration: Adaptive Multi-Directional Neural Weight Modification for Selective Behavioral Alteration in LLMs"** (arXiv 2512.18901, ~23 Dec 2025 [PREPRINT]) — [HF papers](https://huggingface.co/papers/2512.18901)
- Directions: SVD of the paired harmful−harmless hidden-state difference matrix, top-k right singular vectors (recommend **k = 2**, range 1–3). Projection: **ridge-regularized P = R(RᵀR + λI)⁻¹Rᵀ**, λ = 0.1 (0.05–0.2). Update on `o_proj`/`down_proj`: **W ← W − α_ℓ(WP)**. Adaptive per-layer scale **α_ℓ = α_base(1 + β[1 − |ξ_ℓ|])**, α_base = 0.3, β = 0.5 (middle layers scaled more than boundary layers). Layers scored by ‖harmful mean − harmless mean‖; kept if refusal rate < τ = 0.8 — [HF papers](https://huggingface.co/papers/2512.18901)
- **Table 1 (refusal % / KL), Gabliteration vs DIM abliteration:** Qwen3-4B-Instruct 4/0.1522 vs 21/0.4300; Qwen3-4B-Thinking 3/0.0014 vs 4/0.0500; Gemma-3-1B 3/0.2922 vs 3/0.4300; Qwen3-0.6B 3/0.0127 vs 6/0.0957; Llama-3.2-1B 7/0.0038 vs 8/0.0230; HY-MT1.5-1.8B 4/0.0029 vs 15/0.0573; **Granite-3.3-2B 6/0.0030 vs 4/0.2100** (worse refusal); **Nanbeige4-3B 8/0.0074 vs 11/0.0024** (worse KL). Adaptive scaling claimed 12–18% better than uniform (p < 0.001); SVD vs Fisher LDA not significantly different. No standard benchmarks; internal inconsistencies (theorem numbering, 1.3× vs 1.5× middle-layer scale) — [HF papers](https://huggingface.co/papers/2512.18901)
- Independent cross-check (Qwen3-4B-Instruct-2507, kabachuha comparison in Heretic PR): original 100/100 refusals; SOMbliterated 3/100, KL 0.08; heretic-org 5/100, KL 0.07; **gabliterated 4/100, KL 0.25**; ARA entry 8/100, KL 0.14 (row mislabeled) [3P, informal] — [Heretic PR #211](https://github.com/p-e-w/heretic/pull/211)

**Other multi-direction evidence**
- Joad, Hawasly, Boughorbel, Durrani, Sencar, "There Is More to Refusal in LLMs than a Single Direction" (arXiv 2 Feb 2026, v2 15 Sep 2026; **accepted EMNLP 2026 main** [PEER]): different refusal/non-compliance categories correspond to geometrically distinct directions, yet steering along any of them gives **nearly identical refusal–over-refusal trade-offs** ("a shared one-dimensional control knob"); directions mainly change *how* the model refuses, not *whether*; SAEs reveal a shared core of refusal latents plus style/domain-specific ones — [arXiv](https://arxiv.org/abs/2602.02132)
- Petrov, "On the Failure of Topic-Matched Contrast Baselines in Multi-Directional Refusal Abliteration" (arXiv 23 Mar 2026 [PREPRINT]; Qwen 3.5 2B hybrid GatedDeltaNet model; per-class SOM directions, evolutionary per-direction weight optimizer built on Piras et al. and Heretic): **topic-matched harmless contrasts produced no functional refusal directions at any weight (0.3–1.2) on any layer** (refusals stayed 9–10/10; with SVD 10/10), whereas **unmatched bulk contrast (400 harmless_alpaca prompts) reached 0 refusals on six layers** — layers 9/14/15 at w = 0.5 with KL ≈ 0.005; layers 11–13 at w = 0.8 with KL 0.019–0.046. Explanation offered: matching topics cancels the large topic-distance component, leaving a small-norm difference below the threshold where weight projection changes the residual stream; SVD further dilutes it. Single architecture and corpus — [arXiv HTML](https://arxiv.org/html/2603.22061v1)
- Labunets, "Refusal geometry reflects refusal training: diverse refusal prefixes can raise stable rank and weaken refusal vector ablation attacks" (arXiv 26 Aug 2026 [PREPRINT]; OLMo-2-0425-1B-Instruct + synthetic fine-tuning): low-dimensional refusal structure arises from first-token refusal-completion losses; repetitive refusal starts concentrate gradients into a low-dim subspace; **diverse refusal starts raise stable rank and make single-vector ablation less effective** — [arXiv](https://arxiv.org/abs/2608.25390)
- LessWrong, "Exploring the multi-dimensional refusal subspace in reasoning models" (27 Oct 2025, NICT internship [SELF/informal]): HDBSCAN clustering of ~1,271 harmful prompts → per-cluster DIM → 12 directions (pairwise cos ≈ 0.3) → min-cosine selection (more efficient than SVD); single direction insufficient for Qwen3 8B/14B while multiple directions reduce refusal (qualitative); MMLU (0-shot, 100 samples) not significantly degraded except Qwen3-14B (attributed to fp16 vs fp32) — [GreaterWrong mirror](https://www.greaterwrong.com/posts/ixJrmYrgHM4TenN7D/exploring-the-multi-dimensional-refusal-subspace-in-1)

### Inferences
- Rank ordering on *efficacy* (refusal removal) from peer-reviewed evidence: SOM multi-direction (selected by BO) > RDO ≈ DIM single direction, with the gap largest on strongly aligned models (Llama-3-8B, Llama-2-7B, Gemma2-9B). On *side effects*, RDO's explicit KL retain term gives measurable gains over DIM; SOM paper does not report utility in what I read, so multi-direction's capability cost is under-documented.
- Multi-direction ablation should be paired with an explicit retain/KL constraint (as in RDO or Heretic's KL objective); otherwise ablating k directions likely increases collateral damage roughly with k. This is an inference, not a measured result in these papers.
- Contrast-set design (unmatched, topically broad harmless prompts) is a first-order factor: "cleaner" topic-matched directions can be too small in norm to work.
- Models trained with diverse refusal openings (Labunets) or circuit breakers (Mistral-7B-RR: 25.79% max ASR) are where single-direction abliteration fails first; multi-direction or optimization-based edits are needed there.

### Gaps
- No peer-reviewed head-to-head of multi-direction ablation vs MPOA vs Heretic's optimized single direction on shared KL + benchmark metrics.
- SOM paper utility metrics (MMLU, KL) not located in the text read (possibly in appendix).
- Joad et al.'s quantitative results (per-category directions' ablation numbers) not available from abstract.

---

## 4. Direction-selection improvements: COSMIC, per-layer vs global direction, token positions, layer choice, scaling/partial ablation, layer-dependent weights

### Takeaway
Direction/layer selection has moved from Arditi's substring-matching selection of one (position, layer) direction applied uniformly to (a) output-free cosine-similarity selection (COSMIC, ACL Findings 2025), (b) per-layer directions with a fractional `direction_index` and a parameterized **layer-dependent ablation-weight kernel** optimized by TPE against refusals + KL (Heretic), and (c) adaptive/heuristic per-layer scaling (Gabliteration, grimjim's SNR×dissimilarity). The best-documented quantitative gain is Heretic's Gemma-3-12B result: same 3/100 refusals as other abliterations at **KL 0.16 vs 0.45–1.04** [SELF].

### Cited Findings
**COSMIC** (Siu et al., arXiv 30 May 2025; reported as Findings of ACL 2025 [PEER per search result]) — [arXiv HTML](https://arxiv.org/html/2506.00085); venue per [search listing](https://arxiv.org/pdf/2506.00085)
- Candidates: DIM vectors r(i,l) for post-instruction positions i ∈ {−5,…,−1} and every layer l (5L candidates), using layer inputs — [arXiv HTML](https://arxiv.org/html/2506.00085)
- Layer set ℒ_low = the **10% of layers with lowest cosine similarity** between harmful and harmless activations (plus filters: median peak filtering, excluding high-KL directions and late layers) — [arXiv HTML](https://arxiv.org/html/2506.00085)
- Score: intervene (ablation or addition) and collect first-output-token activations at layers in ℒ_low; S_refuse = cos(ā₊, b̄) (harmless+induced refusal vs harmful baseline), S_comply = cos(ā, b̄₋) (harmless baseline vs harmful with refusal ablated); choose argmax (S_refuse + S_comply). **No output text / refusal-string matching needed** — [arXiv HTML](https://arxiv.org/html/2506.00085)
- Works with both linear concept erasure (multi-layer directional ablation / addition) and ACE (single-layer affine edit, α = 0 ablation / α = 1 addition) — [arXiv HTML](https://arxiv.org/html/2506.00085)
- Results: selection "generally competitive" with substring-matching selection and "occasionally inferior"; selected position/layer matches the original in **10 of 12** validation-only cases; Appendix F reports "no significant differences" on GPQA/ARC/TruthfulQA. Main advantage = works in adversarial settings and weakly aligned models where refusal templates are unavailable — [arXiv HTML](https://arxiv.org/html/2506.00085)
- Models: Llama-3.1-70B/8B, Meta-Llama-3-8B, Qwen2.5-72B/7B, Gemma-2-27B/9B, Gemma-7B — [arXiv HTML](https://arxiv.org/html/2506.00085)
- Contrast: a Sep 2026 paper cautions cosine similarity between refusal directions can be unreliable for cross-architecture transfer — [arXiv 2609.04721 (search summary)](https://arxiv.org/pdf/2609.04721)

**Heretic** (p-e-w / Philipp Emanuel Weidmann; GitHub, 2025–2026 [SELF])
- Per-layer residual directions = DIM of **first-token** residuals for harmful vs harmless prompts; `direction_index` is a float that **linearly interpolates between the two nearest per-layer directions** (or "per layer"); ablation-weight kernel over layers parameterized by `max_weight`, `max_weight_position`, `min_weight`, `min_weight_distance`; **separate parameters for attention vs MLP** ("MLP interventions tend to be more damaging"); Optuna TPE co-minimizes refusal count and KL divergence from the original model — [Heretic README](https://github.com/p-e-w/heretic)
- Defaults: harmless = mlabonne/harmless_alpaca train[:400], harmful = mlabonne/harmful_behaviors train[:400]; KL on harmless_alpaca test[:100]; refusals via 33 keyword markers on harmful_behaviors test[:100]; max_response_length 100; n_trials 100 / 30 startup in config file vs 200 / 60 in docs; `kl_divergence_target` = 0.01 (below it objective switches to refusals), `kl_divergence_scale` = 1.0; `winsorization_quantile` = 1.0 (disabled; lower values tame "massive activations") — [config.default.toml](https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml); [Heretic configuration docs](https://heretic-project.org/configuration)
- **Gemma-3-12B-it head-to-head (refusals/100 on harmful; KL on harmless)**: original 97/100, 0; mlabonne abliterated-v2 3/100, **1.04**; huihui-ai abliterated 3/100, **0.45**; **p-e-w heretic 3/100, 0.16** (PyTorch 2.8, RTX 5090; values may vary by hardware) [SELF] — [Heretic README](https://github.com/p-e-w/heretic)
- Heretic credits Labonne's gemma-3-12b-it-abliterated-v2 for **non-constant (layer-dependent) ablation weights** — [Heretic README](https://github.com/p-e-w/heretic)
- Per-layer ablation weights tuned via Optuna have become a standard research setup (e.g., used in "Mechanisms of Introspective Awareness," arXiv 2603.21396) — [search summary](https://arxiv.org/pdf/2603.21396)

**Token position choice**
- Zhao et al. distinguish **t_inst** (last instruction token → harmfulness direction) from **t_post-inst** (last post-instruction/template token → refusal direction); prior refusal-direction work used t_post-inst. Removing post-instruction tokens dropped Llama3 AdvBench refusal from **96.0% to 58.9%** — [arXiv HTML 2507.11878](https://arxiv.org/html/2507.11878)
- COSMIC searches the last 5 post-instruction positions; Heretic uses the first generated token's residual — [COSMIC](https://arxiv.org/html/2506.00085); [Heretic README](https://github.com/p-e-w/heretic)

**Layer choice / measurement vs intervention layers**
- grimjim: measure at a few high-quality layers (SNR × (1 − cos)), apply each to a span of layers (Gemma-3-12B: measure 23 & 29; apply 11–41); more edited layers counter the Hydra self-repair effect; fewer layers retain more refusal — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- jim-plus README: look at "middle to late-middle layers" for candidate sources; YAML supports multiple source layers and per-destination-layer strategies — [GitHub](https://github.com/jim-plus/llm-abliteration)
- SOM paper: single ablation layer l* chosen by largest refusal-token-probability drop under single-direction ablation; directions then applied at every layer — [arXiv HTML](https://arxiv.org/html/2511.08379v2)
- SRA suggests layers 15–25 and layer-wise strength γ_ℓ ∝ ‖a_ℓ(dec)‖₂ (norm of a "deception" concept atom) — [arXiv HTML](https://arxiv.org/html/2601.08489)

**Scaling factor / partial ablation (α ≠ 1)**
- grimjim's MPOA exposes α ∈ [0,1] (`scale_factor`), used at 1.0; jim-plus `--invert` switches ablation to addition — [HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration); [GitHub](https://github.com/jim-plus/llm-abliteration)
- Gabliteration α_base = 0.3 with middle-layer boost (β = 0.5) — [HF papers](https://huggingface.co/papers/2512.18901)
- Petrov: weight sweep 0.3–1.2; w = 0.5 sufficient at best layers (KL ≈ 0.005), w = 0.8 at others — [arXiv HTML](https://arxiv.org/html/2603.22061v1)
- Heretic's kernel lets weights vary per layer (min/max weight), effectively partial ablation per layer — [Heretic README](https://github.com/p-e-w/heretic)

### Inferences
- Optimization-based, per-layer-weighted ablation (Heretic-style) has the strongest *quantified* KL improvement over hand-tuned abliteration at matched refusal rate (~3–6× lower KL on Gemma-3-12B), though from the tool author. COSMIC is chiefly a robustness/automation improvement (no output-text heuristics), not an efficacy improvement.
- A single global direction at uniform α = 1 across all layers is no longer best practice; strength should taper across layers and be tuned against a KL budget.

### Gaps
- No peer-reviewed study isolating the effect of the layer-weight kernel vs per-layer directions vs fractional direction index.
- COSMIC's exact ASR values vs Arditi baseline are in figures not extracted.

---

## 5. Affine Concept Editing (ACE) and harmfulness-vs-refusal separation

### Takeaway
ACE (Marshall, Scherlis, Belrose, 2024) replaces "project out r" (implicitly treating the origin as "no refusal") with "project out r, then add back the reference (harmless) mean's component along r," which standardizes behavior across prompts and fixed incoherence where pure ablation failed (RWKV). Zhao et al. (2025) show harmfulness (at the instruction token) and refusal (at the post-instruction token) are distinct directions (cos ≈ 0.1 on Llama2); ablating the refusal direction removes refusal without removing the model's harmfulness judgment, which is consistent with grimjim's observation that projected-abliterated models still add caveats.

### Cited Findings
- **ACE** (Marshall, Scherlis, Belrose; arXiv 13 Nov 2024, v3 28 Jan 2025 [PREPRINT]; code EleutherAI/steering-llama3) — [arXiv](https://arxiv.org/abs/2411.09003)
  - Directional ablation: v′ = v − proj_r(v). Arditi variant with mean reinserted: v′ = v − proj_r(v) + r. **ACE: v′ = v − proj_r(v) + proj_r(r⁻) + α·r**, r = r⁺ − r⁻; the term proj_r(r⁻) anchors α = 0 to the mean of non-refusal activations r⁻ and α = 1 to the refusal mean r⁺ — [arXiv HTML](https://arxiv.org/html/2411.09003v3)
  - Rationale: the origin is not a meaningful "behavior absent" point; activations are far from zero, so pure projection lands at an unpredictable location. On Hermes Eagle RWKV v5, **directional ablation produced nonsense, ACE at α = 0 produced coherent text**; on Llama 3 8B (layer 15) ACE is "nearly perfectly standardized" at α = −0.5 and 1.5 whereas CAA-only steering's refusal probability depends on the prompt. Mostly qualitative, no aggregate refusal/coherence tables — [arXiv HTML](https://arxiv.org/html/2411.09003v3)
  - Models: Llama 3 8B/70B Instruct, Qwen 1.8B/7B/14B/72B, Yi 6B/34B, Gemma 2B/7B, RWKV v5 — [arXiv HTML](https://arxiv.org/html/2411.09003v3)
  - COSMIC uses ACE as one of its two intervention families (single layer) — [COSMIC](https://arxiv.org/html/2506.00085)
- **Zhao, Huang, Wu, Bau, Shi — "LLMs Encode Harmfulness and Refusal Separately"** (arXiv 16 Jul 2025, v5 6 Jul 2026 [PREPRINT; no venue listed]) — [arXiv](https://arxiv.org/abs/2507.11878)
  - v_harmful = μ_harmful − μ_harmless at **t_inst**; v_refuse = μ_refuse − μ_accept at **t_post-inst**; cosine similarity between them ≈ **0.1** on Llama2 — [arXiv HTML](https://arxiv.org/html/2507.11878)
  - Steering harmless prompts along the harmfulness direction on Llama3-8B yields **94% refusal at layer 9**; refusal direction yields **100% at layer 11**. Steering along the refusal direction did *not* reverse the model's harmfulness judgment (reply-inversion task). Some jailbreaks reduce refusal signals without changing harmfulness belief; adversarial fine-tuning barely changes the harmfulness representation — [arXiv HTML](https://arxiv.org/html/2507.11878); [arXiv abstract](https://arxiv.org/abs/2507.11878)
  - The harmfulness representation is proposed as a "Latent Guard" comparable to or better than Llama Guard 3 8B — [arXiv abstract](https://arxiv.org/abs/2507.11878)
  - The paper does not recommend which direction to ablate — [arXiv HTML](https://arxiv.org/html/2507.11878)
- grimjim cites Zhao et al. as rationale for projecting out only the "mechanistically relevant" refusal component, and observes the abliterated Gemma retains harm awareness (caveats/disclaimers) — [HF blog projected](https://huggingface.co/blog/grimjim/projected-abliteration); [HF blog NPBA](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- grimjim also cautions that removing even the harmfulness-entangled direction could reduce safety in unprincipled ways, citing Korznikov et al. 2025 ("The Rogue Scalpel," arXiv 2509.22067) — [HF blog NPBA](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)

### Inferences
- For refusal removal with minimal collateral damage, the evidence favors targeting the **refusal** direction (t_post-inst / first generated token) rather than the harmfulness direction (t_inst): the refusal direction is behavior-proximal, and removing it leaves the model's harm judgment intact (hence caveats). Ablating the harmfulness direction would change what the model *considers* harmful, a broader edit.
- ACE and projected abliteration share the same principle (don't move harmless activations' mean along r); ACE does it exactly at runtime with an affine offset, whereas weight-orthogonalization cannot add a bias without a bias term, so projection against μ_A is a weight-only approximation of this idea (inference).

### Gaps
- No quantitative head-to-head of ACE vs directional ablation on refusal rate + KL + benchmarks found; ACE has not (as far as found) been baked into weights in popular abliteration tools.

---

## 6. Other variants: spectral cleaning, ARA, sparse/head-level, SAE-feature, low-rank, 2026 work

### Takeaway
The most notable 2026 directions are (1) **cleaning the DIM vector** against protected concept directions (Surgical Refusal Ablation: first-token KL 0.016–0.044 vs 0.62–2.09 for standard ablation at similar or better refusal on 5 models [PREPRINT]) and (2) **direction-free, per-module optimization** (Heretic's Arbitrary-Rank Ablation, ARA, merged Sep 2026 as Heretic's default modifier [SELF]). Head-level and SAE-feature ablation remain mostly analysis tools; SAE-based refusal steering degrades unrelated benchmarks.

### Cited Findings
**Surgical Refusal Ablation (SRA)** — Tony Cristofano, arXiv 2601.08489, 13 Jan 2026 [PREPRINT] — [arXiv](https://arxiv.org/abs/2601.08489)
- Builds a registry of "concept atoms" a_ℓ(k) = μ_ℓ(D₊(k)) − μ_ℓ(D₋(k)) (~10–15 prompts per set) for protected capabilities ("Shield") and stylistic confounds ("Confound"); dirty vector r^dirty = μ(D_harm) − μ(D_safe); **ridge residualization** ŵ = argmin_w ‖r^dirty − A_SC w‖² + λ‖w‖², r̃ = r^dirty − A_SC ŵ (λ not reported); rank-one update W′ = (I − γvvᵀ)W with v = r̃/‖r̃‖, γ_ℓ ∝ ‖a_ℓ(dec)‖₂; suggested layers 15–25; iterative passes adding still-refused prompts as hard negatives — [arXiv HTML](https://arxiv.org/html/2601.08489)
- Results (refusal / ΔPPL WikiText-2 / first-token KL), Standard vs SRA [self-evaluated]: Qwen3-VL-2B 0.0% / +1.568 / 0.622 vs 0.0% / +0.028 / 0.018; **Qwen3-VL-4B 0.0% / +0.431 / 2.088 vs 0.0% / −0.024 / 0.044**; Qwen3-VL-8B 42.0% / +0.658 / 1.337 vs 2.0% / +0.004 / 0.016; Ministral-3B 0.0% / +0.050 / 0.097 vs 2.0% / +0.060 / 0.018; Ministral-14B 12.0% / +1.000 / 0.723 vs 0.0% / +0.040 / 0.026. GSM8K/MBPP teacher-forced perplexity changes small (e.g., Qwen3-VL-4B GSM8K +0.037, MBPP −0.260). Caveats: automated rubric, finite prompt suite, perplexity/KL not a substitute for downstream evals, curated atom registry — [arXiv HTML](https://arxiv.org/html/2601.08489)

**Arbitrary-Rank Ablation (ARA)** — p-e-w (Weidmann 2026), Heretic PR #211 opened 4 Mar 2026; closed 4 Sep 2026 as superseded by #446 (ARA re-implemented as a modifier plugin, merged; squash-merge on master 1 Oct 2026; Heretic version 2.0.0.dev0) [SELF] — [Heretic PR #211](https://github.com/p-e-w/heretic/pull/211)
- Uses **no refusal directions**: captures each module's input/output tensors via hooks and solves unconstrained per-module matrix optimization with three goals: harmless outputs change minimally; harmful outputs move toward the harmless cluster (each harmful output attracted toward its k nearest harmless outputs, `mean_distances_to_knn`); harmful outputs move away from their original values (overcorrection). Objective described as affine-convex; L-BFGS converges in 2–3 iterations; no assumed refusal-manifold rank — [Heretic PR #211](https://github.com/p-e-w/heretic/pull/211)
- Results (informal): on gpt-oss-20b, "dramatically better than any existing abliteration" except kabachuha's SOMbliterated (same refusals, higher KL) — no numbers; Qwen 3.5 4B: main-branch directional ablation trials still refused > 50/100, while ARA with default constants reached **4/100 refusals at KL 0.1396** (user GhostWithAHat); Qwen3-4B-Instruct-2507 comparison: SOMbliterated 3/100 KL 0.08, heretic-org 5/100 KL 0.07, gabliterated 4/100 KL 0.25, ARA 8/100 KL 0.14 (mislabeled row) — [Heretic PR #211](https://github.com/p-e-w/heretic/pull/211)
- A blocker flagged before merge: NaN/inf values in some ARA matrices (attributed by another user to a transformers serialization bug) — [Heretic PR #211](https://github.com/p-e-w/heretic/pull/211)
- Current `config.default.toml` on master sets the active modifier to **ARA**; Abliteration modifier settings apply only if switched — [config.default.toml](https://raw.githubusercontent.com/p-e-w/heretic/master/config.default.toml)

**Head-level / sparse ablation**
- "Safety Alignment Should Be Made More Than Just A Few Attention Heads" (arXiv 2508.19697, Aug 2025): RDSHA uses the refusal direction to rank attention heads and ablates the top ones; removing these heads can severely compromise safety; proposes AHD training to distribute safety across heads — [arXiv](https://arxiv.org/abs/2508.19697v1) (via search summary)
- "Refusal Falls off a Cliff: How Safety Alignment Fails in Reasoning?" (arXiv 2510.06036, Oct 2025): refusal score drops sharply right before output in reasoning models; attributed to a sparse set of heads; **ablating ~3% of these heads reduces ASR below 10%** (i.e., the heads *suppress* refusal; ablating them restores safety) — [arXiv](https://arxiv.org/abs/2510.06036) (via search summary)

**SAE-feature-based**
- O'Brien et al., "Steering Language Model Refusal with Sparse Autoencoders" (Microsoft; arXiv Nov 2024, rev. May 2025; ICML 2025 workshop): SAE features mediating refusal in Phi-3 Mini can be steered to improve jailbreak robustness, but steering **systematically degrades performance across multiple benchmarks**, even on safe inputs — features appear entangled with general capabilities — [EleutherAI page](https://www.eleuther.ai/papers-blog/steering-language-model-refusal-with-sparse-autoencoders); [arXiv](https://arxiv.org/html/2411.11296v2)
- "Beyond I'm Sorry, I Can't: Dissecting LLM Refusal" (arXiv 2509.09708): refusal-critical SAE features re-activate when a distinct precursor is removed (redundancy / "hydra" effect) — [arXiv](https://arxiv.org/html/2509.09708v2) (via search summary)
- Joad et al. (EMNLP 2026): SAEs show a shared core of refusal latents plus category-specific ones — [arXiv](https://arxiv.org/abs/2602.02132)

**Low-rank / subspace**
- RDO cones (≤ 5-D), SOM (k = 2–7 directions), Gabliteration (rank-k ridge projector, k ≈ 2), Heretic `full` row normalization (rank-3 LoRA) and ARA (arbitrary rank) are the main low-rank/multi-vector variants — see Sections 3 and 2; [Heretic config](https://heretic-project.org/configuration)

**Architecture generality (2026)**
- Bosco & Srinivasan, "Locating and Steering Refusal Beyond Attention" (arXiv 4 Sep 2026 [PREPRINT]): a single refusal direction exists across SSM, transformer, recurrent and hybrid models (aligned by a rigid rotation); harm is most readable at each layer's output before addition to the residual stream; ablating the aligned direction does far more than a random direction (no numbers in abstract) — [arXiv](https://arxiv.org/abs/2609.04721)

**Defenses relevant to ranking robustness of methods**
- AMRA, "Abliteration Mitigation via Refusal Aliases" (Truong, arXiv 2608.18093 [PREPRINT]): rank-k updates to residual writers replacing refusal-inducing activations with random aliases; post-abliteration refusal +2.16 pts on Llama-3-8B (< 0.5 pp MMLU cost), +14.70 on Gemma-2-9B (larger utility cost) — [arXiv](https://arxiv.org/abs/2608.18093) (via search summary)

### Inferences
- SRA is the strongest *published, numerical* evidence that cleaning the DIM direction (the generalization of projected abliteration from one protected direction to many) lowers KL by roughly 10–50× at equal or lower refusal; but it is single-author, self-evaluated, and uses first-token KL/perplexity rather than downstream benchmarks.
- ARA represents a shift away from "direction removal" toward constrained per-module regression; current evidence is informal PR-thread numbers, but its adoption as Heretic's default (Oct 2026) suggests the maintainer considers it superior to directional ablation + MPOA.
- Head- and SAE-level ablation do not currently offer better refusal-removal/capability trade-offs than residual-direction methods; the SAE results suggest refusal features are entangled with capabilities.

### Gaps
- No peer-reviewed evaluation of ARA; no downstream benchmark numbers for ARA.
- "Ships" / Zhou et al. (ICLR 2025) single-safety-head ablation could not be confirmed by search; omitted.
- SRA's λ, T and γ constants are unreported, limiting reproducibility.

---

## 7. Head-to-head comparisons across variants

### Takeaway
There is no single peer-reviewed benchmark comparing all variants. Available head-to-heads are (a) paper-internal (RDO vs DIM; SOM-MD vs SD/RDO/GCG; SRA vs standard; Gabliteration vs DIM), (b) tool-author tables (Heretic vs other abliterations on Gemma-3-12B; UGI for MPOA), and (c) community benchmarks (DreamFast lm-eval comparisons; kabachuha's Qwen3-4B table). Across these, the consistent pattern is: KL/benchmark damage of naive hand-tuned abliteration (e.g., huihui-ai) can be large, and methods that optimize per-layer strength against KL (Heretic), clean the direction (SRA), or use multiple selected directions (SOM) dominate at matched refusal.

### Cited Findings
- **Gemma-3-12B-it (Heretic README, [SELF])**: refusals/KL — mlabonne v2 3/100, 1.04; huihui-ai 3/100, 0.45; Heretic 3/100, 0.16 — [Heretic README](https://github.com/p-e-w/heretic)
- **Gemma-3-12B-it (UGI, [SELF])**: standard abliterated UGI 32.08 / NatInt 18.64; MPOA 32.61 / 21.33; base 19.58 / 18.72 — [grimjim HF blog](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- **Qwen3-4B-Instruct-2507 (kabachuha, [3P informal])**: SOMbliterated 3/100, KL 0.08; heretic-org 5/100, 0.07; gabliterated 4/100, 0.25; ARA 8/100, 0.14; kabachuha's ranking MPOA < SOMPOA < ARA — [Heretic PR #211](https://github.com/p-e-w/heretic/pull/211)
- **Qwen3.5-4B (DreamFast, [3P], lm-eval via vLLM, bf16; HarmBench 400; KL on harmless_alpaca test[:100] first-token)**: MMLU base 74.38 / Heretic 74.28 / HauhauCS 74.16 / Huihui 68.48; GSM8K 74.30 / 73.69 / 71.72 / 68.84; ARC-C 51.54 / 51.37 / 50.94 / 44.37; TruthfulQA MC2 48.86 / 45.38 / 45.19 / 43.72; HarmBench refusals 278/400 / 10/400 / 2/400 / 0/400; KL batchmean — / 0.0404 / 0.0217 / **3.6506**. Caveats: single Heretic run (non-deterministic); Heretic's MPOA and ARA not tested; HauhauCS method attribution is inferred — [DreamFast benchmark](https://friendli.ai/models/DreamFast/Qwen3.5-4B-Uncensored-HauhauCS-Aggressive-Safetensor-Benchmark)
- Other DreamFast runs (via search summary): Qwen3.5-27B Heretic MMLU ≈ −0.3%, GSM8K ≈ +7.7%, TruthfulQA MC2 ≈ −3.2%; Qwen3-VL-8B Heretic 1.3.0 MMLU/GSM8K within ~1% of base but TruthfulQA −12–16% — [Qwen3.5-27B](https://friendli.ai/models/DreamFast/Qwen3.5-27B-Uncensored-HauhauCS-Aggressive-Safetensor-Benchmark); [Qwen3-VL-8B](https://friendli.ai/models/DreamFast/Qwen3-VL-8B-Heretic-1.3.0)
- **RDO vs DIM [PEER]**: comparable ASR, better TruthfulQA (+0.3 to +4.6 pts), MMLU drop −0.1% vs −2.6% on Llama 3 8B — [arXiv HTML](https://arxiv.org/html/2502.17420v2)
- **SOM multi-direction vs single DIM vs RDO [PEER]**: HarmBench ASR Llama3-8B 88.05 vs 15.09 vs 32.07; Gemma2-9B 96.27 vs 38.93 vs 91.82 — [arXiv HTML](https://arxiv.org/html/2511.08379v2)
- **SRA vs standard [PREPRINT]**: KL 0.016–0.044 vs 0.097–2.088 across 5 models at ≤ 2% refusal — [arXiv HTML](https://arxiv.org/html/2601.08489)
- **Gabliteration vs DIM [PREPRINT]**: lower KL on 7/8 models, lower/equal refusal on 7/8 — [HF papers](https://huggingface.co/papers/2512.18901)
- TruthfulQA is repeatedly the most-damaged benchmark across methods (RDO paper; DreamFast) — [RDO](https://arxiv.org/html/2502.17420v2); [DreamFast](https://friendli.ai/models/DreamFast/Qwen3.5-4B-Uncensored-HauhauCS-Aggressive-Safetensor-Benchmark)

### Inferences
- Suggested ranking for a writer (best current practice, Oct 2026), weighting peer-reviewed > preprint > self-reported:
  1. **Optimization-driven, KL-constrained editing** — Heretic-style per-layer kernel + TPE over refusals and KL, now with ARA as the default modifier (strongest practical numbers, self-reported/community) — or its directional path with `orthogonalize_direction` + `row_normalization="full"` (i.e., projected + MPOA-style norm preservation).
  2. **Multi-direction ablation with selection** (SOM + BO, AAAI 2026; SOMPOA in Heretic) when single-direction removal is insufficient (Llama-3, Gemma-2, circuit-breaker or diverse-refusal-trained models).
  3. **Direction cleaning** (projected abliteration → SRA's multi-atom ridge residualization) to cut KL, especially on VL/small models.
  4. **RDO** when one can afford gradient-based direction training and want minimal side effects (peer-reviewed evidence of benchmark retention).
  5. MPOA alone (hand-picked layers, α = 1) — widely used, but evidence is a single UGI row.
  6. Conventional DIM single-direction abliteration — baseline; can incur KL 0.45–3.65 in community comparisons.
- Common recommendation across sources: measure with broad, unmatched harmless contrast sets; use fp32 intermediates; winsorize/clamp for models with massive activations (Gemma 3); edit `o_proj` and `down_proj` across a span of middle layers with tapered weights; evaluate with refusal count + first-token KL on harmless prompts + downstream benchmarks (TruthfulQA is the canary).

### Gaps
- No controlled, multi-model, peer-reviewed comparison of MPOA vs Heretic vs SOM vs RDO vs SRA vs ARA on shared metrics.
- No independent replication of grimjim's UGI/NatInt numbers; UGI is a closed leaderboard.
- KL measurement conventions differ (first-token vs multi-token; batchmean vs per-prompt), so cross-source KL numbers are not strictly comparable.
