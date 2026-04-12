-- Corrigir acentuação das categorias padrão (tenants existentes)

-- PF
UPDATE categories SET name = 'Salário' WHERE name = 'Salario' AND is_default = true;
UPDATE categories SET name = 'Alimentação' WHERE name = 'Alimentacao' AND is_default = true;
UPDATE categories SET name = 'Saúde' WHERE name = 'Saude' AND is_default = true;
UPDATE categories SET name = 'Educação' WHERE name = 'Educacao' AND is_default = true;

-- PJ
UPDATE categories SET name = 'Serviços' WHERE name = 'Servicos' AND is_default = true;
UPDATE categories SET name = 'Comissões' WHERE name = 'Comissoes' AND is_default = true;
UPDATE categories SET name = 'Serviços Terceiros' WHERE name = 'Servicos Terceiros' AND is_default = true;

-- Atualizar a function para novos tenants
CREATE OR REPLACE FUNCTION create_default_categories() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'pf' THEN
    INSERT INTO categories (tenant_id, name, type, icon, color, is_default) VALUES
      (NEW.id, 'Salário', 'receita', 'briefcase', '#34d399', true),
      (NEW.id, 'Freelance', 'receita', 'laptop', '#60a5fa', true),
      (NEW.id, 'Investimentos', 'receita', 'trending-up', '#a78bfa', true),
      (NEW.id, 'Outros Ganhos', 'receita', 'plus-circle', '#22d3ee', true),
      (NEW.id, 'Moradia', 'despesa', 'home', '#f87171', true),
      (NEW.id, 'Alimentação', 'despesa', 'utensils', '#fb923c', true),
      (NEW.id, 'Transporte', 'despesa', 'car', '#fbbf24', true),
      (NEW.id, 'Saúde', 'despesa', 'heart-pulse', '#f472b6', true),
      (NEW.id, 'Educação', 'despesa', 'graduation-cap', '#60a5fa', true),
      (NEW.id, 'Lazer', 'despesa', 'gamepad-2', '#a78bfa', true),
      (NEW.id, 'Compras', 'despesa', 'shopping-cart', '#22d3ee', true),
      (NEW.id, 'Assinaturas', 'despesa', 'repeat', '#e879f9', true);
  ELSE
    INSERT INTO categories (tenant_id, name, type, icon, color, is_default) VALUES
      (NEW.id, 'Vendas', 'receita', 'shopping-bag', '#34d399', true),
      (NEW.id, 'Serviços', 'receita', 'wrench', '#60a5fa', true),
      (NEW.id, 'Comissões', 'receita', 'percent', '#a78bfa', true),
      (NEW.id, 'Outros Recebimentos', 'receita', 'plus-circle', '#22d3ee', true),
      (NEW.id, 'Fornecedores', 'despesa', 'truck', '#f87171', true),
      (NEW.id, 'Folha de Pagamento', 'despesa', 'users', '#fb923c', true),
      (NEW.id, 'Aluguel/Sede', 'despesa', 'building', '#fbbf24', true),
      (NEW.id, 'Impostos', 'despesa', 'file-text', '#f472b6', true),
      (NEW.id, 'Marketing', 'despesa', 'megaphone', '#60a5fa', true),
      (NEW.id, 'Tecnologia', 'despesa', 'monitor', '#a78bfa', true),
      (NEW.id, 'Serviços Terceiros', 'despesa', 'briefcase', '#22d3ee', true),
      (NEW.id, 'Despesas Operacionais', 'despesa', 'settings', '#e879f9', true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
