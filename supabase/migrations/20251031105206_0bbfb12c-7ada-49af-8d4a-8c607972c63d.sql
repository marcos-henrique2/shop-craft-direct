-- Function to update product stock when order is created
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update product quantity
  UPDATE products
  SET 
    quantity = quantity - NEW.quantity,
    status = CASE 
      WHEN (quantity - NEW.quantity) <= 0 THEN 'out_of_stock'::product_status
      ELSE status
    END,
    updated_at = now()
  WHERE id = NEW.product_id
  AND quantity >= NEW.quantity; -- Prevent negative stock
  
  -- Check if update was successful (product had enough stock)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto sem estoque suficiente';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run on order insert
CREATE TRIGGER trigger_update_stock_on_order
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_order();