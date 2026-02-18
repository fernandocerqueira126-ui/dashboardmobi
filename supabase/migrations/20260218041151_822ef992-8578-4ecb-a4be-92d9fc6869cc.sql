
-- Seed: 3 corretores fictícios
INSERT INTO public.colaboradores (id, nome, email, telefone, cargo, status) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Carlos Mendes', 'carlos@imobiliariapro.com', '(11) 99888-1001', 'Corretor Sênior', 'ativo'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'Fernanda Lima', 'fernanda@imobiliariapro.com', '(11) 98777-2002', 'Corretora', 'ativo'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'Ricardo Souza', 'ricardo@imobiliariapro.com', '(21) 97666-3003', 'Captador', 'ativo');

-- Seed: 10 leads distribuídos pelo funil
INSERT INTO public.leads (name, phone, email, value, description, date, source, status, link_imovel_interesse) VALUES
  ('Ana Beatriz Rocha', '(11) 99111-0001', 'ana.rocha@email.com', 450000, 'Interessada em apartamento 2 quartos no Jardins', '2026-02-15', 'WhatsApp', 'novo', 'https://imoveis.com/apt-jardins-2q'),
  ('Pedro Augusto Silva', '(11) 99222-0002', 'pedro.silva@email.com', 680000, 'Procura casa com quintal na Zona Norte', '2026-02-14', 'Instagram', 'novo', 'https://imoveis.com/casa-zn-quintal'),
  ('Mariana Costa Santos', '(21) 98333-0003', 'mariana.santos@email.com', 320000, 'Studio para investimento no Centro', '2026-02-13', 'Google Ads', 'contato', NULL),
  ('João Carlos Ferreira', '(11) 97444-0004', 'joao.ferreira@email.com', 890000, 'Cobertura duplex na Vila Mariana', '2026-02-12', 'Indicação', 'contato', 'https://imoveis.com/cobertura-vm'),
  ('Luciana Martins', '(21) 96555-0005', 'luciana.m@email.com', 550000, 'Apartamento 3 quartos com varanda gourmet', '2026-02-11', 'WhatsApp', 'visita', 'https://imoveis.com/apt-3q-varanda'),
  ('Roberto Almeida Jr.', '(11) 95666-0006', 'roberto.jr@email.com', 1200000, 'Casa em condomínio fechado Alphaville', '2026-02-10', 'Site', 'visita', 'https://imoveis.com/casa-alphaville'),
  ('Camila Oliveira', '(11) 94777-0007', 'camila.o@email.com', 720000, 'Apartamento garden com 4 suítes', '2026-02-09', 'LinkedIn', 'proposta', 'https://imoveis.com/garden-4s'),
  ('Thiago Nascimento', '(21) 93888-0008', 'thiago.n@email.com', 380000, 'Sala comercial no Brooklin', '2026-02-08', 'Google Ads', 'documentacao', NULL),
  ('Isabela Ribeiro', '(11) 92999-0009', 'isabela.r@email.com', 950000, 'Penthouse com vista para o parque', '2026-02-05', 'Indicação', 'ganho', 'https://imoveis.com/penthouse-parque'),
  ('Marcos Vinícius Dias', '(21) 91000-0010', 'marcos.d@email.com', 420000, 'Apartamento 2 quartos reformado', '2026-02-03', 'WhatsApp', 'perdido', NULL);
