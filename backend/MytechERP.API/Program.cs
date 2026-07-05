using FluentValidation;
using FluentValidation.AspNetCore;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MytechERP.API.Filters;
using MytechERP.API.Middleware;
using MytechERP.Application.Interfaces;
using MytechERP.Application.Validators;
using MytechERP.domain.Constants;
using MytechERP.domain.Entities;
using MytechERP.domain.Interfaces;
using MytechERP.Infrastructure.Persistance;
using MyTechERP.Infrastructure.BackgroundJobs;
using MyTechERP.Infrastructure.Repositories;
using MyTechERP.Infrastructure.Seeds;
using MyTechERP.Infrastructure.Services;
using QuestPDF.Infrastructure;
using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
var builder = WebApplication.CreateBuilder(args);

var frontendUrls = builder.Configuration.GetSection("FrontendUrls").Get<string[]>() 
                   ?? new[] { "http://localhost:5173", "http://localhost:3000","https://mytecherp-cloud.vercel.app", "https://mytecherp.com", "https://www.mytecherp.com" };

var extraFrontendUrlStr = builder.Configuration["FrontendUrls"];
if (!string.IsNullOrEmpty(extraFrontendUrlStr) && frontendUrls.Length <= 3) 
{
    var parsed = extraFrontendUrlStr.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToArray();
    if (parsed.Length > 0) frontendUrls = parsed;
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMyFrontend", policy =>
    {
        policy.WithOrigins(frontendUrls) 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (connectionString == "CONFIGURE_IN_AZURE_APP_SERVICE" || string.IsNullOrEmpty(connectionString))
{
    connectionString = "Server=localhost;Database=dummy;Trusted_Connection=True;";
}
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddIdentity<AppUser,IdentityRole>(options => {
    options.User.RequireUniqueEmail = false;
}).AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();

// OPTIMIZATION: Reduce password hashing iterations from 100,000 to 10,000
// This makes the Login speed up to 10x faster for newly created users or users who reset their passwords.
builder.Services.Configure<PasswordHasherOptions>(options =>
{
    options.IterationCount = 10000;
});
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IChecklistRepository, ChecklistRepository>();
builder.Services.AddScoped<ICheckListService, CheckListService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IQuotationConversionService, QuotationConversionService>();
builder.Services.AddScoped<IContractRepository, ContractRepository>();
builder.Services.AddScoped<IAssetRepository, AssetRepository>();
builder.Services.AddScoped<IWorkOrderRepository, WorkOrderRepository>();
builder.Services.AddScoped<IWorkOrderService, WorkOrderService>();
builder.Services.AddScoped<IWorkOrderGenerator, WorkOrderGenerator>();
builder.Services.AddScoped<IBlobService, BlobService>();
builder.Services.AddScoped<IWorkflowService, WorkFlowService>();
builder.Services.AddScoped<IQuotationRepository, QuotationRepository>();
builder.Services.AddScoped<IQuotationService, QuotationService>();
builder.Services.AddScoped<ITermsAndConditionsService, TermsAndConditionsService>();
builder.Services.AddScoped<IProductImportService, ProductImportService>();
builder.Services.AddScoped<IFikeProductImportService, FikeProductImportService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<MyTechERP.Infrastructure.Services.QuotationPdfService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<QuotationPdfService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IDigitalSignatureService, DigitalSignatureService>();
builder.Services.AddSingleton<IBackgroundTaskQueue, BackgroundTaskQueue>();
builder.Services.AddHostedService<QueuedHostedService>();
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IWarehouseRepository, WarehouseRepository>();
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IPurchaseOrderRepository, PurchaseOrderRepository>();
builder.Services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
builder.Services.AddScoped<IPaymentGatewayService, StripePaymentService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
// Register the action filter in DI so controllers can use [ServiceFilter(typeof(RequireActiveSubscriptionAttribute))]
builder.Services.AddScoped<RequireActiveSubscriptionAttribute>();
builder.Services.AddScoped<ITimeTrackingService, TimeTrackingService>();
builder.Services.AddScoped<IPayrollService, PayrollService>();
builder.Services.AddScoped<IPaymentTransactionService, PaymentTransactionService>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAssetImportService, AssetImportService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IAmountRequestFormService, AmountRequestFormService>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<MytechERP.Application.Interfaces.HR.IApplicationFormService, MyTechERP.Infrastructure.Services.HR.ApplicationFormService>();
// Hangfire (Skip if placeholder)
var hangfireConnection = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrEmpty(hangfireConnection) && hangfireConnection != "CONFIGURE_IN_AZURE_APP_SERVICE")
{
    builder.Services.AddHangfire(config => config
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseSqlServerStorage(hangfireConnection));
    builder.Services.AddHangfireServer();
}
else
{
    Console.WriteLine("Warning: Hangfire skipped - DefaultConnection is a placeholder.");
}


builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IAssetService, AssetService>();
builder.Services.AddScoped<ISiteDocumentService, SiteDocumentService>();
builder.Services.AddScoped<IMaterialReceivingService, MaterialReceivingService>();
builder.Services.AddScoped<IDailyProgressReportService, DailyProgressReportService>();
builder.Services.AddScoped<IMomMeetingService, MomMeetingService>();
builder.Services.AddScoped<IMeetingMinutesExecutionService, MeetingMinutesExecutionService>();
builder.Services.AddScoped<IItemProcurementService, ItemProcurementService>();
builder.Services.AddScoped<IProjectTechnicalHandoverService, ProjectTechnicalHandoverService>();
builder.Services.AddScoped<IToolBoxTalkRepository, ToolBoxTalkRepository>();
builder.Services.AddScoped<IToolBoxTalkService, MytechERP.Application.Services.ToolBoxTalkService>();
builder.Services.AddScoped<ITrainingDetailService, MyTechERP.Infrastructure.Services.TrainingDetailService>();
builder.Services.AddScoped<MyTechERP.Infrastructure.Services.IItemProcurementPdfService, MyTechERP.Infrastructure.Services.ItemProcurementPdfService>();
builder.Services.AddScoped<MytechERP.Application.Interfaces.IDailyProgressReportPdfService, MytechERP.Infrastructure.Services.DailyProgressReportPdfService>();
builder.Services.AddScoped<IProjectSpotCheckSiteService, ProjectSpotCheckSiteService>();
builder.Services.AddScoped<IIncidentRecordService, IncidentRecordService>();
builder.Services.AddScoped<IOfficeService, MyTechERP.Infrastructure.Services.OfficeService>();
builder.Services.AddScoped<MytechERP.Application.Interfaces.IVehicleTravelFormService, MyTechERP.Infrastructure.Services.HR.VehicleTravelFormService>();
builder.Services.AddScoped<MytechERP.Application.Interfaces.HR.IEmployeeInfoService, MyTechERP.Infrastructure.Services.HR.EmployeeInfoService>();
builder.Services.AddScoped<MytechERP.Application.Interfaces.IProcurementService, MytechERP.Infrastructure.Services.Procurement.ProcurementService>();
builder.Services.AddScoped<MytechERP.Application.Interfaces.IVendorService, MytechERP.Infrastructure.Services.Procurement.VendorService>();
builder.Services.AddScoped<UniversalSyncService>();
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var keyString = jwtSettings["Key"] ?? "ThisIsMySecretKeyForMyTechERPProject123!";
    var signingKey = keyString == "CONFIGURE_IN_AZURE_APP_SERVICE" 
        ? new SymmetricSecurityKey(Encoding.ASCII.GetBytes("ThisIsMySecretKeyForMyTechERPProject123!"))
        : new SymmetricSecurityKey(Encoding.ASCII.GetBytes(keyString));

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "MyTechERP",
        ValidAudience = jwtSettings["Audience"] ?? "MyTechERP_Users",
        IssuerSigningKey = signingKey
    };
});

