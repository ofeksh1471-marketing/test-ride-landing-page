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
      email: data.email,
      sms: normalizeSmsPhone(data.phone),
      first_name: data.firstName || '',
      last_name: data.lastName || '',
      is_deleted: false
    };

    const externalId = String(Date.now());

    const activeTrailPayload = {
      group: groupId,
      contacts: [
        {
          contact,
          externalId,
          externalName: 'RecyclesOrbeaTestRide'
        }
      ]
    };

    const response = await fetch(`${ACTIVE_TRAIL_BASE_URL}/external/import?Authorization=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activeTrailPayload)
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

    const responseData = JSON.parse(responseText);

    if (responseData.contact_errors && responseData.contact_errors.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Contact import error',
          details: responseData.contact_errors
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data: responseData })
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