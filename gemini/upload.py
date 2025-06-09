import json
import os
import supabase
import dotenv

dotenv.load_dotenv()

client = supabase.create_client(
    supabase_url=os.getenv("SUPABASE_URL"),
    supabase_key=os.getenv("SUPABASE_KEY")
)

def update_scores_from_json(json_file):
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for item in data:
        task_id = item.get('id')
        score = item.get('score')
        if task_id is None or score is None:
            print(f"Skipping item with missing id or score: {item}")
            continue
        try:
            response = client.table('sqa_tasks').update({
                "gemini_score": score,
                "gemini_tested": True
            }).eq('id', task_id).execute()
            if hasattr(response, 'error') and response.error:
                print(f"Failed to update id {task_id}: {response.error}")
            else:
                print(f"Updated id {task_id} with score {score}")
        except Exception as e:
            print(f"Exception updating id {task_id}: {e}")

if __name__ == "__main__":
    update_scores_from_json("gemini_scoring_output.json")