ALTER TABLE [Cheques] ADD [AccountName] nvarchar(150) NOT NULL DEFAULT N'';
ALTER TABLE [Cheques] ADD [AccountNumber] nvarchar(50) NOT NULL DEFAULT N'';
ALTER TABLE [Cheques] ADD [BankName] nvarchar(150) NOT NULL DEFAULT N'';

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260918173332_AddChequeBankFields', N'8.0.0');
