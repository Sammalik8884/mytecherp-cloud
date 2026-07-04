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

