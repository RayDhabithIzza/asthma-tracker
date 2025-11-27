const express = require('express');
const path = require('path');
const { RandomForestClassifier } = require('ml-random-forest');


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const FEATURE_ORDER = ['smoke_chest_tightness','cold_dust_trigger','family_asthma','exercise_trigger','night_shortness','laugh_trigger','gender','age_group'];

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
const computeScore = (vals) => {
  const sc = vals.sc;
  const cd = vals.cd;
  const fa = vals.fa;
  const et = vals.et;
  const ns = vals.ns;
  const lt = vals.lt;
  const a = vals.a;
  const scW = sc === 2 ? 3 : sc === 1 ? 1 : 0;
  const nsW = ns === 2 ? 3 : ns === 1 ? 1 : 0;
  const cdW = cd === 1 ? 2 : 0;
  const etW = et === 1 ? 2 : 0;
  const ltW = lt === 1 ? 1 : 0;
  const faW = fa === 1 ? 1 : 0;
  const ageW = a === 3 ? 1 : 0;
  return scW + nsW + cdW + etW + ltW + faW + ageW;
};
for (let sc = 0; sc <= 2; sc++) {
  for (let cd = 0; cd <= 1; cd++) {
    for (let fa = 0; fa <= 1; fa++) {
      for (let et = 0; et <= 1; et++) {
        for (let ns = 0; ns <= 2; ns++) {
          for (let lt = 0; lt <= 1; lt++) {
            for (let g = 0; g <= 1; g++) {
              for (let a = 0; a <= 3; a++) {
                const score = computeScore({ sc, cd, fa, et, ns, lt, g, a });
                const label = score <= 2 ? 0 : score <= 5 ? 1 : 2;
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

const log = (...args) => {
  if (process.env.DEBUG === 'true') {
    console.log(new Date().toISOString(), ...args);
  }
};

const validateInput = (body) => {
  const required = FEATURE_ORDER;
  for (const k of required) {
    if (!(k in body)) return { ok: false, error: `Field '${k}' wajib` };
  }
  const sc = encode.smoke_chest_tightness[body.smoke_chest_tightness];
  const cd = encode.cold_dust_trigger[body.cold_dust_trigger];
  const fa = encode.family_asthma[body.family_asthma];
  const et = encode.exercise_trigger[body.exercise_trigger];
  const ns = encode.night_shortness[body.night_shortness];
  const lt = encode.laugh_trigger[body.laugh_trigger];
  const g = encode.gender[body.gender];
  const a = encode.age_group[body.age_group];
  const arr = [sc, cd, fa, et, ns, lt, g, a];
  if (arr.some(v => v === undefined)) return { ok: false, error: 'Input tidak valid' };
  return { ok: true, vec: [sc, cd, fa, et, ns, lt, g, a] };
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/questionnaire', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'questionnaire.html'));
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/predict', (req, res) => {
  const valid = validateInput(req.body || {});
  if (!valid.ok) {
    res.status(400).json({ error: valid.error });
    return;
  }
  const vec = valid.vec;
  const pred = classifier.predict([vec])[0];
  const score = computeScore({ sc: vec[0], cd: vec[1], fa: vec[2], et: vec[3], ns: vec[4], lt: vec[5], g: vec[6], a: vec[7] });
  const risk = pred === 0 ? 'rendah' : pred === 1 ? 'sedang' : 'tinggi';
  log('predict', { body: req.body, vec, score, pred, risk });
  res.json({ risk });
});

app.use((err, req, res, next) => {
  console.error('error', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Terjadi kesalahan internal' });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
