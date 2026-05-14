const ACTIVE_TRAIL_URL = 'https://webapi.mymarketing.co.il/api/contacts/Import';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const token = process.env.ACTIVE_TRAIL_API_KEY;
  const groupId = Number(process.env.ACTIVE_TRAIL_GROUP_ID || '234804');

  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing ACTIVE_TRAIL_API_KEY' })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    if (!data.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email' })
      };
    }

    const contact = {
      email: data.email,
      sms: data.phone || '',
      phone1: data.phone || '',
      first_name: data.firstName || '',
      last_name: data.lastName || '',
      city: data.city || '',
      ext1: data.height || '',
      ext2: data.bikeModel || '',
      ext3: data.marketingApproved ? 'מאשר' : 'לא מאשר',
      ext4: data.termsApproved ? 'מאשר' : 'לא מאשר',
      is_do_not_mail: !data.marketingApproved
    };

    const response = await fetch(ACTIVE_TRAIL_URL, {
      method: 'POST',
      headers: {
        authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        group: groupId,
        contacts: [contact]
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'ActiveTrail request failed',
          details: responseText
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'ActiveTrail submit failed',
        details: error.message
      })
    };
  }
};
