export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, organisation, interest, message } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Email service is not configured.' });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'DUDU Website <onboarding@resend.dev>',
        to: ['info@dudurobots.eu'],
        reply_to: email,
        subject: `DUDU demo request — ${name}`,
        text: [
          'New DUDU Robots website enquiry',
          '',
          `Name: ${name}`,
          `Email: ${email}`,
          `Organisation: ${organisation || 'Not provided'}`,
          `Interest: ${interest || 'Not provided'}`,
          `Message: ${message || 'Not provided'}`
        ].join('\\n')
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return res.status(502).json({ error: 'Unable to send enquiry.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Server error.' });
  }
}