const GEMINI_API_KEY = 'AIzaSyAVJgpla-MTpfVTOCaQaULCwEgfeEeLqYU';

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error('Error fetching models:', JSON.stringify(data.error, null, 2));
            return;
        }

        console.log('Available Models:');
        if (data.models) {
            data.models.forEach(model => {
                if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${model.name} (${model.displayName})`);
                }
            });
        } else {
            console.log('No models found in response:', data);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}

listModels();
