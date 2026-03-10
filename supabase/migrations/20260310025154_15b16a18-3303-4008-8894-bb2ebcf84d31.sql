
-- Allow authenticated users to update their own notas_credito (for consuming them)
CREATE POLICY "Users can update own notas_credito"
ON public.notas_credito
FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = usuario_id OR has_role(auth.uid(), 'admin'::app_role));
