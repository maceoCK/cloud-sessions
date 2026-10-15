# Abliteration vs. Alternative Refusal-Removal Methods, and Defenses That Resist It

Scope: how abliteration (refusal-direction ablation / weight orthogonalization, Arditi et al. 2024) compares to fine-tuning-based and steering-based refusal removal on cost, data, capability retention and effectiveness, and which defenses make models robust to it. Sources run from Oct 2023 to Aug 2026. Unless noted otherwise, numbers are copied from the primary paper or model card. "ASR" means attack success rate (higher is worse for the defender).

---

## 1. Fine-tuning-based safety removal vs. abliteration (compute, data, capability retention; hybrid approaches)

### Takeaway
Both families are cheap. Fine-tuning attacks need roughly 10–100 harmful examples and under about $200 of GPU time. Abliteration needs no harmful completions, no gradients, a few hundred contrastive prompts, and under $5 even at 70B. Fine-tuning removes refusals more completely and transfers better to downstream task utility. Single-direction abliteration often leaves residual refusals of about 10–30% and causes measurable but usually small capability or "disposition" drift. That drift is why practitioners now heal with DPO, optimize the ablation against KL divergence, or run multiple passes. Fine-tuning is also the only approach shown to work against models hardened specifically against abliteration (see Q3/Q4).

### Cited Findings