builder.Services.AddHostedService<MytechERP.API.BackgroundServices.SalesmanVisitMonitorService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.MaxDepth = 64;
    });

builder.Services.AddValidatorsFromAssemblyContaining<CreateProductValidator>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(frontendUrls)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Title = "MyTechERP API", Version = "v1" });

   
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });

    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
});
builder.Services.AddAuthorization(options =>
{
    var modules = typeof(Permissions).GetNestedTypes();
    foreach (var module in modules)
    {
        var fields = module.GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy);
        foreach (var field in fields)
        {
            var permission = field.GetValue(null)?.ToString();
            if (permission != null)
            {
                options.AddPolicy(permission, policy =>
                    policy.RequireClaim("Permission", permission));
            }
        }
    }
});
builder.Services.AddSignalR();
builder.Services.AddScoped<MytechERP.Application.Interfaces.ISyncNotifier, MytechERP.API.Services.SignalRSyncNotifier>();
OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("MyTechERP");
QuestPDF.Settings.License = LicenseType.Community;
var app = builder.Build();



using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var dbConnection = builder.Configuration.GetConnectionString("DefaultConnection");
        
        if (!string.IsNullOrEmpty(dbConnection) && dbConnection != "CONFIGURE_IN_AZURE_APP_SERVICE")
        {
            // Add SiteId to AspNetUsers for isolation BEFORE any EF operations
            try
            {
                var alterUsersSql = @"
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'SiteId' AND Object_ID = Object_ID(N'AspNetUsers'))
                    BEGIN
                        ALTER TABLE AspNetUsers ADD SiteId INT NULL;
                        ALTER TABLE AspNetUsers ADD CONSTRAINT FK_AspNetUsers_Sites_SiteId FOREIGN KEY (SiteId) REFERENCES Sites(Id);
                    END";
                await context.Database.ExecuteSqlRawAsync(alterUsersSql);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SiteId alter table warning: {ex.Message}");
            }
              try
              {
                  if (context.Database.GetPendingMigrations().Any())
                  {
                      context.Database.Migrate();
                  }
              }
              catch (Exception migEx)
              {
                  Console.WriteLine($"Migration warning (non-fatal): {migEx.Message}");
              }

              // Ensure Store entity sync columns exist (safe to run even if already present)
            try
            {
                var ensureColumnsSql = @"
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'StoreTools') AND name = N'TenantId')
                        ALTER TABLE StoreTools ADD TenantId int NOT NULL DEFAULT 0;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'StoreTools') AND name = N'IsDeleted')
                        ALTER TABLE StoreTools ADD IsDeleted bit NOT NULL DEFAULT 0;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'StoreTools') AND name = N'UpdatedAt')
                        ALTER TABLE StoreTools ADD UpdatedAt datetime2 NOT NULL DEFAULT '2000-01-01';

                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'StoreDailyLogs') AND name = N'TenantId')
                        ALTER TABLE StoreDailyLogs ADD TenantId int NOT NULL DEFAULT 0;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'StoreDailyLogs') AND name = N'IsDeleted')
                        ALTER TABLE StoreDailyLogs ADD IsDeleted bit NOT NULL DEFAULT 0;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'StoreDailyLogs') AND name = N'UpdatedAt')
                        ALTER TABLE StoreDailyLogs ADD UpdatedAt datetime2 NOT NULL DEFAULT '2000-01-01';

                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'StoreDailyLogItems') AND name = N'TenantId')
                        ALTER TABLE StoreDailyLogItems ADD TenantId int NOT NULL DEFAULT 0;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'StoreDailyLogItems') AND name = N'IsDeleted')
                        ALTER TABLE StoreDailyLogItems ADD IsDeleted bit NOT NULL DEFAULT 0;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'StoreDailyLogItems') AND name = N'UpdatedAt')
                        ALTER TABLE StoreDailyLogItems ADD UpdatedAt datetime2 NOT NULL DEFAULT '2000-01-01';

                    -- Fix existing records that got TenantId = 0 (assign them to Tenant 3 = MytechEngineering)
                    UPDATE StoreTools SET TenantId = 3 WHERE TenantId = 0;
                    UPDATE StoreDailyLogs SET TenantId = 3 WHERE TenantId = 0;
                    UPDATE StoreDailyLogItems SET TenantId = 3 WHERE TenantId = 0;
                    
                    -- Deduplicate StoreTools
                    IF OBJECT_ID('tempdb..#ToolMapping') IS NOT NULL DROP TABLE #ToolMapping;
                    
                    SELECT dt.KeepId, st.Id AS OldId
                    INTO #ToolMapping
                    FROM StoreTools st
                    JOIN (
                        SELECT Description, MIN(Id) as KeepId
                        FROM StoreTools
                        GROUP BY Description
                        HAVING COUNT(*) > 1
                    ) dt ON st.Description = dt.Description AND st.Id <> dt.KeepId;

                    IF EXISTS (SELECT 1 FROM #ToolMapping)
                    BEGIN
                        -- Update StoreDailyLogItems
                        UPDATE dli
                        SET StoreToolId = tm.KeepId
                        FROM StoreDailyLogItems dli
                        JOIN #ToolMapping tm ON dli.StoreToolId = tm.OldId;

                        -- Merge SiteToolStocks quantities
                        UPDATE keepSts
                        SET AvailableQuantity = keepSts.AvailableQuantity + oldSts.AvailableQuantity
                        FROM SiteToolStocks keepSts
                        JOIN SiteToolStocks oldSts ON keepSts.SiteId = oldSts.SiteId
                        JOIN #ToolMapping tm ON oldSts.StoreToolId = tm.OldId AND keepSts.StoreToolId = tm.KeepId;

                        DELETE oldSts
                        FROM SiteToolStocks oldSts
                        JOIN SiteToolStocks keepSts ON keepSts.SiteId = oldSts.SiteId
                        JOIN #ToolMapping tm ON oldSts.StoreToolId = tm.OldId AND keepSts.StoreToolId = tm.KeepId;

                        -- For remaining oldSts, just update StoreToolId
                        UPDATE oldSts
                        SET StoreToolId = tm.KeepId
                        FROM SiteToolStocks oldSts
                        JOIN #ToolMapping tm ON oldSts.StoreToolId = tm.OldId;

                        -- Delete duplicates first, so they don't keep adding up
                        DELETE st
                        FROM StoreTools st
                        JOIN #ToolMapping tm ON st.Id = tm.OldId;
                    END
                    DROP TABLE #ToolMapping;

                    -- Recalculate inflated TotalQuantity based on SiteToolStocks to fix the exponential growth bug
                    UPDATE st
                    SET TotalQuantity = ISNULL(sts.TotalStock, 0),
                        CurrentQuantity = ISNULL(sts.TotalStock, 0)
                    FROM StoreTools st
                    LEFT JOIN (
                        SELECT StoreToolId, SUM(AvailableQuantity) as TotalStock
                        FROM SiteToolStocks
                        GROUP BY StoreToolId
                    ) sts ON st.Id = sts.StoreToolId
                    WHERE st.TotalQuantity > ISNULL(sts.TotalStock, 0) + 100; -- Only fix massively inflated ones to be safe
                ";
                await context.Database.ExecuteSqlRawAsync(ensureColumnsSql);
                Console.WriteLine("Store entity columns verified/created successfully.");
            }
            catch (Exception colEx)
            {
                Console.WriteLine($"Store column ensure warning: {colEx.Message}");
            }

            // Step 1: Create SiteToolStocks table if missing
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'SiteToolStocks')
                    CREATE TABLE SiteToolStocks (
                        Id                int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                        SiteId            int NOT NULL REFERENCES Sites(Id),
                        StoreToolId       int NOT NULL REFERENCES StoreTools(Id),
                        AvailableQuantity int NOT NULL DEFAULT 0
                    );
                ");
                Console.WriteLine("SiteToolStocks: table OK.");
            }
            catch (Exception ex) { Console.WriteLine($"SiteToolStocks create: {ex.Message}"); }

            // Step 2: Remove duplicate (SiteId, StoreToolId) rows — keep highest quantity row
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    DELETE a
                    FROM SiteToolStocks a
                    INNER JOIN SiteToolStocks b
                        ON  a.SiteId      = b.SiteId
                        AND a.StoreToolId = b.StoreToolId
                        AND (
                            a.AvailableQuantity < b.AvailableQuantity
                            OR (a.AvailableQuantity = b.AvailableQuantity AND a.Id > b.Id)
                        );
                ");
                Console.WriteLine("SiteToolStocks: duplicates removed.");
            }
            catch (Exception ex) { Console.WriteLine($"SiteToolStocks dedup: {ex.Message}"); }

            // Step 3: Ensure unique constraint exists (only possible after dedup)
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.indexes
                        WHERE name = N'UQ_SiteToolStocks_Site_Tool'
                          AND object_id = OBJECT_ID(N'SiteToolStocks')
                    )
                    ALTER TABLE SiteToolStocks
                    ADD CONSTRAINT UQ_SiteToolStocks_Site_Tool UNIQUE (SiteId, StoreToolId);
                ");
                Console.WriteLine("SiteToolStocks: unique constraint OK.");
            }
            catch (Exception ex) { Console.WriteLine($"SiteToolStocks constraint: {ex.Message}"); }

            // Step 4: Fix any tools still with TenantId=0
            try
            {
                await context.Database.ExecuteSqlRawAsync(
                    "UPDATE StoreTools SET TenantId = 3 WHERE TenantId = 0;");
                Console.WriteLine("StoreTools: TenantId fixed.");
            }
            catch (Exception ex) { Console.WriteLine($"StoreTools TenantId fix: {ex.Message}"); }

            // NOTE: Auto-seeding of (Site x Tool) pairs is intentionally NOT done here.
            // It is handled by SitesController.Create and StoreToolsController.Create.
            // Running an INSERT here on every startup was causing duplicate rows.


            var userManager = services.GetRequiredService<UserManager<AppUser>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

            await DefaultRoles.SeedAsync(userManager, roleManager);
            await DefaultSuperAdmin.SeedAsync(userManager, roleManager);

            // Seed Subscription Plans
            var configuration = services.GetRequiredService<IConfiguration>();
            string basicPriceId = configuration["Stripe:BasicPlanPriceId"] ?? "price_1TCVwUGv46lRNfrQ3dYcAmXR";
            string proPriceId = configuration["Stripe:ProPlanPriceId"] ?? "price_1TCVwwGv46lRNfrQV7KVxwoZ";

            if (!await context.SubscriptionPlans.AnyAsync(p => p.Name == "Basic"))
            {
                context.SubscriptionPlans.Add(new SubscriptionPlan
                {
                    Name = "Basic",
                    StripePriceId = basicPriceId,
                    MonthlyPrice = 49.99m,
                    MaxUsers = 5,
                    PlanFeatures = MytechERP.domain.Enums.PlanFeature.None,
                    IsActive = true
                });
            }
            else
            {
                var basic = await context.SubscriptionPlans.FirstAsync(p => p.Name == "Basic");
                basic.MaxUsers = 5;
                basic.StripePriceId = basicPriceId;
                basic.PlanFeatures = MytechERP.domain.Enums.PlanFeature.None;
            }

            if (!await context.SubscriptionPlans.AnyAsync(p => p.Name == "Pro"))
            {
                context.SubscriptionPlans.Add(new SubscriptionPlan
                {
                    Name = "Pro",
                    StripePriceId = proPriceId,
                    MonthlyPrice = 149.99m,
                    MaxUsers = 25,
                    PlanFeatures = MytechERP.domain.Enums.PlanFeature.HrPayroll | 
                                   MytechERP.domain.Enums.PlanFeature.ChecklistFormBuilder | 
                                   MytechERP.domain.Enums.PlanFeature.AuditLogs | 
                                   MytechERP.domain.Enums.PlanFeature.AdvancedAnalytics |
                                   MytechERP.domain.Enums.PlanFeature.OfflineSync,
                    IsActive = true
                });
            }
            else
            {
                var pro = await context.SubscriptionPlans.FirstAsync(p => p.Name == "Pro");
                pro.MaxUsers = 25;
                pro.StripePriceId = proPriceId;
                pro.PlanFeatures = MytechERP.domain.Enums.PlanFeature.HrPayroll | 
                                   MytechERP.domain.Enums.PlanFeature.ChecklistFormBuilder | 
                                   MytechERP.domain.Enums.PlanFeature.AuditLogs | 
                                   MytechERP.domain.Enums.PlanFeature.AdvancedAnalytics |
                                   MytechERP.domain.Enums.PlanFeature.OfflineSync;
            }
            
            await context.SaveChangesAsync();
        }
        else
        {
            Console.WriteLine("Warning: Database migration and seeding skipped - DefaultConnection is a placeholder.");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($" Error seeding database: {ex.Message}");
    }
}

