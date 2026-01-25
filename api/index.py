from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv

from youtube_transcript_api import YouTubeTranscriptApi
from google import genai
import os
import re
import json
from pydantic import BaseModel
from typing import List, Optional
from ddgs import DDGS
from tenacity import retry, stop_after_attempt, wait_exponential
import time
import random


load_dotenv()

app = FastAPI()

# Initialize Gemini Client (Key should be in Vercel Env Vars)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Define retry logic for Gemini generation
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def call_gemini_with_retry(prompt_text):
    return client.models.generate_content(
        model="gemini-3-flash-preview", 
        contents=prompt_text,
        config={
            "response_mime_type": "application/json"
        }
    )

@app.get("/api/generate")
async def generate_itinerary(url: str):
    try:
        # 1. Extract Video ID
        video_id = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11})", url).group(1)
        
        # 2. Get Transcript
        # Instantiate the API class
        yt = YouTubeTranscriptApi()
        transcript = yt.fetch(video_id)
        transcript_text = " ".join([t.text for t in transcript])
        
        prompt = f"""
        Create a detailed day-by-day travel itinerary based on the following transcript.
        Return the response in raw JSON format with the following structure:
        {{
            "trip_title": "Title of the trip",
            "summary": "Brief summary of the trip",
            "days": [
                {{
                    "day_number": 1,
                    "theme": "Theme of the day",
                    "image_query": "A specific search query to find a beautiful image for this day (e.g. 'Eiffel Tower Paris', 'Colosseum Rome')",
                    "activities": [
                        {{
                            "time": "Time of day (e.g., Morning, 10:00 AM)",
                            "activity": "Name of activity",
                            "description": "Description of activity"
                        }}
                    ]
                }}
            ]
        }}
        
        Transcript: {transcript_text[:15000]}
        """
        
        response = call_gemini_with_retry(prompt)
        
        print("\n\n=== Token Usage ===\n")
        print(response.usage_metadata)
        print("\n===================\n")
        
        # Parse JSON
        if not response.text:
            print("Response text is empty. Checking feedback...")
            # print(response.prompt_feedback) # prompt_feedback might not be available on all response types depending on library version, but let's try or just print generic
            return {"error": "The AI model returned an empty response. This might be due to safety filters or overload.", "detail": str(response)}

        try:
            itinerary_data = json.loads(response.text)
            
            # Fetch images for each day
            # print("Fetching images...")
            # with DDGS() as ddgs:
            #     for day in itinerary_data.get("days", []):
            #         query = day.get("image_query")
            #         if query:
            #             # Random delay to avoid rate limits (2-4 seconds)
            #             time.sleep(random.uniform(2, 4))
            #             try:
            #                 # Try fetching once, fail gracefully
            #                 results = list(ddgs.images(query, max_results=1))
            #                 if results:
            #                     day["image_url"] = results[0]["image"]
            #             except Exception as e:
            #                 print(f"Failed to fetch image for {query}: {e}")
            #                 # Optional: Set a placeholder if needed, or leave blank to fallback to UI default
            #                 # day["image_url"] = f"https://placehold.co/800x400?text={query.replace(' ', '+')}"
                            
            return itinerary_data
        except json.JSONDecodeError:
            # Fallback if model fails to return valid JSON (rare with 2.0 Flash + JSON mode)
            return {"error": "Failed to generate structured itinerary", "raw_text": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Serve the frontend

