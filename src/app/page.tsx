'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Activity {
  time: string;
  activity: string;
  description: string;
}

interface Day {
  day_number: number;
  theme: string;
  image_query?: string;
  image_url?: string;
  activities: Activity[];
}

interface Itinerary {
  trip_title: string;
  summary: string;
  days: Day[];
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setItinerary(null);

    try {
      const res = await fetch(`/api/generate?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to generate itinerary');
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setItinerary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-blue-600 mb-4 tracking-tight">
            AI Travel Planner
          </h1>
          <p className="text-xl text-gray-600">
            Turn YouTube travel guides into a structured itinerary instantly.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                YouTube Video URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  id="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="flex-1 rounded-xl border-gray-300 border px-5 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition shadow-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px] shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Planning...
                    </span>
                  ) : (
                    'Plan Trip'
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-2">
                <span>❌</span>
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {itinerary && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl">
              <h2 className="text-3xl font-bold mb-3">{itinerary.trip_title}</h2>
              <p className="text-blue-100 text-lg leading-relaxed">{itinerary.summary}</p>
            </div>

            {/* Itinerary Cards */}
            <div className="space-y-6">
              {itinerary.days.map((day) => (
                <div key={day.day_number} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  {/* Image Section */}
                  {day.image_url && (
                    <div className="h-48 w-full relative">
                      <img
                        src={day.image_url}
                        alt={day.theme}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                  )}

                  <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-baseline gap-4 relative">
                    <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wide z-10">
                      Day {day.day_number}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-800 z-10">{day.theme}</h3>
                  </div>

                  <div className="p-8">
                    <div className="relative border-l-2 border-blue-100 ml-3 space-y-8 pb-2">
                      {day.activities.map((activity, idx) => (
                        <div key={idx} className="relative pl-8">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-md"></div>

                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-1">
                            <span className="text-sm font-bold text-blue-600 min-w-[80px] uppercase tracking-wider">
                              {activity.time}
                            </span>
                            <h4 className="text-lg font-bold text-gray-900">
                              {activity.activity}
                            </h4>
                          </div>
                          <p className="text-gray-600 leading-relaxed">
                            {activity.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
