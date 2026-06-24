# Portal de Pedidos - O Grupo The Best 🍦

Solução corporativa integrada para pedidos de sorvetes e abertura automatizada de incidentes no **InvGate Service Desk** utilizando **SAML SSO** via **Supabase**.

## 🚀 Requisitos de Configuração

### 1. Configuração do SAML SSO (Microsoft Entra ID) no Supabase

Para que o login SSO integrado com o Microsoft Entra ID funcione corretamente:
1. Acesse o **Supabase Dashboard** > **Authentication** > **SAML 2.0**.
2. Adicione um provedor de identidade (IdP):
   - **Entity ID**: URL obtida no seu painel corporativo do Azure/Entra ID.
   - **Metadata URL / Certificate PEM**: Faça o upload do arquivo gerado pelo Entra ID.
   - **Dominio**: Atribua o domínio corporativo que constará no arquivo `.env` (ex: `ogrupothebest.com.br`).

### 2. Configurações de Banco de Dados (Supabase PostgreSQL)

Crie as tabelas executando o script SQL abaixo diretamente no editor de SQL do Supabase:

```sql
-- Criar Tabela de Unidades / Lojas
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar Tabela de Produtos
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    consumption_15_days VARCHAR(255) DEFAULT 'Sem Info.',
    category VARCHAR(100) DEFAULT 'SORVETES',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserir Dados Mínimos de Lojas
INSERT INTO public.stores (code, name, city) VALUES
('LOJA001', 'Matriz - Curitiba', 'Curitiba'),
('LOJA002', 'Filial - Londrina', 'Londrina');

-- Inserir Dados de Produtos
INSERT INTO public.products (name, weight, price, stock, consumption_15_days, category) VALUES
('Abacaxi', 6.50, 115.00, 2, 'Sem Info.', 'SORVETES'),
('Amarena', 6.50, 140.00, 2, 'Sem Info.', 'SORVETES'),
('Blue Ice', 6.50, 110.00, 2, 'Sem Info.', 'SORVETES'),
('Brownie Recheado', 6.50, 150.00, 2, 'Sem Info.', 'SORVETES'),
('Chocomenta', 6.50, 135.00, 1, 'Sem Info.', 'SORVETES');
