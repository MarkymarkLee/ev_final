# 🧠 Enhancing the SQA3D Dataset with Gemini

This project explores whether **Gemini**, a multimodal large language model (LLM), can generate **higher-quality Situated Question Answering (SQA) data** than the original **SQA3D** dataset. 

We extract 3D scene data from ScanNet and prompt Gemini to generate question-answer pairs that require **deep spatial understanding and reasoning**. We also evaluate the generated dataset using both **human feedback** via a web interface and **model-based scoring**.


## 🌐 Website (Human Evaluation Platform)

This is a web interface where users can compare QA pairs from the original SQA3D and our Gemini-enhanced dataset, and rate their quality.

### 🚀 To run locally:

1. Make sure Node.js is installed  
2. Run the development server:

```bash
npm intall
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 🔗 Live Demo:
Try it online here:
👉 https://evfinal.markymark.space/

## 🤖 Gemini (Data Generation & Scoring)

We use Gemini to both generate new QA pairs and evaluate the quality of both Gemini and SQA3D examples.

### 🔧 Available scripts:

```bash
python ./gemini/gemini_infer.py
# Generates (situation, question, answer) from scene data

python ./gemini/gemini_scoring.py
# Evaluates QA quality for both Gemini and SQA3D samples

python ./gemini/upload.py
# Uploads Gemini-generated data to Supabase
```

You can see our prompt in gemini/gemini_prompt.txt

## 📊 Poster

You can see our poster in EV_group1.pdf