using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Newtonsoft.Json;
using platform_core_service.Common.Entities.Identities;
using platform_core_service.Data;

namespace platform_core_service.Configuration;

public static class ServiceExtensions
{
    #region Configure Controller and NewtonsoftJson to it
    public static IServiceCollection ConfigureControllerWithNewtonsoftJson(this IServiceCollection services)
    {
        services.AddControllers()
                .AddNewtonsoftJson(options =>
                {
                    options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
                    options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
                });

        return services;
    }
    #endregion

    #region ConfigureCorsDomain
    public static IServiceCollection ConfigureCorsDomain(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment env)
    {
        services.AddCors(opt =>
        {
            opt.AddPolicy("CorsPolicy", builderCors =>
            {
                var corsLst = configuration.GetSection("AllowCors")
                                           .GetChildren()
                                           .Select(x => x.Value)
                                           .Where(x => x != "*")
                                           .ToArray();

                if (corsLst.Length > 0)
                {
                    builderCors
                        .WithOrigins(corsLst!)
                        .SetIsOriginAllowedToAllowWildcardSubdomains()
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                }
                else
                {
                    if (!env.IsDevelopment())
                    {
                        throw new InvalidOperationException(
                            $"AllowCors configuration is required in '{env.EnvironmentName}' environment. " +
                            "Please add allowed origins to appsettings.json.");
                    }

                    // Development only — wildcard fallback
                    builderCors
                        .AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader();
                }
            });
        });

        return services;
    }
    #endregion

    #region Configure Auth (JWT, OAuth2)
    public static IServiceCollection ConfigureAuthService(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAntiforgery(options => options.HeaderName = "X-XSRF-TOKEN");
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = configuration["Jwt:Issuer"],
                ValidAudience = configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    System.Text.Encoding.UTF8.GetBytes(configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured")))
            };

            // SignalR can't send Authorization headers on the initial WebSocket handshake
            // => using access_token and then set Token in the context for SignalR hubs
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(accessToken))
                    {
                        var path = context.HttpContext.Request.Path;
                        if (path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                    }
                    return Task.CompletedTask;
                }
            };
        });

        return services;
    }
    #endregion

    #region Configure Swagger
    public static IServiceCollection ConfigureSwaggerService(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.AddSecurityDefinition("bearer", new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "JWT Authorization header using the Bearer scheme."
            });

            options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("bearer", document)] = []
            });
        });

        return services;
    }
    #endregion

    #region Configure Database
    public static IServiceCollection ConfigurePostgresqlDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly("platform-core-service");
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorCodesToAdd: null);
            });
        });

        return services;
    }
    #endregion

    #region Configure Identity
    public static IServiceCollection ConfigureIdentity(this IServiceCollection services)
    {
        services.AddIdentityCore<ApplicationUser>(opt =>
        {
            opt.Password.RequiredLength = 6;
            opt.Password.RequireDigit = true;
            opt.Password.RequireNonAlphanumeric = true;
            opt.Password.RequireUppercase = true;
            opt.Password.RequireLowercase = true;
            opt.SignIn.RequireConfirmedEmail = true;
        })
        .AddRoles<ApplicationRole>()
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddRoleValidator<RoleValidator<ApplicationRole>>()
        .AddRoleManager<RoleManager<ApplicationRole>>()
        .AddSignInManager<SignInManager<ApplicationUser>>()
        .AddDefaultTokenProviders();

        // Configure password-reset token lifespan to 5 minutes
        services.Configure<DataProtectionTokenProviderOptions>(opts =>
        {
            opts.TokenLifespan = TimeSpan.FromMinutes(5);
        });

        return services;
    }
    #endregion

    #region Configure SignalR 
    public static IServiceCollection ConfigureSignalR(this IServiceCollection services)
    {
        services.AddSignalR(hubOptions =>
            {
                hubOptions.EnableDetailedErrors = true;
                hubOptions.KeepAliveInterval = TimeSpan.FromSeconds(5);
            });
        return services;
    }
    #endregion

    #region Configure Auto Mapper
    public static IServiceCollection ConfigureAutoMapper(this IServiceCollection services)
    {
        services.AddAutoMapper(cfg => cfg.ShouldMapMethod = _ => false, AppDomain.CurrentDomain.GetAssemblies());
        return services;
    }
    #endregion
}