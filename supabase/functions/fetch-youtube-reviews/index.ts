import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BATCH_SIZE = 10;
const MAX_VIDEOS_PER_RESTAURANT = 3;
const DELAY_MS = 500; // delay between API calls to avoid rate limits

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");

    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({ error: "YOUTUBE_API_KEY not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all restaurants
    const { data: restaurants, error: restaurantsError } = await supabase
      .from("restaurants")
      .select("id, name");

    if (restaurantsError) throw restaurantsError;
    if (!restaurants || restaurants.length === 0) {
      return new Response(
        JSON.stringify({ message: "No restaurants found", inserted: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    // Process in batches
    for (let i = 0; i < restaurants.length; i += BATCH_SIZE) {
      const batch = restaurants.slice(i, i + BATCH_SIZE);

      for (const restaurant of batch) {
        try {
          const query = encodeURIComponent(
            `${restaurant.name} dessert review`
          );
          const searchUrl =
            `https://www.googleapis.com/youtube/v3/search` +
            `?part=snippet` +
            `&q=${query}` +
            `&type=video` +
            `&maxResults=${MAX_VIDEOS_PER_RESTAURANT}` +
            `&videoDuration=short` +
            `&key=${youtubeApiKey}`;

          const res = await fetch(searchUrl);
          if (!res.ok) {
            const text = await res.text();
            errors.push(
              `YouTube API error for "${restaurant.name}": ${res.status} ${text}`
            );
            continue;
          }

          const json = await res.json();

          for (const item of json.items ?? []) {
            const videoId = item.id?.videoId;
            if (!videoId) continue;

            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const thumbnailUrl =
              item.snippet?.thumbnails?.high?.url ??
              item.snippet?.thumbnails?.default?.url ??
              null;

            // Check for duplicates
            const { data: existing } = await supabase
              .from("video_reviews")
              .select("id")
              .eq("video_url", videoUrl)
              .maybeSingle();

            if (existing) {
              totalSkipped++;
              continue;
            }

            const { error: insertError } = await supabase
              .from("video_reviews")
              .insert({
                restaurant_id: restaurant.id,
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl,
              });

            if (insertError) {
              errors.push(
                `Insert error for "${restaurant.name}": ${insertError.message}`
              );
            } else {
              totalInserted++;
            }
          }

          // Delay between restaurants to avoid YouTube rate limits
          await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
        } catch (err) {
          errors.push(
            `Error processing "${restaurant.name}": ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        restaurants_processed: restaurants.length,
        videos_inserted: totalInserted,
        videos_skipped_duplicate: totalSkipped,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
