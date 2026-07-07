BEGIN TRANSACTION;
GO

ALTER TABLE [AspNetUsers] ADD [Region] nvarchar(max) NULL;
GO

CREATE TABLE [SystemRegions] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_SystemRegions] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260704223510_AddSystemRegionsAndSalesmanRegion', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [ProcurementRequests] ADD [RegionalHeadApprovalDate] datetime2 NULL;
GO

ALTER TABLE [ProcurementRequests] ADD [RegionalHeadEmail] nvarchar(max) NULL;
GO

ALTER TABLE [ProcurementRequests] ADD [RegionalHeadRemarks] nvarchar(max) NULL;
GO

CREATE TABLE [ProcurementQuotes] (
    [Id] int NOT NULL IDENTITY,
    [ProcurementRequestId] int NOT NULL,
    [VendorName] nvarchar(200) NOT NULL,
    [CityName] nvarchar(100) NULL,
    [ContactPerson] nvarchar(100) NULL,
    [ContactNumber] nvarchar(50) NULL,
    [BankAccountName] nvarchar(200) NULL,
    [BankName] nvarchar(100) NULL,
    [AccountNumber] nvarchar(100) NULL,
    [TotalAmount] decimal(18,2) NOT NULL,
    [IsSelected] bit NOT NULL,
    [SubmittedAt] datetime2 NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_ProcurementQuotes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProcurementQuotes_ProcurementRequests_ProcurementRequestId] FOREIGN KEY ([ProcurementRequestId]) REFERENCES [ProcurementRequests] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [ProcurementQuoteItems] (
    [Id] int NOT NULL IDENTITY,
    [QuoteId] int NOT NULL,
    [ProcurementRequestItemId] int NOT NULL,
    [UnitRate] decimal(18,2) NOT NULL,
    [LineTotal] decimal(18,2) NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_ProcurementQuoteItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProcurementQuoteItems_ProcurementQuotes_QuoteId] FOREIGN KEY ([QuoteId]) REFERENCES [ProcurementQuotes] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId] FOREIGN KEY ([ProcurementRequestItemId]) REFERENCES [ProcurementRequestItems] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_ProcurementQuoteItems_ProcurementRequestItemId] ON [ProcurementQuoteItems] ([ProcurementRequestItemId]);
GO

CREATE INDEX [IX_ProcurementQuoteItems_QuoteId] ON [ProcurementQuoteItems] ([QuoteId]);
GO

CREATE INDEX [IX_ProcurementQuotes_ProcurementRequestId] ON [ProcurementQuotes] ([ProcurementRequestId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260704224254_AddProcurementQuotesAndRegionalHead', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [ProcurementQuoteItems] DROP CONSTRAINT [FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId];
GO

ALTER TABLE [VehicleTravelForms] ADD [ApprovedByMunawarAt] datetime2 NULL;
GO

ALTER TABLE [VehicleTravelForms] ADD [ApprovedByShahbazAt] datetime2 NULL;
GO

ALTER TABLE [VehicleTravelForms] ADD [Status] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [ProcurementRequests] ADD [IsAcceptedBySupervisor] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [ProcurementRequests] ADD [SupervisorAcceptanceDate] datetime2 NULL;
GO

ALTER TABLE [ProcurementRequests] ADD [SupervisorAcceptanceRemarks] nvarchar(max) NULL;
GO

ALTER TABLE [Expenses] ADD [ReviewedAt] datetime2 NULL;
GO

ALTER TABLE [Expenses] ADD [ReviewedByEmail] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Expenses] ADD [ReviewerComments] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [Expenses] ADD [Status] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [EmployeeInfos] ADD [AttachmentsJson] nvarchar(max) NOT NULL DEFAULT N'';
GO

ALTER TABLE [EmployeeInfos] ADD [IsActive] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

CREATE TABLE [ProcurementVendors] (
    [Id] int NOT NULL IDENTITY,
    [VendorName] nvarchar(200) NOT NULL,
    [CityName] nvarchar(100) NULL,
    [ContactPerson] nvarchar(100) NULL,
    [ContactNumber] nvarchar(50) NULL,
    [BankAccountName] nvarchar(200) NULL,
    [BankName] nvarchar(100) NULL,
    [AccountNumber] nvarchar(100) NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_ProcurementVendors] PRIMARY KEY ([Id])
);
GO

