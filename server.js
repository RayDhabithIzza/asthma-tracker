const express = require('express');
const path = require('path');
const { RandomForestClassifier } = require('ml-random-forest');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const encode = {
  breath_shortness: { 'jarang': 0, 'kadang-kadang': 1, 'sering': 2 },
  smoke_exposure: { 'tidak pernah': 0, 'kadang-kadang': 1, 'sering': 2 },
  allergy: { 'tidak': 0, 'ringan': 1, 'berat': 2 },
  family_history: { 'tidak': 0, 'ya': 1 },
  diagnosed_other: { 'tidak': 0, 'ya': 1 },
  exercise: { 'tidak pernah': 0, 'kadang-kadang': 1, 'sering': 2 },
  fast_food: { 'jarang': 0, 'kadang-kadang': 1, 'sering': 2 },
  smoking: { 'tidak pernah': 0, 'sudah berhenti': 1, 'saat ini merokok': 2 },
  inhaler: { 'tidak': 0, 'ya': 1 },
  meds_breath_cough: { 'tidak': 0, 'ya': 1 }
};

const features = [];
const labels = [];
for (let b = 0; b <= 2; b++) {
  for (let s = 0; s <= 2; s++) {
    for (let a = 0; a <= 2; a++) {
      for (let fh = 0; fh <= 1; fh++) {
        for (let d = 0; d <= 1; d++) {
          for (let ex = 0; ex <= 2; ex++) {
            for (let ff = 0; ff <= 2; ff++) {
              for (let sm = 0; sm <= 2; sm++) {
                for (let inh = 0; inh <= 1; inh++) {
                  for (let md = 0; md <= 1; md++) {
                    const exerciseInverse = 2 - ex;
                    const smokingWeight = sm === 2 ? 3 : sm === 1 ? 1 : 0;
                    const score = (
                      b * 3 +
                      s * 2 +
                      a * 2 +
                      fh * 2 +
                      d * 2 +
                      exerciseInverse * 2 +
                      ff * 2 +
                      smokingWeight +
                      inh * 2 +
                      md * 2
                    );
                    const label = score <= 6 ? 0 : score <= 11 ? 1 : 2;
                    features.push([b, s, a, fh, d, ex, ff, sm, inh, md]);
                    labels.push(label);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

const rfOptions = { seed: 3, maxFeatures: 1, replacement: true, nEstimators: 25 };
const classifier = new RandomForestClassifier(rfOptions);
classifier.train(features, labels);

app.post('/predict', (req, res) => {
  const {
    breath_shortness,
    smoke_exposure,
    allergy,
    family_history,
    diagnosed_other,
    exercise,
    fast_food,
    smoking,
    inhaler,
    meds_breath_cough
  } = req.body || {};

  const b = encode.breath_shortness[breath_shortness];
  const s = encode.smoke_exposure[smoke_exposure];
  const a = encode.allergy[allergy];
  const fh = encode.family_history[family_history];
  const d = encode.diagnosed_other[diagnosed_other];
  const ex = encode.exercise[exercise];
  const ff = encode.fast_food[fast_food];
  const sm = encode.smoking[smoking];
  const inh = encode.inhaler[inhaler];
  const md = encode.meds_breath_cough[meds_breath_cough];
  if ([b, s, a, fh, d, ex, ff, sm, inh, md].some(v => v === undefined)) {
    res.status(400).json({ error: 'Input tidak valid' });
    return;
  }
  const pred = classifier.predict([[b, s, a, fh, d, ex, ff, sm, inh, md]])[0];
  const risk = pred === 0 ? 'rendah' : pred === 1 ? 'sedang' : 'tinggi';
  res.json({ risk });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server berjalan di port ${port}`);
});