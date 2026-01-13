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
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert crowd analysis AI. Your task is to accurately count ALL people visible in images and provide precise bounding box coordinates. Be thorough and count every person you can see, including:
- People in the foreground AND background
- Partially visible people (at edges or behind objects)
- People at any distance from the camera
- People of any size in the image

Always respond with valid JSON only, no markdown or explanation.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Carefully analyze this image and count EVERY person visible. Look thoroughly at all areas of the image.

Instructions:
1. Count ALL people visible, even if partially obscured or far away
2. For each person, provide bounding box as percentages (0-100) of image dimensions
3. x,y = top-left corner position; width,height = box size
4. Confidence should reflect how clearly you can see the person (0.5-1.0)

Return ONLY this JSON structure:
{
  "peopleCount": <total_number_of_people>,
  "detectedPersons": [
    {"id": "p1", "x": <0-100>, "y": <0-100>, "width": <1-50>, "height": <1-60>, "confidence": <0.5-1.0>}
  ]
}

IMPORTANT: peopleCount MUST equal the length of detectedPersons array. Count everyone!`
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
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return fallback response
      analysisResult = {
        peopleCount: 0,
        detectedPersons: []
      };
    }

    // Ensure proper structure
    const result = {
      peopleCount: analysisResult.peopleCount || 0,
      detectedPersons: (analysisResult.detectedPersons || []).map((person: any, index: number) => ({
        id: person.id || `person-${index}`,
        x: Math.max(0, Math.min(100, Number(person.x) || 0)),
        y: Math.max(0, Math.min(100, Number(person.y) || 0)),
        width: Math.max(1, Math.min(50, Number(person.width) || 5)),
        height: Math.max(1, Math.min(50, Number(person.height) || 10)),
        confidence: Math.max(0, Math.min(1, Number(person.confidence) || 0.8)),
      })),
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
