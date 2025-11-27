const express = require('express');
const path = require('path');
const { RandomForestClassifier } = require('ml-random-forest');


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const encode = {
  smoke_chest_tightness: { 'tidak pernah': 0, 'kadang-kadang': 1, 'sering': 2 },
  cold_dust_trigger: { 'tidak': 0, 'iya': 1 },
  family_asthma: { 'tidak': 0, 'iya': 1 },
  exercise_trigger: { 'tidak': 0, 'iya': 1 },
  night_shortness: { 'tidak pernah': 0, 'kadang-kadang': 1, 'sering': 2 },
  laugh_trigger: { 'tidak': 0, 'iya': 1 },
  gender: { 'laki-laki': 0, 'perempuan': 1 },
  age_group: { 'anak-anak': 0, 'remaja': 1, 'dewasa': 2, 'lansia': 3 }
};

const features = [];
const labels = [];
for (let sc = 0; sc <= 2; sc++) {
  for (let cd = 0; cd <= 1; cd++) {
    for (let fa = 0; fa <= 1; fa++) {
      for (let et = 0; et <= 1; et++) {
        for (let ns = 0; ns <= 2; ns++) {
          for (let lt = 0; lt <= 1; lt++) {
            for (let g = 0; g <= 1; g++) {
              for (let a = 0; a <= 3; a++) {
                const ageW = a === 0 ? 1 : a === 1 ? 1 : a === 2 ? 2 : 3;
                const genderW = g === 1 ? 1 : 0;
                const score = (
                  sc * 3 +
                  ns * 3 +
                  cd * 2 +
                  fa * 2 +
                  et * 2 +
                  lt * 1 +
                  ageW +
                  genderW
                );
                const label = score <= 3 ? 0 : score <= 6 ? 1 : 2;
                features.push([sc, cd, fa, et, ns, lt, g, a]);
                labels.push(label);
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
    gender,
    age_group,
    smoke_chest_tightness,
    cold_dust_trigger,
    family_asthma,
    exercise_trigger,
    night_shortness,
    laugh_trigger
  } = req.body || {};

  const g = encode.gender[gender];
  const a = encode.age_group[age_group];
  const sc = encode.smoke_chest_tightness[smoke_chest_tightness];
  const cd = encode.cold_dust_trigger[cold_dust_trigger];
  const fa = encode.family_asthma[family_asthma];
  const et = encode.exercise_trigger[exercise_trigger];
  const ns = encode.night_shortness[night_shortness];
  const lt = encode.laugh_trigger[laugh_trigger];
  if ([g, a, sc, cd, fa, et, ns, lt].some(v => v === undefined)) {
    res.status(400).json({ error: 'Input tidak valid' });
    return;
  }
  const pred = classifier.predict([[sc, cd, fa, et, ns, lt, g, a]])[0];
  const risk = pred === 0 ? 'rendah' : pred === 1 ? 'sedang' : 'tinggi';
  res.json({ risk });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
