"""False-positive statistics for the onsystem fresh sample (seed 20261016).

Usage: python3 -I scripts/stats.py sample-labelled.json sample-key.json
Unweighted rates use 95% Wilson intervals. The weighted rate weights each sampled finding by its
rule's population share (stratumPopulation / stratumSampled), with a Wilson interval on the
Kish effective sample size. Strict reading: a false positive whose value the project's own design
system already uses (own_ds_value true) counts as debatable.
"""
import json
import math
import sys
from collections import Counter, defaultdict

Z = 1.959964


def wilson(k, n):
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + Z * Z / n
    c = (p + Z * Z / (2 * n)) / d
    h = Z * math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n)) / d
    return (max(0.0, c - h), min(1.0, c + h))


def pct(x):
    return f"{100 * x:.1f}%"


labelled = json.load(open(sys.argv[1]))['findings']
key = {f['id']: f for f in json.load(open(sys.argv[2]))['findings']}
n = len(labelled)
labels = Counter(f['label'] for f in labelled)
fp = labels['FP']
lo, hi = wilson(fp, n)
print(f"n = {n}: TP {labels['TP']}, debatable {labels['debatable']}, FP {fp}")
print(f"FP (unweighted) {fp}/{n} = {pct(fp / n)} [95% Wilson {pct(lo)}-{pct(hi)}]")
tlo, thi = wilson(labels['TP'], n)
print(f"TP (unweighted) {labels['TP']}/{n} = {pct(labels['TP'] / n)} [{pct(tlo)}-{pct(thi)}]")


def weighted(is_fp):
    w = [key[f['id']]['weight'] for f in labelled]
    s = sum(w)
    p = sum(wi for wi, f in zip(w, labelled) if is_fp(f)) / s
    neff = s * s / sum(wi * wi for wi in w)
    lo, hi = wilson(p * neff, neff)
    return p, lo, hi, neff


p, lo, hi, neff = weighted(lambda f: f['label'] == 'FP')
print(f"FP weighted by rule population: {pct(p)} [95% Wilson on n_eff={neff:.1f}: {pct(lo)}-{pct(hi)}]")

strict = sum(1 for f in labelled if f['label'] == 'FP' and f.get('own_ds_value') is not True)
slo, shi = wilson(strict, n)
print(f"FP strict (own design-system values count as debatable) {strict}/{n} = {pct(strict / n)} [{pct(slo)}-{pct(shi)}]")
p, lo, hi, neff = weighted(lambda f: f['label'] == 'FP' and f.get('own_ds_value') is not True)
print(f"FP strict, weighted: {pct(p)} [{pct(lo)}-{pct(hi)}]")

print("\nPer rule (FP / sampled, 95% Wilson):")
by = defaultdict(list)
for f in labelled:
    by[f['rule']].append(f)
for rule, fs in sorted(by.items(), key=lambda kv: -len(kv[1])):
    k = sum(1 for f in fs if f['label'] == 'FP')
    lo, hi = wilson(k, len(fs))
    c = Counter(f['label'] for f in fs)
    print(f"  {rule}: FP {k}/{len(fs)} [{pct(lo)}-{pct(hi)}]  (TP {c['TP']}, debatable {c['debatable']}); population {key[fs[0]['id']]['stratumPopulation']}")

comp = [f for f in labelled if f['rule'] in ('no-unknown-component', 'no-unknown-prop', 'no-unknown-variant')]
k = sum(1 for f in comp if f['label'] == 'TP')
lo, hi = wilson(len(comp) - k, len(comp))
print(f"\nComponent/prop/variant rules: {k}/{len(comp)} right (FP upper bound {pct(hi)})")
rw = sum(1 for f in labelled if f.get('replacement_wrong') is True)
print(f"Findings whose named replacement was wrong (any label): {rw}")
own = sum(1 for f in labelled if f.get('own_ds_value') is True)
print(f"Findings flagging a value the project's own design system uses (own_ds_value): {own}")
