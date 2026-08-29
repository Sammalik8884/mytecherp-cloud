IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [AspNetRoles] (
        [Id] nvarchar(450) NOT NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] int NOT NULL IDENTITY,
        [EntityName] nvarchar(max) NOT NULL,
        [EntityId] int NOT NULL,
        [Action] nvarchar(max) NOT NULL,
        [UserId] nvarchar(max) NOT NULL,
        [Details] nvarchar(max) NULL,
        [Timestamp] datetime2 NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Categories] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Categories] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Customers] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [Phone] nvarchar(max) NOT NULL,
        [TaxNumber] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NOT NULL,
        [CompanyName] nvarchar(max) NULL,
        [SiteName] nvarchar(100) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Customers] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [InspectionQuestions] (
        [Id] int NOT NULL IDENTITY,
        [AssetType] nvarchar(max) NOT NULL,
        [QuestionText] nvarchar(max) NOT NULL,
        [RegulationReference] nvarchar(max) NOT NULL,
        [ResponseType] nvarchar(max) NOT NULL,
        [SortOrder] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_InspectionQuestions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [JobEvidences] (
        [Id] int NOT NULL IDENTITY,
        [WorkOrderId] int NOT NULL,
        [FileType] nvarchar(max) NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        [GpsLatitude] float NOT NULL,
        [GpsLongitude] float NOT NULL,
        [Timestamp] datetime2 NOT NULL,
        [ContentHash] nvarchar(max) NOT NULL,
        [TechnicianId] nvarchar(max) NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_JobEvidences] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Tenants] (
        [Id] int NOT NULL IDENTITY,
        [CompanyName] nvarchar(max) NOT NULL,
        [SubscriptionPlan] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [SubscriptionExpiresAt] datetime2 NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_Tenants] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [AspNetRoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [ChecklistQuestions] (
        [Id] int NOT NULL IDENTITY,
        [Text] nvarchar(max) NOT NULL,
        [CategoryId] int NOT NULL,
        [ConfigJson] nvarchar(max) NOT NULL,
        [Version] nvarchar(max) NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_ChecklistQuestions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChecklistQuestions_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Products] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [TenantId] int NOT NULL,
        [CategoryId] int NOT NULL,
        [ImageUrl] nvarchar(max) NULL,
        [Description] nvarchar(max) NULL,
        [Brand] nvarchar(max) NULL,
        [ItemCode] nvarchar(max) NULL,
        [SupplierItemCode] nvarchar(max) NULL,
        [PriceAED] decimal(18,2) NULL,
        [TechnicalSpecs] nvarchar(max) NULL,
        CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Products_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [AspNetUsers] (
        [Id] nvarchar(450) NOT NULL,
        [FullName] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CustomerId] int NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUsers_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Contracts] (
        [Id] int NOT NULL IDENTITY,
        [Title] nvarchar(max) NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [EndDate] datetime2 NOT NULL,
        [VisitFrequencyMonths] int NOT NULL,
        [ContractValue] decimal(18,2) NOT NULL,
        [IsActive] bit NOT NULL,
        [CustomerId] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Contracts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Contracts_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Sites] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [City] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NOT NULL,
        [CustomerId] int NOT NULL,
        [CategoryId] int NOT NULL,
        [SiteName] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Sites] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Sites_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [AspNetUserClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [AspNetUserLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [AspNetUserRoles] (
        [UserId] nvarchar(450) NOT NULL,
        [RoleId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [AspNetUserTokens] (
        [UserId] nvarchar(450) NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Assets] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [SerialNumber] nvarchar(max) NOT NULL,
        [AssetType] int NOT NULL,
        [Status] int NOT NULL,
        [Brand] nvarchar(max) NOT NULL,
        [Model] nvarchar(max) NOT NULL,
        [ManufacturingDate] datetime2 NOT NULL,
        [ExpiryDate] datetime2 NOT NULL,
        [LocationDescription] nvarchar(max) NOT NULL,
        [SiteId] int NOT NULL,
        [Floor] nvarchar(max) NULL,
        [Room] nvarchar(max) NULL,
        [CategoryId] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Assets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Assets_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Buildings] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [SiteId] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Buildings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Buildings_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Quotations] (
        [Id] int NOT NULL IDENTITY,
        [QuoteNumber] nvarchar(max) NOT NULL,
        [CustomerId] int NOT NULL,
        [SiteId] int NULL,
        [OpportunityId] int NULL,
        [ValidUntil] datetime2 NOT NULL,
        [Stage] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [Currency] nvarchar(max) NOT NULL,
        [ExchangeRate] decimal(18,4) NOT NULL,
        [GlobalCommissionPct] decimal(18,2) NOT NULL,
        [SubTotal] decimal(18,2) NOT NULL,
        [GSTPercentage] decimal(18,2) NOT NULL,
        [GSTAmount] decimal(18,2) NOT NULL,
        [IncomeTaxPercentage] decimal(18,2) NOT NULL,
        [IncomeTaxAmount] decimal(18,2) NOT NULL,
        [Adjustment] decimal(18,2) NOT NULL,
        [GrandTotal] decimal(18,2) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Quotations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Quotations_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Quotations_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [ContractItems] (
        [Id] int NOT NULL IDENTITY,
        [ContractId] int NOT NULL,
        [AssetId] int NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [ServiceVisitsPerYear] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ContractItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ContractItems_Assets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [Assets] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ContractItems_Contracts_ContractId] FOREIGN KEY ([ContractId]) REFERENCES [Contracts] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [WorkOrders] (
        [Id] int NOT NULL IDENTITY,
        [Description] nvarchar(200) NOT NULL,
        [Status] int NOT NULL,
        [ScheduledDate] datetime2 NOT NULL,
        [CompletedDate] datetime2 NULL,
        [ContractId] int NOT NULL,
        [TechnicianId] nvarchar(450) NULL,
        [TechnicianNotes] nvarchar(max) NULL,
        [AssetId] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_WorkOrders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_WorkOrders_AspNetUsers_TechnicianId] FOREIGN KEY ([TechnicianId]) REFERENCES [AspNetUsers] ([Id]),
        CONSTRAINT [FK_WorkOrders_Assets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [Assets] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_WorkOrders_Contracts_ContractId] FOREIGN KEY ([ContractId]) REFERENCES [Contracts] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Floors] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [BuildingId] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Floors] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Floors_Buildings_BuildingId] FOREIGN KEY ([BuildingId]) REFERENCES [Buildings] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [QuotationItem] (
        [Id] int NOT NULL IDENTITY,
        [Description] nvarchar(max) NOT NULL,
        [Quantity] int NOT NULL,
        [QuotationId] int NOT NULL,
        [ProductId] int NULL,
        [UnitCost] decimal(18,2) NOT NULL,
        [MarginPercentage] decimal(18,2) NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [LineTotal] decimal(18,2) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_QuotationItem] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuotationItem_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]),
        CONSTRAINT [FK_QuotationItem_Quotations_QuotationId] FOREIGN KEY ([QuotationId]) REFERENCES [Quotations] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [WorkOrderChecklistResults] (
        [Id] int NOT NULL IDENTITY,
        [WorkOrderId] int NOT NULL,
        [ChecklistQuestionId] int NOT NULL,
        [SnapshotText] nvarchar(max) NOT NULL,
        [SnapshotJson] nvarchar(max) NOT NULL,
        [ResultValue] nvarchar(max) NOT NULL,
        [IsFlagged] bit NOT NULL,
        [Comment] nvarchar(max) NULL,
        [QuestionText] nvarchar(max) NOT NULL,
        [Value] nvarchar(max) NOT NULL,
        [IsPass] bit NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_WorkOrderChecklistResults] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_WorkOrderChecklistResults_ChecklistQuestions_ChecklistQuestionId] FOREIGN KEY ([ChecklistQuestionId]) REFERENCES [ChecklistQuestions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_WorkOrderChecklistResults_WorkOrders_WorkOrderId] FOREIGN KEY ([WorkOrderId]) REFERENCES [WorkOrders] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE TABLE [Rooms] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [FloorId] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Rooms] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Rooms_Floors_FloorId] FOREIGN KEY ([FloorId]) REFERENCES [Floors] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_AspNetUsers_CustomerId] ON [AspNetUsers] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_Assets_SiteId] ON [Assets] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_Buildings_SiteId] ON [Buildings] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_ChecklistQuestions_CategoryId] ON [ChecklistQuestions] ([CategoryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_ContractItems_AssetId] ON [ContractItems] ([AssetId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_ContractItems_ContractId] ON [ContractItems] ([ContractId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_Contracts_CustomerId] ON [Contracts] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_Floors_BuildingId] ON [Floors] ([BuildingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_Products_CategoryId] ON [Products] ([CategoryId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_QuotationItem_ProductId] ON [QuotationItem] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_QuotationItem_QuotationId] ON [QuotationItem] ([QuotationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_Quotations_CustomerId] ON [Quotations] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_Quotations_SiteId] ON [Quotations] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_Rooms_FloorId] ON [Rooms] ([FloorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_Sites_CustomerId] ON [Sites] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_WorkOrderChecklistResults_ChecklistQuestionId] ON [WorkOrderChecklistResults] ([ChecklistQuestionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_WorkOrderChecklistResults_WorkOrderId] ON [WorkOrderChecklistResults] ([WorkOrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_WorkOrders_AssetId] ON [WorkOrders] ([AssetId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_WorkOrders_ContractId] ON [WorkOrders] ([ContractId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    CREATE INDEX [IX_WorkOrders_TechnicianId] ON [WorkOrders] ([TechnicianId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260129213126_InitialDb'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260129213126_InitialDb', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [QuotationItem] DROP CONSTRAINT [FK_QuotationItem_Products_ProductId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [QuotationItem] DROP CONSTRAINT [FK_QuotationItem_Quotations_QuotationId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [QuotationItem] DROP CONSTRAINT [PK_QuotationItem];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    EXEC sp_rename N'[QuotationItem]', N'QuotationsItem';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    EXEC sp_rename N'[QuotationsItem].[IX_QuotationItem_QuotationId]', N'IX_QuotationsItem_QuotationId', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    EXEC sp_rename N'[QuotationsItem].[IX_QuotationItem_ProductId]', N'IX_QuotationsItem_ProductId', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [Quotations] ADD [ApprovedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [Quotations] ADD [ApprovedByUserId] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [Quotations] ADD [ReviewerComments] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [Quotations] ADD [Status] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD CONSTRAINT [PK_QuotationsItem] PRIMARY KEY ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD CONSTRAINT [FK_QuotationsItem_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD CONSTRAINT [FK_QuotationsItem_Quotations_QuotationId] FOREIGN KEY ([QuotationId]) REFERENCES [Quotations] ([Id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130135503_QuotationItemsAdded'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260130135503_QuotationItemsAdded', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130184953_Addedfix'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Sites]') AND [c].[name] = N'Name');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Sites] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Sites] DROP COLUMN [Name];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260130184953_Addedfix'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260130184953_Addedfix', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    ALTER TABLE [WorkOrders] DROP CONSTRAINT [FK_WorkOrders_Contracts_ContractId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[WorkOrders]') AND [c].[name] = N'ContractId');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [WorkOrders] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [WorkOrders] ALTER COLUMN [ContractId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[WorkOrders]') AND [c].[name] = N'AssetId');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [WorkOrders] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [WorkOrders] ALTER COLUMN [AssetId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [CustomerId] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [ReferenceQuotationId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [SiteId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    ALTER TABLE [Contracts] ADD [ReferenceQuotationId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    CREATE INDEX [IX_WorkOrders_ReferenceQuotationId] ON [WorkOrders] ([ReferenceQuotationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    CREATE INDEX [IX_Contracts_ReferenceQuotationId] ON [Contracts] ([ReferenceQuotationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    ALTER TABLE [Contracts] ADD CONSTRAINT [FK_Contracts_Quotations_ReferenceQuotationId] FOREIGN KEY ([ReferenceQuotationId]) REFERENCES [Quotations] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD CONSTRAINT [FK_WorkOrders_Contracts_ContractId] FOREIGN KEY ([ContractId]) REFERENCES [Contracts] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD CONSTRAINT [FK_WorkOrders_Quotations_ReferenceQuotationId] FOREIGN KEY ([ReferenceQuotationId]) REFERENCES [Quotations] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206202052_LinkQuoteToOps'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260206202052_LinkQuoteToOps', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206221027_AddAuditValues'
)
BEGIN
    ALTER TABLE [AuditLogs] ADD [NewValue] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206221027_AddAuditValues'
)
BEGIN
    ALTER TABLE [AuditLogs] ADD [OldValue] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260206221027_AddAuditValues'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260206221027_AddAuditValues', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260207203752_AddDigitalSignatures'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260207203752_AddDigitalSignatures', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260207204228_AddDigitalSignaturesUpdated'
)
BEGIN
    CREATE TABLE [DocumentSignatures] (
        [Id] int NOT NULL IDENTITY,
        [EntityName] nvarchar(max) NOT NULL,
        [EntityId] int NOT NULL,
        [Signature] nvarchar(max) NOT NULL,
        [KeyVersion] nvarchar(max) NOT NULL,
        [DataHash] nvarchar(max) NOT NULL,
        [SignedByUserId] nvarchar(max) NOT NULL,
        [SignedAt] datetime2 NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_DocumentSignatures] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260207204228_AddDigitalSignaturesUpdated'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260207204228_AddDigitalSignaturesUpdated', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208144039_RemoveStageProperty'
)
BEGIN
    DECLARE @var3 sysname;
    SELECT @var3 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Quotations]') AND [c].[name] = N'Stage');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [Quotations] DROP CONSTRAINT [' + @var3 + '];');
    ALTER TABLE [Quotations] DROP COLUMN [Stage];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208144039_RemoveStageProperty'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260208144039_RemoveStageProperty', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208151027_AddSystemFailures'
)
BEGIN
    CREATE TABLE [SystemFailures] (
        [Id] int NOT NULL IDENTITY,
        [JobName] nvarchar(max) NOT NULL,
        [Payload] nvarchar(max) NOT NULL,
        [ErrorMessage] nvarchar(max) NOT NULL,
        [StackTrace] nvarchar(max) NOT NULL,
        [RetryCount] int NOT NULL,
        [FailedAt] datetime2 NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_SystemFailures] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208151027_AddSystemFailures'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260208151027_AddSystemFailures', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208204616_AddInventoryModule'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [Result] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208204616_AddInventoryModule'
)
BEGIN
    CREATE TABLE [InventoryProducts] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [SKU] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [CostPrice] decimal(18,2) NOT NULL,
        [SellingPrice] decimal(18,2) NOT NULL,
        [ReorderLevel] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_InventoryProducts] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208204616_AddInventoryModule'
)
BEGIN
    CREATE TABLE [Warehouses] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Location] nvarchar(max) NOT NULL,
        [IsMobile] bit NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Warehouses] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208204616_AddInventoryModule'
)
BEGIN
    CREATE TABLE [InventoryStocks] (
        [Id] int NOT NULL IDENTITY,
        [ProductId] int NOT NULL,
        [WarehouseId] int NOT NULL,
        [QuantityOnHand] int NOT NULL,
        [BinLocation] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_InventoryStocks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InventoryStocks_InventoryProducts_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [InventoryProducts] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_InventoryStocks_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208204616_AddInventoryModule'
)
BEGIN
    CREATE INDEX [IX_InventoryStocks_ProductId] ON [InventoryStocks] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208204616_AddInventoryModule'
)
BEGIN
    CREATE INDEX [IX_InventoryStocks_WarehouseId] ON [InventoryStocks] ([WarehouseId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208204616_AddInventoryModule'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260208204616_AddInventoryModule', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208205248_UpgradeProductEntity'
)
BEGIN
    ALTER TABLE [Products] ADD [CostPrice] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208205248_UpgradeProductEntity'
)
BEGIN
    ALTER TABLE [Products] ADD [ReorderLevel] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208205248_UpgradeProductEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260208205248_UpgradeProductEntity', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208205955_UpdateProductForInventory'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260208205955_UpdateProductForInventory', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208211420_Invoice'
)
BEGIN
    CREATE TABLE [Invoices] (
        [Id] int NOT NULL IDENTITY,
        [InvoiceNumber] nvarchar(max) NOT NULL,
        [CustomerId] int NOT NULL,
        [QuotationId] int NULL,
        [IssueDate] datetime2 NOT NULL,
        [DueDate] datetime2 NOT NULL,
        [SubTotal] decimal(18,2) NOT NULL,
        [TaxAmount] decimal(18,2) NOT NULL,
        [TotalAmount] decimal(18,2) NOT NULL,
        [AmountPaid] decimal(18,2) NOT NULL,
        [Status] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Invoices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Invoices_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208211420_Invoice'
)
BEGIN
    CREATE TABLE [invoiceItems] (
        [Id] int NOT NULL IDENTITY,
        [InvoiceId] int NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Quantity] decimal(18,2) NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_invoiceItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_invoiceItems_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208211420_Invoice'
)
BEGIN
    CREATE INDEX [IX_invoiceItems_InvoiceId] ON [invoiceItems] ([InvoiceId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208211420_Invoice'
)
BEGIN
    CREATE INDEX [IX_Invoices_CustomerId] ON [Invoices] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260208211420_Invoice'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260208211420_Invoice', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218142057_AddPurchaseOrderModule'
)
BEGIN
    CREATE TABLE [Vendors] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [ContactPerson] nvarchar(max) NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [Phone] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NOT NULL,
        [PaymentTerms] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Vendors] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218142057_AddPurchaseOrderModule'
)
BEGIN
    CREATE TABLE [PurchaseOrders] (
        [Id] int NOT NULL IDENTITY,
        [PONumber] nvarchar(max) NOT NULL,
        [VendorId] int NOT NULL,
        [OrderDate] datetime2 NOT NULL,
        [ExpectedDeliveryDate] datetime2 NULL,
        [Status] int NOT NULL,
        [TotalAmount] decimal(18,2) NOT NULL,
        [TargetWarehouseId] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_PurchaseOrders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PurchaseOrders_Vendors_VendorId] FOREIGN KEY ([VendorId]) REFERENCES [Vendors] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PurchaseOrders_Warehouses_TargetWarehouseId] FOREIGN KEY ([TargetWarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218142057_AddPurchaseOrderModule'
)
BEGIN
    CREATE TABLE [PurchaseOrderItems] (
        [Id] int NOT NULL IDENTITY,
        [PurchaseOrderId] int NOT NULL,
        [ProductId] int NOT NULL,
        [QuantityOrdered] int NOT NULL,
        [QuantityReceived] int NOT NULL,
        [UnitCost] decimal(18,2) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_PurchaseOrderItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PurchaseOrderItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId] FOREIGN KEY ([PurchaseOrderId]) REFERENCES [PurchaseOrders] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218142057_AddPurchaseOrderModule'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrderItems_ProductId] ON [PurchaseOrderItems] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218142057_AddPurchaseOrderModule'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrderItems_PurchaseOrderId] ON [PurchaseOrderItems] ([PurchaseOrderId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218142057_AddPurchaseOrderModule'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrders_TargetWarehouseId] ON [PurchaseOrders] ([TargetWarehouseId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218142057_AddPurchaseOrderModule'
)
BEGIN
    CREATE INDEX [IX_PurchaseOrders_VendorId] ON [PurchaseOrders] ([VendorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218142057_AddPurchaseOrderModule'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260218142057_AddPurchaseOrderModule', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218160511_AddStockTransfersFix'
)
BEGIN
    CREATE TABLE [stockTransfers] (
        [Id] int NOT NULL IDENTITY,
        [TransferNumber] nvarchar(max) NOT NULL,
        [FromWarehouseId] int NOT NULL,
        [ToWarehouseId] int NOT NULL,
        [TransferDate] datetime2 NOT NULL,
        [Notes] nvarchar(max) NOT NULL,
        [Status] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_stockTransfers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_stockTransfers_Warehouses_FromWarehouseId] FOREIGN KEY ([FromWarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_stockTransfers_Warehouses_ToWarehouseId] FOREIGN KEY ([ToWarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218160511_AddStockTransfersFix'
)
BEGIN
    CREATE TABLE [stockTransferItems] (
        [Id] int NOT NULL IDENTITY,
        [StockTransferId] int NOT NULL,
        [ProductId] int NOT NULL,
        [Quantity] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_stockTransferItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_stockTransferItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_stockTransferItems_stockTransfers_StockTransferId] FOREIGN KEY ([StockTransferId]) REFERENCES [stockTransfers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218160511_AddStockTransfersFix'
)
BEGIN
    CREATE INDEX [IX_stockTransferItems_ProductId] ON [stockTransferItems] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218160511_AddStockTransfersFix'
)
BEGIN
    CREATE INDEX [IX_stockTransferItems_StockTransferId] ON [stockTransferItems] ([StockTransferId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218160511_AddStockTransfersFix'
)
BEGIN
    CREATE INDEX [IX_stockTransfers_FromWarehouseId] ON [stockTransfers] ([FromWarehouseId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218160511_AddStockTransfersFix'
)
BEGIN
    CREATE INDEX [IX_stockTransfers_ToWarehouseId] ON [stockTransfers] ([ToWarehouseId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218160511_AddStockTransfersFix'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260218160511_AddStockTransfersFix', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218163312_AddStockTransfersTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260218163312_AddStockTransfersTable', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218205513_AddStockAdjustments'
)
BEGIN
    CREATE TABLE [StockAdjustments] (
        [Id] int NOT NULL IDENTITY,
        [AdjustmentNumber] nvarchar(max) NOT NULL,
        [WarehouseId] int NOT NULL,
        [ProductId] int NOT NULL,
        [QuantityAdjusted] int NOT NULL,
        [Reason] nvarchar(max) NOT NULL,
        [AdjustmentDate] datetime2 NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_StockAdjustments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_StockAdjustments_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_StockAdjustments_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218205513_AddStockAdjustments'
)
BEGIN
    CREATE INDEX [IX_StockAdjustments_ProductId] ON [StockAdjustments] ([ProductId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218205513_AddStockAdjustments'
)
BEGIN
    CREATE INDEX [IX_StockAdjustments_WarehouseId] ON [StockAdjustments] ([WarehouseId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260218205513_AddStockAdjustments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260218205513_AddStockAdjustments', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219095247_PaymentTransactionNew'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [AssignedTechnicianId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219095247_PaymentTransactionNew'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [JobNumber] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219095247_PaymentTransactionNew'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [JobType] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219095247_PaymentTransactionNew'
)
BEGIN
    ALTER TABLE [Quotations] ADD [CreatedByUserId] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219095247_PaymentTransactionNew'
)
BEGIN
    ALTER TABLE [Quotations] ADD [ExpiryDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219095247_PaymentTransactionNew'
)
BEGIN
    ALTER TABLE [Quotations] ADD [IssueDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219095247_PaymentTransactionNew'
)
BEGIN
    ALTER TABLE [Quotations] ADD [Notes] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219095247_PaymentTransactionNew'
)
BEGIN
    CREATE TABLE [PaymentTransactions] (
        [Id] int NOT NULL IDENTITY,
        [InvoiceId] int NOT NULL,
        [ReferenceNumber] nvarchar(max) NOT NULL,
        [GatewayTransactionId] nvarchar(max) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Currency] nvarchar(max) NOT NULL,
        [Provider] int NOT NULL,
        [Status] int NOT NULL,
        [ErrorMessage] nvarchar(max) NULL,
        [ProcessedAt] datetime2 NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_PaymentTransactions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219095247_PaymentTransactionNew'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260219095247_PaymentTransactionNew', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219112159_AddWorkOrderToInvoice'
)
BEGIN
    ALTER TABLE [Invoices] ADD [WorkOrderId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219112159_AddWorkOrderToInvoice'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260219112159_AddWorkOrderToInvoice', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219114834_AddTimeLogsAndInvoices'
)
BEGIN
    ALTER TABLE [invoiceItems] DROP CONSTRAINT [FK_invoiceItems_Invoices_InvoiceId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219114834_AddTimeLogsAndInvoices'
)
BEGIN
    ALTER TABLE [invoiceItems] DROP CONSTRAINT [PK_invoiceItems];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219114834_AddTimeLogsAndInvoices'
)
BEGIN
    EXEC sp_rename N'[invoiceItems]', N'InvoiceItem';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219114834_AddTimeLogsAndInvoices'
)
BEGIN
    EXEC sp_rename N'[InvoiceItem].[IX_invoiceItems_InvoiceId]', N'IX_InvoiceItem_InvoiceId', N'INDEX';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219114834_AddTimeLogsAndInvoices'
)
BEGIN
    ALTER TABLE [InvoiceItem] ADD [TotalPrice] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219114834_AddTimeLogsAndInvoices'
)
BEGIN
    ALTER TABLE [InvoiceItem] ADD CONSTRAINT [PK_InvoiceItem] PRIMARY KEY ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219114834_AddTimeLogsAndInvoices'
)
BEGIN
    CREATE TABLE [TimeLogs] (
        [Id] int NOT NULL IDENTITY,
        [WorkOrderId] int NOT NULL,
        [TechnicianId] nvarchar(max) NOT NULL,
        [CheckInTime] datetime2 NOT NULL,
        [CheckInLatitude] float NULL,
        [CheckInLongitude] float NULL,
        [CheckOutTime] datetime2 NULL,
        [CheckOutLatitude] float NULL,
        [CheckOutLongitude] float NULL,
        [HourlyRate] decimal(18,2) NOT NULL,
        [TotalCost] decimal(18,2) NOT NULL,
        [Notes] nvarchar(max) NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_TimeLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219114834_AddTimeLogsAndInvoices'
)
BEGIN
    ALTER TABLE [InvoiceItem] ADD CONSTRAINT [FK_InvoiceItem_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219114834_AddTimeLogsAndInvoices'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260219114834_AddTimeLogsAndInvoices', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219201944_AddPayrollModule'
)
BEGIN
    CREATE TABLE [EmployeeProfiles] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(max) NOT NULL,
        [MonthlyBaseSalary] decimal(18,2) NOT NULL,
        [BankAccountNumber] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_EmployeeProfiles] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219201944_AddPayrollModule'
)
BEGIN
    CREATE TABLE [Payslips] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(max) NOT NULL,
        [PeriodStart] datetime2 NOT NULL,
        [PeriodEnd] datetime2 NOT NULL,
        [BaseSalaryAmount] decimal(18,2) NOT NULL,
        [TotalBonuses] decimal(18,2) NOT NULL,
        [TotalPenalties] decimal(18,2) NOT NULL,
        [NetPay] decimal(18,2) NOT NULL,
        [Status] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Payslips] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219201944_AddPayrollModule'
)
BEGIN
    CREATE TABLE [PayrollEntries] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(max) NOT NULL,
        [WorkOrderId] int NULL,
        [PayslipId] int NULL,
        [Type] int NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [DateIncurred] datetime2 NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_PayrollEntries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PayrollEntries_Payslips_PayslipId] FOREIGN KEY ([PayslipId]) REFERENCES [Payslips] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219201944_AddPayrollModule'
)
BEGIN
    CREATE INDEX [IX_PayrollEntries_PayslipId] ON [PayrollEntries] ([PayslipId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219201944_AddPayrollModule'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260219201944_AddPayrollModule', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219215355_workOrder'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [CreatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219215355_workOrder'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260219215355_workOrder', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219232050_UpdatedTables'
)
BEGIN
    ALTER TABLE [Assets] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219232050_UpdatedTables'
)
BEGIN
    ALTER TABLE [Assets] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219232050_UpdatedTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260219232050_UpdatedTables', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219234432_AddSyncToCoreModules'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219234432_AddSyncToCoreModules'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219234432_AddSyncToCoreModules'
)
BEGIN
    ALTER TABLE [Payslips] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219234432_AddSyncToCoreModules'
)
BEGIN
    ALTER TABLE [Payslips] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219234432_AddSyncToCoreModules'
)
BEGIN
    ALTER TABLE [PayrollEntries] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219234432_AddSyncToCoreModules'
)
BEGIN
    ALTER TABLE [PayrollEntries] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219234432_AddSyncToCoreModules'
)
BEGIN
    ALTER TABLE [Invoices] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219234432_AddSyncToCoreModules'
)
BEGIN
    ALTER TABLE [Invoices] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260219234432_AddSyncToCoreModules'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260219234432_AddSyncToCoreModules', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260223201335_UpdateQuotationSchema2'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260223201335_UpdateQuotationSchema2', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226205016_AddAuditFieldsToWarehouse'
)
BEGIN
    ALTER TABLE [Warehouses] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226205016_AddAuditFieldsToWarehouse'
)
BEGIN
    ALTER TABLE [Warehouses] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226205016_AddAuditFieldsToWarehouse'
)
BEGIN
    ALTER TABLE [Vendors] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226205016_AddAuditFieldsToWarehouse'
)
BEGIN
    ALTER TABLE [Vendors] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226205016_AddAuditFieldsToWarehouse'
)
BEGIN
    ALTER TABLE [PurchaseOrders] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226205016_AddAuditFieldsToWarehouse'
)
BEGIN
    ALTER TABLE [PurchaseOrders] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226205016_AddAuditFieldsToWarehouse'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260226205016_AddAuditFieldsToWarehouse', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226213118_MergeProductTables'
)
BEGIN
    ALTER TABLE [InventoryStocks] DROP CONSTRAINT [FK_InventoryStocks_InventoryProducts_ProductId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226213118_MergeProductTables'
)
BEGIN
    DROP TABLE [InventoryProducts];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226213118_MergeProductTables'
)
BEGIN
    ALTER TABLE [InventoryStocks] ADD CONSTRAINT [FK_InventoryStocks_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260226213118_MergeProductTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260226213118_MergeProductTables', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260302005921_WorkOrderLifecycleRefactor'
)
BEGIN
    ALTER TABLE [Products] DROP CONSTRAINT [FK_Products_Categories_CategoryId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260302005921_WorkOrderLifecycleRefactor'
)
BEGIN
    ALTER TABLE [WorkOrders] DROP CONSTRAINT [FK_WorkOrders_AspNetUsers_TechnicianId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260302005921_WorkOrderLifecycleRefactor'
)
BEGIN
    CREATE INDEX [IX_WorkOrders_TenantId_TechnicianId] ON [WorkOrders] ([TenantId], [TechnicianId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260302005921_WorkOrderLifecycleRefactor'
)
BEGIN
    ALTER TABLE [Products] ADD CONSTRAINT [FK_Products_Categories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [Categories] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260302005921_WorkOrderLifecycleRefactor'
)
BEGIN
    ALTER TABLE [WorkOrders] ADD CONSTRAINT [FK_WorkOrders_AspNetUsers_TechnicianId] FOREIGN KEY ([TechnicianId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260302005921_WorkOrderLifecycleRefactor'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260302005921_WorkOrderLifecycleRefactor', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303151546_AddAssetToQuotation'
)
BEGIN
    ALTER TABLE [Quotations] ADD [AssetId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303151546_AddAssetToQuotation'
)
BEGIN
    CREATE INDEX [IX_Quotations_AssetId] ON [Quotations] ([AssetId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303151546_AddAssetToQuotation'
)
BEGIN
    ALTER TABLE [Quotations] ADD CONSTRAINT [FK_Quotations_Assets_AssetId] FOREIGN KEY ([AssetId]) REFERENCES [Assets] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260303151546_AddAssetToQuotation'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260303151546_AddAssetToQuotation', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304215003_AddFlexibleDataToAsset'
)
BEGIN
    ALTER TABLE [Assets] ADD [FlexibleData] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260304215003_AddFlexibleDataToAsset'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260304215003_AddFlexibleDataToAsset', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306223320_AddCategoryDescription'
)
BEGIN
    ALTER TABLE [Categories] ADD [Description] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306223320_AddCategoryDescription'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260306223320_AddCategoryDescription', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310194702_AddBankNameToEmployeeProfile'
)
BEGIN
    ALTER TABLE [EmployeeProfiles] ADD [BankName] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310194702_AddBankNameToEmployeeProfile'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260310194702_AddBankNameToEmployeeProfile', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310210050_AddSyncLogsAndConflicts'
)
BEGIN
    CREATE TABLE [SyncConflicts] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [UserId] nvarchar(max) NOT NULL,
        [EntityType] nvarchar(max) NOT NULL,
        [ServerId] int NOT NULL,
        [LocalMobileId] nvarchar(max) NOT NULL,
        [ServerPayloadJson] nvarchar(max) NOT NULL,
        [ClientPayloadJson] nvarchar(max) NOT NULL,
        [ResolutionStrategy] nvarchar(max) NOT NULL,
        [IsResolved] bit NOT NULL,
        [ConflictTime] datetime2 NOT NULL,
        CONSTRAINT [PK_SyncConflicts] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310210050_AddSyncLogsAndConflicts'
)
BEGIN
    CREATE TABLE [SyncLogs] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [UserId] nvarchar(max) NOT NULL,
        [UserFullName] nvarchar(max) NOT NULL,
        [Role] nvarchar(max) NOT NULL,
        [ItemsPushed] int NOT NULL,
        [ItemsPulled] int NOT NULL,
        [ConflictsResolved] int NOT NULL,
        [ErrorsEncountered] int NOT NULL,
        [SyncTime] datetime2 NOT NULL,
        [DeviceInfo] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_SyncLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310210050_AddSyncLogsAndConflicts'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260310210050_AddSyncLogsAndConflicts', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311015904_AddInventorySyncSupport'
)
BEGIN
    ALTER TABLE [stockTransfers] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311015904_AddInventorySyncSupport'
)
BEGIN
    ALTER TABLE [stockTransfers] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311015904_AddInventorySyncSupport'
)
BEGIN
    ALTER TABLE [stockTransferItems] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311015904_AddInventorySyncSupport'
)
BEGIN
    ALTER TABLE [stockTransferItems] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311015904_AddInventorySyncSupport'
)
BEGIN
    ALTER TABLE [StockAdjustments] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311015904_AddInventorySyncSupport'
)
BEGIN
    ALTER TABLE [StockAdjustments] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311015904_AddInventorySyncSupport'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311015904_AddInventorySyncSupport', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316215310_AddNotificationsTable'
)
BEGIN
    DECLARE @var4 sysname;
    SELECT @var4 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[WorkOrders]') AND [c].[name] = N'JobNumber');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [WorkOrders] DROP CONSTRAINT [' + @var4 + '];');
    ALTER TABLE [WorkOrders] ALTER COLUMN [JobNumber] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316215310_AddNotificationsTable'
)
BEGIN
    CREATE TABLE [Notifications] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [Title] nvarchar(100) NOT NULL,
        [Message] nvarchar(500) NOT NULL,
        [Type] nvarchar(50) NOT NULL,
        [TargetId] int NULL,
        [IsRead] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notifications_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316215310_AddNotificationsTable'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316215310_AddNotificationsTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260316215310_AddNotificationsTable', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Sites] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Sites] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Quotations] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Quotations] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [PurchaseOrderItems] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [PurchaseOrderItems] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Products] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Products] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [PaymentTransactions] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [PaymentTransactions] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [InventoryStocks] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [InventoryStocks] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Customers] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Customers] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Contracts] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Contracts] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [ContractItems] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [ContractItems] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Categories] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Categories] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Buildings] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    ALTER TABLE [Buildings] ADD [UpdatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260316222233_AddSyncToRemainingModules'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260316222233_AddSyncToRemainingModules', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318204008_AddSubscriptionToInvoice'
)
BEGIN
    ALTER TABLE [Invoices] ADD [SubscriptionId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318204008_AddSubscriptionToInvoice'
)
BEGIN
    CREATE TABLE [SubscriptionPlans] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [StripePriceId] nvarchar(200) NOT NULL,
        [MonthlyPrice] decimal(18,2) NOT NULL,
        [MaxUsers] int NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_SubscriptionPlans] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318204008_AddSubscriptionToInvoice'
)
BEGIN
    CREATE TABLE [TenantSubscriptions] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [StripeCustomerId] nvarchar(200) NOT NULL,
        [StripeSubscriptionId] nvarchar(200) NOT NULL,
        [SubscriptionPlanId] int NOT NULL,
        [SubscriptionStatus] int NOT NULL,
        [CurrentPeriodEnd] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TenantSubscriptions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TenantSubscriptions_SubscriptionPlans_SubscriptionPlanId] FOREIGN KEY ([SubscriptionPlanId]) REFERENCES [SubscriptionPlans] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TenantSubscriptions_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318204008_AddSubscriptionToInvoice'
)
BEGIN
    CREATE INDEX [IX_TenantSubscriptions_StripeSubscriptionId] ON [TenantSubscriptions] ([StripeSubscriptionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318204008_AddSubscriptionToInvoice'
)
BEGIN
    CREATE INDEX [IX_TenantSubscriptions_SubscriptionPlanId] ON [TenantSubscriptions] ([SubscriptionPlanId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318204008_AddSubscriptionToInvoice'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TenantSubscriptions_TenantId] ON [TenantSubscriptions] ([TenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318204008_AddSubscriptionToInvoice'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260318204008_AddSubscriptionToInvoice', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260318210436_AddSubscriptionTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260318210436_AddSubscriptionTables', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260319021237_UpdateStripePriceIds'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260319021237_UpdateStripePriceIds', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260320022545_AddTrialStartedAtToTenant'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260320022545_AddTrialStartedAtToTenant', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260320180314_AddPlanFeatures'
)
BEGIN
    ALTER TABLE [SubscriptionPlans] ADD [PlanFeatures] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260320180314_AddPlanFeatures'
)
BEGIN
    EXEC(N'UPDATE [SubscriptionPlans] SET [PlanFeatures] = 0
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260320180314_AddPlanFeatures'
)
BEGIN
    EXEC(N'UPDATE [SubscriptionPlans] SET [PlanFeatures] = 0
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260320180314_AddPlanFeatures'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260320180314_AddPlanFeatures', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260322074746_FixMissingTrialStartedAtColumn'
)
BEGIN
                    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Tenants' AND COLUMN_NAME = 'TrialStartedAt')
                    BEGIN
                        ALTER TABLE Tenants ADD TrialStartedAt datetime2 NULL;
                    END
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260322074746_FixMissingTrialStartedAtColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260322074746_FixMissingTrialStartedAtColumn', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    ALTER TABLE [Customers] ADD [IsProspect] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    CREATE TABLE [SalesLeads] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [LeadNumber] nvarchar(max) NOT NULL,
        [SiteId] int NOT NULL,
        [CustomerId] int NOT NULL,
        [SalesmanUserId] nvarchar(450) NOT NULL,
        [Status] int NOT NULL,
        [Notes] nvarchar(max) NOT NULL,
        [BOQFileUrl] nvarchar(max) NULL,
        [DrawingsFileUrl] nvarchar(max) NULL,
        [QuotationId] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_SalesLeads] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesLeads_AspNetUsers_SalesmanUserId] FOREIGN KEY ([SalesmanUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_SalesLeads_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SalesLeads_Quotations_QuotationId] FOREIGN KEY ([QuotationId]) REFERENCES [Quotations] ([Id]),
        CONSTRAINT [FK_SalesLeads_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    CREATE TABLE [SiteVisits] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [SalesLeadId] int NOT NULL,
        [VisitNumber] int NOT NULL,
        [StartTime] datetime2 NULL,
        [EndTime] datetime2 NULL,
        [StartLatitude] float NULL,
        [StartLongitude] float NULL,
        [EndLatitude] float NULL,
        [EndLongitude] float NULL,
        [MeetingNotes] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_SiteVisits] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SiteVisits_SalesLeads_SalesLeadId] FOREIGN KEY ([SalesLeadId]) REFERENCES [SalesLeads] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    CREATE TABLE [VisitPhotos] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [SiteVisitId] int NOT NULL,
        [PhotoUrl] nvarchar(max) NOT NULL,
        [Caption] nvarchar(max) NULL,
        [UploadedAt] datetime2 NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_VisitPhotos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VisitPhotos_SiteVisits_SiteVisitId] FOREIGN KEY ([SiteVisitId]) REFERENCES [SiteVisits] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    CREATE INDEX [IX_SalesLeads_CustomerId] ON [SalesLeads] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    CREATE INDEX [IX_SalesLeads_QuotationId] ON [SalesLeads] ([QuotationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    CREATE INDEX [IX_SalesLeads_SalesmanUserId] ON [SalesLeads] ([SalesmanUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    CREATE INDEX [IX_SalesLeads_SiteId] ON [SalesLeads] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    CREATE INDEX [IX_SiteVisits_SalesLeadId] ON [SiteVisits] ([SalesLeadId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    CREATE INDEX [IX_VisitPhotos_SiteVisitId] ON [VisitPhotos] ([SiteVisitId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404142427_AddIsProspectToCustomer'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260404142427_AddIsProspectToCustomer', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260404152959_AddSalesModule'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260404152959_AddSalesModule', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260407082500_UpdateSalesWorkflow'
)
BEGIN
    ALTER TABLE [Sites] ADD [Latitude] float NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260407082500_UpdateSalesWorkflow'
)
BEGIN
    ALTER TABLE [Sites] ADD [Longitude] float NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260407082500_UpdateSalesWorkflow'
)
BEGIN
    ALTER TABLE [Sites] ADD [ProjectStatus] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260407082500_UpdateSalesWorkflow'
)
BEGIN
    ALTER TABLE [SalesLeads] ADD [SalespersonSignatureName] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260407082500_UpdateSalesWorkflow'
)
BEGIN
    ALTER TABLE [Customers] ADD [ContactPersonName] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260407082500_UpdateSalesWorkflow'
)
BEGIN
    ALTER TABLE [Customers] ADD [ContractorCompanyName] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260407082500_UpdateSalesWorkflow'
)
BEGIN
    ALTER TABLE [Customers] ADD [FurtherDetails] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260407082500_UpdateSalesWorkflow'
)
BEGIN
    ALTER TABLE [Customers] ADD [HasVisitingCard] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260407082500_UpdateSalesWorkflow'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260407082500_UpdateSalesWorkflow', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412092143_QuotationItemTypes_QuotationSettings'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [CalculationBreakdown] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412092143_QuotationItemTypes_QuotationSettings'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [ItemType] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412092143_QuotationItemTypes_QuotationSettings'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [OriginalPrice] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412092143_QuotationItemTypes_QuotationSettings'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [ServiceName] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412092143_QuotationItemTypes_QuotationSettings'
)
BEGIN
    ALTER TABLE [Quotations] ADD [QuoteMode] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412092143_QuotationItemTypes_QuotationSettings'
)
BEGIN
    ALTER TABLE [Quotations] ADD [SupplyColumnMode] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412092143_QuotationItemTypes_QuotationSettings'
)
BEGIN
    ALTER TABLE [Products] ADD [Type] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412092143_QuotationItemTypes_QuotationSettings'
)
BEGIN
    CREATE TABLE [QuotationSettings] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [DefaultExchangeRate] decimal(18,4) NOT NULL,
        [CostFactorPct] decimal(18,4) NOT NULL,
        [ImportationPct] decimal(18,4) NOT NULL,
        [TransportationPct] decimal(18,4) NOT NULL,
        [ProfitPct] decimal(18,4) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_QuotationSettings] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412092143_QuotationItemTypes_QuotationSettings'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260412092143_QuotationItemTypes_QuotationSettings', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412210342_QuotationPdfEnhancement'
)
BEGIN
    ALTER TABLE [Quotations] ADD [ProjectCode] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412210342_QuotationPdfEnhancement'
)
BEGIN
    ALTER TABLE [Quotations] ADD [QuoteHeadline] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412210342_QuotationPdfEnhancement'
)
BEGIN
    ALTER TABLE [Quotations] ADD [RevisionNumber] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260412210342_QuotationPdfEnhancement'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260412210342_QuotationPdfEnhancement', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419142022_AddUnitFieldsToQuotationItem'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [Unit] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419142022_AddUnitFieldsToQuotationItem'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [UnitQty] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260419142022_AddUnitFieldsToQuotationItem'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260419142022_AddUnitFieldsToQuotationItem', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420075723_AddDesignationToAppUser'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [Designation] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260420075723_AddDesignationToAppUser'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260420075723_AddDesignationToAppUser', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260421121511_AddQuotationItemIdToInvoice'
)
BEGIN
    ALTER TABLE [InvoiceItem] ADD [QuotationItemId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260421121511_AddQuotationItemIdToInvoice'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260421121511_AddQuotationItemIdToInvoice', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426194243_AddBankAccounts'
)
BEGIN
    ALTER TABLE [Invoices] ADD [BankAccountNumber] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426194243_AddBankAccounts'
)
BEGIN
    ALTER TABLE [Invoices] ADD [BankAccountTitle] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426194243_AddBankAccounts'
)
BEGIN
    ALTER TABLE [Invoices] ADD [BankName] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426194243_AddBankAccounts'
)
BEGIN
    ALTER TABLE [Invoices] ADD [IssuedByName] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426194243_AddBankAccounts'
)
BEGIN
    ALTER TABLE [Invoices] ADD [IssuedByPhone] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426194243_AddBankAccounts'
)
BEGIN
    CREATE TABLE [BankAccounts] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [BankName] nvarchar(200) NOT NULL,
        [AccountNumber] nvarchar(100) NOT NULL,
        [AccountTitle] nvarchar(200) NOT NULL,
        [IsDefault] bit NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_BankAccounts] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260426194243_AddBankAccounts'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260426194243_AddBankAccounts', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427223500_AddAdditionalContactsJsonAndImportedLocalServices'
)
BEGIN
    ALTER TABLE [Customers] ADD [AdditionalContactsJson] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427223500_AddAdditionalContactsJsonAndImportedLocalServices'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427223500_AddAdditionalContactsJsonAndImportedLocalServices', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427232418_AddProvincialTaxToQuotation'
)
BEGIN
    ALTER TABLE [Quotations] ADD [ProvincialTaxAmount] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427232418_AddProvincialTaxToQuotation'
)
BEGIN
    ALTER TABLE [Quotations] ADD [ProvincialTaxPercentage] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427232418_AddProvincialTaxToQuotation'
)
BEGIN
    ALTER TABLE [Quotations] ADD [ProvincialTaxType] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260427232418_AddProvincialTaxToQuotation'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260427232418_AddProvincialTaxToQuotation', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428192630_AddExtraFileUrlsJsonToSalesLead'
)
BEGIN
    ALTER TABLE [SalesLeads] ADD [ExtraFileUrlsJson] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260428192630_AddExtraFileUrlsJsonToSalesLead'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260428192630_AddExtraFileUrlsJsonToSalesLead', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501203658_AddAmountRequestForm'
)
BEGIN
    CREATE TABLE [AmountRequestForms] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [AdvanceRequested] decimal(18,2) NOT NULL,
        [AccountDetail] nvarchar(max) NOT NULL,
        [DateOfFundRequired] datetime2 NULL,
        [SiteId] int NULL,
        [CustomSiteName] nvarchar(max) NOT NULL,
        [ClientName] nvarchar(max) NOT NULL,
        [PurposeOfAdvance] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [DirectorName] nvarchar(max) NULL,
        [DirectorApprovalDate] datetime2 NULL,
        [DirectorComment] nvarchar(max) NULL,
        [CeoName] nvarchar(max) NULL,
        [CeoApprovalDate] datetime2 NULL,
        [CeoComment] nvarchar(max) NULL,
        [AccountsDateOfEntry] datetime2 NULL,
        [AccountsDateOfFundReleased] datetime2 NULL,
        [AccountsReleasedAmount] decimal(18,2) NULL,
        [AccountsRemarks] nvarchar(max) NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_AmountRequestForms] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AmountRequestForms_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501203658_AddAmountRequestForm'
)
BEGIN
    CREATE TABLE [AmountRequestPayments] (
        [Id] int NOT NULL IDENTITY,
        [AmountRequestFormId] int NOT NULL,
        [ReleasedDate] datetime2 NULL,
        [ReleasedAmount] decimal(18,2) NOT NULL,
        [ReceivedBy] nvarchar(max) NOT NULL,
        [ModeOfPayment] nvarchar(max) NOT NULL,
        [Remarks] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_AmountRequestPayments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AmountRequestPayments_AmountRequestForms_AmountRequestFormId] FOREIGN KEY ([AmountRequestFormId]) REFERENCES [AmountRequestForms] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501203658_AddAmountRequestForm'
)
BEGIN
    CREATE INDEX [IX_AmountRequestForms_SiteId] ON [AmountRequestForms] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501203658_AddAmountRequestForm'
)
BEGIN
    CREATE INDEX [IX_AmountRequestPayments_AmountRequestFormId] ON [AmountRequestPayments] ([AmountRequestFormId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501203658_AddAmountRequestForm'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260501203658_AddAmountRequestForm', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501204247_AddCreatedAtToAmountRequestForm'
)
BEGIN
    ALTER TABLE [AmountRequestForms] ADD [CreatedAt] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501204247_AddCreatedAtToAmountRequestForm'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260501204247_AddCreatedAtToAmountRequestForm', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501222156_AddEmployeeEmailToAmountRequestForm'
)
BEGIN
    ALTER TABLE [AmountRequestForms] ADD [EmployeeEmail] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501222156_AddEmployeeEmailToAmountRequestForm'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260501222156_AddEmployeeEmailToAmountRequestForm', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503113404_AddExpenseAndArfNumber'
)
BEGIN
    ALTER TABLE [AmountRequestForms] ADD [ArfNumber] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503113404_AddExpenseAndArfNumber'
)
BEGIN
    CREATE TABLE [Expenses] (
        [Id] int NOT NULL IDENTITY,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [SiteId] int NOT NULL,
        [AmountRequestFormId] int NOT NULL,
        [CreatedByEmail] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Expenses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Expenses_AmountRequestForms_AmountRequestFormId] FOREIGN KEY ([AmountRequestFormId]) REFERENCES [AmountRequestForms] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Expenses_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503113404_AddExpenseAndArfNumber'
)
BEGIN
    CREATE TABLE [ExpenseItems] (
        [Id] int NOT NULL IDENTITY,
        [ExpenseId] int NOT NULL,
        [ExpenseDate] datetime2 NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [EmployeeDesignation] nvarchar(max) NOT NULL,
        [ExpenseType] nvarchar(max) NOT NULL,
        [DescriptionItems] nvarchar(max) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Remarks] nvarchar(max) NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ExpenseItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ExpenseItems_Expenses_ExpenseId] FOREIGN KEY ([ExpenseId]) REFERENCES [Expenses] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503113404_AddExpenseAndArfNumber'
)
BEGIN
    CREATE INDEX [IX_ExpenseItems_ExpenseId] ON [ExpenseItems] ([ExpenseId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503113404_AddExpenseAndArfNumber'
)
BEGIN
    CREATE INDEX [IX_Expenses_AmountRequestFormId] ON [Expenses] ([AmountRequestFormId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503113404_AddExpenseAndArfNumber'
)
BEGIN
    CREATE INDEX [IX_Expenses_SiteId] ON [Expenses] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503113404_AddExpenseAndArfNumber'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260503113404_AddExpenseAndArfNumber', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503132250_AddAllocatedExcessToExpense'
)
BEGIN
    ALTER TABLE [Expenses] DROP CONSTRAINT [FK_Expenses_AmountRequestForms_AmountRequestFormId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503132250_AddAllocatedExcessToExpense'
)
BEGIN
    DECLARE @var5 sysname;
    SELECT @var5 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Expenses]') AND [c].[name] = N'AmountRequestFormId');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [Expenses] DROP CONSTRAINT [' + @var5 + '];');
    ALTER TABLE [Expenses] ALTER COLUMN [AmountRequestFormId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503132250_AddAllocatedExcessToExpense'
)
BEGIN
    ALTER TABLE [Expenses] ADD [IsAllocatedExcess] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503132250_AddAllocatedExcessToExpense'
)
BEGIN
    ALTER TABLE [Expenses] ADD [SourceArfNumber] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503132250_AddAllocatedExcessToExpense'
)
BEGIN
    ALTER TABLE [Expenses] ADD CONSTRAINT [FK_Expenses_AmountRequestForms_AmountRequestFormId] FOREIGN KEY ([AmountRequestFormId]) REFERENCES [AmountRequestForms] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260503132250_AddAllocatedExcessToExpense'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260503132250_AddAllocatedExcessToExpense', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260511011957_AddArfAttachments'
)
BEGIN
    ALTER TABLE [AmountRequestForms] ADD [AttachmentsJson] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260511011957_AddArfAttachments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260511011957_AddArfAttachments', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260511015232_AddExpenseItemAttachmentsJson'
)
BEGIN
    ALTER TABLE [ExpenseItems] ADD [AttachmentsJson] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260511015232_AddExpenseItemAttachmentsJson'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260511015232_AddExpenseItemAttachmentsJson', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519233316_AddAssignedEstimatorToSalesLead'
)
BEGIN
    ALTER TABLE [SalesLeads] ADD [AssignedEstimatorId] nvarchar(450) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519233316_AddAssignedEstimatorToSalesLead'
)
BEGIN
    CREATE INDEX [IX_SalesLeads_AssignedEstimatorId] ON [SalesLeads] ([AssignedEstimatorId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519233316_AddAssignedEstimatorToSalesLead'
)
BEGIN
    ALTER TABLE [SalesLeads] ADD CONSTRAINT [FK_SalesLeads_AspNetUsers_AssignedEstimatorId] FOREIGN KEY ([AssignedEstimatorId]) REFERENCES [AspNetUsers] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260519233316_AddAssignedEstimatorToSalesLead'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260519233316_AddAssignedEstimatorToSalesLead', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520171409_AddTermsAndConditionsTemplates'
)
BEGIN
    ALTER TABLE [Quotations] ADD [TermsAndConditionsJson] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520171409_AddTermsAndConditionsTemplates'
)
BEGIN
    CREATE TABLE [TermsAndConditionsTemplates] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [IsDefault] bit NOT NULL,
        [PaymentAndTax] nvarchar(max) NULL,
        [Delivery] nvarchar(max) NULL,
        [Warranty] nvarchar(max) NULL,
        [PurchaseOrder] nvarchar(max) NULL,
        [ValidityAndTransportation] nvarchar(max) NULL,
        [General] nvarchar(max) NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_TermsAndConditionsTemplates] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260520171409_AddTermsAndConditionsTemplates'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260520171409_AddTermsAndConditionsTemplates', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526133925_AddSiteDocuments'
)
BEGIN
    CREATE TABLE [SiteDocuments] (
        [Id] int NOT NULL IDENTITY,
        [SiteId] int NOT NULL,
        [DocumentType] nvarchar(max) NOT NULL,
        [CustomerId] int NULL,
        [SecondaryCustomerId] int NULL,
        [FileName] nvarchar(max) NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        [UploadedByUserId] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_SiteDocuments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SiteDocuments_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]),
        CONSTRAINT [FK_SiteDocuments_Customers_SecondaryCustomerId] FOREIGN KEY ([SecondaryCustomerId]) REFERENCES [Customers] ([Id]),
        CONSTRAINT [FK_SiteDocuments_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526133925_AddSiteDocuments'
)
BEGIN
    CREATE INDEX [IX_SiteDocuments_CustomerId] ON [SiteDocuments] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526133925_AddSiteDocuments'
)
BEGIN
    CREATE INDEX [IX_SiteDocuments_SecondaryCustomerId] ON [SiteDocuments] ([SecondaryCustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526133925_AddSiteDocuments'
)
BEGIN
    CREATE INDEX [IX_SiteDocuments_SiteId] ON [SiteDocuments] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526133925_AddSiteDocuments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260526133925_AddSiteDocuments', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526193000_UpdateSiteDocumentsAddMissingProps'
)
BEGIN
    ALTER TABLE [SiteDocuments] ADD [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE());
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526193000_UpdateSiteDocumentsAddMissingProps'
)
BEGIN
    ALTER TABLE [SiteDocuments] ADD [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526193000_UpdateSiteDocumentsAddMissingProps'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260526193000_UpdateSiteDocumentsAddMissingProps', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260527124825_AddMaterialReceivingForm'
)
BEGIN
    CREATE TABLE [MaterialReceivingForms] (
        [Id] int NOT NULL IDENTITY,
        [SiteId] int NULL,
        [TenantId] int NOT NULL,
        [Location] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_MaterialReceivingForms] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MaterialReceivingForms_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_MaterialReceivingForms_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]),
        CONSTRAINT [FK_MaterialReceivingForms_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260527124825_AddMaterialReceivingForm'
)
BEGIN
    CREATE TABLE [MaterialReceivingItems] (
        [Id] int NOT NULL IDENTITY,
        [MaterialReceivingFormId] int NOT NULL,
        [ItemName] nvarchar(max) NOT NULL,
        [LocationValue] nvarchar(max) NOT NULL,
        [Received] nvarchar(max) NOT NULL,
        [Remarks] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_MaterialReceivingItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MaterialReceivingItems_MaterialReceivingForms_MaterialReceivingFormId] FOREIGN KEY ([MaterialReceivingFormId]) REFERENCES [MaterialReceivingForms] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260527124825_AddMaterialReceivingForm'
)
BEGIN
    CREATE INDEX [IX_MaterialReceivingForms_CreatedByUserId] ON [MaterialReceivingForms] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260527124825_AddMaterialReceivingForm'
)
BEGIN
    CREATE INDEX [IX_MaterialReceivingForms_SiteId] ON [MaterialReceivingForms] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260527124825_AddMaterialReceivingForm'
)
BEGIN
    CREATE INDEX [IX_MaterialReceivingForms_TenantId] ON [MaterialReceivingForms] ([TenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260527124825_AddMaterialReceivingForm'
)
BEGIN
    CREATE INDEX [IX_MaterialReceivingItems_MaterialReceivingFormId] ON [MaterialReceivingItems] ([MaterialReceivingFormId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260527124825_AddMaterialReceivingForm'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260527124825_AddMaterialReceivingForm', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    ALTER TABLE [MaterialReceivingForms] DROP CONSTRAINT [FK_MaterialReceivingForms_AspNetUsers_CreatedByUserId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    CREATE TABLE [MomMeetings] (
        [Id] int NOT NULL IDENTITY,
        [SiteId] int NULL,
        [TenantId] int NOT NULL,
        [MeetingTitle] nvarchar(max) NOT NULL,
        [MeetingDate] datetime2 NOT NULL,
        [TimeFrom] nvarchar(max) NOT NULL,
        [TimeTo] nvarchar(max) NOT NULL,
        [Location] nvarchar(max) NOT NULL,
        [Organizer] nvarchar(max) NOT NULL,
        [MeetingType] nvarchar(max) NOT NULL,
        [Agenda] nvarchar(max) NOT NULL,
        [DiscussionPoints] nvarchar(max) NOT NULL,
        [DecisionsMade] nvarchar(max) NOT NULL,
        [ActionItems] nvarchar(max) NOT NULL,
        [ClosingNotes] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_MomMeetings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MomMeetings_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_MomMeetings_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]),
        CONSTRAINT [FK_MomMeetings_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    CREATE TABLE [MomAttachments] (
        [Id] int NOT NULL IDENTITY,
        [MomMeetingId] int NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_MomAttachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MomAttachments_MomMeetings_MomMeetingId] FOREIGN KEY ([MomMeetingId]) REFERENCES [MomMeetings] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    CREATE TABLE [MomAttendees] (
        [Id] int NOT NULL IDENTITY,
        [MomMeetingId] int NOT NULL,
        [EmployeeIdStr] nvarchar(max) NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [EmployeeStatus] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_MomAttendees] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MomAttendees_MomMeetings_MomMeetingId] FOREIGN KEY ([MomMeetingId]) REFERENCES [MomMeetings] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    CREATE INDEX [IX_MomAttachments_MomMeetingId] ON [MomAttachments] ([MomMeetingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    CREATE INDEX [IX_MomAttendees_MomMeetingId] ON [MomAttendees] ([MomMeetingId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    CREATE INDEX [IX_MomMeetings_CreatedByUserId] ON [MomMeetings] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    CREATE INDEX [IX_MomMeetings_SiteId] ON [MomMeetings] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    CREATE INDEX [IX_MomMeetings_TenantId] ON [MomMeetings] ([TenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    ALTER TABLE [MaterialReceivingForms] ADD CONSTRAINT [FK_MaterialReceivingForms_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260528133341_AddMomMeeting'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260528133341_AddMomMeeting', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE TABLE [DailyProgressReports] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [SiteId] int NOT NULL,
        [Date] datetime2 NOT NULL,
        [SiteInCharge] nvarchar(max) NOT NULL,
        [SiteOpeningTime] nvarchar(max) NOT NULL,
        [SiteClosingTime] nvarchar(max) NOT NULL,
        [TotalWorkers] int NOT NULL,
        [NextDayActivityPlan] nvarchar(max) NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_DailyProgressReports] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DailyProgressReports_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_DailyProgressReports_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE TABLE [DprActivities] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [DailyProgressReportId] int NOT NULL,
        [ActivityDone] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_DprActivities] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DprActivities_DailyProgressReports_DailyProgressReportId] FOREIGN KEY ([DailyProgressReportId]) REFERENCES [DailyProgressReports] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE TABLE [DprAttachments] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [DailyProgressReportId] int NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        [BlobName] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_DprAttachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DprAttachments_DailyProgressReports_DailyProgressReportId] FOREIGN KEY ([DailyProgressReportId]) REFERENCES [DailyProgressReports] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE TABLE [DprEmployees] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [DailyProgressReportId] int NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [InTime] nvarchar(max) NOT NULL,
        [OutTime] nvarchar(max) NOT NULL,
        [OverTime] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_DprEmployees] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DprEmployees_DailyProgressReports_DailyProgressReportId] FOREIGN KEY ([DailyProgressReportId]) REFERENCES [DailyProgressReports] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE TABLE [DprMaterials] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [DailyProgressReportId] int NOT NULL,
        [Item] nvarchar(max) NOT NULL,
        [Quantity] nvarchar(max) NOT NULL,
        [Remarks] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_DprMaterials] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DprMaterials_DailyProgressReports_DailyProgressReportId] FOREIGN KEY ([DailyProgressReportId]) REFERENCES [DailyProgressReports] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE INDEX [IX_DailyProgressReports_CreatedByUserId] ON [DailyProgressReports] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE INDEX [IX_DailyProgressReports_SiteId] ON [DailyProgressReports] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE INDEX [IX_DprActivities_DailyProgressReportId] ON [DprActivities] ([DailyProgressReportId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE INDEX [IX_DprAttachments_DailyProgressReportId] ON [DprAttachments] ([DailyProgressReportId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE INDEX [IX_DprEmployees_DailyProgressReportId] ON [DprEmployees] ([DailyProgressReportId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    CREATE INDEX [IX_DprMaterials_DailyProgressReportId] ON [DprMaterials] ([DailyProgressReportId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529113601_AddDailyProgressReport'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260529113601_AddDailyProgressReport', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529225020_AddItemProcurement'
)
BEGIN
    CREATE TABLE [ItemProcurements] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [SiteId] int NOT NULL,
        [Date] datetime2 NOT NULL,
        [Remarks] nvarchar(max) NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ItemProcurements] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ItemProcurements_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ItemProcurements_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529225020_AddItemProcurement'
)
BEGIN
    CREATE TABLE [ItemProcurementItems] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [ItemProcurementId] int NOT NULL,
        [ItemName] nvarchar(max) NOT NULL,
        [Quantity] int NOT NULL,
        [Remarks] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ItemProcurementItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ItemProcurementItems_ItemProcurements_ItemProcurementId] FOREIGN KEY ([ItemProcurementId]) REFERENCES [ItemProcurements] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529225020_AddItemProcurement'
)
BEGIN
    CREATE INDEX [IX_ItemProcurementItems_ItemProcurementId] ON [ItemProcurementItems] ([ItemProcurementId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529225020_AddItemProcurement'
)
BEGIN
    CREATE INDEX [IX_ItemProcurements_CreatedByUserId] ON [ItemProcurements] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529225020_AddItemProcurement'
)
BEGIN
    CREATE INDEX [IX_ItemProcurements_SiteId] ON [ItemProcurements] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260529225020_AddItemProcurement'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260529225020_AddItemProcurement', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530104556_AddMeetingMinutesExecution'
)
BEGIN
    CREATE TABLE [MeetingMinutesExecutions] (
        [Id] int NOT NULL IDENTITY,
        [SiteId] int NULL,
        [TenantId] int NOT NULL,
        [MeetingTitle] nvarchar(max) NOT NULL,
        [MeetingDate] datetime2 NOT NULL,
        [TimeFrom] nvarchar(max) NOT NULL,
        [TimeTo] nvarchar(max) NOT NULL,
        [Location] nvarchar(max) NOT NULL,
        [Organizer] nvarchar(max) NOT NULL,
        [MeetingType] nvarchar(max) NOT NULL,
        [Agenda] nvarchar(max) NOT NULL,
        [DiscussionPoints] nvarchar(max) NOT NULL,
        [DecisionsMade] nvarchar(max) NOT NULL,
        [ActionItems] nvarchar(max) NOT NULL,
        [ClosingNotes] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_MeetingMinutesExecutions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MeetingMinutesExecutions_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_MeetingMinutesExecutions_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]),
        CONSTRAINT [FK_MeetingMinutesExecutions_Tenants_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [Tenants] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530104556_AddMeetingMinutesExecution'
)
BEGIN
    CREATE TABLE [MeetingMinutesExecutionAttachments] (
        [Id] int NOT NULL IDENTITY,
        [MeetingMinutesExecutionId] int NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_MeetingMinutesExecutionAttachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MeetingMinutesExecutionAttachments_MeetingMinutesExecutions_MeetingMinutesExecutionId] FOREIGN KEY ([MeetingMinutesExecutionId]) REFERENCES [MeetingMinutesExecutions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530104556_AddMeetingMinutesExecution'
)
BEGIN
    CREATE TABLE [MeetingMinutesExecutionAttendees] (
        [Id] int NOT NULL IDENTITY,
        [MeetingMinutesExecutionId] int NOT NULL,
        [EmployeeIdStr] nvarchar(max) NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [EmployeeStatus] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_MeetingMinutesExecutionAttendees] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MeetingMinutesExecutionAttendees_MeetingMinutesExecutions_MeetingMinutesExecutionId] FOREIGN KEY ([MeetingMinutesExecutionId]) REFERENCES [MeetingMinutesExecutions] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530104556_AddMeetingMinutesExecution'
)
BEGIN
    CREATE INDEX [IX_MeetingMinutesExecutionAttachments_MeetingMinutesExecutionId] ON [MeetingMinutesExecutionAttachments] ([MeetingMinutesExecutionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530104556_AddMeetingMinutesExecution'
)
BEGIN
    CREATE INDEX [IX_MeetingMinutesExecutionAttendees_MeetingMinutesExecutionId] ON [MeetingMinutesExecutionAttendees] ([MeetingMinutesExecutionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530104556_AddMeetingMinutesExecution'
)
BEGIN
    CREATE INDEX [IX_MeetingMinutesExecutions_CreatedByUserId] ON [MeetingMinutesExecutions] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530104556_AddMeetingMinutesExecution'
)
BEGIN
    CREATE INDEX [IX_MeetingMinutesExecutions_SiteId] ON [MeetingMinutesExecutions] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530104556_AddMeetingMinutesExecution'
)
BEGIN
    CREATE INDEX [IX_MeetingMinutesExecutions_TenantId] ON [MeetingMinutesExecutions] ([TenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530104556_AddMeetingMinutesExecution'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260530104556_AddMeetingMinutesExecution', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530133042_AddProjectTechnicalHandover'
)
BEGIN
    CREATE TABLE [ProjectTechnicalHandovers] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [SiteId] int NOT NULL,
        [CustomerId] int NULL,
        [SecondaryCustomerId] int NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ProjectTechnicalHandovers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProjectTechnicalHandovers_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProjectTechnicalHandovers_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]),
        CONSTRAINT [FK_ProjectTechnicalHandovers_Customers_SecondaryCustomerId] FOREIGN KEY ([SecondaryCustomerId]) REFERENCES [Customers] ([Id]),
        CONSTRAINT [FK_ProjectTechnicalHandovers_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530133042_AddProjectTechnicalHandover'
)
BEGIN
    CREATE TABLE [ProjectTechnicalHandoverAttachments] (
        [Id] int NOT NULL IDENTITY,
        [ProjectTechnicalHandoverId] int NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_ProjectTechnicalHandoverAttachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProjectTechnicalHandoverAttachments_ProjectTechnicalHandovers_ProjectTechnicalHandoverId] FOREIGN KEY ([ProjectTechnicalHandoverId]) REFERENCES [ProjectTechnicalHandovers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530133042_AddProjectTechnicalHandover'
)
BEGIN
    CREATE INDEX [IX_ProjectTechnicalHandoverAttachments_ProjectTechnicalHandoverId] ON [ProjectTechnicalHandoverAttachments] ([ProjectTechnicalHandoverId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530133042_AddProjectTechnicalHandover'
)
BEGIN
    CREATE INDEX [IX_ProjectTechnicalHandovers_CreatedByUserId] ON [ProjectTechnicalHandovers] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530133042_AddProjectTechnicalHandover'
)
BEGIN
    CREATE INDEX [IX_ProjectTechnicalHandovers_CustomerId] ON [ProjectTechnicalHandovers] ([CustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530133042_AddProjectTechnicalHandover'
)
BEGIN
    CREATE INDEX [IX_ProjectTechnicalHandovers_SecondaryCustomerId] ON [ProjectTechnicalHandovers] ([SecondaryCustomerId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530133042_AddProjectTechnicalHandover'
)
BEGIN
    CREATE INDEX [IX_ProjectTechnicalHandovers_SiteId] ON [ProjectTechnicalHandovers] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260530133042_AddProjectTechnicalHandover'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260530133042_AddProjectTechnicalHandover', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608142245_AddToolBoxTalk'
)
BEGIN
    CREATE TABLE [ToolBoxTalks] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [DocumentNo] nvarchar(max) NOT NULL,
        [FormNo] nvarchar(max) NOT NULL,
        [Date] datetime2 NOT NULL,
        [Time] nvarchar(max) NOT NULL,
        [SiteId] int NOT NULL,
        [TbtPerformedBy] nvarchar(max) NOT NULL,
        [Subject] nvarchar(max) NOT NULL,
        [JobSupervisorName] nvarchar(max) NOT NULL,
        [QehsName] nvarchar(max) NOT NULL,
        [ProjectManagerName] nvarchar(max) NOT NULL,
        [SelectedTopics] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ToolBoxTalks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ToolBoxTalks_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608142245_AddToolBoxTalk'
)
BEGIN
    CREATE TABLE [ToolBoxTalkAttendees] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [ToolBoxTalkId] int NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ToolBoxTalkAttendees] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ToolBoxTalkAttendees_ToolBoxTalks_ToolBoxTalkId] FOREIGN KEY ([ToolBoxTalkId]) REFERENCES [ToolBoxTalks] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608142245_AddToolBoxTalk'
)
BEGIN
    CREATE INDEX [IX_ToolBoxTalkAttendees_ToolBoxTalkId] ON [ToolBoxTalkAttendees] ([ToolBoxTalkId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608142245_AddToolBoxTalk'
)
BEGIN
    CREATE INDEX [IX_ToolBoxTalks_SiteId] ON [ToolBoxTalks] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608142245_AddToolBoxTalk'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260608142245_AddToolBoxTalk', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608152338_AddTrainingDetailsForm'
)
BEGIN
    CREATE TABLE [TrainingDetails] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [TrainerName] nvarchar(max) NOT NULL,
        [FromTime] nvarchar(max) NOT NULL,
        [ToTime] nvarchar(max) NOT NULL,
        [Date] datetime2 NOT NULL,
        [Location] nvarchar(max) NOT NULL,
        [TrainingType] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TrainingDetails] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608152338_AddTrainingDetailsForm'
)
BEGIN
    CREATE TABLE [TrainingDetailParticipants] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [TrainingDetailId] int NOT NULL,
        [ParticipantName] nvarchar(max) NOT NULL,
        [EmployeeId] nvarchar(max) NOT NULL,
        [Department] nvarchar(max) NOT NULL,
        [Designation] nvarchar(max) NOT NULL,
        [ContactDetails] nvarchar(max) NOT NULL,
        [EmployeeStatus] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TrainingDetailParticipants] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TrainingDetailParticipants_TrainingDetails_TrainingDetailId] FOREIGN KEY ([TrainingDetailId]) REFERENCES [TrainingDetails] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608152338_AddTrainingDetailsForm'
)
BEGIN
    CREATE INDEX [IX_TrainingDetailParticipants_TrainingDetailId] ON [TrainingDetailParticipants] ([TrainingDetailId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608152338_AddTrainingDetailsForm'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260608152338_AddTrainingDetailsForm', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608163236_AddProjectSpotCheck'
)
BEGIN
    CREATE TABLE [ProjectSpotChecks] (
        [Id] int NOT NULL IDENTITY,
        [SiteId] int NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [UploadedFiles] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ProjectSpotChecks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProjectSpotChecks_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProjectSpotChecks_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608163236_AddProjectSpotCheck'
)
BEGIN
    CREATE TABLE [ProjectSpotCheckItems] (
        [Id] int NOT NULL IDENTITY,
        [ProjectSpotCheckId] int NOT NULL,
        [ItemText] nvarchar(max) NOT NULL,
        [IsYes] bit NOT NULL,
        [IsNo] bit NOT NULL,
        [IsNA] bit NOT NULL,
        [Comments] nvarchar(max) NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ProjectSpotCheckItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProjectSpotCheckItems_ProjectSpotChecks_ProjectSpotCheckId] FOREIGN KEY ([ProjectSpotCheckId]) REFERENCES [ProjectSpotChecks] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608163236_AddProjectSpotCheck'
)
BEGIN
    CREATE INDEX [IX_ProjectSpotCheckItems_ProjectSpotCheckId] ON [ProjectSpotCheckItems] ([ProjectSpotCheckId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608163236_AddProjectSpotCheck'
)
BEGIN
    CREATE INDEX [IX_ProjectSpotChecks_CreatedByUserId] ON [ProjectSpotChecks] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608163236_AddProjectSpotCheck'
)
BEGIN
    CREATE INDEX [IX_ProjectSpotChecks_SiteId] ON [ProjectSpotChecks] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608163236_AddProjectSpotCheck'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260608163236_AddProjectSpotCheck', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608194604_AddProjectSpotCheckSite'
)
BEGIN
    DROP TABLE [ProjectSpotCheckItems];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608194604_AddProjectSpotCheckSite'
)
BEGIN
    DROP TABLE [ProjectSpotChecks];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608194604_AddProjectSpotCheckSite'
)
BEGIN
    CREATE TABLE [ProjectSpotCheckSites] (
        [Id] int NOT NULL IDENTITY,
        [SiteId] int NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(max) NOT NULL,
        [UploadedFiles] nvarchar(max) NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ProjectSpotCheckSites] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProjectSpotCheckSites_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608194604_AddProjectSpotCheckSite'
)
BEGIN
    CREATE TABLE [ProjectSpotCheckSiteItems] (
        [Id] int NOT NULL IDENTITY,
        [ProjectSpotCheckSiteId] int NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(max) NOT NULL,
        [ItemText] nvarchar(max) NOT NULL,
        [IsYes] bit NOT NULL,
        [IsNA] bit NOT NULL,
        [Comments] nvarchar(max) NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ProjectSpotCheckSiteItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProjectSpotCheckSiteItems_ProjectSpotCheckSites_ProjectSpotCheckSiteId] FOREIGN KEY ([ProjectSpotCheckSiteId]) REFERENCES [ProjectSpotCheckSites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608194604_AddProjectSpotCheckSite'
)
BEGIN
    CREATE INDEX [IX_ProjectSpotCheckSiteItems_ProjectSpotCheckSiteId] ON [ProjectSpotCheckSiteItems] ([ProjectSpotCheckSiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608194604_AddProjectSpotCheckSite'
)
BEGIN
    CREATE INDEX [IX_ProjectSpotCheckSites_SiteId] ON [ProjectSpotCheckSites] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608194604_AddProjectSpotCheckSite'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260608194604_AddProjectSpotCheckSite', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608203618_AddIncidentRecord'
)
BEGIN
    CREATE TABLE [IncidentRecords] (
        [Id] int NOT NULL IDENTITY,
        [TenantId] int NOT NULL,
        [SiteId] int NOT NULL,
        [Doc] nvarchar(max) NOT NULL,
        [Issue] nvarchar(max) NOT NULL,
        [IssueDate] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_IncidentRecords] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_IncidentRecords_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608203618_AddIncidentRecord'
)
BEGIN
    CREATE TABLE [IncidentRecordItems] (
        [Id] int NOT NULL IDENTITY,
        [IncidentRecordId] int NOT NULL,
        [Date] datetime2 NULL,
        [DescriptionOfIncident] nvarchar(max) NOT NULL,
        [ToWhom] nvarchar(max) NOT NULL,
        [Department] nvarchar(max) NOT NULL,
        [CorrectiveAction] nvarchar(max) NOT NULL,
        [Remarks] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_IncidentRecordItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_IncidentRecordItems_IncidentRecords_IncidentRecordId] FOREIGN KEY ([IncidentRecordId]) REFERENCES [IncidentRecords] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608203618_AddIncidentRecord'
)
BEGIN
    CREATE INDEX [IX_IncidentRecordItems_IncidentRecordId] ON [IncidentRecordItems] ([IncidentRecordId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608203618_AddIncidentRecord'
)
BEGIN
    CREATE INDEX [IX_IncidentRecords_SiteId] ON [IncidentRecords] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260608203618_AddIncidentRecord'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260608203618_AddIncidentRecord', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    ALTER TABLE [Expenses] DROP CONSTRAINT [FK_Expenses_Sites_SiteId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    DECLARE @var6 sysname;
    SELECT @var6 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Expenses]') AND [c].[name] = N'IsAllocatedExcess');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Expenses] DROP CONSTRAINT [' + @var6 + '];');
    ALTER TABLE [Expenses] DROP COLUMN [IsAllocatedExcess];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    DECLARE @var7 sysname;
    SELECT @var7 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Expenses]') AND [c].[name] = N'SourceArfNumber');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [Expenses] DROP CONSTRAINT [' + @var7 + '];');
    ALTER TABLE [Expenses] DROP COLUMN [SourceArfNumber];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    DECLARE @var8 sysname;
    SELECT @var8 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Expenses]') AND [c].[name] = N'SiteId');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [Expenses] DROP CONSTRAINT [' + @var8 + '];');
    ALTER TABLE [Expenses] ALTER COLUMN [SiteId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    ALTER TABLE [Expenses] ADD [OfficeId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    ALTER TABLE [ExpenseItems] ADD [IsExcessItem] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    ALTER TABLE [AmountRequestForms] ADD [OfficeId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    CREATE TABLE [Offices] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [OfficeName] nvarchar(max) NOT NULL,
        [City] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_Offices] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    CREATE INDEX [IX_Expenses_OfficeId] ON [Expenses] ([OfficeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    CREATE INDEX [IX_AmountRequestForms_OfficeId] ON [AmountRequestForms] ([OfficeId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    ALTER TABLE [AmountRequestForms] ADD CONSTRAINT [FK_AmountRequestForms_Offices_OfficeId] FOREIGN KEY ([OfficeId]) REFERENCES [Offices] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    ALTER TABLE [Expenses] ADD CONSTRAINT [FK_Expenses_Offices_OfficeId] FOREIGN KEY ([OfficeId]) REFERENCES [Offices] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    ALTER TABLE [Expenses] ADD CONSTRAINT [FK_Expenses_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613124038_RemoveExpenseAllocationLogic'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260613124038_RemoveExpenseAllocationLogic', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613165957_AddApplicationForm'
)
BEGIN
    CREATE TABLE [ApplicationForms] (
        [Id] int NOT NULL IDENTITY,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [ApplicantName] nvarchar(max) NOT NULL,
        [Designation] nvarchar(max) NOT NULL,
        [ApplicationDate] datetime2 NOT NULL,
        [EmployeeCode] nvarchar(max) NOT NULL,
        [PhoneNumber] nvarchar(max) NOT NULL,
        [EmployeeType] nvarchar(max) NOT NULL,
        [Subject] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [DirectorRemarks] nvarchar(max) NOT NULL,
        [CeoRemarks] nvarchar(max) NOT NULL,
        [RejectionRemarks] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ApplicationForms] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613165957_AddApplicationForm'
)
BEGIN
    CREATE TABLE [ApplicationFormAttachments] (
        [Id] int NOT NULL IDENTITY,
        [ApplicationFormId] int NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ApplicationFormAttachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ApplicationFormAttachments_ApplicationForms_ApplicationFormId] FOREIGN KEY ([ApplicationFormId]) REFERENCES [ApplicationForms] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613165957_AddApplicationForm'
)
BEGIN
    CREATE INDEX [IX_ApplicationFormAttachments_ApplicationFormId] ON [ApplicationFormAttachments] ([ApplicationFormId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613165957_AddApplicationForm'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260613165957_AddApplicationForm', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613172130_UpdateApplicationFormUsers'
)
BEGIN
    ALTER TABLE [ApplicationForms] ADD [CreatedByUserId] nvarchar(450) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613172130_UpdateApplicationFormUsers'
)
BEGIN
    CREATE INDEX [IX_ApplicationForms_CreatedByUserId] ON [ApplicationForms] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613172130_UpdateApplicationFormUsers'
)
BEGIN
    ALTER TABLE [ApplicationForms] ADD CONSTRAINT [FK_ApplicationForms_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613172130_UpdateApplicationFormUsers'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260613172130_UpdateApplicationFormUsers', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613174500_MakeApplicationFormFieldsNullable'
)
BEGIN
    DECLARE @var9 sysname;
    SELECT @var9 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ApplicationForms]') AND [c].[name] = N'EmployeeCode');
    IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [ApplicationForms] DROP CONSTRAINT [' + @var9 + '];');
    ALTER TABLE [ApplicationForms] ALTER COLUMN [EmployeeCode] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613174500_MakeApplicationFormFieldsNullable'
)
BEGIN
    DECLARE @var10 sysname;
    SELECT @var10 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ApplicationForms]') AND [c].[name] = N'DirectorRemarks');
    IF @var10 IS NOT NULL EXEC(N'ALTER TABLE [ApplicationForms] DROP CONSTRAINT [' + @var10 + '];');
    ALTER TABLE [ApplicationForms] ALTER COLUMN [DirectorRemarks] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613174500_MakeApplicationFormFieldsNullable'
)
BEGIN
    DECLARE @var11 sysname;
    SELECT @var11 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ApplicationForms]') AND [c].[name] = N'CeoRemarks');
    IF @var11 IS NOT NULL EXEC(N'ALTER TABLE [ApplicationForms] DROP CONSTRAINT [' + @var11 + '];');
    ALTER TABLE [ApplicationForms] ALTER COLUMN [CeoRemarks] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613174500_MakeApplicationFormFieldsNullable'
)
BEGIN
    DECLARE @var12 sysname;
    SELECT @var12 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ApplicationForms]') AND [c].[name] = N'RejectionRemarks');
    IF @var12 IS NOT NULL EXEC(N'ALTER TABLE [ApplicationForms] DROP CONSTRAINT [' + @var12 + '];');
    ALTER TABLE [ApplicationForms] ALTER COLUMN [RejectionRemarks] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613174500_MakeApplicationFormFieldsNullable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260613174500_MakeApplicationFormFieldsNullable', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613182445_AddVehicleTravelForm'
)
BEGIN
    CREATE TABLE [VehicleTravelForms] (
        [Id] int NOT NULL IDENTITY,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [EmployeeName] nvarchar(max) NOT NULL,
        [EmployeeId] nvarchar(max) NOT NULL,
        [Contact] nvarchar(max) NOT NULL,
        [VehicleName] nvarchar(max) NOT NULL,
        [RegistrationNumber] nvarchar(max) NOT NULL,
        [StartReading] float NOT NULL,
        [EndReading] float NOT NULL,
        [CurrentDate] datetime2 NOT NULL,
        [CreatedByUserId] nvarchar(450) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_VehicleTravelForms] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VehicleTravelForms_AspNetUsers_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613182445_AddVehicleTravelForm'
)
BEGIN
    CREATE TABLE [VehicleTravelFormAttachments] (
        [Id] int NOT NULL IDENTITY,
        [FileName] nvarchar(max) NOT NULL,
        [FileUrl] nvarchar(max) NOT NULL,
        [VehicleTravelFormId] int NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_VehicleTravelFormAttachments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VehicleTravelFormAttachments_VehicleTravelForms_VehicleTravelFormId] FOREIGN KEY ([VehicleTravelFormId]) REFERENCES [VehicleTravelForms] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613182445_AddVehicleTravelForm'
)
BEGIN
    CREATE INDEX [IX_VehicleTravelFormAttachments_VehicleTravelFormId] ON [VehicleTravelFormAttachments] ([VehicleTravelFormId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613182445_AddVehicleTravelForm'
)
BEGIN
    CREATE INDEX [IX_VehicleTravelForms_CreatedByUserId] ON [VehicleTravelForms] ([CreatedByUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260613182445_AddVehicleTravelForm'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260613182445_AddVehicleTravelForm', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260614153500_ClearArfAndExpenseData'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260614153500_ClearArfAndExpenseData', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260618211145_AddEmployeeInfo'
)
BEGIN
    CREATE TABLE [EmployeeInfos] (
        [Id] int NOT NULL IDENTITY,
        [EmploymentType] nvarchar(max) NOT NULL,
        [CreatedByUserId] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [EmployeeNumber] nvarchar(max) NULL,
        [EmployeeName] nvarchar(max) NULL,
        [MailingAddress] nvarchar(max) NULL,
        [MothersMaidenName] nvarchar(max) NULL,
        [GrossSalary] nvarchar(max) NULL,
        [Designation] nvarchar(max) NULL,
        [AccountBranchCode] nvarchar(max) NULL,
        [OfficePhoneNo] nvarchar(max) NULL,
        [MobileNetwork] nvarchar(max) NULL,
        [MobileNumber] nvarchar(max) NULL,
        [PlaceOfBirth] nvarchar(max) NULL,
        [EmailAddress] nvarchar(max) NULL,
        [EmployeeCnicNumber] nvarchar(max) NULL,
        [FatherHusbandName] nvarchar(max) NULL,
        [Gender] nvarchar(max) NULL,
        [DateOfBirth] nvarchar(max) NULL,
        [DateOfIssue] nvarchar(max) NULL,
        [ExpiryDate] nvarchar(max) NULL,
        [PresentAddress] nvarchar(max) NULL,
        [PaDistrictCity] nvarchar(max) NULL,
        [PermanentAddress] nvarchar(max) NULL,
        [KinFullName] nvarchar(max) NULL,
        [KinCnicNumber] nvarchar(max) NULL,
        [KinRelationship] nvarchar(max) NULL,
        [KinMobileNumber] nvarchar(max) NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_EmployeeInfos] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260618211145_AddEmployeeInfo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260618211145_AddEmployeeInfo', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620155402_AddProcurementModule'
)
BEGIN
    CREATE TABLE [ProcurementRequests] (
        [Id] int NOT NULL IDENTITY,
        [ProcurementNumber] nvarchar(100) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [SupervisorName] nvarchar(100) NOT NULL,
        [SupervisorEmail] nvarchar(max) NOT NULL,
        [SiteId] int NULL,
        [Status] nvarchar(50) NOT NULL,
        [PdEmail] nvarchar(max) NULL,
        [PdRemarks] nvarchar(max) NULL,
        [PdApprovalDate] datetime2 NULL,
        [ProcurementHeadEmail] nvarchar(max) NULL,
        [AmountRequestFormId] int NULL,
        [AssignedExecutiveEmail] nvarchar(max) NULL,
        [AssignedDate] datetime2 NULL,
        [CompletedDate] datetime2 NULL,
        [DeliveryNoteText] nvarchar(max) NULL,
        [DeliveryNoteDocumentsJson] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ProcurementRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProcurementRequests_AmountRequestForms_AmountRequestFormId] FOREIGN KEY ([AmountRequestFormId]) REFERENCES [AmountRequestForms] ([Id]),
        CONSTRAINT [FK_ProcurementRequests_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620155402_AddProcurementModule'
)
BEGIN
    CREATE TABLE [ProcurementRequestItems] (
        [Id] int NOT NULL IDENTITY,
        [ProcurementRequestId] int NOT NULL,
        [ItemName] nvarchar(200) NOT NULL,
        [Quantity] decimal(18,2) NOT NULL,
        [Reason] nvarchar(500) NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ProcurementRequestItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProcurementRequestItems_ProcurementRequests_ProcurementRequestId] FOREIGN KEY ([ProcurementRequestId]) REFERENCES [ProcurementRequests] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620155402_AddProcurementModule'
)
BEGIN
    CREATE INDEX [IX_ProcurementRequestItems_ProcurementRequestId] ON [ProcurementRequestItems] ([ProcurementRequestId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620155402_AddProcurementModule'
)
BEGIN
    CREATE INDEX [IX_ProcurementRequests_AmountRequestFormId] ON [ProcurementRequests] ([AmountRequestFormId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620155402_AddProcurementModule'
)
BEGIN
    CREATE INDEX [IX_ProcurementRequests_SiteId] ON [ProcurementRequests] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260620155402_AddProcurementModule'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260620155402_AddProcurementModule', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622162608_AddStoreManagement'
)
BEGIN
    DECLARE @var13 sysname;
    SELECT @var13 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[ProcurementRequestItems]') AND [c].[name] = N'Quantity');
    IF @var13 IS NOT NULL EXEC(N'ALTER TABLE [ProcurementRequestItems] DROP CONSTRAINT [' + @var13 + '];');
    ALTER TABLE [ProcurementRequestItems] ALTER COLUMN [Quantity] decimal(18,4) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622162608_AddStoreManagement'
)
BEGIN
    CREATE TABLE [StoreDailyLogs] (
        [Id] int NOT NULL IDENTITY,
        [SiteId] int NOT NULL,
        [Date] datetime2 NOT NULL,
        [TimeOut] datetime2 NOT NULL,
        [TimeIn] datetime2 NULL,
        CONSTRAINT [PK_StoreDailyLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_StoreDailyLogs_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622162608_AddStoreManagement'
)
BEGIN
    CREATE TABLE [StoreTools] (
        [Id] int NOT NULL IDENTITY,
        [Description] nvarchar(max) NOT NULL,
        [TotalQuantity] int NOT NULL,
        [CurrentQuantity] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_StoreTools] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622162608_AddStoreManagement'
)
BEGIN
    CREATE TABLE [StoreDailyLogItems] (
        [Id] int NOT NULL IDENTITY,
        [StoreDailyLogId] int NOT NULL,
        [StoreToolId] int NOT NULL,
        [CustomDescription] nvarchar(max) NULL,
        [QuantityOut] int NOT NULL,
        [QuantityIn] int NULL,
        CONSTRAINT [PK_StoreDailyLogItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_StoreDailyLogItems_StoreDailyLogs_StoreDailyLogId] FOREIGN KEY ([StoreDailyLogId]) REFERENCES [StoreDailyLogs] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_StoreDailyLogItems_StoreTools_StoreToolId] FOREIGN KEY ([StoreToolId]) REFERENCES [StoreTools] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622162608_AddStoreManagement'
)
BEGIN
    CREATE INDEX [IX_StoreDailyLogItems_StoreDailyLogId] ON [StoreDailyLogItems] ([StoreDailyLogId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622162608_AddStoreManagement'
)
BEGIN
    CREATE INDEX [IX_StoreDailyLogItems_StoreToolId] ON [StoreDailyLogItems] ([StoreToolId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622162608_AddStoreManagement'
)
BEGIN
    CREATE INDEX [IX_StoreDailyLogs_SiteId] ON [StoreDailyLogs] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622162608_AddStoreManagement'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260622162608_AddStoreManagement', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    ALTER TABLE [Quotations] ADD [ParentQuoteId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [SiteId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    CREATE TABLE [SiteToolStocks] (
        [Id] int NOT NULL IDENTITY,
        [SiteId] int NOT NULL,
        [StoreToolId] int NOT NULL,
        [AvailableQuantity] int NOT NULL,
        CONSTRAINT [PK_SiteToolStocks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SiteToolStocks_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_SiteToolStocks_StoreTools_StoreToolId] FOREIGN KEY ([StoreToolId]) REFERENCES [StoreTools] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    CREATE INDEX [IX_Quotations_ParentQuoteId] ON [Quotations] ([ParentQuoteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    CREATE INDEX [IX_AspNetUsers_SiteId] ON [AspNetUsers] ([SiteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SiteToolStocks_SiteId_StoreToolId] ON [SiteToolStocks] ([SiteId], [StoreToolId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    CREATE INDEX [IX_SiteToolStocks_StoreToolId] ON [SiteToolStocks] ([StoreToolId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD CONSTRAINT [FK_AspNetUsers_Sites_SiteId] FOREIGN KEY ([SiteId]) REFERENCES [Sites] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    ALTER TABLE [Quotations] ADD CONSTRAINT [FK_Quotations_Quotations_ParentQuoteId] FOREIGN KEY ([ParentQuoteId]) REFERENCES [Quotations] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260624095720_AddQuotationHierarchy'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260624095720_AddQuotationHierarchy', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704223510_AddSystemRegionsAndSalesmanRegion'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [Region] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704223510_AddSystemRegionsAndSalesmanRegion'
)
BEGIN
    CREATE TABLE [SystemRegions] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_SystemRegions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704223510_AddSystemRegionsAndSalesmanRegion'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260704223510_AddSystemRegionsAndSalesmanRegion', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704224254_AddProcurementQuotesAndRegionalHead'
)
BEGIN
    ALTER TABLE [ProcurementRequests] ADD [RegionalHeadApprovalDate] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704224254_AddProcurementQuotesAndRegionalHead'
)
BEGIN
    ALTER TABLE [ProcurementRequests] ADD [RegionalHeadEmail] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704224254_AddProcurementQuotesAndRegionalHead'
)
BEGIN
    ALTER TABLE [ProcurementRequests] ADD [RegionalHeadRemarks] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704224254_AddProcurementQuotesAndRegionalHead'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704224254_AddProcurementQuotesAndRegionalHead'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704224254_AddProcurementQuotesAndRegionalHead'
)
BEGIN
    CREATE INDEX [IX_ProcurementQuoteItems_ProcurementRequestItemId] ON [ProcurementQuoteItems] ([ProcurementRequestItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704224254_AddProcurementQuotesAndRegionalHead'
)
BEGIN
    CREATE INDEX [IX_ProcurementQuoteItems_QuoteId] ON [ProcurementQuoteItems] ([QuoteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704224254_AddProcurementQuotesAndRegionalHead'
)
BEGIN
    CREATE INDEX [IX_ProcurementQuotes_ProcurementRequestId] ON [ProcurementQuotes] ([ProcurementRequestId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704224254_AddProcurementQuotesAndRegionalHead'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260704224254_AddProcurementQuotesAndRegionalHead', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [ProcurementQuoteItems] DROP CONSTRAINT [FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [VehicleTravelForms] ADD [ApprovedByMunawarAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [VehicleTravelForms] ADD [ApprovedByShahbazAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [VehicleTravelForms] ADD [Status] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [ProcurementRequests] ADD [IsAcceptedBySupervisor] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [ProcurementRequests] ADD [SupervisorAcceptanceDate] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [ProcurementRequests] ADD [SupervisorAcceptanceRemarks] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [Expenses] ADD [ReviewedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [Expenses] ADD [ReviewedByEmail] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [Expenses] ADD [ReviewerComments] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [Expenses] ADD [Status] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [EmployeeInfos] ADD [AttachmentsJson] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [EmployeeInfos] ADD [IsActive] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    ALTER TABLE [ProcurementQuoteItems] ADD CONSTRAINT [FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId] FOREIGN KEY ([ProcurementRequestItemId]) REFERENCES [ProcurementRequestItems] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260704233232_AddExpenseReviewAndVehicleStatusFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260704233232_AddExpenseReviewAndVehicleStatusFields', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260705013034_AddPaymentSlipUrl'
)
BEGIN
    ALTER TABLE [AmountRequestPayments] ADD [PaymentSlipUrl] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260705013034_AddPaymentSlipUrl'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260705013034_AddPaymentSlipUrl', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260705025925_AddRegionalHeadToProcurement'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260705025925_AddRegionalHeadToProcurement', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260705031444_ForceRegionalHeadColumns'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260705031444_ForceRegionalHeadColumns', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260705033042_ForceProcurementQuotesTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260705033042_ForceProcurementQuotesTables', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707152508_FixDuplicateQuoteNumbersAndAddUniqueIndex'
)
BEGIN
                    WITH CTE AS (
                        SELECT Id, QuoteNumber, 
                               ROW_NUMBER() OVER(PARTITION BY TenantId, QuoteNumber ORDER BY Id) as rn
                        FROM Quotations
                        WHERE QuoteNumber = 'MTQ-AA00021-FPS-R0'
                    )
                    UPDATE Quotations
                    SET QuoteNumber = 'MTQ-AA00022-FPS-R0'
                    WHERE Id IN (SELECT Id FROM CTE WHERE rn > 1);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707152508_FixDuplicateQuoteNumbersAndAddUniqueIndex'
)
BEGIN
                    WITH CTE AS (
                        SELECT Id, QuoteNumber, 
                               ROW_NUMBER() OVER(PARTITION BY TenantId, QuoteNumber ORDER BY Id) as rn
                        FROM Quotations
                    )
                    UPDATE Quotations
                    SET QuoteNumber = QuoteNumber + '-DUP-' + CAST(Id AS VARCHAR)
                    WHERE Id IN (SELECT Id FROM CTE WHERE rn > 1);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707152508_FixDuplicateQuoteNumbersAndAddUniqueIndex'
)
BEGIN
    DECLARE @var14 sysname;
    SELECT @var14 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Quotations]') AND [c].[name] = N'QuoteNumber');
    IF @var14 IS NOT NULL EXEC(N'ALTER TABLE [Quotations] DROP CONSTRAINT [' + @var14 + '];');
    ALTER TABLE [Quotations] ALTER COLUMN [QuoteNumber] nvarchar(450) NOT NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707152508_FixDuplicateQuoteNumbersAndAddUniqueIndex'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Quotations_TenantId_QuoteNumber] ON [Quotations] ([TenantId], [QuoteNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260707152508_FixDuplicateQuoteNumbersAndAddUniqueIndex'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260707152508_FixDuplicateQuoteNumbersAndAddUniqueIndex', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708185053_AddBoqReferenceNumber'
)
BEGIN
    ALTER TABLE [Quotations] ADD [BoqReferenceNumber] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708185053_AddBoqReferenceNumber'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260708185053_AddBoqReferenceNumber', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708190633_AddDrawingsFileUrlsJson'
)
BEGIN
    ALTER TABLE [SalesLeads] ADD [DrawingsFileUrlsJson] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260708190633_AddDrawingsFileUrlsJson'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260708190633_AddDrawingsFileUrlsJson', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260714195833_AddReferenceNumberToQuotationItem'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [ReferenceNumber] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260714195833_AddReferenceNumberToQuotationItem'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260714195833_AddReferenceNumberToQuotationItem', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260724141202_AddSalesMeetingReminders'
)
BEGIN
    CREATE TABLE [SalesMeetingReminders] (
        [Id] int NOT NULL IDENTITY,
        [SalesmanUserId] nvarchar(450) NOT NULL,
        [SiteName] nvarchar(255) NOT NULL,
        [MeetingDate] datetime2 NOT NULL,
        [IsTimeIncluded] bit NOT NULL,
        [IsNotified] bit NOT NULL,
        [IsPopupAcknowledged] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_SalesMeetingReminders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SalesMeetingReminders_AspNetUsers_SalesmanUserId] FOREIGN KEY ([SalesmanUserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260724141202_AddSalesMeetingReminders'
)
BEGIN
    CREATE INDEX [IX_SalesMeetingReminders_SalesmanUserId] ON [SalesMeetingReminders] ([SalesmanUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260724141202_AddSalesMeetingReminders'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260724141202_AddSalesMeetingReminders', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260819120918_AddSupplyQuotationModule'
)
BEGIN
    CREATE TABLE [SupplyQuotations] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [QuoteNumber] nvarchar(max) NOT NULL,
        [QuoteDate] datetime2 NOT NULL,
        [QuotationFor] nvarchar(max) NOT NULL,
        [RevisionNumber] nvarchar(max) NOT NULL,
        [TermsAndConditionsJson] nvarchar(max) NULL,
        [CreatedByUserId] nvarchar(max) NOT NULL,
        [SupplyColumnsJson] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_SupplyQuotations] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260819120918_AddSupplyQuotationModule'
)
BEGIN
    CREATE TABLE [SupplyQuotationItems] (
        [Id] int NOT NULL IDENTITY,
        [UpdatedAt] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL,
        [SupplyQuotationId] int NOT NULL,
        [SNo] int NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [Quantity] decimal(18,2) NOT NULL,
        [Unit] nvarchar(max) NOT NULL,
        [RatesJson] nvarchar(max) NOT NULL,
        [TotalAmount] decimal(18,2) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_SupplyQuotationItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SupplyQuotationItems_SupplyQuotations_SupplyQuotationId] FOREIGN KEY ([SupplyQuotationId]) REFERENCES [SupplyQuotations] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260819120918_AddSupplyQuotationModule'
)
BEGIN
    CREATE INDEX [IX_SupplyQuotationItems_SupplyQuotationId] ON [SupplyQuotationItems] ([SupplyQuotationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260819120918_AddSupplyQuotationModule'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260819120918_AddSupplyQuotationModule', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260819131028_AddSupplyQuotationHeaders'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [HeaderCompany] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260819131028_AddSupplyQuotationHeaders'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [HeaderDesignation] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260819131028_AddSupplyQuotationHeaders'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [HeaderLocation] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260819131028_AddSupplyQuotationHeaders'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [HeaderToName] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260819131028_AddSupplyQuotationHeaders'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260819131028_AddSupplyQuotationHeaders', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260820175746_AddArfExceptionsAndQuota'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [CustomArfLimit] decimal(18,2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260820175746_AddArfExceptionsAndQuota'
)
BEGIN
    CREATE TABLE [ArfExceptionRequests] (
        [Id] int NOT NULL IDENTITY,
        [EmployeeEmail] nvarchar(max) NOT NULL,
        [RequestedAmount] decimal(18,2) NOT NULL,
        [Reason] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [MunawarComment] nvarchar(max) NULL,
        [IsUsed] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ArfExceptionRequests] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260820175746_AddArfExceptionsAndQuota'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260820175746_AddArfExceptionsAndQuota', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260821182659_AddTaxAndApprovalFieldsToSupplyQuotation'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [TaxPercentage] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260821182659_AddTaxAndApprovalFieldsToSupplyQuotation'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [TaxAmount] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260821182659_AddTaxAndApprovalFieldsToSupplyQuotation'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [NetTotal] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260821182659_AddTaxAndApprovalFieldsToSupplyQuotation'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [GrandTotal] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260821182659_AddTaxAndApprovalFieldsToSupplyQuotation'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [ApprovedBy] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260821182659_AddTaxAndApprovalFieldsToSupplyQuotation'
)
BEGIN
    ALTER TABLE [SupplyQuotations] ADD [IssuedBy] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260821182659_AddTaxAndApprovalFieldsToSupplyQuotation'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260821182659_AddTaxAndApprovalFieldsToSupplyQuotation', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260824194800_AddRemarksToQuotationItems'
)
BEGIN
    ALTER TABLE [SupplyQuotationItems] ADD [Remarks] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260824194800_AddRemarksToQuotationItems'
)
BEGIN
    ALTER TABLE [QuotationsItem] ADD [Remarks] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260824194800_AddRemarksToQuotationItems'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260824194800_AddRemarksToQuotationItems', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829132611_AddArfReturnsAndDebt'
)
BEGIN
    ALTER TABLE [Expenses] ADD [IsPaidByDebt] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829132611_AddArfReturnsAndDebt'
)
BEGIN
    CREATE TABLE [ArfReturns] (
        [Id] int NOT NULL IDENTITY,
        [AmountRequestFormId] int NOT NULL,
        [ReturnAmount] decimal(18,2) NOT NULL,
        [Details] nvarchar(max) NOT NULL,
        [ReturnDate] datetime2 NOT NULL,
        [ReturnedByEmail] nvarchar(max) NOT NULL,
        [TenantId] int NOT NULL,
        CONSTRAINT [PK_ArfReturns] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ArfReturns_AmountRequestForms_AmountRequestFormId] FOREIGN KEY ([AmountRequestFormId]) REFERENCES [AmountRequestForms] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829132611_AddArfReturnsAndDebt'
)
BEGIN
    CREATE INDEX [IX_ArfReturns_AmountRequestFormId] ON [ArfReturns] ([AmountRequestFormId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260829132611_AddArfReturnsAndDebt'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260829132611_AddArfReturnsAndDebt', N'8.0.0');
END;
GO

COMMIT;
GO

