# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
import os
import json
from google import genai
from google.genai import types

def generate(video_file_name, image_file_name):
    try:
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

        with open(image_file_name, 'rb') as f:
            image_bytes = f.read()

        myvideo = client.files.upload(file=video_file_name)

        model = "gemini-2.5-pro-preview-06-05"
        contents = [
            myvideo,
            types.Content(
                role="user",
                parts=[types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg')],
            ),
            types.Content(
                role="user",
                parts=[types.Part.from_text(text="""You have excellent spatial reasoning skills and are tasked with generating three full examples, each consisting of a unique situation, a question, and the correct answer designed to test deep 3D understanding. Each example must be based on the provided POV (point-of-view) video and bird’s-eye view image.
For each example, follow these steps:
First randomly select a position and a facing direction using the scene information. Then, generate a concise description of the situation from that position and direction, focusing only on the spatial layout and key visual elements relevant to orientation and understanding.
Next, create a challenging question that requires substantial situated 3D reasoning—such as visibility, occlusion, relative direction, object alignment, or what can or cannot be seen from the selected viewpoint. The question must require substantial situated reasoning, and avoid questions that could be answered without reference to the current situation, such as “How many chairs are there in the room?”
Finally, provide the correct answer to the question with no explanation needed.
The goal is to test whether someone can accurately comprehend and reason about spatial relationships using both the POV video and the bird’s-eye view image. Keep the description concise, and ensure the question challenges spatial understanding, not just static observation.
Repeat this process three times, generating three separate examples, and include all of them in your response.
Your response json format should be like this:

{
  "situation_description": [
    "string (description of situation 1)",
    "string (description of situation 2)",
    "string (description of situation 3)"
  ],
  "question": [
    "string (question 1)",
    "string (question 2)",
    "string (question 3)"
  ],
  "answer": [
    "string (answer 1)",
    "string (answer 2)",
    "string (answer 3)"
  ]
}""")],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=genai.types.Schema(
                type=genai.types.Type.OBJECT,
                required=["situation_description", "question", "answer"],
                properties={
                    "situation_description": genai.types.Schema(
                        type=genai.types.Type.ARRAY,
                        items=genai.types.Schema(type=genai.types.Type.STRING),
                    ),
                    "question": genai.types.Schema(
                        type=genai.types.Type.ARRAY,
                        items=genai.types.Schema(type=genai.types.Type.STRING),
                    ),
                    "answer": genai.types.Schema(
                        type=genai.types.Type.ARRAY,
                        items=genai.types.Schema(type=genai.types.Type.STRING),
                    ),
                },
            ),
        )

        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )

        return response.text
    except Exception as e:
        print(f"[Error in generate()] Scene: {video_file_name}, Error: {e}")
        return None

def get_processed_scene_ids(output_file):
    if not os.path.exists(output_file):
        return set()
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return set(entry['sceneid'] for entry in data)
    except Exception as e:
        print(f"[Error reading output file] {e}")
        return set()

if __name__ == "__main__":
    output_file = 'output.json'
    processed_scene_ids = get_processed_scene_ids(output_file)

    for i in range(707):
        scene_id = f'scene{i:04d}_00'
        if scene_id in processed_scene_ids:
            print(f"[Skipped] Scene {scene_id} already processed.")
            continue
        
        video_file_name = f'./video/scene{i:04d}_00.mp4'
        image_file_name = f'./bird/scene{i:04d}_00_bird.png'

        if not os.path.exists(video_file_name) or not os.path.exists(image_file_name):
            print(f"[Skipped] Missing files for scene {i:04d}")
            continue

        print(f"[Processing] Scene {i:04d}")
        output = generate(video_file_name, image_file_name)

        if output is None:
            continue

        try:
            parsed_output = json.loads(output)
            scene_results = []
            for j in range(len(parsed_output["situation_description"])):
                scene_data = {
                    "sceneid": f'scene{i:04d}_00',
                    "situation": parsed_output["situation_description"][j],
                    "question": parsed_output["question"][j],
                    "answer": parsed_output["answer"][j],
                    "split": "train",
                    "source": "gemini"
                }
                scene_results.append(scene_data)

            if os.path.exists(output_file):
                with open(output_file, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            else:
                existing_data = []

            existing_data.extend(scene_results)

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, ensure_ascii=False, indent=4)

            print(f"[Success] Scene {i:04d} written to {output_file}")
        except Exception as e:
            print(f"[Error parsing/writing scene] Scene: {video_file_name}, Error: {e}")
