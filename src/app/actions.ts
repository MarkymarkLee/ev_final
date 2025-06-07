'use server';

// Update the import path if supabaseClient is located elsewhere, e.g.:
import { supabase } from "../../lib/supabaseClient";
import { redirect } from "next/navigation";

type SceneData = { 
    sceneid: string,
    tasks_ids: string[],
    videourl: string,
    imageurl: string,
};

export async function getRandomSceneId() {
    const { data, error } = await supabase
        .rpc("get_random_scene").single<SceneData>();
    
        if (error) {
        console.error("Error fetching random scene ID:", error);
        throw new Error("Failed to fetch random scene ID");
    }
    return data.sceneid;
}

export async function startComparison() {
  const scene_id = await getRandomSceneId();
//   const scene_id = "scene0000_00";
  
  redirect(`/comparison/${scene_id}`)
}
