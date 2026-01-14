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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    // Use gemini-2.5-pro for better face detection accuracy
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
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert FACE DETECTION system. Count people by detecting their FACES.

DETECTION METHOD:
1. SCAN the entire image systematically for HUMAN FACES
2. Look for facial features: eyes, nose, mouth, face shape
3. Count faces that are visible even if:
   - Partially visible (profile view, looking away)
   - Small in the background
   - Partially occluded by objects or other people
   - Blurry but identifiable as faces

BOUNDING BOX RULES:
- Draw box around the FACE only, not the whole body
- x,y = top-left corner as percentage (0-100)
- width/height = face dimensions as percentage (typically 2-15% for faces)

CONFIDENCE SCORING:
- 0.9-1.0: Clear frontal face, all features visible
- 0.7-0.9: Clear face but angled or partial profile
- 0.5-0.7: Partially visible face, some features obscured
- 0.3-0.5: Very small, distant, or heavily obscured face

OUTPUT (JSON only, no markdown):
{"peopleCount":<N>,"detectedPersons":[{"id":"f1","x":<0-100>,"y":<0-100>,"width":<1-20>,"height":<1-25>,"confidence":<0.3-1.0>}]}

CRITICAL: Count EVERY face. peopleCount MUST equal array length. Be thorough!`
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
        temperature: 0.1,
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
    
    let analysisResult;
    try {
      const content = aiResult.choices?.[0]?.message?.content || '';
      let jsonStr = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        jsonStr = match ? match[1].trim() : jsonStr.replace(/```(?:json)?/g, '').trim();
      }
      
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Raw:', aiResult.choices?.[0]?.message?.content);
      analysisResult = {
        peopleCount: 0,
        detectedPersons: []
      };
    }

    // Validate and sanitize - use smaller boxes for face detection
    const detectedPersons = (analysisResult.detectedPersons || []).map((person: any, index: number) => ({
      id: person.id || `f${index + 1}`,
      x: Math.max(0, Math.min(100, Number(person.x) || 0)),
      y: Math.max(0, Math.min(100, Number(person.y) || 0)),
      width: Math.max(1, Math.min(20, Number(person.width) || 5)),
      height: Math.max(1, Math.min(25, Number(person.height) || 6)),
      confidence: Math.max(0.3, Math.min(1, Number(person.confidence) || 0.7)),
    }));

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