ALTER TABLE [ProcurementQuoteItems] ADD CONSTRAINT [FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId] FOREIGN KEY ([ProcurementRequestItemId]) REFERENCES [ProcurementRequestItems] ([Id]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260704233232_AddExpenseReviewAndVehicleStatusFields', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [AmountRequestPayments] ADD [PaymentSlipUrl] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260705013034_AddPaymentSlipUrl', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [ProcurementRequests] ADD [RegionalHeadApprovalDate] datetime2 NULL;
GO

ALTER TABLE [ProcurementRequests] ADD [RegionalHeadEmail] nvarchar(max) NULL;
GO

ALTER TABLE [ProcurementRequests] ADD [RegionalHeadRemarks] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260705025925_AddRegionalHeadToProcurement', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [ProcurementRequests] ADD [RegionalHeadApprovalDate] datetime2 NULL;
GO

ALTER TABLE [ProcurementRequests] ADD [RegionalHeadEmail] nvarchar(max) NULL;
GO

ALTER TABLE [ProcurementRequests] ADD [RegionalHeadRemarks] nvarchar(max) NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260705031444_ForceRegionalHeadColumns', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [ProcurementQuotes] (
    [Id] int NOT NULL IDENTITY,
    [ProcurementRequestId] int NOT NULL,
    [VendorName] nvarchar(200) NOT NULL,
    [CityName] nvarchar(100) NULL,
    [ContactPerson] nvarchar(100) NULL,
    [ContactNumber] nvarchar(50) NULL,
    [BankAccountName] nvarchar(200) NULL,
    [BankName] nvarchar(100) NULL,
    [AccountNumber] nvarchar(100) NULL,
    [TotalAmount] decimal(18,2) NOT NULL,
    [IsSelected] bit NOT NULL,
    [SubmittedAt] datetime2 NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_ProcurementQuotes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProcurementQuotes_ProcurementRequests_ProcurementRequestId] FOREIGN KEY ([ProcurementRequestId]) REFERENCES [ProcurementRequests] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [ProcurementQuoteItems] (
    [Id] int NOT NULL IDENTITY,
    [QuoteId] int NOT NULL,
    [ProcurementRequestItemId] int NOT NULL,
    [UnitRate] decimal(18,2) NOT NULL,
    [LineTotal] decimal(18,2) NOT NULL,
    [TenantId] int NOT NULL,
    CONSTRAINT [PK_ProcurementQuoteItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProcurementQuoteItems_ProcurementQuotes_QuoteId] FOREIGN KEY ([QuoteId]) REFERENCES [ProcurementQuotes] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId] FOREIGN KEY ([ProcurementRequestItemId]) REFERENCES [ProcurementRequestItems] ([Id]) ON DELETE NO ACTION
);
GO

CREATE INDEX [IX_ProcurementQuoteItems_ProcurementRequestItemId] ON [ProcurementQuoteItems] ([ProcurementRequestItemId]);
GO

CREATE INDEX [IX_ProcurementQuoteItems_QuoteId] ON [ProcurementQuoteItems] ([QuoteId]);
GO

CREATE INDEX [IX_ProcurementQuotes_ProcurementRequestId] ON [ProcurementQuotes] ([ProcurementRequestId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260705033042_ForceProcurementQuotesTables', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

                WITH CTE AS (
                    SELECT Id, QuoteNumber, 
                           ROW_NUMBER() OVER(PARTITION BY TenantId, QuoteNumber ORDER BY Id) as rn
                    FROM Quotations
                    WHERE QuoteNumber = 'MTQ-AA00021-FPS-R0'
                )
                UPDATE Quotations
                SET QuoteNumber = 'MTQ-AA00022-FPS-R0'
                WHERE Id IN (SELECT Id FROM CTE WHERE rn > 1);
GO

                WITH CTE AS (
                    SELECT Id, QuoteNumber, 
                           ROW_NUMBER() OVER(PARTITION BY TenantId, QuoteNumber ORDER BY Id) as rn
                    FROM Quotations
                )
                UPDATE Quotations
                SET QuoteNumber = QuoteNumber + '-DUP-' + CAST(Id AS VARCHAR)
                WHERE Id IN (SELECT Id FROM CTE WHERE rn > 1);
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Quotations]') AND [c].[name] = N'QuoteNumber');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Quotations] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Quotations] ALTER COLUMN [QuoteNumber] nvarchar(450) NOT NULL;
GO

CREATE UNIQUE INDEX [IX_Quotations_TenantId_QuoteNumber] ON [Quotations] ([TenantId], [QuoteNumber]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260707152508_FixDuplicateQuoteNumbersAndAddUniqueIndex', N'8.0.0');
GO

COMMIT;
GO

