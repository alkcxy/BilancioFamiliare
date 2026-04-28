pulsante di salvataggio quando abilito il repeat genera un errore con questo log:
web-1  | Started POST "/operations.json" for 151.101.194.132 at 2026-04-27 05:31:08 +0000
web-1  | Processing by OperationsController#create as JSON
web-1  |   Parameters: {"operation"=>{"date"=>"2026-4-27", "type_id"=>15, "user_id"=>1, "sign"=>"-", "amount"=>10, "note"=>"un pantalone da Temu al mese", "repeat"=>1, "interval_repeat"=>1, "type_repeat"=>3, "wday_repeat"=>3, "week_repeat"=>3, "last_date_repeat"=>"2026-12-31"}}
web-1  |   User Count (1.1ms)  SELECT COUNT(*) FROM `users`
web-1  |   ↳ app/controllers/application_controller.rb:24:in `authorize'
web-1  |   User Load (0.6ms)  SELECT `users`.* FROM `users` WHERE `users`.`blocked` = FALSE AND `users`.`id` = 1 LIMIT 1
web-1  |   ↳ app/controllers/application_controller.rb:17:in `block (2 levels) in authorize'
web-1  |   TRANSACTION (0.2ms)  BEGIN
web-1  |   ↳ app/controllers/operations_controller.rb:63:in `block in create'
web-1  |   Type Load (1.6ms)  SELECT `types`.* FROM `types` WHERE `types`.`id` = 15 LIMIT 1
web-1  |   ↳ app/controllers/operations_controller.rb:63:in `block in create'
web-1  |   User Load (0.2ms)  SELECT `users`.* FROM `users` WHERE `users`.`id` = 1 LIMIT 1
web-1  |   ↳ app/controllers/operations_controller.rb:63:in `block in create'
web-1  |   Operation Create (0.3ms)  INSERT INTO `operations` (`note`, `sign`, `amount`, `type_id`, `user_id`, `date`, `year`, `month`, `day`, `created_at`, `updated_at`) VALUES ('un pantalone da Temu al mese', '-', 10.0, 15, 1, '2026-04-27', 2026, 4, 27, '2026-04-27 05:31:08', '2026-04-27 05:31:08') RETURNING `id`
web-1  |   ↳ app/controllers/operations_controller.rb:63:in `block in create'
web-1  |   Type Load (0.2ms)  SELECT `types`.* FROM `types` WHERE `types`.`id` = 15 LIMIT 1
web-1  |   ↳ app/models/concerns/repeatable.rb:62:in `block (2 levels) in <module:Repeatable>'
web-1  |   User Load (0.2ms)  SELECT `users`.* FROM `users` WHERE `users`.`id` = 1 LIMIT 1
web-1  |   ↳ app/models/concerns/repeatable.rb:62:in `block (2 levels) in <module:Repeatable>'
web-1  |   Operation Create (0.2ms)  INSERT INTO `operations` (`note`, `sign`, `amount`, `type_id`, `user_id`, `date`, `year`, `month`, `day`, `created_at`, `updated_at`) VALUES ('un pantalone da Temu al mese', '-', 10.0, 15, 1, '2026-05-20', 2026, 5, 20, '2026-04-27 05:31:08', '2026-04-27 05:31:08') RETURNING `id`
web-1  |   ↳ app/models/concerns/repeatable.rb:62:in `block (2 levels) in <module:Repeatable>'
web-1  |   Operation Maximum (1.4ms)  SELECT MAX(`operations`.`updated_at`) FROM `operations`
web-1  |   ↳ app/models/concerns/repeatable.rb:64:in `block (2 levels) in <module:Repeatable>'
web-1  |   TRANSACTION (0.8ms)  ROLLBACK
web-1  |   ↳ app/controllers/operations_controller.rb:63:in `block in create'
web-1  | Completed 500 Internal Server Error in 22ms (ActiveRecord: 6.5ms (9 queries, 0 cached) | GC: 0.0ms)
web-1  |
web-1  |
web-1  |
web-1  | ArgumentError (wrong number of arguments (given 1, expected 2)):
web-1  |
web-1  | app/models/concerns/repeatable.rb:64:in `block (2 levels) in <module:Repeatable>'
web-1  | app/controllers/operations_controller.rb:63:in `block in create'
web-1  | app/controllers/operations_controller.rb:62:in `create'

Pulsante di cancellazione:
non funziona sulla lista mese/anno
funziona nella pagina di dettaglio ma non chiede conferma e dopo la cancellazione non conferma che l'operazione di cancellazione e' andata a buon fine.
inoltre la cache su webstorage non viene aggiornata pertanto il record continua ad essere visualizzato nell'elenco mese/anno ma cliccando su dettagli ovviamente non trova nulla
