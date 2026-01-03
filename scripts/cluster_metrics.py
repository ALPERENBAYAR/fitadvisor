import csv
from collections import defaultdict
from datetime import datetime

from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score


def parse_date(value):
    try:
        return datetime.fromisoformat(value).date().isoformat()
    except ValueError:
        return value.split(" ")[0]


def load_avg_hr(path):
    buckets = defaultdict(list)
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            user_id = row.get("Id")
            time_raw = row.get("SecondsTime") or ""
            hr_raw = row.get("HeartRate")
            if not user_id or not hr_raw:
                continue
            date_key = parse_date(time_raw)
            try:
                hr = float(hr_raw)
            except ValueError:
                continue
            buckets[(user_id, date_key)].append(hr)
    return {key: sum(vals) / len(vals) for key, vals in buckets.items() if vals}


def load_steps(path):
    steps = {}
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            user_id = row.get("Id")
            date_key = row.get("ActivityDate")
            steps_raw = row.get("TotalSteps")
            if not user_id or not date_key or not steps_raw:
                continue
            try:
                steps_val = float(steps_raw)
            except ValueError:
                continue
            steps[(user_id, date_key)] = steps_val
    return steps


def build_samples(steps_map, hr_map):
    samples = []
    for key, steps in steps_map.items():
        avg_hr = hr_map.get(key)
        if avg_hr is None:
            continue
        samples.append([steps, avg_hr])
    return samples


def main():
    hr_map = load_avg_hr("Data/Kalp.csv")
    try:
        steps_map = load_steps("Data/Adim.csv")
    except FileNotFoundError:
        steps_map = load_steps("Data/Adım.csv")
    samples = build_samples(steps_map, hr_map)
    if len(samples) < 3:
        raise SystemExit("Yeterli ornek yok: ortak (Id, tarih) verisi bulunamadi.")

    print(f"Samples: {len(samples)}")
    for k in range(2, 6):
        model = KMeans(n_clusters=k, n_init=10, random_state=42)
        labels = model.fit_predict(samples)
        inertia = model.inertia_
        sil = silhouette_score(samples, labels)
        print(f"K: {k} | Inertia: {inertia:.2f} | Silhouette: {sil:.4f}")


if __name__ == "__main__":
    main()
