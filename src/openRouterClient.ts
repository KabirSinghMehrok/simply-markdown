const openRouterApiClient = async (editorContent: string) => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": "google/gemma-3n-e2b-it:free",
      "messages": [
        { "role": "user", "content": `You are an expert auto completion engine. Strictly complete the end sentence of the following user text. Strictly only give the completion output, not the whole input : ${editorContent} ` }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

export default openRouterApiClient;
