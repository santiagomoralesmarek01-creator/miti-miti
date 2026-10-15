-- Cada gasto y cada pago lo edita o lo borra solo quien lo cargó.
-- Al cargar, el autor es siempre quien tiene la sesión (no se puede elegir otro).

drop policy "integrantes cargan gastos" on public.expenses;
create policy "integrantes cargan gastos" on public.expenses
  for insert with check (
    created_by = auth.uid()
    and is_member(group_id)
    and members_belong(group_id, participant_ids || payer_id)
  );

drop policy "integrantes editan gastos" on public.expenses;
create policy "quien lo cargó edita el gasto" on public.expenses
  for update using (created_by = auth.uid() and is_member(group_id))
  with check (
    created_by = auth.uid()
    and is_member(group_id)
    and members_belong(group_id, participant_ids || payer_id)
  );

drop policy "integrantes borran gastos" on public.expenses;
create policy "quien lo cargó borra el gasto" on public.expenses
  for delete using (created_by = auth.uid() and is_member(group_id));

drop policy "integrantes registran pagos" on public.payments;
create policy "integrantes registran pagos" on public.payments
  for insert with check (
    created_by = auth.uid()
    and is_member(group_id)
    and members_belong(group_id, array[from_id, to_id])
  );

drop policy "integrantes borran pagos" on public.payments;
create policy "quien lo registró deshace el pago" on public.payments
  for delete using (created_by = auth.uid() and is_member(group_id));
