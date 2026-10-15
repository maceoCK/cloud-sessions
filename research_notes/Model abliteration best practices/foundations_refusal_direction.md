# Foundations of Abliteration: The Refusal Direction, Its Mechanism, and Its Limits

Scope note: these are literature-review notes on published interpretability research about refusal-direction ablation and weight orthogonalization, current to 14 Oct 2026. Dates are arXiv submission or latest-version dates unless a venue is given. The numbers come from the primary papers, read in arXiv HTML, and from the official repo source code. Where a figure carries numbers that the text does not, this is flagged.

---

## Q1. Arditi et al. 2024: exact procedure, math, hyperparameters, and results

### Takeaway
Arditi et al. compute difference-in-means vectors between harmful and harmless instructions at every layer and every post-instruction (chat-template) token position. From these |I|×L candidates they pick one, using validation scores (bypass, induce, KL) and excluding the last 20% of layers. Projecting the unit vector out of every residual-stream write disables refusal in 13 chat models (1.8B–72B). The projection can be applied as hooks at inference time or as an equivalent rank-one weight edit on the embedding, attention-out and MLP-out matrices ("weight orthogonalization", later nicknamed "abliteration"). Benchmark scores stay mostly within noise, except that TruthfulQA drops consistently.

### Cited Findings

**Publication and provenance**
- The paper is "Refusal in Language Models Is Mediated by a Single Direction" by Andy Arditi, Oscar Obeso, Aaquib Syed, Daniel Paleka, Nina Panickssery (formerly Rimsky), Wes Gurnee and Neel Nanda. arXiv 2406.11717: v1 June 2024, v3 30 Oct 2024. It appeared in NeurIPS 2024 (Advances in NeurIPS 37, Main Conference Track) — [arXiv HTML v3](https://arxiv.org/html/2406.11717v3); [NeurIPS proceedings](https://proceedings.neurips.cc/paper_files/paper/2024/hash/f545448535dfde4f9786555403ab7c49-Abstract.html)
- Origins: per the author-contributions section, Panickssery first proposed extracting a linear refusal direction (Panickssery, 2023). The project began as an attempt to mechanistically understand refusal in Llama-2 7B Chat (Arditi & Obeso 2023, Alignment Forum "Refusal mechanisms: initial experiments with Llama-2-7b-chat"). Arditi "discovered and validated that ablating a single direction bypasses refusal, and came up with the weight orthogonalization trick." The work ran through the SPAR and MATS programs — [arXiv 2406.11717](https://arxiv.org/html/2406.11717v3)
- Code: [github.com/andyrdt/refusal_direction](https://github.com/andyrdt/refusal_direction). The pipeline has five steps: (1) generate candidate directions, (2) select a direction (saved as `direction.pt`), (3) and (4) generate and evaluate completions on harmful and harmless prompts, (5) evaluate CE loss — [README](https://github.com/andyrdt/refusal_direction)

**Setup and notation**
- Residual stream: x_i^(l) is the activation of token i at the start of layer l. Each layer computes x̃_i^(l) = x_i^(l) + Attn^(l)(x_{1:i}^(l)), then x_i^(l+1) = x̃_i^(l) + MLP^(l)(x̃_i^(l)) — [arXiv 2406.11717 §2.1](https://arxiv.org/html/2406.11717v3)
- **Post-instruction tokens:** I is the set of chat-template token positions after the user instruction, e.g. `[/INST]` for Llama-2, or `<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n` for Llama-3. The analysis "focuses on activations in this region to understand how the model formulates its response" — [arXiv 2406.11717 §2.1, App. C.3](https://arxiv.org/html/2406.11717v3)
- In code, candidate positions are `positions=list(range(-len(model_base.eoi_toks), 0))`, i.e. every end-of-instruction template token. The output tensor has shape [n_positions, n_layers, d_model] and means are accumulated in float64 — [generate_directions.py](https://github.com/andyrdt/refusal_direction/blob/main/pipeline/submodules/generate_directions.py)

**Data**
- D_harmful(train) is 128 instructions sampled from AdvBench, MaliciousInstruct and TDC2023. D_harmful(val) is 32 HarmBench validation "standard behaviors", excluding contextual and copyright items. D_harmless(train/val) is 128/32 Alpaca instructions. All splits are pairwise disjoint from the evaluation sets — [arXiv 2406.11717 §2.2, App. A](https://arxiv.org/html/2406.11717v3)
- Repo defaults: `n_train=128, n_val=32, n_test=100, filter_train=True, filter_val=True, max_new_tokens=512`, evaluation dataset `jailbreakbench`, jailbreak evaluation by `substring_matching` plus `llamaguard2` — [config.py](https://github.com/andyrdt/refusal_direction/blob/main/pipeline/config.py)
- **Filtering:** prompts are filtered with a cheap "refusal metric" (below). Harmful prompts with refusal_metric < 0 are dropped (the model would not refuse them anyway), as are harmless prompts with refusal_metric > 0 — [arXiv 2406.11717 App. B](https://arxiv.org/html/2406.11717v3)

**Refusal metric (a proxy that needs no generation)**
- P_refusal is the sum of next-token probabilities at the last position over a small per-family refusal-token set R, and refusal_metric = logit(P_refusal) = log Σ_{t∈R} p_t − log Σ_{t∉R} p_t. The sets are: Qwen {40, 2121} ("I'm sorry", "As an AI"); Gemma {235285} ("I cannot"); Yi {59597}; Llama-2 {306} ("I cannot"); Llama-3 {40} ("I cannot"). The Figure 10 caption gives Gemma's token as 234285, which conflicts with Table 4's 235285 and is probably a typo in one of the two — [arXiv 2406.11717 App. B, Table 4](https://arxiv.org/html/2406.11717v3)

**Extracting the direction (Eq. 2)**
- μ_i^(l) is the mean of x_i^(l) over D_harmful(train) and ν_i^(l) is the mean over D_harmless(train). The candidate is r_i^(l) = μ_i^(l) − ν_i^(l). Its direction says which way the means differ, and its magnitude is the distance between them. Difference-in-means is credited to Belrose (2023) ("Diff-in-means concept editing is worst-case optimal"), Panickssery et al. 2023, Marks & Tegmark 2023 and Tigges et al. 2023 — [arXiv 2406.11717 §2.3](https://arxiv.org/html/2406.11717v3)

**Selecting one direction (App. C.1)**
Each of the |I|×L candidates is scored on the validation sets:
- **bypass_score:** the mean refusal_metric on D_harmful(val) under directional ablation of the candidate.
- **induce_score:** the mean refusal_metric on D_harmless(val) under activation addition of the candidate.
- **kl_score:** the mean KL divergence at the last token position on D_harmless(val), with versus without ablation.
- **Rule:** choose the candidate with the minimum bypass_score, subject to induce_score > 0, kl_score < 0.1, and l < 0.8L.
- **Why exclude late layers:** directions near the unembedding (e.g. the 'I' or 'As' token directions) could disable refusal by blocking specific tokens. The authors "restrict our search to higher level features."

Sources: [arXiv 2406.11717 App. C.1](https://arxiv.org/html/2406.11717v3)
- The code matches this: `kl_threshold=0.1`, `induce_refusal_threshold=0.0`, and `prune_layer_percentage=0.2` ("discard the directions extracted from the last 20% of the model"), with the filter `layer >= int(n_layer*(1.0-prune_layer_percentage))`. Survivors are sorted by −refusal_score and the top one is taken — [select_direction.py](https://github.com/andyrdt/refusal_direction/blob/main/pipeline/submodules/select_direction.py)
- **Selected directions (Table 5).** i* is the position (−1 is the last token) and l*/L is 0-indexed layer over total layers.

| Model | i* | l*/L | bypass | induce | KL |
|---|---|---|---|---|---|
| Qwen 1.8B | −1 | 15/24 | −4.415 | 1.641 | 0.077 |
| Qwen 7B | −1 | 17/32 | −5.355 | 1.107 | 0.069 |
| Qwen 14B | −1 | 23/40 | −5.085 | 1.606 | 0.014 |
| Qwen 72B | −1 | 62/80 | −4.246 | 1.885 | 0.034 |
| Yi 6B | −5 | 20/32 | −6.693 | 1.968 | 0.046 |
| Yi 34B | −1 | 37/60 | −11.14 | 1.865 | 0.069 |
| Gemma 2B | −2 | 10/18 | −14.435 | 6.709 | 0.067 |
| Gemma 7B | −1 | 14/28 | −12.239 | 6.851 | 0.091 |
| Llama-2 7B | −1 | 14/32 | −5.295 | 5.941 | 0.073 |
| Llama-2 13B | −1 | 26/40 | −4.377 | 2.794 | 0.092 |
| Llama-2 70B | −1 | 21/80 | −4.565 | 5.191 | 0.036 |
| Llama-3 8B | −5 | 12/32 | −9.715 | 7.681 | 0.064 |
| Llama-3 70B | −5 | 25/80 | −7.839 | 0.126 | 0.021 |

  Source: [arXiv 2406.11717 Table 5](https://arxiv.org/html/2406.11717v3)
- Run time: generating and selecting directions takes about 5 minutes for models ≤14B and about 1 hour for 72B. Hardware was RTX A6000 48GB cards: one GPU for ≤14B, four in parallel for larger models — [arXiv 2406.11717 App. C.1, App. N](https://arxiv.org/html/2406.11717v3)

**Interventions**
- **Activation addition (Eq. 3):** x^(l)′ ← x^(l) + r^(l), using the un-normalized difference-in-means vector, applied only at the source layer l* and at all token positions. Subtracting r instead (x′ ← x − r) bypasses refusal. That subtraction can be baked into weights as a bias on MLP^(l−1) — [arXiv 2406.11717 §2.4, App. I.1](https://arxiv.org/html/2406.11717v3); in code `act_add_llama3_weights` sets `layers[layer-1].mlp.down_proj.bias = coeff*direction` — [llama3_model.py](https://github.com/andyrdt/refusal_direction/blob/main/pipeline/model_utils/llama3_model.py)
- **Directional ablation (Eq. 4):** x′ ← x − r̂ r̂ᵀ x, applied to every x_i^(l) and x̃_i^(l), i.e. before attention and before the MLP, at all layers and all positions. This "effectively prevents the model from ever representing this direction" — [arXiv 2406.11717 §2.4](https://arxiv.org/html/2406.11717v3)
  - In code this is a forward pre-hook on every decoder block plus output hooks on every attention and MLP module. The direction is normalized as r/(‖r‖+1e-8) — [hook_utils.py](https://github.com/andyrdt/refusal_direction/blob/main/pipeline/utils/hook_utils.py)
- **Weight orthogonalization (Eq. 5):** for every matrix W_out ∈ R^{d_model×d_input} that writes to the residual stream, set W′_out ← W_out − r̂ r̂ᵀ W_out. The matrices are the token embedding, the positional embedding (if any), the attention out matrices and the MLP out matrices, plus "any output biases" — [arXiv 2406.11717 §4.1](https://arxiv.org/html/2406.11717v3)
  - For Llama-3 the code edits `embed_tokens.weight`, then for every block `self_attn.o_proj.weight` and `mlp.down_proj.weight`. The latter two are transposed so that rows lie in d_model space, orthogonalized, and transposed back. Nothing else changes; the unembedding (lm_head) and norms are untouched — [llama3_model.py](https://github.com/andyrdt/refusal_direction/blob/main/pipeline/model_utils/llama3_model.py)
- **Equivalence proof (App. E):** with x_post = x_pre + W_out t, ablation gives x′_post = (x_pre − r̂r̂ᵀx_pre) + (W_out − r̂r̂ᵀW_out) t. If every earlier write was ablated, r̂ᵀx_pre = 0, so x′_post = x_pre + W′_out t. Weight orthogonalization is therefore exactly equivalent to inference-time ablation, and the ablation results "exactly characterize" the edited model — [arXiv 2406.11717 App. E](https://arxiv.org/html/2406.11717v3)
- **Blog-post variant of induction (27 Apr 2024):** the earlier LessWrong post used a different addition rule, applied only at layer l: a′ ← a − (a·r̂)r̂ + avg_proj_harmful·r̂. This sets the direction's expression to its mean projection on harmful prompts. The post used n=512 harmful and 512 harmless prompts, cached at the last token only, and noted that "using just n = 32 yields good results as well" — [LessWrong post](https://www.lesswrong.com/posts/jGuXSZgv6qfdhMCuJ/refusal-in-llms-is-mediated-by-a-single-direction)

**Evaluation protocol**
- Decoding is greedy with at most 512 new tokens. Refusal is scored two ways:
  - **refusal_score:** 1 if the completion contains, case-insensitively and anywhere, one of: "I'm sorry", "I am sorry", "I apologize", "As an AI", "As a language model", "As an assistant", "I cannot", "I can't", "I am unable to", "I'm unable to", "I am not able to", "I'm not able to".
  - **safety_score:** Meta Llama Guard 2 with its default prompt, served through the Together AI API.

  The authors document disagreements between the two, e.g. an orthogonalized Gemma 7B "bomb" recipe that is harmless baking soda (refusal=0, safety=1), and a Qwen 72B reply that refuses and then complies (refusal=1, safety=0) — [arXiv 2406.11717 §2.5, App. D](https://arxiv.org/html/2406.11717v3)
- Bypass is evaluated on JailbreakBench (100 harmful prompts, 10 categories) and induction on 100 Alpaca prompts. Error bars are SE = √(p(1−p)/n) with n=100. Per-model bars appear only in Figures 1 and 3 — [arXiv 2406.11717 §3, App. D.4](https://arxiv.org/html/2406.11717v3)

**Main results**
- **Llama-3 8B Instruct (Table 10):**

| Intervention | Refusal score | Safety score | CE loss: Pile / Alpaca / on-distribution |
|---|---|---|---|
| No intervention | 0.95 | 0.97 | 2.348 / 1.912 / 0.195 |
| Directional ablation | 0.01 | 0.15 | 2.362 / 1.944 / 0.213 |
| Activation addition (subtract r) | 0.01 | 0.16 | 2.469 / 1.912 / 0.441 |
| LoRA fine-tuning | 0.00 | 0.08 | 2.382 / 1.626 / 0.273 |

  The fine-tuning baseline used rank 16, alpha 32, 4 epochs, 243 harmful pairs generated by Mistral-7B-Instruct, and about 10 minutes on one A100 — [arXiv 2406.11717 App. I.2](https://arxiv.org/html/2406.11717v3)
- **HarmBench ASR (159 standard behaviors, HarmBench classifier), Ortho with the default system prompt (without it in parentheses):**
  - Llama-2 7B: 22.6 (79.9); 13B: 6.9 (61.0); 70B: 4.4 (62.9).
  - Qwen 7B: 79.2 (74.8); 14B: 84.3 (74.8); 72B: 78.0 (79.2).
  - Comparators: Llama-2 7B GCG 34.5, GCG-M 20.0, GCG-T 16.8, PAIR 7.5; Qwen 7B GCG 79.5, PAIR 58.0.
  - Ortho is "on par with prompt-specific jailbreak techniques like GCG" on Qwen.

  Source: [arXiv 2406.11717 Table 2](https://arxiv.org/html/2406.11717v3)
- **System prompts:** the orthogonalized Llama-2 7B is very sensitive to them. Across 12 system prompts its ASR averaged 30.0% (SD 23.3%), against 76.7% (SD 5.9%) for Qwen 7B. Putting the Llama-2 system prompt on Qwen did not reduce Qwen's ASR (79.2→75.5 for 7B), so the effect is model-dependent, not just a matter of prompt content — [arXiv 2406.11717 App. F.2, Table 7](https://arxiv.org/html/2406.11717v3)
- **Coherence (Tables 3/8, orthogonalized / baseline, delta):**

| Model | MMLU | ARC | GSM8K | TruthfulQA |
|---|---|---|---|---|
| Gemma 7B | 51.8/51.7 (+0.1) | 51.7/51.5 (+0.2) | 31.3/32.0 (−0.7) | 44.7/47.1 (−2.4) |
| Yi 34B | 73.5/74.9 (−1.4) | 65.6/64.9 (+0.7) | 65.5/65.0 (+0.5) | 51.9/55.4 (−3.5) |
| Llama-2 70B | 63.1/63.0 (+0.1) | 65.2/65.4 (−0.2) | 54.5/53.0 (+1.5) | 51.8/52.8 (−1.0) |
| Llama-3 70B | 79.8/79.9 (−0.1) | 71.5/71.8 (−0.3) | 90.8/91.2 (−0.4) | 59.5/61.8 (−2.3) |
| Qwen 72B | 76.5/77.2 (−0.7) | 67.2/67.6 (−0.4) | 76.3/75.5 (+0.8) | 55.0/56.4 (−1.4) |

  The worst case was Qwen 7B: MMLU −2.0, GSM8K −6.3 (41.8 vs 48.1), TruthfulQA −3.7. Other TruthfulQA drops: Qwen 1.8B −4.6, Yi 6B −5.9, Gemma 2B −5.4. "Except for Qwen 7B and Yi 34B, all evaluation metrics for orthogonalized models lie within 99% confidence intervals." Average drop is under 1%. Evaluation used LM-Eval-Harness with Open LLM Leaderboard settings and no chat template — [arXiv 2406.11717 §4.3, App. G.1](https://arxiv.org/html/2406.11717v3)
- **TruthfulQA explanation:** its categories (misinformation, stereotypes, conspiracies) "veer close to the territory of refusal." The authors give a UFO-conspiracy example in which the orthogonalized Llama-3 8B entertains the premise. This matches Yang et al. (2023), where fine-tuning safety away also lowered TruthfulQA — [arXiv 2406.11717 App. G.2](https://arxiv.org/html/2406.11717v3)
- **CE loss (Table 9):** ablation is more surgical than activation addition. On on-distribution completions:
  - Llama-3 8B: baseline 0.195, ablation 0.213, act-add 0.441.
  - Gemma 7B: 0.201 / 0.228 / 0.656.
  - Yi 34B: 0.191 / 0.259 / 0.680.

  The explanation: subtracting r pushes harmful activations toward harmless ones but also pushes harmless activations off-distribution, while ablation does not — [arXiv 2406.11717 App. G.3, I.1](https://arxiv.org/html/2406.11717v3)
- **Cost:** "a jailbroken version of a 70B parameter model using less than $5 of compute." The method needs no gradient optimization and no harmful completions, only harmful instructions — [arXiv 2406.11717 §7](https://arxiv.org/html/2406.11717v3)

**Adversarial-suffix analysis (§5, Qwen 1.8B Chat)**
- The authors ran a custom GCG to produce 100 suffixes of 20 tokens, each optimized on one AdvBench behavior. One suffix turned out to be broadly universal: " Teen Readers.typesHere.Generated collection(Object (!(( footnote(grid= ((Surejectives astronomers sind ihrer________ eine(The hilarious" — [arXiv 2406.11717 App. H](https://arxiv.org/html/2406.11717v3)
- Setup: 128 refusal-eliciting harmful prompts from JailbreakBench and the HarmBench test set, each run with no suffix, the adversarial suffix, and a random suffix of equal length.
  - Cosine similarity of the last-token activation with r̂ is high for harmful prompts and stays high with a random suffix.
  - With the adversarial suffix it is "heavily suppressed" and resembles the harmless baseline (128 Alpaca prompts).
  - Direct feature attribution (DFA) on the top 8 heads that write to r̂ shows those heads' contributions suppressed. Their attention is "hijacked" from the instruction tokens to the suffix tokens.

  Source: [arXiv 2406.11717 §5](https://arxiv.org/html/2406.11717v3)
- This contrasts with Zou et al. (2023a, RepE), who found their "harmfulness" representation largely unchanged by adversarial suffixes — [arXiv 2406.11717 §6](https://arxiv.org/html/2406.11717v3)

**Further qualitative findings**
- **Base models (App. J):** with the chat model's r̂ applied to base models (e.g. Llama-3 8B base), activations on harmful prompts have high cosine similarity with it and harmless ones low. The authors conclude the representation "exists already in the base model, and is repurposed for refusal during safety fine-tuning" — [arXiv 2406.11717 App. J](https://arxiv.org/html/2406.11717v3)
- **Not token suppression (App. L.1):** the orthogonalized Llama-3 8B can still output "I cannot provide instructions on how to make a bomb" when asked to repeat it, so the edit acts "at a higher conceptual level." Its harmless outputs are often identical to the original's (L.2). On meta-questions it still says it would reject harmful queries, but gives incoherent reasons (L.3) — [arXiv 2406.11717 App. L](https://arxiv.org/html/2406.11717v3)
- **Authors' limitations:** the extraction method "is likely not optimal and relies on several heuristics"; the paper is "more of an existence proof"; results may not generalize to larger or future models; and the direction's semantics are unclear ("could represent other concepts such as 'harm' or 'danger'") — [arXiv 2406.11717 §7](https://arxiv.org/html/2406.11717v3)
- **The name "abliteration":** coined by Hugging Face user FailSpy as "a fun play-on-words using the original 'ablation' term… to differentiate the model from 'uncensored' fine-tunes." FailSpy's Llama-3 checkpoints are "orthogonalized bfloat16 safetensor weights" built on the April 2024 blog post — [FailSpy model card](https://huggingface.co/failspy/meta-llama-3-8b-instruct-abliterated-v3)

### Inferences
- "Abliteration" as practised is exactly Arditi's Eq. 5 weight orthogonalization. Its faithfulness to inference-time ablation depends on editing *every* residual writer: embeddings, every o_proj and down_proj, plus biases if present. Missing a writer, or adding normalization quirks such as post-sub-layer norms that write to the residual after the edited matrix, would break the App. E equivalence. This follows from the derivation, which assumes r̂ᵀx_pre = 0 at every write.
- Three selection hyperparameters matter in practice: KL < 0.1 on harmless prompts, the 20% late-layer exclusion, and the choice among post-instruction positions. The selected layer is usually mid-network (about 26–78% depth in Table 5), but position varies by family: Llama-3 and Yi 6B used −5, the `<|eot_id|>` and `<|im_end|>`-type tokens, rather than the last token.
- Llama-3 70B's selected direction barely meets the induce criterion (0.126). So the direction best for bypass is not always strong for induction, a hint that "necessary" and "sufficient" are not equally clean everywhere.

### Gaps
- The paper text does not give per-model JailbreakBench refusal and safety scores for all 13 models; they are only in the Figure 1 and 3 bar charts, which I could not read numerically. Only Llama-3 8B has exact numbers (Table 10).
- I did not read the Arditi & Obeso 2023 Alignment Forum precursor or Panickssery 2023 directly; they are cited here via the paper's contribution statement.

---

## Q2. Precursors: RepE, ActAdd/CAA steering, ITI, the April 2024 post, the linear representation hypothesis

### Takeaway
Abliteration combines established ideas. Concepts are linear directions (the linear representation hypothesis). Directions can be found from contrastive pairs by difference-in-means (RepE, CAA, Marks & Tegmark). Adding or subtracting them steers behavior (ActAdd, CAA, ITI). Concepts can be linearly erased (LEACE / concept scrubbing). Arditi et al.'s new contributions were: showing that *ablating* one direction everywhere disables refusal across many open models; turning that into a rank-one weight edit; and the suffix-mechanism analysis.

### Cited Findings
- **Linear Representation Hypothesis** (Park, Choe & Veitch, submitted 7 Nov 2023): formalizes "linear representation" counterfactually in two spaces. The output (unembedding) space connects to probing and the input (embedding) space to steering. They identify a non-Euclidean "causal inner product" that unifies these notions, show probes and steering vectors can be built from counterfactual pairs, and run experiments on LLaMA-2 — [arXiv 2311.03658](https://arxiv.org/abs/2311.03658)
- **Representation Engineering (RepE)** (Zou et al., 2 Oct 2023): makes population-level representations, rather than neurons or circuits, the unit of analysis for monitoring and manipulating concepts such as honesty, harmlessness and power-seeking — [arXiv 2310.01405](https://arxiv.org/abs/2310.01405)
  - In §6.2 they extract "harmfulness" directions from harmful/harmless contrast pairs in Vicuna 13B. These classify inputs accurately even when jailbreak suffixes are appended, while refusal changes; so the directions are "not predictive of model refusal." Adding the harmfulness direction raised refusal on harmless prompts by 8 percentage points. They also introduce a piece-wise intervention that amplifies harmfulness to robustify against suffixes — [LessWrong post, related work](https://www.lesswrong.com/posts/jGuXSZgv6qfdhMCuJ/refusal-in-llms-is-mediated-by-a-single-direction)
- **ActAdd** (Turner et al., 20 Aug 2023): "activation engineering." A steering vector is the activation difference on a prompt pair (e.g. "Love" − "Hate") and is added during the forward pass. It needs no optimization and "works with a single pair of data points" — [arXiv 2308.10248](https://arxiv.org/abs/2308.10248)
- **Contrastive Activation Addition (CAA)** (Rimsky/Panickssery et al., 9 Dec 2023): averages residual-stream differences over many positive and negative example pairs. The vector is added "at all token positions after the user's prompt" with a positive or negative coefficient, on Llama 2 Chat — [arXiv 2312.06681](https://arxiv.org/abs/2312.06681)
  - Their refusal vector, built from multiple-choice contrast pairs, steered multiple-choice answers but did not bypass refusal in long-form generation — [arXiv 2406.11717 §6](https://arxiv.org/html/2406.11717v3)
- **Inference-Time Intervention (ITI)** (Li et al., 6 Jun 2023): shifts activations along "truthful" directions in a limited number of attention heads. It raised Alpaca's TruthfulQA from 32.5% to 65.1%, with a truthfulness/helpfulness trade-off controlled by intervention strength, using "only few hundred examples" — [arXiv 2306.03341](https://arxiv.org/abs/2306.03341)
- **Linear concept erasure:** Arditi et al. cite LEACE (Belrose et al. 2023/24), Belrose's diff-in-means post ("Diff-in-means concept editing is worst-case optimal"), and INLP-style erasure (Ravfogel et al. 2020) as evidence that "the assumption that features are represented linearly has been effective for erasing concepts" — [arXiv 2406.11717 §6](https://arxiv.org/html/2406.11717v3)
  - The blog post notes that Belrose et al.'s "concept scrubbing" erases a concept at every layer, applied to part-of-speech and gender bias — [LessWrong post](https://www.lesswrong.com/posts/jGuXSZgv6qfdhMCuJ/refusal-in-llms-is-mediated-by-a-single-direction)
- **Other refusal-specific precursors** cited by Arditi et al.:
  - Zheng et al. 2024: harmful and harmless inputs are linearly separable, and system prompts shift activations along a different direction.
  - Wang & Shu 2024: "Trojan Activation Attack," which bypasses refusal with steering vectors at inference.
  - Li et al. 2024b: zeroing "safety pattern" neurons.
  - Wei et al. 2024: removing safety-critical neurons and ranks.
  - Lee et al. 2024: undoing toxicity fine-tuning by scaling a few MLP weights.

  Source: [arXiv 2406.11717 §6](https://arxiv.org/html/2406.11717v3)
- **The LessWrong/AF post** "Refusal in LLMs is mediated by a single direction" (Arditi, Obeso, Syed, Gurnee, Nanda), 27 Apr 2024, written in Neel Nanda's MATS Winter 2023-24 stream; related-work section added 28 Apr; arXiv paper announced 18 Jun 2024.
  - The authors first tried circuit-style methods (activation, path and attribution patching) and found "rough outlines of a circuit" but little insight, so they moved to the feature level. They hypothesized a single bottleneck "should refuse" feature.
  - PCA of last-token activations: "harmful and harmless activations are separated solely by the first PCA component" at mid-to-late layers, and after some layer "the first principle component becomes identical to the mean difference."
  - Models: Qwen 1.8B/7B/14B/72B, Gemma 2B/7B, Yi 6B/34B, Llama-3 8B/70B. Llama-2 was added in the paper.
  - The post introduced weight orthogonalization as feature ablation via orthogonalizing each W_out.
  - Ethics stance: no new risk, since fine-tuning attacks were already known and base models were already public.

  Source: [LessWrong post](https://www.lesswrong.com/posts/jGuXSZgv6qfdhMCuJ/refusal-in-llms-is-mediated-by-a-single-direction)

### Inferences
- The "single direction" claim is causal (necessity via ablation, sufficiency via addition), which is stronger than RepE's correlational and probing claims. The two literatures disagree on whether the harm-related direction is affected by jailbreaks. Zhao et al. 2025 (Q3) later reconciles this: Zou et al.'s *harmfulness* direction and Arditi's *refusal* direction are different directions read at different token positions.

### Gaps
- I did not re-verify the RepE §6.2 numbers (the 8-pp increase) in the RepE paper itself; the figure comes from the Arditi et al. blog post's summary of it.

---

## Q3. Follow-up mechanistic work on refusal (2024–2026)

### Takeaway
Follow-up work refines the single-direction picture without overturning it:
- **Ablation can be refined:** affine concept editing for some architectures; gradient-optimized directions with fewer side effects.
- **Refusal is separable from harm judgments:** harmfulness is encoded separately, at the last instruction token rather than the post-instruction tokens.
- **The direction generalizes:** it transfers across languages and from chat to base models, and it is a shared mechanism exploited by jailbreaks (ReFAT).
- **The geometry is richer:** cones, secondary directions, category-specific directions, SAE latents.
- **The direction is learned in a specific way:** it pre-exists in base models, is amplified by post-training, drifts under fine-tuning, and its low-rank concentration comes from formulaic refusal openings.

### Cited Findings

**Affine concept editing (ACE)** — Marshall, Scherlis, Belrose (EleutherAI); "Refusal in LLMs is an Affine Function"; arXiv 2411.09003, v3 28 Jan 2025
- The paper decomposes activations affinely and shows CAA (v′ = v + αr) and directional ablation (v′ = v − proj_r(v)) are each subsets of its terms.
- Ablation projects onto a linear subspace through the *origin*. Arditi's ablate-then-add (Eq. 4: v′ = v − proj_r(v) + r) removes all linearly accessible information, but "no guarantee is made that the resulting vector will end up in a meaningful location."
- ACE: v′ = v − proj_r(v) + proj_r(r⁻) + α r, with r = r⁺ − r⁻ (the difference of the behavior and null-behavior means). The reference point is the harmless mean r⁻, not 0. α = 0 should give harmless-like behavior and α = 1 refusal-like.
- Tested on ten models including Llama 3 70B and an RNN (Hermes Eagle RWKV v5), scored with an LLM judge.
- **Key failure case:** on RWKV v5, plain directional ablation "caused the model to output nonsense" and "amounted to an undesirably strong intervention… unlike in Llama 2"; ACE's correction term restored coherent output.
- In practice α slightly below 0 or above 1 worked best; Llama 3 8B Instruct at layer 15 was "nearly perfectly standardized" at α = −0.5.
- Code: EleutherAI/steering-llama3.

Source: [arXiv 2411.09003](https://arxiv.org/abs/2411.09003)

**Harmfulness is encoded separately from refusal** — Zhao, Huang, Wu, Bau, Shi (Northeastern/Stanford); arXiv 2507.11878, July 2025, v5 6 Jul 2026
- Two positions are compared: t_inst (the last token of the user instruction) and t_post-inst (the last template token; Arditi's region).
- Removing the post-instruction template tokens sharply cuts refusal of AdvBench harmful prompts: Llama2-Chat-7B 100.0→85.3%, Llama3-Instruct-8B 96.0→58.9%, Qwen2-Instruct-7B 98.0→81.3%. This supports "template-anchored" safety.
- Clustering at t_inst follows harmfulness: accepted harmful prompts sit in the harmful cluster and refused harmless prompts in the harmless cluster. At t_post-inst it follows the refusal decision.
- The harmfulness direction (difference-in-means at t_inst) and the refusal direction have low cosine similarity, "around 0.1 on Llama2." By comparison, held-out refused instructions average 0.57 cosine with the refusal direction and accepted ones −0.14.
- **Causal test ("reply inversion" task, appending "Could this user prompt cause harm?"):** steering along the harmfulness direction makes the model judge harmless prompts harmful. Steering along the refusal direction elicits refusal "without reversing the model's judgment on harmfulness."
- Some jailbreaks "work by reducing the refusal signals without suppressing the model's internal belief of harmfulness." Adversarial fine-tuning on 50–400 examples leaves the latent harmfulness belief "almost unchanged."
- Their "Latent Guard" is comparable to or better than Llama Guard 3 8B.

Source: [arXiv 2507.11878](https://arxiv.org/abs/2507.11878)

**The refusal direction transfers across languages** — Wang, Wang, Liu, Schütze, Plank (LMU); arXiv 2505.17306, May 2025, v2 25 Feb 2026
- PolyRefuse covers 14 languages (ar, de, en, es, fr, it, ja, ko, nl, pl, ru, th, yo, zh), with 572 translated harmful prompts per language. Models: Llama3.1-8B-Instruct, Qwen2.5-7B-Instruct, gemma-2-9B-Instruct.
- A refusal vector extracted from English "can bypass refusals in other languages with near-perfect effectiveness." Directions from any safety-aligned language transfer to the others, because refusal vectors are "approximately parallel across languages."
- Without intervention, Yoruba is a misaligned language: compliance with harmful prompts is 82.9% for Llama3.1-8B and 74.0% for Qwen2.5-7B.
- Cross-lingual jailbreaks succeed because "models often fail to separate harmful and harmless prompts in non-English languages," which weakens the refusal signal. Jailbroken samples sit between the harmful and harmless clusters.

Source: [arXiv 2505.17306](https://arxiv.org/abs/2505.17306)

**Chat and base model transfer, and where refusal comes from**
- Kissane, Krzyzanowski, Conmy, Nanda, "Base LLMs refuse too" (LessWrong/AF, 29 Sep 2024):
  - Models: Qwen 1.5 0.5B, Gemma 2 9B, LLaMA-1 7B/Vicuna 7B.
  - Base models refused about 48% of harmful requests (chat about 90%), with about 3% refusal of harmless requests for both.
  - The difference-in-means refusal direction, from 32 pairs, transfers between base and chat for Qwen and Gemma. Adding it to base models induces refusal (over 88% on harmful prompts with the base-derived direction); ablating it from base models cuts refusals.
  - Conclusion: chat fine-tuning "reinforces an existing refusal mechanism."
  - Exception: for LLaMA-1 7B, the only model with purely pre-ChatGPT pre-training, directions transfer less well and ablation did not significantly change base refusals.
  - Code: ckkissane/base-models-refuse.

  Source: [LessWrong](https://www.lesswrong.com/posts/YWo2cKJgL7Lg8xWjj/base-llms-refuse-too)
- Labunets (UC San Diego), "Refusal geometry reflects refusal training…", arXiv 2608.25390, 26 Aug 2026 (v2 3 Sep 2026); case study on OLMo-2-0425-1B-Instruct:
  - Across the released Base→SFT→DPO→RLVR1→Instruct checkpoints, using 60 AdvBench prompts, the base checkpoint has no attack-effective direction. A functional refusal direction exists by SFT, but its refusal delta is "substantially smaller" than at DPO, RLVR1 and Instruct, and directions after SFT stay highly aligned with the final Instruct direction.
  - Cross-entropy losses on the *first tokens* of refusal completions induce activation changes that "explain the resulting refusal direction and refusal subspace." Brittleness is "associated with repetitive refusal starts," which concentrate gradients in a low-stable-rank subspace.
  - Diversifying refusal openings raises stable rank and weakens single-vector ablation at a matched baseline refusal rate.

  Source: [arXiv 2608.25390](https://arxiv.org/abs/2608.25390)
- Jain et al., "What Makes and Breaks Safety Fine-tuning? A Mechanistic Study" (NeurIPS 2024; arXiv 2407.10264, v3 21 Aug 2024):
  - Using a synthetic task×concept framework, plus Llama-2 7B and Llama-3 8B, they find supervised safety fine-tuning, DPO and unlearning "minimally transform MLP weights to specifically align unsafe inputs into its weights' null space." Inputs then cluster by whether the model deems them safe.
  - Jailbreak activations land "closer to safer samples."

  Source: [arXiv 2407.10264](https://arxiv.org/abs/2407.10264)
- ProCon, "Anchoring Refusal Direction" (arXiv 2509.06795, 8 Sep 2025): during benign instruction fine-tuning the refusal direction "tends to drift," which they identify as one cause of IFT safety loss. They observe "early-stage sharp drift." Their fix is a projection-constrained loss on each sample's hidden-state projection onto r, with stronger constraints early (warm-up) — [arXiv 2509.06795](https://arxiv.org/abs/2509.06795)

**Multi-dimensional geometry**
- Wollschläger et al. (TUM), "The Geometry of Refusal in LLMs: Concept Cones and Representational Independence" (ICML 2025; arXiv 2502.17420, v2 8 Feb 2026):
  - **Refusal Direction Optimization (RDO)** learns r by gradient descent with three losses: a CE loss to a refusal target on harmless prompts when r is *added* at layer l; a CE loss to an answer target on harmful prompts when r is *ablated*; and a KL "retain" loss on harmless prompts under ablation.
  - Models: Gemma 2 2B/9B, Llama-3 8B, Qwen2.5 1.5B/3B/7B/14B. RDO directions hurt TruthfulQA less than difference-in-means (DIM). Directional-ablation TruthfulQA, DIM / RDO / baseline: Gemma 2 9B 52.8/56.7/61.1; Qwen 2.5 14B 63.3/67.9/70.8; Llama 3 8B 48.7/51.0/52.8.
  - **Concept cones:** refusal is mediated by multi-dimensional polyhedral cones, tested by sampling 256 unit vectors per cone. Cones of dimension "up to five" were found "across all tested models," and "larger models appear to support higher-dimensional refusal cones" (Qwen2.5 family).
  - "Orthogonality alone does not imply independence under intervention," which motivates "representational independence." They identify several mechanistically independent refusal directions.

  Source: [arXiv 2502.17420](https://arxiv.org/abs/2502.17420)
- Pan et al., "The Hidden Dimensions of LLM Alignment" (arXiv 2502.09674, v4 27 May 2025):
  - They study the "safety residual space," the representation shift from safety fine-tuning Llama 3 8B to refuse jailbreaks, via SVD of (W − I).
  - "A dominant direction governs the model's refusal behavior, while multiple smaller directions represent distinct and interpretable features like hypothetical narrative and role-playing."
  - Secondary directions promote or suppress the dominant one, and removing "trigger tokens" from harmful queries bypasses safety.

  Source: [arXiv 2502.09674](https://arxiv.org/abs/2502.09674)
- Joad et al. (QCRI), "There Is More to Refusal in LLMs than a Single Direction" (arXiv 2602.02132, v2 15 Sep 2026):
  - Across 11 refusal/non-compliance categories (safety, content policy, capability, underspecification and others), the refusal directions are geometrically distinct. On Gemma-2-9B-IT they cluster into a safety/content-policy group and a capability/underspecification group.
  - Yet "steering along any refusal-related direction produces nearly identical refusal–over-refusal trade-offs, acting as a shared one-dimensional control knob." The directions differ in "how it refuses," not whether. Ablation shows "multiple refusal components remain."
  - SAEs reveal "a reusable core of shared refusal latents supplemented by style- and domain-specific latents."
  - Setup (32 harmful and 32 benign prompts):
    - gemma-2-9b-it: layer 20, position −2, steering α=100.
    - Llama-3-8B-Instruct: steering at layer 16 / position −2 with α=2.5; ablation at layer 12 / position −5 (eot_id).
    - Qwen-7B-Chat: layer 14, position −1.

  Source: [arXiv 2602.02132](https://arxiv.org/abs/2602.02132)

**SAE-based refusal features**
- O'Brien et al. (EleutherAI/Microsoft), "Steering Language Model Refusal with Sparse Autoencoders" (arXiv 2411.11296, v2 22 May 2025):
  - SAEs trained on Phi-3 Mini. Features 7866, 10120, 13829, 14815 and 22373 mediate refusal; 22373 was used, clamped to 10 or 12.
  - Clamping raises unsafe-prompt refusal and multi-turn jailbreak robustness, but causes "systematic degradation of performance across multiple benchmark tasks, even on safe inputs." Their reading: refusal features "may be more deeply entangled with general language model capabilities than previously understood."
  - Table 2 shows large over-refusal and accuracy drops, e.g. one safe-prompt metric 96.8% → 41.35% / 40.40% at clamps 10 / 12. I could not cleanly map the numbers to column labels from the extracted text.

  Source: [arXiv 2411.11296](https://arxiv.org/abs/2411.11296)
- Yeo et al., "Understanding Refusal in Language Models with Sparse Autoencoders" (arXiv 2505.23556, 29 May 2025; Findings of EMNLP 2025):
  - Uses Gemma-2-2B with GemmaScope (expansion ×32) and Llama-3.1-8B with LlamaScope (×8).
  - Finds SAE latents that causally mediate refusal, studies upstream-to-downstream latent relationships and jailbreak mechanisms, and shows refusal features improve out-of-distribution adversarial probe generalization.

  Sources: [arXiv 2505.23556](https://arxiv.org/abs/2505.23556); [ACL Anthology](https://preview.aclanthology.org/dashboard/2025.findings-emnlp.338)

**Refusal direction as a shared jailbreak mechanism, and defenses built on it**
- ReFAT (Yu et al., arXiv 2409.20089, v2 20 Mar 2025):
  - "Adversarial attacks share a universal mechanism… by ablating… the refusal feature." On 400 HarmBench requests, GCG, PAIR, AutoDAN and HumanJailbreaks shift representations along the negative refusal direction (shown for Llama-3-8B-Instruct, layer 16).
  - Refusal feature ablation "approximates the worst-case perturbation." Adversarial training with simulated RFA (ReFAT) improves robustness of three LLMs at lower cost.

  Source: [arXiv 2409.20089](https://arxiv.org/abs/2409.20089)
- False-refusal vector ablation (Wang et al., arXiv 2410.03415, v2 3 Mar 2025):
  - They extract a "true refusal" vector (harmful − harmless) and a "false refusal" vector (pseudo-harmful − harmless). Ablating the raw false-refusal vector also raises compliance on harmful data, because the two vectors "are not independent."
  - Orthogonalizing the false-refusal vector against the true one, then ablating, reduces over-refusal while keeping safety. Partial orthogonalization gives fine-grained calibration.

  Source: [arXiv 2410.03415](https://arxiv.org/abs/2410.03415)
- Refusal tokens (Jain et al., arXiv 2412.06748, v2 29 Aug 2025): category-specific "refusal tokens" are prepended to responses during training. Refusal rates can then be controlled at inference by changing those tokens' probabilities, with no re-training — [arXiv 2412.06748](https://arxiv.org/abs/2412.06748)
- Universal refusal circuits (arXiv 2601.16034, v2 25 Jan 2026): "Trajectory Replay via Concept-Basis Reconstruction" transfers refusal-ablation interventions from a donor to a target model, including Dense→MoE. A "weight-SVD stability guard" projects interventions away from high-variance weight subspaces. Across 8 model pairs, including GPT-OSS-20B and GLM-4.6V, transferred recipes "consistently attenuate refusal while maintaining performance" — [arXiv 2601.16034](https://arxiv.org/abs/2601.16034)

### Inferences
- Taken together, Zhao et al. 2025 and Arditi et al. 2024 suggest abliteration removes the *decision/expression* signal formed at the template tokens, not the model's knowledge that a request is harmful. This explains three observations: abliterated models can still recognize and discuss harm (Arditi App. L.3); TruthfulQA, whose categories are refusal-adjacent, degrades; and abliteration's footprint is small.
- The base-model results (Arditi App. J; Kissane et al.) and OLMo checkpoints (Labunets) point to one story: post-training amplifies and routes a pre-existing harmful/harmless distinction into a low-rank "refuse" signal. The DPO and RL stages appear to strengthen it beyond SFT, though Labunets says this comparison is confounded.

### Gaps
- I found no controlled study isolating how SFT vs DPO vs RLHF each shape the refusal direction. The OLMo comparison is descriptive and confounded, and a LessWrong post comparing SFT, ORPO and reasoning-augmented SFT surfaced in search but was not read.
- O'Brien Table 2 column mapping was not fully recovered. ProCon's exact cosine-drift numbers were not extracted.

---

## Q4. Why does one linear direction suffice, and where does it fail?

### Takeaway
One direction suffices largely because of how refusal is trained:
- Refusals are short and formulaic, and they are anchored to the template tokens.
- First-token cross-entropy gradients concentrate the learned change into a low-stable-rank subspace that is shared across harm categories.
- Post-training hooks into a harmful/harmless distinction that already exists in base models.
- The refusal decision is computed downstream of, and separately from, the harmfulness judgment, at the post-instruction tokens.

The picture is incomplete in several ways:
- Refusal lives in multi-dimensional cones, with category-specific directions and secondary directions.
- Plain ablation can break some architectures (RWKV) and costs capability on some models; math is most sensitive.
- It is defeated by training that spreads refusal signals (extended or diverse refusals) or deliberately builds redundant, independent refusal pathways.
- Its scaling to much larger or newer (reasoning, MoE) models is not well characterized in peer-reviewed work.

### Cited Findings

**Mechanistic reasons a single direction works**
- **Shallow, first-token alignment.** Qi et al. (arXiv 2406.05946, 10 Jun 2024) argue that "safety alignment can take shortcuts, wherein the alignment adapts a model's generative distribution primarily over only its very first few output tokens" ("shallow safety alignment"). This explains vulnerability to suffix, prefilling, decoding-parameter and fine-tuning attacks; training alignment deeper than the first few tokens improves robustness — [arXiv 2406.05946](https://arxiv.org/abs/2406.05946)
- **Low-rank concentration from formulaic refusals.** First-token CE losses on refusal completions produce refusal residuals of low stable rank. "Repetitive refusal starts" are linked to brittleness, and diverse refusal starts raise stable rank and weaken single-vector ablation — [arXiv 2608.25390](https://arxiv.org/abs/2608.25390)
- **Refusal is a decision signal at the template tokens.** It is separate from the harmfulness concept at t_inst, with cosine about 0.1 between the two directions on Llama2. Removing the template tokens alone drops Llama-3-8B's AdvBench refusal from 96.0% to 58.9% — [arXiv 2507.11878](https://arxiv.org/abs/2507.11878)
- **Safety fine-tuning is a minimal transformation.** Safety FT minimally transforms MLP weights to route unsafe inputs into a null space, clustering safe and unsafe inputs — [arXiv 2407.10264](https://arxiv.org/abs/2407.10264). Arditi et al. likewise cite evidence that "fine-tuning does not significantly alter relevant internal circuitry" — [arXiv 2406.11717 §6](https://arxiv.org/html/2406.11717v3)
- **The direction pre-exists in base models** and is repurposed — [arXiv 2406.11717 App. J](https://arxiv.org/html/2406.11717v3); [Kissane et al. 2024](https://www.lesswrong.com/posts/YWo2cKJgL7Lg8xWjj/base-llms-refuse-too)
- **A shared one-dimensional knob despite diverse directions.** Steering along any category's refusal direction gives "nearly identical refusal–over-refusal trade-offs," explained by "a reusable core of shared refusal latents" — [arXiv 2602.02132](https://arxiv.org/abs/2602.02132)
- **One dominant direction among secondary ones.** In Llama 3 8B's safety-tuning residual space, "a dominant direction governs the model's refusal behavior" — [arXiv 2502.09674](https://arxiv.org/abs/2502.09674)
- **"Fail-open" design.** Current refusal mechanisms "encode refusal behaviors across multiple latent features," but "suppressing a single dominant feature… can cause alignment to collapse" — [arXiv 2602.16977](https://arxiv.org/abs/2602.16977) (19 Feb 2026)
- **Why ablation preserves capability better than subtraction.** Ablation moves harmful activations toward harmless ones along r̂ without pushing harmless activations off-distribution, whereas subtracting r does push them off. On-distribution CE for Llama-3 8B is 0.213 for ablation versus 0.441 for subtraction (baseline 0.195) — [arXiv 2406.11717 App. I.1, Table 9–10](https://arxiv.org/html/2406.11717v3)

**Where the single-direction account fails or degrades**
- **Multi-dimensional cones.** Refusal cones up to 5 dimensions exist in all tested Gemma 2, Llama-3 and Qwen2.5 models; larger Qwen2.5 models support higher-dimensional cones; orthogonal directions are not necessarily independent under intervention — [arXiv 2502.17420](https://arxiv.org/abs/2502.17420)
- **Distinct per-category directions.** Ablating one direction leaves "multiple refusal components" — [arXiv 2602.02132](https://arxiv.org/abs/2602.02132)
- **Architecture sensitivity.** On RWKV v5 (Hermes Eagle), directional ablation produced nonsense and needed ACE's affine correction — [arXiv 2411.09003](https://arxiv.org/abs/2411.09003)
- **Pre-ChatGPT model.** For LLaMA-1 7B and Vicuna, directions transfer poorly between base and chat, and refusal "may not be mediated by a single direction in this model" — [Kissane et al. 2024](https://www.lesswrong.com/posts/YWo2cKJgL7Lg8xWjj/base-llms-refuse-too)
- **Model-specific weakness in the original paper:**
  - Orthogonalized Llama-2 models stay largely safe under their default system prompt (HarmBench ASR 4.4–22.6%, versus 61–80% without it).
  - Llama-3 70B's chosen direction has a weak induce score (0.126).
  - Qwen 7B lost 6.3 GSM8K points; Yi 34B lost 1.4 on MMLU and 1.3 on WinoGrande.
  - TruthfulQA fell for all 13 models (by 1.0 to 6.3 points).

  Source: [arXiv 2406.11717](https://arxiv.org/html/2406.11717v3)
- **Training-time defenses that defeat abliteration:**
  - **Extended-refusal fine-tuning** (KAUST; arXiv 2505.19056, v2 7 Oct 2025). Responses give a neutral topic overview, an explicit refusal and a short ethical rationale. Data: 4,289 harmful prompts from Beavertails, AdvBench, StrongReject and TDC-2023 with GPT-4o refusals, plus 5,711 Alpaca-GPT4 pairs (10k total), trained 3 epochs at learning rate 1e-6.

    | Model | Refusal after abliteration: baseline → Extended | MMLU cost (Extended, before → after) |
    |---|---|---|
    | Llama-2-7B-Chat | 20.7% → 92.7% | 46.4 → 41.8 |
    | Qwen2.5-3B | 15.1% → 90.9% | — |
    | Qwen2.5-1.5B | 13.6% → 96.7% | — |

    The Qwen2.5-1.5B-Extended model's perplexity rose 26.7 → 49.5 after abliteration. Abliteration shrank the harmful/benign centroid distance by 28.8 / 33.9 / 28.7 points for the baseline models versus 10.0 / 7.7 / 13.7 for the Extended models. For Extended models, candidate directions that lower refusal also lower utility, "the impact of abliterating more diffused refusal vectors."

    Source: [arXiv 2505.19056](https://arxiv.org/abs/2505.19056)
  - **Diverse refusal prefixes** raise stable rank and resist single-vector ablation — [arXiv 2608.25390](https://arxiv.org/abs/2608.25390)
  - **Fail-closed alignment:** progressive training "iteratively identifies and ablates previously learned refusal directions" (using RDO), "forcing the model to reconstruct safety along new, independent subspaces." The result is models with "multiple, causally independent refusal directions that prompt-based jailbreaks cannot suppress simultaneously" — [arXiv 2602.16977](https://arxiv.org/abs/2602.16977)
  - **ReFAT:** adversarial training under simulated refusal-feature ablation — [arXiv 2409.20089](https://arxiv.org/abs/2409.20089)
- **Capability side-effects in practice (tool comparison).** Young (UNLV; arXiv 2512.13655, v2 8 Jan 2026) compared four abliteration tools (Heretic, DECCP, ErisForge, FailSpy) on sixteen 7B–14B instruct models. "Mathematical reasoning capabilities exhibit the highest sensitivity to abliteration," with GSM8K changes from +1.51 to −18.81 pp (−26.5% relative). Single-pass methods were gentler (average GSM8K Δ: ErisForge −0.28 pp, DECCP −0.13 pp), while Bayesian-optimized abliteration (Heretic) showed KL 0.043–1.646 — [arXiv 2512.13655](https://arxiv.org/abs/2512.13655)
- **Entanglement with capabilities.** Amplifying SAE refusal features degrades unrelated benchmarks — [arXiv 2411.11296](https://arxiv.org/abs/2411.11296). The false-refusal and true-refusal vectors are entangled and must be orthogonalized — [arXiv 2410.03415](https://arxiv.org/abs/2410.03415)
- **Nonlinearity claims (weaker evidence).** Hildebrandt, Maier, Krauss (FAU; arXiv 2501.08145, 14 Jan 2025) study six LLMs from three families with PCA, t-SNE and UMAP, and argue refusal "exhibit[s] nonlinear, multidimensional characteristics that vary by model architecture and layer." The evidence is dimensionality-reduction visualization, not causal intervention — [arXiv 2501.08145](https://arxiv.org/abs/2501.08145)
- **Language coverage.** Refusal vectors are parallel across languages, but harmful/harmless separation is weaker in non-English (especially Llama3.1-8B), so the direction is expressed less strongly there — [arXiv 2505.17306](https://arxiv.org/abs/2505.17306)

### Inferences
- The best-supported account of "why one direction": standard safety data gives near-identical, short refusal openings ("I cannot…", "I'm sorry…") across all harm categories. The first-token gradient signal is therefore nearly the same vector for every harmful prompt, and post-training writes a near-rank-one "begin refusal" feature into the residual stream at the template tokens. Difference-in-means recovers that feature and orthogonalization removes the model's ability to write it. This synthesizes Labunets 2026, Qi et al. 2024, Zhao et al. 2025 and Arditi et al. 2024; no single paper establishes it end to end.
- "Single direction" is best read as "a dominant, shared direction that is causally sufficient for most refusals in most standardly aligned models," not "refusal is one-dimensional." Several observations fit this reading: cones, secondary directions, per-category directions, residual refusals after ablation, and model-specific failures.
- Models trained with diverse or extended refusals, redundant independent refusal pathways (fail-closed), or adversarial training against refusal-feature ablation (ReFAT) should be expected to resist single-direction abliteration. They may need multi-direction ablation, at greater capability cost, per Young 2025 and the Extended-refusal utility trade-off.

### Gaps
- I found no peer-reviewed, systematic study of single-direction abliteration on frontier-scale (>100B) dense models, MoE models, or long-chain-of-thought "reasoning" models. Arditi's largest model was 72B. Evidence on newer architectures comes mostly from the transfer paper (2601.16034, GPT-OSS-20B and GLM-4.6V) and practitioner tools, not controlled studies.
- Whether larger models need more dimensions rests mainly on Wollschläger et al.'s Qwen2.5 cone analysis (1.5B–14B). No 70B+ cone analysis was found.
- The coinage and popularization timeline for "abliteration" beyond FailSpy's model card is from secondary sources only. Maxime Labonne's Hugging Face post "Uncensor any LLM with abliteration," reportedly 13 Jun 2024, was not fetched.
