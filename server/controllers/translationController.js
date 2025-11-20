const { translate } = require('@vitalets/google-translate-api');

const translateText = async (req, res) => {
  const { text, targetLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({ message: 'Text and target language are required' });
  }

  try {
    const { text: translatedText } = await translate(text, { to: targetLanguage });
    res.json({ translatedText });
  } catch (error) {
    res.status(500).json({ message: 'Error translating text' });
  }
};

module.exports = { translateText };
