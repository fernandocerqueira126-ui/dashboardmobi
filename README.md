# Dashboard Imobiliário - CRM de Leads
![Banner do Projeto](https://xjknsccxvetehreahjcr.supabase.co/storage/v1/object/public/midia/Screenshot_1.png)

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
</p>

## 🇧🇷 Português (Brasil)

### Sobre o Projeto
O **Dashboard Mobi** é um sistema completo e moderno de CRM (Gerenciamento de Relacionamento com o Cliente) focado no setor imobiliário. Além do gerenciamento em formato Kanban altamente configurável, a plataforma fornece ferramentas para administrar corretores, métricas de vendas e integração com Webhooks em tempo real. O uso do Supabase garante persistência e autenticação robustas. 

### Funcionalidades Principais
- **Kanban Interativo de Leads**: Cards que podem ser movidos com arrastar-e-soltar (`dnd-kit/sortable`). As colunas podem ser adicionadas, removidas e ter suas cores HEX personalizadas na nova página dedicada de Configurações ( `/leads/config` ).
- **Interface Otimizada (UI/UX)**: Design em *dark mode* polido, utilizando bibliotecas maduras como **Shadcn-ui** provendo alta responsividade.
- **Relatórios Avançados**: Acompanhamento de metas de vendas (visuais), conversões e taxa de fechamento.
- **Integração Realtime (Supabase)**: Atualizações de leads, corretores atrelados e Webhooks de eventos totalmente integrados.
- **Proteção Completa**: Variáveis de ambiente isoladas, mitigando o risco de exposição de chaves através de boas práticas.

### Como Rodar (Desenvolvimento)
1. **Clone o repositório:**
   ```bash
   git clone https://github.com/fernandocerqueira126-ui/dashboardmobi.git
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configure as Variáveis:** 
   Crie um arquivo `.env` contendo:
   ```env
   VITE_SUPABASE_URL="SUA_URL"
   VITE_SUPABASE_ANON_KEY="SUA_CHAVE"
   ```
4. **Configure o Banco de Dados:**
   Abra o arquivo `database_schema.sql` presente na raiz do repositório, copie todo o seu conteúdo e execute no **SQL Editor** do seu painel do Supabase. Isso replicará instantaneamente todas as tabelas, Storage, Webhooks e Políticas de segurança.
5. **Suba o servidor:**
   ```bash
   npm run dev
   ```

---

## 🇺🇸 English

### About the Project
**Dashboard Mobi** is a full-fledged, modern CRM (Customer Relationship Management) system tailored for the real estate domain. Along with highly-customizable Kanban management, the platform brings powerful tools out of the box for handling brokers, sales metrics, and real-time Webhook integrations. The usage of Supabase ensures a robust persistence and authentication layer.

### Key Features
- **Interactive Leads Kanban**: Drag-and-drop workflow (`dnd-kit/sortable`). Kanban columns are entirely dynamic and customizable; users can add, remove, organize, and pick HEX colors across a dedicated Configuration page (`/leads/config`).
- **Premium UI/UX**: Detailed dark mode utilizing **Shadcn-ui** and Tailwind CSS with responsive, sleek styles.
- **Advanced Reports**: Real-time sales targets, funnel conversion tracking, and comprehensive statistical overviews.
- **Real-time Backend (Supabase)**: Live leads update, broker attribution, integrated events, and serverless edge functions.
- **Robust Security**: Decoupled environment variables with standard Vite env injections (`import.meta.env`).

### How to Run Locally
1. **Clone the repository:**
   ```bash
   git clone https://github.com/fernandocerqueira126-ui/dashboardmobi.git
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Setup environment:** 
   Create a `.env` file referencing your keys:
   ```env
   VITE_SUPABASE_URL="YOUR_URL"
   VITE_SUPABASE_ANON_KEY="YOUR_KEY"
   ```
4. **Setup the Database:**
   Open the `database_schema.sql` file located in the root folder, copy all of its content, and execute it within your Supabase project's **SQL Editor**. This will instantly replicate all tables, storage, webhooks, and security policies required for the application.
5. **Start the server:**
   ```bash
   npm run dev
   ```

---
*Built with React, Vite, Shadcn UI and Supabase.*
