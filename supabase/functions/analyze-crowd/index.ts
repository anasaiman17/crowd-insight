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
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image for crowd detection. Count the number of people visible in the image. For each person detected, estimate their bounding box position as percentages (0-100) of the image dimensions. Return ONLY a valid JSON object with no additional text, in this exact format:
{
  "peopleCount": <number>,
  "detectedPersons": [
    {
      "id": "<unique_id>",
      "x": <x_position_percentage>,
      "y": <y_position_percentage>,
      "width": <width_percentage>,
      "height": <height_percentage>,
      "confidence": <0.0_to_1.0>
    }
  ]
}

Be accurate but conservative - only count clearly visible people. If no people are visible, return peopleCount: 0 and empty detectedPersons array.`
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
