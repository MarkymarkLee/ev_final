import supabase
from tqdm import tqdm
import dotenv
import pydantic
from typing import Optional

import os
import json

import base64
import os
import json
from google import genai
from google.genai import types
from collections import defaultdict
import random

import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

dotenv.load_dotenv()

client = supabase.create_client(
    supabase_url=os.getenv("SUPABASE_URL"),
    supabase_key=os.getenv("SUPABASE_KEY")
)

lock = threading.Lock()
output_file = "gemini_scoring_output.json"

def generate(video_file_name, image_file_name, situation=None, question=None, answer=None):
    try:
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

        with open(image_file_name, 'rb') as f:
            image_bytes = f.read()

        myvideo = client.files.upload(file=video_file_name)

        model = "gemini-2.5-flash-preview-05-20"
        contents = [
            myvideo,
            types.Content(
                role="user",
                parts=[types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg')],
            ),
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=f"""You are an expert in spatial reasoning. Your task is to evaluate the quality of a Situation-Question-Answer (SQA) triplet based on a described scene, which includes:
A bird's-eye view description of the environment
A surrounding video providing spatial context
Use the following scoring criteria. For each criterion the QA satisfies, assign 0.2 points.
Scoring Criteria:
You can know where you are based on the situation
You can understand the question perfectly
The answer is correct based on the situation and question
To answer this question, the video or birdeye image of the scene is necessary
To answer this question, you need to understand the 3d relations of the items in the scene and yourself
Your output should include:
Total Score (maximum 1)
List of criteria met (by index, e.g., [1, 3, 5])
And give a explanation for it.
Be concise but precise in your judgment.
Here is the SQA triplet:
Situation: {situation}
Question: {question}
Answer: {answer}""")],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=genai.types.Schema(
                type = genai.types.Type.OBJECT,
                required = ["score", "criteria_list", "explanation"],
                properties = {
                    "score": genai.types.Schema(
                        type = genai.types.Type.NUMBER,
                    ),
                    "criteria_list": genai.types.Schema(
                        type = genai.types.Type.ARRAY,
                        items = genai.types.Schema(
                            type = genai.types.Type.INTEGER,
                        ),
                    ),
                    "explanation": genai.types.Schema(
                        type = genai.types.Type.STRING,
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


def fetch_all_tasks():
    """
    Fetches all tasks from the 'sqa_tasks' table in Supabase.
    """
    try:
        response = client.table('sqa_tasks').select('sceneid', 'situation', 'question', 'answer', 'source', 'id').execute()
        # if response.error:
        #     print(f"Error fetching tasks: {response.error}")
        #     return []

        data = response.data
        return data
    except Exception as e:
        print(f"Unexpected error while fetching tasks: {e}")
        return []

def select_tasks_by_scene(all_tasks):
    """
    Selects 6 tasks per unique sceneid: 3 from 'sqa3d' and 3 from 'gemini'.
    """
    scene_task_map = defaultdict(lambda: {'sqa3d': [], 'gemini': []})

    # Group tasks by sceneid and source
    for task in all_tasks:
        sceneid = task.get('sceneid')
        source = task.get('source')
        if source in ['sqa3d', 'gemini']:
            scene_task_map[sceneid][source].append(task)

    selected_tasks = []

    # For each sceneid, randomly select 3 from each source if available
    for sceneid, sources in scene_task_map.items():
        sqa3d_tasks = random.sample(sources['sqa3d'], min(3, len(sources['sqa3d'])))
        gemini_tasks = random.sample(sources['gemini'], min(3, len(sources['gemini'])))
        
        if len(sqa3d_tasks) == 3 and len(gemini_tasks) == 3:
            selected_tasks.extend(sqa3d_tasks + gemini_tasks)

    return selected_tasks
    
def generate_and_store_result(task):
    sceneid = task.get('sceneid')
    situation = task.get('situation')
    question = task.get('question')
    answer = task.get('answer')
    source = task.get('source')
    id = task.get('id')

    if not sceneid or not situation or not question or not answer:
        print(f"Skipping incomplete task: {task}")
        return

    video_file_name = f"./video/{sceneid}.mp4"
    image_file_name = f"./bird/{sceneid}_bird.png"

    if not os.path.exists(video_file_name) or not os.path.exists(image_file_name):
        print(f"Files for scene {sceneid} do not exist. Skipping.")
        return

    try:
        result = generate(video_file_name, image_file_name, situation, question, answer)
        parsed_result = json.loads(result)
        parsed_result['sceneid'] = sceneid
        parsed_result['source'] = source
        parsed_result['situation'] = situation
        parsed_result['question'] = question
        parsed_result['answer'] = answer
        parsed_result['id'] = id
    except Exception as e:
        print(f"Error during generation for scene {sceneid}: {e}")
        return

    try:
        with lock:
            if os.path.exists(output_file):
                with open(output_file, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            else:
                existing_data = []

            existing_data.append(parsed_result)

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, indent=4)
    except Exception as e:
        print(f"Error writing result for scene {sceneid}: {e}")
        return

if __name__ == "__main__":
    try:
        all_tasks = fetch_all_tasks()
        selected_tasks = select_tasks_by_scene(all_tasks)
    except Exception as e:
        print(f"Failed to fetch tasks: {e}")
        exit(1)

    with ThreadPoolExecutor(max_workers=4) as executor:  # Adjust the number of threads as needed
        futures = [executor.submit(generate_and_store_result, task) for task in selected_tasks]

        for _ in tqdm(as_completed(futures), total=len(futures), desc="Processing tasks"):
            pass


