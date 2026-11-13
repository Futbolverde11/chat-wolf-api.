
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  const apiKey = process.env.CHAT_WOLF_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;

  if (!apiKey || !anthropicKey || !model) {
    return res.status(500).json({
      error: "Configuración incompleta"
    });
  }

  const authorization = req.headers.authorization;

  if (authorization !== `Bearer ${apiKey}`) {
    return res.status(401).json({
      error: "No autorizado"
    });
  }

  try {
    const { message } = req.body || {};

    if (
      typeof message !== "string" ||
      message.trim().length === 0 ||
      message.length > 4000
    ) {
      return res.status(400).json({
        error: "Mensaje inválido"
      });
    }

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: message.trim()
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "Error del proveedor de IA"
      });
    }

    const answer = (data.content || [])
      .filter(item => item.type === "text")
      .map(item => item.text)
      .join("\n");

    return res.status(200).json({
      name: "CHAT WOLF",
      reply: answer
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error interno del servidor"
    });
  }
}
