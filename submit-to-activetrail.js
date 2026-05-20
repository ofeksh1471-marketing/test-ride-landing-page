const ACTIVE_TRAIL_BASE_URL = 'https://webapi.mymarketing.co.il/api';

function normalizeSmsPhone(phone) {
  const cleanPhone = String(phone || '').trim().replace(/[\s-]/g, '');

  if (!cleanPhone) {
    return '';
  }

  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }

  if (cleanPhone.startsWith('972')) {
    return `+${cleanPhone}`;
  }

  if (cleanPhone.startsWith('0')) {
    return `+972${cleanPhone.slice(1)}`;
  }

  return cleanPhone;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const token = (process.env.ACTIVE_TRAIL_API_KEY || '').trim();
  const groupId = Number(process.env.ACTIVE_TRAIL_GROUP_ID || '234804');

  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing ACTIVE_TRAIL_API_KEY' })
    };
  }

  if (event.queryStringParameters && event.queryStringParameters.debug === '1') {
    const groupResponse = await fetch(`${ACTIVE_TRAIL_BASE_URL}/groups/${groupId}`, {
      method: 'GET',
      headers: {
        Authorization: token
      }
    });

    const groupResponseText = await groupResponse.text();

    return {
      statusCode: 200,
      body: JSON.stringify({
        hasToken: Boolean(token),
        tokenLength: token.length,
        groupId,
        groupCheckStatus: groupResponse.status,
        groupCheckResponse: groupResponseText
      })
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
      subscriptionStatus: true,
      email: data.email,
      sms: normalizeSmsPhone(data.phone),
      phone1: data.phone || '',
      first_name: data.firstName || '',
      last_name: data.lastName || '',
      is_deleted: false,
      city: data.city || '',
      ext3: 'Orbea',
      ext5: data.marketingApproved ? 'מאשר' : 'לא מאשר',
      ext6: 'חדש',
      ext8: data.height || '',
      ext9: data.bikeModel || '',
      ext10: data.termsApproved ? 'מאשר' : 'לא מאשר'
    };

    const response = await fetch(`${ACTIVE_TRAIL_BASE_URL}/external/import`, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        group: groupId,
        contacts: [
          {
            contact,
            externalId: data.email,
            externalName: 'Orbea Test Ride'
          }
        ]
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
