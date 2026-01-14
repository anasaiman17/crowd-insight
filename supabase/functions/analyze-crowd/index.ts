import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI Gateway to analyze the image for crowd detection
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    // Use gemini-2.5-flash for faster processing with structured output
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a precision crowd counter. Analyze this image and detect EVERY person.

DETECTION RULES:
- Count ALL humans: standing, sitting, walking, partial views, crowds, distant figures
- Include people partially cut off at edges
- Include people partially occluded by objects/others
- Include small/distant people in background

OUTPUT FORMAT (JSON only, no markdown):
{"peopleCount":<N>,"detectedPersons":[{"id":"p1","x":<0-100>,"y":<0-100>,"width":<2-40>,"height":<3-50>,"confidence":<0.3-1.0>}]}

COORDINATES: Percentages of image dimensions. x,y = top-left corner.
CONFIDENCE: 0.3-0.6 = partial/distant, 0.6-0.8 = clear but small, 0.8-1.0 = clearly visible

Return ONLY valid JSON. peopleCount MUST match array length.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1, // Low temperature for consistent, accurate results
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    
    // Parse the AI response
    let analysisResult;
    try {
      const content = aiResult.choices?.[0]?.message?.content || '';
      // Clean the response - remove any markdown formatting
      let jsonStr = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        jsonStr = match ? match[1].trim() : jsonStr.replace(/```(?:json)?/g, '').trim();
      }
      
      // Parse JSON
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Raw:', aiResult.choices?.[0]?.message?.content);
      // Return fallback response
      analysisResult = {
        peopleCount: 0,
        detectedPersons: []
      };
    }

    // Validate and sanitize the result
    const detectedPersons = (analysisResult.detectedPersons || []).map((person: any, index: number) => ({
      id: person.id || `p${index + 1}`,
      x: Math.max(0, Math.min(100, Number(person.x) || 0)),
      y: Math.max(0, Math.min(100, Number(person.y) || 0)),
      width: Math.max(2, Math.min(40, Number(person.width) || 8)),
      height: Math.max(3, Math.min(50, Number(person.height) || 15)),
      confidence: Math.max(0.3, Math.min(1, Number(person.confidence) || 0.7)),
    }));

    // Ensure count matches array length
    const result = {
      peopleCount: detectedPersons.length,
      detectedPersons,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-crowd function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
