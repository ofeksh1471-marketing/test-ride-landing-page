const ACTIVE_TRAIL_BASE_URL = 'http://webapi.mymarketing.co.il/api';

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
    return {
      statusCode: 200,
      body: JSON.stringify({
        hasToken: Boolean(token),
        tokenLength: token.length,
        groupId
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
      email: data.email,
      status: 'Active',
      sms_status: 'Active',
      double_optin: false,
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

    const response = await fetch(`${ACTIVE_TRAIL_BASE_URL}/groups/${groupId}/members`, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contact)
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
