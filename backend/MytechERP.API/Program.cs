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
                   ?? new[] { "http://localhost:5173", "http://localhost:3000" };

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
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddIdentity<AppUser,IdentityRole>(options => {
    options.User.RequireUniqueEmail = false;
}).AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();
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
builder.Services.AddScoped<IProductImportService, ProductImportService>();
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
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfireServer();


builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IAssetService, AssetService>();
builder.Services.AddScoped<UniversalSyncService>();
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

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
        if (context.Database.GetPendingMigrations().Any())
        {
            context.Database.Migrate();
        }



        var userManager = services.GetRequiredService<UserManager<AppUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        
        await DefaultRoles.SeedAsync(userManager, roleManager);
        await DefaultSuperAdmin.SeedAsync(userManager, roleManager);

        // Seed Subscription Plans
        var configuration = services.GetRequiredService<IConfiguration>();
        string basicPriceId = configuration["Stripe:BasicPlanPriceId"] ?? "price_1QxT12Gqj2XF2N98w7If4lSj";
        string proPriceId = configuration["Stripe:ProPlanPriceId"] ?? "price_1QxT1FGqj2XF2N98hG5CnvC1";

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
    catch (Exception ex)
    {
        Console.WriteLine($" Error seeding database: {ex.Message}");
    }
}
app.UseExceptionHandler(opt => { });
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseExceptionHandler();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.UseHangfireDashboard("/hangfire");


app.UseStaticFiles();
app.MapControllers();
app.MapHub<MytechERP.API.Hubs.SyncHub>("/hubs/sync");
RecurringJob.AddOrUpdate<IWorkOrderGenerator>(
    "daily-maintenance-check",
    service => service.GenerateMonthlyJobs(),
    Cron.Daily);
app.Run();