app.UseRouting();
app.UseCors("AllowFrontend");

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new { 
            message = exception?.Message, 
            stackTrace = exception?.StackTrace 
        }));
    });
});
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

try 
{
    app.UseHangfireDashboard("/hangfire");
    RecurringJob.AddOrUpdate<IWorkOrderGenerator>(
        "daily-maintenance-check",
        service => service.GenerateMonthlyJobs(),
        Cron.Daily);
} 
catch (Exception ex) 
{
    Console.WriteLine("Hangfire startup skipped: " + ex.Message);
}

app.UseStaticFiles();
app.MapControllers();
app.MapHub<MytechERP.API.Hubs.SyncHub>("/hubs/sync");
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.MapGet("/api/debug/migrations", async (MytechERP.Infrastructure.Persistance.ApplicationDbContext ctx) => 
{
    try 
    {
        var pending = await ctx.Database.GetPendingMigrationsAsync();
        if (!pending.Any()) return Results.Ok("No pending migrations.");
        
        await ctx.Database.MigrateAsync();
        return Results.Ok($"Successfully applied {pending.Count()} migrations.");
    }
    catch (Exception ex)
    {
        return Results.Problem(detail: ex.ToString(), title: "Migration Failed");
    }
});

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MytechERP.Infrastructure.Persistance.ApplicationDbContext>();
    try
    {
        dbContext.Database.Migrate();
        
        if (!dbContext.StoreTools.Any())
        {
            try 
            {
                var seedFile = Path.Combine(AppContext.BaseDirectory, "seed_tools.json");
                if (!File.Exists(seedFile)) 
                {
                    seedFile = "seed_tools.json"; // fallback to current dir
                }
                
                if (File.Exists(seedFile))
                {
                    var json = File.ReadAllText(seedFile);
                    var tools = System.Text.Json.JsonSerializer.Deserialize<List<MytechERP.domain.Entities.StoreTool>>(json);
                    if (tools != null && tools.Any())
                    {
                        dbContext.StoreTools.AddRange(tools);
                        dbContext.SaveChanges();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred while seeding the store tools: {ex.Message}");
            }
        }

        if (!dbContext.Offices.Any())
        {
            dbContext.Offices.AddRange(
                new MytechERP.domain.Entities.CRM.Office { Name = "Lahore", City = "Lahore" },
                new MytechERP.domain.Entities.CRM.Office { Name = "Karachi", City = "Karachi" },
                new MytechERP.domain.Entities.CRM.Office { Name = "Islamabad", City = "Islamabad" }
            );
            dbContext.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine("Error migrating database: " + ex.Message);
    }
}

app.Run();
