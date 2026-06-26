'use server';

interface SubmitOrderPayload {
  storeId: string;
  storeName: string;
  cartItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    weight: number;
    price: number;
  }>;
  totalEstimated: number;
  totalOrder: number;
  totalProduct: number;
  freight: number;
  userEmail: string;
}

export async function submitOrderToInvGate(payload: SubmitOrderPayload) {
  try {
    const bypassActive = process.env.BYPASS_API_REQUEST === 'true';
    if (bypassActive) {
      console.log("InvGate API Request Bypass is active. Bypassing request creation.");
      const mockTicketNumber = Math.floor(1000 + Math.random() * 9000);
      return {
        success: true,
        ticketId: `#${mockTicketNumber}`,
        bypassActive: true,
        message: 'Pedido submetido com sucesso ao Service Desk!'
      };
    }

    const baseUrl = process.env.INVGATE_BASE_URL;
    const tokenUrl = process.env.INVGATE_ACCESS_TOKEN_URL;
    const clientId = process.env.INVGATE_CLIENT_ID;
    const clientSecret = process.env.INVGATE_CLIENT_SECRET;

    if (!baseUrl || !tokenUrl || !clientId || !clientSecret) {
      throw new Error('Configuração de ambiente inválida para o InvGate API.');
    }

    // Step 1: OAuth 2.0 Token Generation
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: [
          'api.v1.incident:post',
          'api.v1.incident.custom_field:post',
          'api.v1.incident.comment:post',
          'api.v1.incident.external_entity:post',
          'api.v1.incident.reassign:post',
          'api.v1.incident.observer:post',
          'api.v1.incident.collaborator:post',
          'api.v1.incident.link:post'
        ].join(' ')
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to authenticate with InvGate OAuth:', errorText);
      throw new Error('Falha na autenticação corporativa com InvGate.');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Fetch InvGate User ID using corporate email
    // InvGate endpoint supports searching users by user.by?email or /users?email
    const userSearchUrl = `${baseUrl}/user.by?email=${encodeURIComponent(payload.userEmail)}`;
    const userResponse = await fetch(userSearchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    let userId: string | number = '';
    if (userResponse.ok) {
      const userData = await userResponse.json();
      // Extract user ID from user.by or users endpoint
      userId = userData.id || userData.user_id || '';
    }

    // If matching corporate user not found, fall back to a defaults or fail gracefully
    if (!userId) {
      console.warn(`User matching email ${payload.userEmail} not found. Defaulting user context to self/creator.`);
      userId = '1'; // Default backup user ID
    }

    // Default API parameters
    const priorityId = process.env.INVGATE_DEFAULT_PRIORITY_ID || '2';
    const typeId = process.env.INVGATE_DEFAULT_TYPE_ID || '2';
    const categoryId = process.env.INVGATE_DEFAULT_CATEGORY_ID || '15';
    const orderTitle = `Novo Pedido de Sorvete - Unidade: ${payload.storeName}`;

    // Formatting products summary for descriptions/custom fields
    const cartSummary = payload.cartItems
      .map(item => `- ${item.productName}: ${item.quantity} un. (${item.weight.toFixed(2)} KG) - R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      .join('\n');

    const ticketDescription = `
Novo pedido de sorvete recebido.

Unidade Solicitante: ${payload.storeName} (ID: ${payload.storeId})
Solicitante: ${payload.userEmail}

Itens Selecionados:
${cartSummary}

Resumo Financeiro:
- Total em Produtos: R$ ${payload.totalProduct.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Frete Estimado (7%): R$ ${payload.freight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total Estimado: R$ ${payload.totalEstimated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Total do Pedido: R$ ${payload.totalOrder.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    `.trim();

    // Step 3: Create Service Desk Incident
    const queryParams = new URLSearchParams({
      customer_id: String(userId),
      creator_id: String(userId),
      priority_id: priorityId,
      type_id: typeId,
      category_id: categoryId,
      title: orderTitle
    });

    const createIncidentUrl = `${baseUrl}/incident?${queryParams.toString()}`;

    const incidentResponse = await fetch(createIncidentUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        description: ticketDescription,
        // Optional payload variables if custom fields are preferred inside InvGate
        custom_fields: {
          store_name: payload.storeName,
          order_total: payload.totalOrder
        }
      })
    });

    if (!incidentResponse.ok) {
      const errorDetails = await incidentResponse.text();
      console.error('InvGate Incident Creation Error:', errorDetails);
      throw new Error('Falha ao abrir incidente de pedido no Service Desk.');
    }

    const incidentResult = await incidentResponse.json();
    return {
      success: true,
      ticketId: incidentResult.id || incidentResult.ticket_number || 'Criado',
      message: 'Pedido submetido com sucesso ao Service Desk!'
    };

  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Erro inesperado ao processar pedido.'
    };
  }
}
