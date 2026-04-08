CREATE OR REPLACE FUNCTION create_default_categories() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'pf' THEN
    INSERT INTO categories (tenant_id, name, type, icon, color, is_default) VALUES
      (NEW.id, 'Salario', 'receita', 'briefcase', '#34d399', true),
      (NEW.id, 'Freelance', 'receita', 'laptop', '#60a5fa', true),
      (NEW.id, 'Investimentos', 'receita', 'trending-up', '#a78bfa', true),
      (NEW.id, 'Outros Ganhos', 'receita', 'plus-circle', '#22d3ee', true),
      (NEW.id, 'Moradia', 'despesa', 'home', '#f87171', true),
      (NEW.id, 'Alimentacao', 'despesa', 'utensils', '#fb923c', true),
      (NEW.id, 'Transporte', 'despesa', 'car', '#fbbf24', true),
      (NEW.id, 'Saude', 'despesa', 'heart-pulse', '#f472b6', true),
      (NEW.id, 'Educacao', 'despesa', 'graduation-cap', '#60a5fa', true),
      (NEW.id, 'Lazer', 'despesa', 'gamepad-2', '#a78bfa', true),
      (NEW.id, 'Compras', 'despesa', 'shopping-cart', '#22d3ee', true),
      (NEW.id, 'Assinaturas', 'despesa', 'repeat', '#e879f9', true);
  ELSE
    INSERT INTO categories (tenant_id, name, type, icon, color, is_default) VALUES
      (NEW.id, 'Vendas', 'receita', 'shopping-bag', '#34d399', true),
      (NEW.id, 'Servicos', 'receita', 'wrench', '#60a5fa', true),
      (NEW.id, 'Comissoes', 'receita', 'percent', '#a78bfa', true),
      (NEW.id, 'Outros Recebimentos', 'receita', 'plus-circle', '#22d3ee', true),
      (NEW.id, 'Fornecedores', 'despesa', 'truck', '#f87171', true),
      (NEW.id, 'Folha de Pagamento', 'despesa', 'users', '#fb923c', true),
      (NEW.id, 'Aluguel/Sede', 'despesa', 'building', '#fbbf24', true),
      (NEW.id, 'Impostos', 'despesa', 'file-text', '#f472b6', true),
      (NEW.id, 'Marketing', 'despesa', 'megaphone', '#60a5fa', true),
      (NEW.id, 'Tecnologia', 'despesa', 'monitor', '#a78bfa', true),
      (NEW.id, 'Servicos Terceiros', 'despesa', 'briefcase', '#22d3ee', true),
      (NEW.id, 'Despesas Operacionais', 'despesa', 'settings', '#e879f9', true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();
