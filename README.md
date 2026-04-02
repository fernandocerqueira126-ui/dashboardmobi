# Dashboard Imobiliário - CRM de Leads
![Banner do Projeto](https://xjknsccxvetehreahjcr.supabase.co/storage/v1/object/public/midia/painel.png)

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
</p>

---

## 🇧🇷 Português (Brasil)

### 📋 Sobre o Projeto
O **Dashboard Mobi** é um ecossistema CRM de alta performance desenvolvido especificamente para o mercado imobiliário. Focado em agilidade e conversão, o sistema une uma interface visual moderna com poderosas automações e integridade de dados via Supabase.

### 🚀 Funcionalidades de Destaque
- **Gestão de Leads (Kanban)**: Fluxo de trabalho intuitivo com arrastar-e-soltar (`dnd-kit`). Configuração total de colunas e cores HEX em `/leads/config`.
- **Central de Atendimentos**: Chat em tempo real para comunicação direta (WhatsApp/Web) e histórico de interações.
- **Automação & IA**: Módulo de automação nativo para workflows de nutrição e integração com agentes inteligentes.
- **Agenda Inteligente**: Gestão de compromissos, visitas e lembretes integrados ao fluxo do lead.
- **Gerador de Propostas**: Criação de propostas comerciais personalizadas com suporte a RAG para busca de propriedades ideais.
- **Dashboard de Métricas**: Visualização de KPIs, metas de corretores e funil de vendas em tempo real.

### 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite.
- **Styling**: Tailwind CSS, Shadcn/UI, Lucide React (Ícones).
- **Gerenciamento de Estado**: TanStack Query (React Query).
- **Backend & DB**: Supabase (Auth, Postgres, Realtime, Edge Functions).
- **Formulários**: React Hook Form + Zod.
- **Animações**: Tailwind Animate e Radix UI primitives.

### 💻 Como Rodar (Desenvolvimento)
1. **Clone o repositório:**
   ```bash
   git clone https://github.com/fernandocerqueira126-ui/dashboardmobi.git
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Variáveis de Ambiente:** 
   Crie um arquivo `.env` (baseado no `.env.example`, se disponível):
   ```env
   VITE_SUPABASE_URL="SUA_URL"
   VITE_SUPABASE_ANON_KEY="SUA_CHAVE"
   ```
4. **Banco de Dados:**
   Execute o script `database_schema.sql` no **SQL Editor** do seu projeto Supabase para configurar tabelas, triggers e RLS.
5. **Run:**
   ```bash
   npm run dev
   ```

---

## 🇺🇸 English

### 📋 About the Project
**Dashboard Mobi** is a high-performance CRM ecosystem developed specifically for the real estate market. Focused on agility and conversion, the system combines a modern visual interface with powerful automations and data integrity via Supabase.

### 🚀 Key Features
- **Lead Management (Kanban)**: Intuitive drag-and-drop workflow (`dnd-kit`). Full customization of columns and HEX colors via `/leads/config`.
- **Customer Service Hub**: Real-time chat for direct communication and full interaction history.
- **Automation & AI**: Native automation module for nurturing workflows and integration with intelligent agents.
- **Smart Calendar**: Appointment management, property viewings, and reminders integrated into the lead flow.
- **Proposal Generator**: Custom commercial proposal creation with RAG support for finding ideal properties.
- **Metrics Dashboard**: Real-time KPI visualization, broker targets, and sales funnel tracking.

### 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite.
- **Styling**: Tailwind CSS, Shadcn/UI, Lucide React.
- **State Management**: TanStack Query (React Query).
- **Backend & DB**: Supabase (Auth, Postgres, Realtime, Edge Functions).
- **Testing**: Vitest & Testing Library.

### 💻 How to Run Locally
1. **Clone the repository:**
   ```bash
   git clone https://github.com/fernandocerqueira126-ui/dashboardmobi.git
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Setup:** 
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL="YOUR_URL"
   VITE_SUPABASE_ANON_KEY="YOUR_KEY"
   ```
4. **Database Configuration:**
   Execute the `database_schema.sql` script within your Supabase **SQL Editor** to instantly set up all tables and security policies.
5. **Start:**
   ```bash
   npm run dev
   ```

---
*Feito por [Fernando Cerqueira](https://github.com/fernandocerqueira126) • © 2026 DashboardMobi*

