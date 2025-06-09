This is a project to find out whether gemini can generate a better dataset than sqa3d.

## Website part

First have nodejs installed, then run the development server:

```bash
npm intall
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Or you can just play with the website here https://evfinal.markymark.space/ as we have deploy it.

## Gemini part

You can run the following code to generate data from gemini:

```
python ./gemini/gemini_infer.py
# this can generate situation, question, and answer
python ./gemini/gemini_scoring.py
# this can generate score for the SQA set
python ./gemini/upload.py
# this can upload gemini's data to supabase
```

You can see our prompt in gemini/gemini_prompt.txt

## Poster

You can see our poster in EV_group1.pdf