**Fine-tuning attacks (2023 baseline literature)**
- Qi et al. (arXiv 2310.03693, 5 Oct 2023): fine-tuning GPT-3.5 Turbo on **10 harmful examples cost < $0.20** through OpenAI's API. Harmfulness rate went from **1.8% → 88.8%** with 10 examples (5 epochs), **87.0%** with 50 and **91.8%** with 100. Llama-2-7b-Chat went **0.3% → 50.0% / 80.3% / 80.0%** with 10/50/100 examples. The 10-shot Llama attack is only **5 gradient steps**. — [Qi et al. 2023 (HTML)](https://arxiv.org/html/2310.03693)
- Qi et al. 2023, identity-shifting ("AOA") attack with 10 benign-looking examples: GPT-3.5 Turbo reached a **87.3%** harmfulness rate at 10 epochs, and Llama-2-7b-Chat **72.1%** at 5 epochs. — [Qi et al. 2023](https://arxiv.org/html/2310.03693)
- Qi et al. 2023, benign fine-tuning with no malicious intent still erodes safety: 1 epoch of Alpaca took GPT-3.5 Turbo from **5.5% → 31.8%** and Llama-2-7b-Chat from **0.3% → 16.1%**. LLaVA-Instruct took Llama-2-7b-Chat from **0% → 18.8%**. — [Qi et al. 2023](https://arxiv.org/html/2310.03693)
- Qi et al. 2023, mitigation: mixing in 100 safety samples cut the 100-shot attack from 91.8% to **23.0%**, which is still far less safe than the original model. OpenAI's fine-tuning moderation flagged **none** of the 100 harmful training examples. — [Qi et al. 2023](https://arxiv.org/html/2310.03693)
- Lermen, Rogers-Smith & Ladish (arXiv 2310.20624, 31 Oct 2023, rev. 22 May 2024) used quantized LoRA on **one GPU for < $200** to remove safety training from Llama 2-Chat 7B/13B/70B and Mixtral-Instruct. The 70B model's refusal rate fell to **about 1%** on two refusal benchmarks, and the authors say capabilities were retained on two general benchmarks. — [Lermen et al. 2023](https://arxiv.org/abs/2310.20624)
- BadLlama (Gade, Lermen, Rogers-Smith, Ladish; arXiv 2311.00117, 31 Oct 2023, v3 28 May 2024) removed safety fine-tuning from Llama 2-Chat 13B for **< $200** "while retaining its general capabilities." — [BadLlama](https://arxiv.org/abs/2311.00117)
- Shadow Alignment (Yang et al.; arXiv 2310.02949, 4 Oct 2023) used **100 malicious examples and 1 GPU-hour** to subvert **8 models from 5 organizations** (LLaMA-2, Falcon, InternLM, BaiChuan2, Vicuna). The models still answered regular queries appropriately, and the English single-turn attack transferred to multi-turn dialogue and other languages. — [Shadow Alignment](https://arxiv.org/abs/2310.02949)
- OpenAI's "Estimating Worst-Case Frontier Risks of Open-Weight LLMs" (arXiv 2508.03153, Aug 2025; ICLR 2026) describes an incremental RL stage with a helpful-only reward on gpt-oss-120b. It reached "refusal rates near 0% for unsafe prompts" and, with mild hyperparameter tuning, kept capabilities on benchmarks such as GPQA. The paper reports no compute figures for this stage. Its threat model assumes an adversary with roughly a seven-figure USD GPU budget. Abliteration is not evaluated. — [Wallace et al./OpenAI 2025](https://arxiv.org/html/2508.03153v2); [ICLR 2026 listing](https://iclr.cc/virtual/2026/poster/10007142)

**Abliteration cost, data and capability retention (reference point)**
- Arditi et al. (arXiv 2406.11717, v3 30 Oct 2024) extract the direction from **128 harmful + 128 harmless** prompts (32+32 for validation) as a difference-in-means. No gradient optimization or harmful completions are needed, and a jailbroken 70B model costs **"less than $5 of compute."** Weight orthogonalization (W_out ← W_out − r̂r̂ᵀW_out on every residual-stream writer) is stated to be equivalent to inference-time directional ablation (their App. E). — [Arditi et al. 2024](https://arxiv.org/html/2406.11717v3)
- Arditi et al., HarmBench ASR of orthogonalized models with the system prompt, and without it in parentheses: Llama-2 7B **22.6 (79.9)**, 13B **6.9 (61.0)**, 70B **4.4 (62.9)**; Qwen 7B **79.2 (74.8)**, 14B **84.3 (74.8)**, 72B **78.0 (79.2)**. For Qwen 7B, GCG reached 79.5 and PAIR 58.0. So the Llama-2 system prompt largely restores refusal after ablation. — [Arditi et al. 2024](https://arxiv.org/html/2406.11717v3)
- Arditi et al., capability deltas after orthogonalization (largest model per family; MMLU / ARC / GSM8K / TruthfulQA): Gemma 7B +0.1/+0.2/−0.7/**−2.4**; Yi 34B −1.4/+0.7/+0.5/**−3.5**; Llama-2 70B +0.1/−0.2/+1.5/−1.0; Llama-3 70B −0.1/−0.3/−0.4/−2.3; Qwen 72B −0.7/−0.4/+0.8/−1.4. Except for Qwen 7B and Yi 34B, all results fall within 99% CIs. TruthfulQA is the consistent loser. — [Arditi et al. 2024](https://arxiv.org/html/2406.11717v3)
- Heretic (p-e-w, 2025–2026) tunes per-layer ablation weights with Optuna TPE to co-minimize refusals and KL divergence. On Gemma-3-12B-IT, refusals were 97/100 originally. mlabonne-v2 abliterated reached **3/100 at KL 1.04**, huihui-ai **3/100 at KL 0.45**, and Heretic **3/100 at KL 0.16**. Qwen3-4B takes about **20–30 min on an RTX 3090**. — [Heretic GitHub](https://github.com/p-e-w/heretic)
- Young (arXiv 2512.13655v2, 8 Jan 2026) compared 4 abliteration tools (Heretic, DECCP, ErisForge, FailSpy) on 16 models of 7–14B. Heretic ran on 16/16 models, DECCP on 11, ErisForge on 9 and FailSpy on 5. Mean GSM8K change was **−7.81 pp for Heretic** (mostly Yi-1.5-9B at **−18.81 pp**), −0.28 pp for ErisForge and −0.13 pp for DECCP. Heretic's KL ranged **0.043–1.646**. KL and residual refusals correlated at **r = 0.87 (n = 8)**. DPO-only Zephyr-7B-beta was the most susceptible: **2/100 refusals (98% ASR)**, versus about 75–76% ASR for Llama-3.1-8B and Yi-1.5-9B. The keyword refusal metric understates bypass: a classifier gave 95.7% non-refusal versus 72.2% from keywords. — [Young 2026](https://arxiv.org/html/2512.13655v2)
- Off-target effects (Fafuła, arXiv 2607.17427, 19 Jul 2026; independent researcher, single task) compared huihui-ai abliterations of Gemma-4-26B-A4B-it and Qwen3-30B-A3B-Instruct-2507 with their base models. Optimism rate rose **+12.2 pp (Gemma)** and **+7.4 pp (Qwen)**. Mean confidence moved in opposite directions: **−0.008 for Gemma, +0.109 for Qwen**. Qwen's 1-week-horizon share fell **−42.0 pp**. The author's conclusion is that the abliterated model is "a measurably different decision-maker," not the base model minus its refusals. — [Fafuła 2026](https://arxiv.org/html/2607.17427)

**Head-to-head: projection vs. LoRA fine-tuning (only direct comparison found)**
- Gervais & Gervais (arXiv 2605.17413, 17 May 2026) tested Qwen2.5-0.5B/1.5B/3B on a 60-prompt authorized-security suite (Security-AR). Results are averaged across the three models: security score / security refusal / general score / out-of-scope unsafe rate.
  - Aligned baseline: 0.46 / 0.17 / 0.74 / 0.10.
  - **Single-vector refusal projection (abliteration-style): 0.50 / 0.11 / 0.75 / 0.47.** Utility gain is small and unsafe spillover is large.
  - **Rank-4 refusal-subspace projection: 0.51 / 0.09 / 0.72 / 0.10.**
  - **LoRA refusal suppression: 0.87 / 0.00 / 0.80 / 0.13.**
  - LoRA was trained on just 240 synthetic task rows + 480 retention rows (rank 16, 3 epochs).
  - Across three seeds on Qwen2.5-1.5B, LoRA reached 0.88 security with 0.07 spillover, while single-vector projection reached 0.47 with 0.53 spillover.
  - The authors call single-vector projection "surface removal," say LoRA is "not a safety certificate," and recommend reversible inference-time interventions for high-risk audits.
  — [Gervais & Gervais 2026](https://arxiv.org/html/2605.17413v1)

**Hybrid: abliteration followed by healing**
- Labonne's blog (13 Jun 2024) abliterated Daredevil-8B (≤256 harmful/harmless training prompts each) and saw "a performance drop in the ablated version across all benchmarks." DPO healing used mlabonne/orpo-dpo-mix-40k with QLoRA (4-bit, r=64), 1 epoch, LR 5e-6, on 6×A6000 for about 6 h 45 min, producing NeuralDaredevil-8B-abliterated. That run recovered "most of the performance drop," except GSM8K. Exact scores appear only in chart images. — [Labonne 2024](https://huggingface.co/blog/mlabonne/abliteration)
- In CAST's evaluation (ICLR 2025), the healed NeuralDaredevil-8B still refused **25.78%** of harmful prompts and **2.40%** of harmless ones at baseline. This is evidence that abliteration plus DPO healing leaves substantial residual refusal on Sorry-Bench-style prompts. — [Lee et al. CAST (HTML v3)](https://arxiv.org/html/2409.05907v3)
- Norm-preserving biprojected abliteration (grimjim, 6 Nov 2025) subtracts only the directional component of each weight row and then restores row norms. It is still rank-1. On Gemma-3-12B-IT the UGI / NatInt scores were: baseline 19.58 / 18.72, standard abliteration 32.08 / 18.64, norm-preserving biprojected **32.61 / 21.33**. The author attributes partial return of refusals in the biprojected variant to the Hydra self-repair effect. — [grimjim 2025](https://huggingface.co/blog/grimjim/norm-preserving-biprojected-abliteration)
- The Qwen3.6-27B-abliterated card (abliterix tool, 2026) merges rank-3 LoRA adapters found by Optuna search, over two passes. Refusals went 100/100 → **16/100 after pass 1** → **10/100 after pass 2**, with cumulative KL ≈ 0.024. The author says coherence degrades at KL ≥ 0.05. These are self-reported. — [HF model card](https://huggingface.co/wangzhang/Qwen3.6-27B-abliterated)

### Inferences
- Compute is no longer the differentiator, since both approaches cost less than a hobbyist GPU-day. The real differences are:
  - **Data:** abliteration needs only prompts, while fine-tuning needs harmful *completions* or a reward signal.
  - **Completeness:** fine-tuning reaches about 0–1% refusal, while single-direction abliteration often leaves 3–30% depending on model and judge.
  - **Robustness to defenses:** fine-tuning reached ~0% refusal on gpt-oss-120b via RL, and Qi 2023 / Lermen 2023 broke every model they targeted.
- On capability retention, the best abliterations (KL-optimized or norm-preserving) look comparable to or better than LoRA uncensoring on general benchmarks. The one controlled comparison (Gervais 2026, small Qwen2.5 models, security tasks) favored LoRA for task utility and shows single-vector projection increasing *out-of-scope* unsafe outputs. Abliteration is therefore not uniformly "cleaner."
- The practical "best practice" pipeline seen in the community combines three steps:
  1. A KL-constrained or norm-preserving abliteration.
  2. An optional second pass against the residual direction.
  3. An optional short DPO/SFT heal.

  This combination is a hybrid between the two families.

### Gaps
- No peer-reviewed paper benchmarks abliteration vs. LoRA uncensoring vs. full SFT on the same models with standard benchmarks (MMLU/GSM8K/MT-Bench) and identical refusal judges. Gervais 2026 is the closest but is small-scale and task-specific.
- Lermen et al.'s exact refusal and benchmark numbers could not be retrieved; the HTML fetch was blocked. Only the abstract figures above are confirmed.
- NeuralDaredevil's before/after benchmark numbers exist only as images in Labonne's blog.
- No source quantifies the compute of OpenAI's gpt-oss anti-refusal RL stage.

---

## 2. Inference-time steering alternatives: runtime directional ablation / activation steering vs. permanent weight edits; conditional steering (CAST)

### Takeaway
Runtime directional ablation and weight orthogonalization are mathematically equivalent (Arditi et al.). The choice is therefore operational:
- **Runtime hooks** are reversible, can be toggled per request, and avoid distributing modified weights. They need a hookable inference stack.
- **Weight edits** are portable to any runtime and to quantized formats, but are permanent.

Conditional steering (CAST, ICLR 2025) shows that steering can be made input-selective, though it has been demonstrated for *adding* refusal on chosen categories rather than removing it. Recent work finds that single-vector projection is the least selective option and leaks harm outside the target scope.

### Cited Findings
- Arditi et al. 2024: weight orthogonalization is "equivalent to inference-time directional ablation" (App. E). The same direction can also be *added* to induce refusal on harmless prompts (activation addition). — [Arditi et al. 2024](https://arxiv.org/html/2406.11717v3)
- CAST, "Programming Refusal with Conditional Activation Steering" (Lee et al., IBM Research/UPenn; arXiv 2409.05907, Sep 2024; ICLR 2025 Spotlight), works as follows:
  - A **condition vector** is checked only during the prompt forward pass, by projection similarity against a threshold.
  - If the condition fires, a **behavior vector** (refusal) is applied in later passes.
  - No weight optimization is required, and the authors say it keeps the data, runtime and compute efficiency of activation steering.

  — [CAST HTML v3](https://arxiv.org/html/2409.05907v3); [ICLR 2025 proceedings](https://proceedings.iclr.cc/paper_files/paper/2025/hash/e2dd53601de57c773343a7cdf09fae1c-Abstract-Conference.html)
- CAST results, harmful / harmless refusal % for base → unconditional steering (AST) → CAST:

  | Model | Base | AST | CAST |
  |---|---|---|---|
  | Qwen1.5-1.8B | 45.78 / 0.00 | 100.00 / 96.40 | **90.67 / 2.20** |
  | Hermes-2-Pro-8B | 19.33 / 1.00 | 98.00 / 91.80 | **83.33 / 2.40** |
  | NeuralDaredevil-8B | 25.78 / 2.40 | 99.11 / 98.60 | **83.33 / 3.00** |
  | Zephyr-β | 35.78 / 0.20 | 99.33 / 94.80 | **88.22 / 6.80** |

  Unconditional steering refuses almost everything, while CAST keeps harmless refusal at about 2–7%. — [CAST HTML v3](https://arxiv.org/html/2409.05907v3)
- CAST data needs: 4,050 harmful condition prompts (90 × 45 Sorry-Bench categories) paired with Alpaca, and 10,000 contrastive pairs for the refusal behavior vector. — [CAST HTML v3](https://arxiv.org/html/2409.05907v3)
- CAST limitations:
  - High sensitivity to hyperparameters, with thresholds varying by model (about 0.0–0.1 for Hermes 2 Pro vs. 0.4–0.6 for Zephyr).
  - Imperfect refusal vectors give inconsistent behavior.
  - Combining conditions reduces effectiveness.
  - The grid search over threshold, layer and direction is the main cost.

  — [CAST HTML v3](https://arxiv.org/html/2409.05907v3)
- Gervais & Gervais (May 2026), on Qwen2.5 0.5–3B: single-vector refusal projection raised out-of-scope unsafe outputs from **0.10 to 0.47**. A **rank-4 subspace projection** kept spillover at **0.10** with a similar small utility gain, and topic-matched projection gave 0.30. The authors recommend **reversible inference-time interventions** for high-risk audits so that modified weights are never distributed. — [Gervais & Gervais 2026](https://arxiv.org/html/2605.17413v1)
- ReFAT's analysis (Yu et al., arXiv 2409.20089, Sep 2024 / Mar 2025) shows why runtime refusal-feature ablation (RFA) is such a strong attack: it approximates the worst-case perturbation. RFA ASR on undefended models was **53.3% (Llama-3-8B), 85.6% (Mistral-7B), 92.8% (Gemma-7B)**, higher than GCG, PAIR or AutoDAN on every model. — [ReFAT HTML v2](https://arxiv.org/html/2409.20089v2)

### Inferences
- When to prefer runtime ablation or steering over a weight edit:
  - Evaluation or red-team settings that need reversibility or per-request toggling.
  - Scoped behavior: condition on topic, CAST-style, to unlock only one domain such as authorized security work.
  - Cases where you do not want to publish an uncensored checkpoint.
- When to prefer a weight edit: deployment to runtimes without activation hooks, or quantized distribution (GGUF and similar), where a baked-in rank-1 edit travels with the weights.
- Conditional *removal* (e.g., "ablate refusal only if the topic is cybersecurity") is a natural extension of CAST plus abliteration. I found no peer-reviewed paper evaluating it. The topic-matched projection arm in Gervais 2026 is the nearest analog, and it had weaker utility gains.

### Gaps
- I found no source benchmarking inference latency or throughput of runtime ablation hooks against orthogonalized weights. Overhead should be one projection per layer, but this is unsourced.
- Support for control vectors and steering in vLLM and llama.cpp was not verified in this research pass.
- No paper was found applying CAST-style conditional *suppression* of refusal.

---

## 3. Defenses and robustness against abliteration (and which recent models resist it)

### Takeaway
Three families of defense measurably blunt single-direction abliteration on 2–9B models:
1. **Distributing refusal across tokens or representations:** extended-refusal fine-tuning, deep/augmented alignment, safety pretraining.
2. **Adversarial training against the refusal direction itself:** ReFAT and DeepRefusal.
3. **Representation rerouting:** circuit breakers.

Reported numbers:
- Refusal after abliteration stays at **90–97%** with extended refusals, versus 14–21% for baselines.
- RFA ASR falls from **53–93% to 10–21%** with ReFAT.
- Refusal-ablation ASR falls to **about 0–1%** with DeepRefusal on Llama-3-8B and Gemma-7B, but stays at **36.9%** on Llama-2-7B.

None of these defenses is shown to survive adaptive or fine-tuning attacks. The durability literature shows that "tamper-resistant" claims (TAR, RepNoise, circuit breakers) collapse under modest changes to attack configuration. Among 2025–26 production models, only anecdotal or self-reported "resistance" exists (Gemma 3, Qwen3), and it is overcome by better abliteration variants.

### Cited Findings

**Extended-refusal fine-tuning ("An Embarrassingly Simple Defense…", Abu Shairah, Hammoud, Ghanem, Turkiyyah, KAUST; arXiv 2505.19056, v1 25 May 2025, v2 7 Oct 2025)**
- Method: fine-tune on 10,000 examples (about 4.3k harmful, 5.7k benign Alpaca-GPT4). Harmful responses are generated by GPT-4o in a topic explanation → explicit refusal → ethical justification format. Training ran 3 epochs at LR 1e-6. — [Abu Shairah et al. 2025 (HTML v2)](https://arxiv.org/html/2505.19056v2)
- Refusal on CatQA before → after abliteration:

  | Model | Before | After | Drop |
  |---|---|---|---|
  | Llama-2-7B-chat | 100 | 20.7 | 79.3 |
  | Llama-2-7B-Extended | 100 | **92.7** | 7.3 |
  | Qwen2.5-3B | 93.1 | 15.1 | 78.0 |
  | Qwen2.5-3B-Extended | 100 | **90.9** | 9.1 |
  | Qwen2.5-1.5B | 93.8 | 13.6 | 80.2 |
  | Qwen2.5-1.5B-Extended | 100 | **96.7** | 3.3 |

  — [Abu Shairah et al. 2025](https://arxiv.org/html/2505.19056v2)
- Cost: before any attack, extended-refusal models lose 0.5–1.3 MMLU points. After abliteration the defended models lose coherence (Llama 100 → 89.1) and MMLU (Llama 46.4 → 41.8; Qwen-1.5B 59.6 → 54.4, with perplexity 26.7 → **49.5**). Defended models therefore stay "safe" partly because the attack damages them. — [Abu Shairah et al. 2025](https://arxiv.org/html/2505.19056v2)
- Mechanism: after abliteration, the harmful/harmless centroid distance shrinks by 28.8–33.9 points for baselines but only 7.7–13.7 points for extended models. The component ablation on Qwen2.5-3B shows refusal-only responses give **17.8%** post-abliteration refusal, explanation-only **81.1%**, justification-only **86.2%**, and full **90.9%**. The explanation and justification text carries the robustness. — [Abu Shairah et al. 2025](https://arxiv.org/html/2505.19056v2)
- Limitations the authors state:
  - Tested only on models up to 7B.
  - Refusals still decline under benign fine-tuning (Dolly). Qwen2.5-3B-Extended held above 90% past 1.4k steps, while the baseline dropped after a few hundred.
  - No adaptive or multi-direction attack was tested.

  — [Abu Shairah et al. 2025](https://arxiv.org/html/2505.19056v2)
- Source conflict: a 2026 secondary paper paraphrases this result as "cut abliteration success from 70–80% to under 10%." The primary paper says the *refusal-rate drop* is ≤10% versus 70–80%. — [Young 2026](https://arxiv.org/html/2512.13655v2) vs. [primary](https://arxiv.org/abs/2505.19056)

**Refusal Feature Adversarial Training (ReFAT; Yu, Do, Hambardzumyan, Cancedda, Meta; arXiv 2409.20089, 30 Sep 2024, rev. 20 Mar 2025)**
- Method: during training, ablate the refusal feature (recomputed from data) and train the model to still refuse.
- RFA-attack ASR, base → ReFAT:
  - Llama-3-8B: **53.3 → 10.4**. Other defenses on the same attack: RT 50.8, R2D2 43.9, CAT 36.5, LAT 45.0.
  - Mistral-7B: **85.6 → 21.1**.
  - Gemma-7B: **92.8 → 18.8**.
- GCG and PAIR also drop (Llama-3 PAIR 29.9 → 11.5).

  — [ReFAT HTML v2](https://arxiv.org/html/2409.20089v2)
- Cost: forward/backward passes are **1.5/1** for ReFAT, versus 11/11 for CAT/LAT and 2566/6 for R2D2. That is about 1,700× cheaper than R2D2 and about 10× cheaper than CAT/LAT. — [ReFAT HTML v2](https://arxiv.org/html/2409.20089v2)
- Utility on Llama-3-8B (MT-Bench / MMLU / XSTest): 7.24 / 65.9 / 97.2 → 6.98 / 65.2 / 97.6. — [ReFAT HTML v2](https://arxiv.org/html/2409.20089v2)
- Limitations: fails on some non-English or colloquial GCG prompts, because refusal features come from English Alpaca data. Training for more than 1 epoch overfits and raises ASR. — [ReFAT HTML v2](https://arxiv.org/html/2409.20089v2)

**DeepRefusal (Xie et al.; arXiv 2509.15202, 18 Sep 2025; EMNLP 2025 Findings)**
- Method: probabilistically ablate the refusal direction (p = 0.5) across layers and token positions during LoRA fine-tuning, plus prefill augmentation. LoRA r=16, 1 epoch, about **45 min on one A100-80GB**. Data: 2k harmful (CircuitBreaker set), 4k UltraChat and 500 over-refusal examples. — [DeepRefusal HTML](https://arxiv.org/html/2509.15202v1)
- ASR under the "Refusal" (direction ablation) attack, base → DeepRefusal:
  - Llama-3-8B **92.5 → 0.2**. Circuit Breaker gave 1.2 and LAT 91.0 on this attack.
  - Gemma-7B **78.9 → 0.0**. Circuit Breaker gave 39.5.
  - Llama-2-7B **90.4 → 36.9**. Circuit Breaker gave 66.0.
- Refusal-Transfer (direction computed on the original instruct model): Llama-3 **92.5 → 0.4**, Mistral **94.8 → 0.0**.
- Prefilling: Llama-3 86.8 → 0.4.
- Average ASR reduction is about 95%, but Mistral CodeAttack stays at **73.5%**.

  — [DeepRefusal HTML](https://arxiv.org/html/2509.15202v1)
- Capability (MMLU / GSM8K / MT-Bench), Llama-3-8B: 63.82 / 75.44 / 6.89 → 63.61 / 72.40 / **5.94**. Circuit Breaker scored 58.82 / **42.84** / 6.79. Over-refusal stays high in some cases (Llama-3 28.5–29%, Gemma 30.5%). — [DeepRefusal HTML](https://arxiv.org/html/2509.15202v1)

**Circuit breakers / representation rerouting (Zou et al.; arXiv 2406.04313, Jun 2024, v4 Jul 2024)**
- RepE attack (representation-space refusal suppression) ASR:
  - Mistral-7B: refusal-trained 73.7 → R2D2 30.7 → **RR 6.2**.
  - Llama-3-8B: 91.2 → **RR 8.7**.
  - Cygnet: **0.0**.
- Input-embedding attack ASR: Llama-3 80.4 → 9.6.
- MT-Bench barely changes (Llama-3 8.05 → 8.00).
- Training is cheap: 150 steps, batch 16, about **20 min on one A100**.

  — [Circuit Breakers HTML v4](https://arxiv.org/html/2406.04313v4)
- Over-refusal on WildChat rose to 3.4% (Mistral) and 6.2% (Llama-3), from 2.0% and 2.2%. — [Circuit Breakers HTML v4](https://arxiv.org/html/2406.04313v4)
- Broken by stronger embedding attacks: Schwinn & Geisler (arXiv 2407.15902, Jul 2024) report **100% ASR** against circuit-breaker models after "a few simple changes" to embedding-space attacks, more than 80 points above the original evaluation. — [Schwinn & Geisler 2024](https://arxiv.org/abs/2407.15902)
- Mixed results against direction ablation in third-party tests: in DeepRefusal's table, CB held at 1.2% on Llama-3-8B but allowed 39.5% (Gemma-7B) and 66.0% (Llama-2-7B) under refusal-direction ablation. — [DeepRefusal HTML](https://arxiv.org/html/2509.15202v1)

**Shallow vs. deep safety alignment (Qi et al.; arXiv 2406.05946, 10 Jun 2024; ICLR 2025)**
- Diagnosis: alignment mostly changes the distribution over the first few output tokens.
- Data augmentation with "safety recovery" examples on Llama-2-7B-Chat cut ASR as follows:
  - Prefilling (5 tokens): 42.1 → **2.8**.
  - Prefilling (40 tokens): 57.0 → 4.5.
  - GCG (AdvBench): 65.6 → 19.0.
  - Decoding exploit (MaliciousInstruct): 84.3 → 1.0.
- AlpacaEval utility moved 51.8 → 49.5.

  — [Qi et al. 2024 HTML](https://arxiv.org/html/2406.05946v1)
- A token-wise constrained fine-tuning objective, under a harmful-example fine-tuning attack, gave Llama-2 ASR **88.9% (standard SFT) vs 4.6% (constrained)** and Gemma-1.1 81.6% vs 1.9%, with benign fine-tuning utility roughly preserved. The paper does not test abliteration. DeepRefusal and extended-refusal build on this "make it deep" idea. — [Qi et al. 2024 HTML](https://arxiv.org/html/2406.05946v1)
- DeepRefusal's "RT-Augmented" baseline (Qi-style deep alignment) still allowed **77.7%** refusal-ablation ASR on Llama-3-8B. That suggests token-depth augmentation alone does not stop direction ablation. — [DeepRefusal HTML](https://arxiv.org/html/2509.15202v1)

**Tamper-Resistant Safeguards (TAR; Tamirisa et al.; arXiv 2408.00761, Aug 2024, v4 Feb 2025) and the durability critique**
- TAR claims safeguards that survive "hundreds of steps of fine-tuning" with benign capabilities preserved. — [TAR](https://arxiv.org/abs/2408.00761)
- Qi, Wei, Carlini et al., "On Evaluating the Durability of Safeguards for Open-Weight LLMs" (arXiv 2412.07097, 10 Dec 2024), found the following for TAR-Bio-v2 on Llama-3-8B:
  - Across 5 seeds, the best run of each "failed" attack recovered WMDP-Bio from ~25% to **>60%**.
  - Changing warmup or schedule (100 steps, cosine), or using LoRA, broke the defense.
  - The defense appears to rely on early-training instability.
  - TAR's own GSM8K fell **74.4 → 1.5 (v1) / 4.8 (v2)**.

  For RepNoise, shuffling and seeds restored near-undefended harmfulness, and 100 benign examples largely restored HarmfulQA behavior. — [Qi et al. 2024 durability](https://arxiv.org/html/2412.07097v1)

**Unlearning-based approaches**
- Łucki et al., "An Adversarial Perspective on Machine Unlearning for AI Safety" (arXiv 2409.18025; TMLR; v6 May 2025), on Zephyr-7B WMDP-Bio accuracy (base 64.4):
  - Orthogonalization (directional ablation) restored RMU from 29.9 to **64.7**, fully recovering the capability.
  - NPO went 29.5 → 45.1 and DPO refusal training 27.9 → 50.7.
  - Fine-tuning on 10 unrelated examples recovered RMU to 61.6.
  - The authors call RMU "the most vulnerable to our orthogonalization." Unlearning mostly obfuscates knowledge rather than removing it.

  — [Łucki et al. HTML v6](https://arxiv.org/html/2409.18025v6)
- Deep Ignorance (O'Brien, Casper et al.; arXiv 2508.06601, Aug 2025, v2 Feb 2026) pretrained 6.9B models from scratch on data filtered for biothreat content. They resisted adversarial fine-tuning for **up to 10,000 steps and 300M tokens**, "over an order of magnitude" better than post-training baselines, with no reported degradation of unrelated capabilities. They can still use hazardous information supplied in context. — [Deep Ignorance](https://arxiv.org/abs/2508.06601)

**Safety pretraining under abliteration (Agnihotri et al.; arXiv 2510.02768, 3 Oct 2025; NeurIPS 2025 Lock-LLM workshop)**
- Setup: 20 systems (10 models × original/abliterated), 50 harmful + 50 harmless prompts each.
- Results:
  - The SmolLM2-1.7B "Safety Oracle" checkpoint (rephrase + refusals + metatags in pretraining) kept harmful prompts largely refused, with the smallest pre/post gap.
  - Single-signal variants (rephrase-only, refusals-only) were fragile.
  - Llama-3.3 showed the largest drop among open baselines, and GLM-4 also lost refusal.
  - **Qwen3 showed no loss** in their setup.
- Exact numbers are only in figures. — [Agnihotri et al. HTML](https://arxiv.org/html/2510.02768v1)

**2026 defenses targeting abliteration specifically**
- AMRA, "Abliteration Mitigation via Refusal Aliases" (Truong; arXiv 2608.18093, submitted 7 Jun 2026): rank-k edits replace refusal-related activations with random aliases so that the direction is hard to extract, then reader matrices are patched to keep behavior. Post-abliteration refusal improved only **+2.16 points (Llama-3-8B; MMLU cost <0.5 pp)** and **+14.70 points (Gemma-2-9B; higher utility cost)**. The abstract does not report adaptive attacks. — [AMRA](https://arxiv.org/abs/2608.18093)
- "Fool's Gold: Defensive Deception Against Safety-Removal Attacks" (Russinovich; arXiv 2608.17202, 17 Aug 2026) accepts that refusal will be stripped. It trains "decoy" answers, with falsified critical steps, that appear only in the *abliterated* state, using a differentiable simulation of the attack.
  - Coverage: 7 models from 5 families (9B–122B, dense and MoE); 6 passed the pre-registered efficacy gate.
  - On those 6, **0.51–0.90** of attacked-state responses were decoys.
  - On the defended 122B model, **0.82–0.86** of matched-quality answers were fatally wrong, versus ≤0.10 undefended.
  - The defense covers only chem/bio, does not address in-context jailbreaks, and protects only the released weights.

  — [Fool's Gold](https://arxiv.org/abs/2608.17202)

**Which 2025–2026 models are reported to resist abliteration**
- Gemma 3 (Mar 2025): Labonne reported it "much more resilient to refusal removal than other models like Qwen 2.5" and needed a revised recipe. This is an X post, not peer-reviewed. — [Labonne on X](https://x.com/maximelabonne/status/1901581470717608215)
- Gemma 3 is nevertheless abliterated to 3/100 refusals by three different tools (KL 0.16–1.04). — [Heretic](https://github.com/p-e-w/heretic)
- Qwen3: there was no harmful-refusal loss in Agnihotri's abliteration setup. — [Agnihotri et al.](https://arxiv.org/html/2510.02768v1)
- Qwen3.6-27B: a single pass plateaued at 16/100 refusals, and a second pass reached 10/100. — [HF card](https://huggingface.co/wangzhang/Qwen3.6-27B-abliterated)
- Routed MoE / hybrid-MoE models: LoMC (arXiv 2606.13709, 10 Jun 2026) argues broad direction-based edits "perturb general-purpose computation" in routed models, and expert-only edits lack capacity for heterogeneous refusal representations. It proposes localized multi-direction rank-one corrections. The abstract does not name models or give numbers. — [LoMC](https://arxiv.org/abs/2606.13709)
- gpt-oss: OpenAI reports refusals disabled to ~0% by helpful-only RL. It does not evaluate abliteration. — [OpenAI 2025](https://arxiv.org/html/2508.03153v2)

### Inferences
- The defenses that work against abliteration share one property: they stop refusal from being a single, concentrated, linearly removable feature. They do this in three ways:
  - Extending refusals over many tokens (extended refusal).
  - Training against the ablated state (ReFAT, DeepRefusal, and Fool's Gold via a simulated attack).
  - Changing what harmful representations route to (circuit breakers).

  They raise the cost of single-direction abliteration but are evaluated almost exclusively against the *non-adaptive* Arditi attack on ≤9B models. None of the papers tested multi-direction or cone ablation, Heretic-style per-layer optimization, or a short LoRA fine-tune against the defended models.
- Given the durability literature (TAR, RepNoise, circuit breakers broken by attack-configuration changes) and the 2023 fine-tuning results, the conservative reading is this. Abliteration-resistant training changes *which* cheap attack works, from directional ablation to LoRA or SFT, but does not deliver tamper-resistance for open weights. Pretraining-data filtering (Deep Ignorance) is the only approach with order-of-magnitude fine-tuning resistance, and it removes knowledge rather than protecting refusal.
- Several defenses impose real costs:
  - Higher over-refusal: DeepRefusal 21–30%.
  - Lower MT-Bench: DeepRefusal −0.4 to −0.9.
  - Longer responses: extended refusals roughly double length on Qwen.
  - Capability collapse: TAR's GSM8K.
- "Fool's Gold" changes the threat model: instead of making abliteration fail, it makes the abliterated model unreliable. This is relevant for a writer explaining that "abliteration succeeded" may not mean "useful harmful output."

### Gaps
- No peer-reviewed study tests multi-direction, cone or SOM ablation, or Heretic-optimized ablation, against extended-refusal, ReFAT, DeepRefusal or circuit-breaker models. Robustness to *adaptive* abliteration is unknown.
- No model technical report from 2025–26 (Gemma 3/4, Qwen3, Llama 4, gpt-oss) was found that explicitly claims abliteration resistance or describes anti-abliteration training. "Resistance" claims are anecdotal or come from third-party papers.
- The claim that some 2026 work argues extended-refusal defenses "raise attack cost but cannot eliminate the vulnerability" (attributed in search to arXiv 2606.27567) could **not** be verified. That paper is about prompt injection and does not mention abliteration.
- Per-model numbers from Agnihotri et al. are only in figures. AMRA's absolute refusal rates are not given in the abstract.

---

## 4. Implications for the "best way": when single-direction abliteration stops working, what works instead?

### Takeaway
Evidence points to a ladder of escalation:
1. Optimized single direction: KL-constrained, per-layer weighted, norm-preserving.
2. Second pass on the residual direction, or multi-direction / cone / SOM ablation.
3. Low-rank subspace projection for scope control.
4. Short LoRA/SFT or RL fine-tuning, which remains the most complete and most defense-agnostic method.

Refusal is now well documented to be multi-dimensional, with cones of up to 5 dimensions and multiple representationally independent directions. That explains both residual refusals and why defenses that "spread" refusal work against naive abliteration.

### Cited Findings
- Wollschläger et al., "The Geometry of Refusal in LLMs: Concept Cones and Representational Independence" (arXiv 2502.17420, Feb 2025, v2 Feb 2026). Tested on Gemma 2 2B/9B, Qwen2.5 1.5B–14B and Llama-3-8B.
  - Gradient-based Refusal Direction Optimization (RDO) roughly ties difference-in-means (DIM) on ablation ASR. Examples: Llama-3-8B DIM 79.7 vs RDO 80.3; Qwen2.5-14B 76.2 vs 75.7.
  - RDO has fewer side effects, reducing TruthfulQA error by about 40% on average.
  - Refusal-mediating cones exist up to **5 dimensions**, and best-of-N ASR on Gemma-2-2B rises with cone dimension until it plateaus at 4.
  - Ablating the top-k *representationally independent* directions on Gemma-2-2B beats the DIM baseline at **k ≥ 4**.
  - Ablating multiple DIM directions from different layers did *not* help.
  - Orthogonal ≠ independent: ablating one orthogonal direction reduces the other downstream.

  — [Wollschläger et al. HTML v2](https://arxiv.org/html/2502.17420v2); [abs](https://arxiv.org/abs/2502.17420)
- Piras et al., "SOM Directions are Better than One" (arXiv 2511.08379, Nov 2025; AAAI 2026): Self-Organizing Maps over harmful-prompt representations yield multiple refusal directions (neuron minus harmless centroid), selected by Bayesian optimization. Ablating them "outperforms not only the single-direction baseline but also specialized jailbreak algorithms." Exact numbers were not retrieved. — [Piras et al.](https://arxiv.org/abs/2511.08379)
- Petrov (arXiv 2603.22061, Mar 2026), on Qwen 3.5 2B: topic-matched contrast baselines in multi-directional abliteration produced **no functional refusal directions** on any layer, while unmatched contrast fully eliminated refusal on 6 layers. Subtraction cancels shared topic components. *Seen via search snippet only.* — [Petrov 2026](https://arxiv.org/pdf/2603.22061)
- Two-pass residual-direction abliteration on Qwen3.6-27B: 16/100 → 10/100 refusals. The author attributes the remainder to directions orthogonal to the first. Self-reported. — [HF card](https://huggingface.co/wangzhang/Qwen3.6-27B-abliterated)
- Rank-4 subspace projection vs. single vector (Gervais 2026): similar utility gain but out-of-scope unsafe spillover of 0.10 vs 0.47. LoRA far exceeds both on task utility (0.87 vs ~0.50). — [Gervais & Gervais 2026](https://arxiv.org/html/2605.17413v1)
- Heretic-style optimization: per-layer ablation weight kernels, interpolated direction index and separate attention/MLP weights. MLP edits are described as more damaging. It reaches the same refusal suppression at much lower KL (0.16 vs 0.45–1.04 on Gemma-3-12B). — [Heretic](https://github.com/p-e-w/heretic)
- In Young 2026, KL and residual refusals correlate at r = 0.87 across 8 models. Model-dependent trade-offs are real, and per-model tuning matters. — [Young 2026](https://arxiv.org/html/2512.13655v2)
- Defense-side evidence that multiple or dynamic directions are not always better: in DeepRefusal's ablations, layer-wise and dynamic directions performed *worse* than a single static direction for building the defense. — [DeepRefusal HTML](https://arxiv.org/html/2509.15202v1)
- Fine-tuning as the fallback: Qi 2023 (10 examples), Lermen 2023 (<$200, ~1% refusal at 70B), Shadow Alignment (100 examples / 1 GPU-hour) and OpenAI's gpt-oss helpful-only RL (~0% refusal) all reach near-total refusal removal. TAR-style tamper-resistance falls to LoRA or schedule changes. — [Qi 2023](https://arxiv.org/html/2310.03693); [Lermen 2023](https://arxiv.org/abs/2310.20624); [Shadow Alignment](https://arxiv.org/abs/2310.02949); [OpenAI 2025](https://arxiv.org/html/2508.03153v2); [Qi et al. durability 2024](https://arxiv.org/html/2412.07097v1)
- Off-target warning: even successful abliteration shifts model dispositions in family-specific directions (optimism and confidence on Gemma-4 and Qwen3 MoE). It is "not a scalpel." — [Fafuła 2026](https://arxiv.org/html/2607.17427)

### Inferences
- Use abliteration when you have only prompts and no completions, little compute, and need a quick, portable, mostly capability-preserving removal of a *standard* refusal-trained model. Best practice is KL- or norm-constrained ablation, checked with a classifier judge rather than keywords.
- Escalate to multi-direction methods (cone, SOM, residual second pass) when single-pass refusals plateau, typically at 10–30%. Expect diminishing returns after about 4 directions (Wollschläger), and watch KL and coherence.
- Switch to LoRA/SFT/DPO, or use it as a heal after abliteration, when:
  - The model was trained with extended refusals, ReFAT, DeepRefusal or circuit breakers, or with layered safety pretraining.
  - You need downstream task utility, not just non-refusal.
  - Residual refusals persist after multi-direction ablation.
- Abliteration cannot recover knowledge that was never learned (Deep Ignorance-style filtering). Against decoy-hardened models (Fool's Gold), it may "succeed" on refusal metrics while yielding deliberately wrong content. A writer should treat "non-refusal" and "useful compliance" as different outcomes.

### Gaps
- No paper directly measures how many directions or what rank is needed to defeat extended-refusal, ReFAT or DeepRefusal models. These would be the decisive experiments for "best way against hardened models."
- SOM paper numbers and Petrov's critique were not read in full. Model-level ASR comparisons from those papers are missing.
- No source evaluates abliteration on frontier-scale (>100B) dense or MoE models in a peer-reviewed setting, except Fool's Gold, which is a defense paper. Arditi et al. go up to 72B.
