using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Src.Controllers;
using Src.Database;
using Src.Entities;
using Src.Repositories;
using Src.Services;
using Src.Shared.Repository;

namespace WalletProject
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(Configuration.GetConnectionString("DefaultConnection"))
            );

            services.AddScoped<IRepository<User, UserReadDTO>, UserRepository>();
            services.AddScoped<IRepository<Account, AccountReadDTO>, AccountRepository>();
            services.AddScoped<ITransactionRepository, TransactionRepository>();
            services.AddScoped<UserRepository>();
            services.AddScoped<IUserSettingsService, UserSettingsService>();
            services.AddScoped<ITimezoneService, TimezoneService>();

            // Add JWT Authentication
            var secretKey =
                Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
                ?? "your-super-secret-key-that-should-be-at-least-32-characters-long";
            var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "WalletProject";
            var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "WalletProject";

            services
                .AddAuthentication(options =>
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
                        ValidIssuer = jwtIssuer,
                        ValidAudience = jwtAudience,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(secretKey)
                        ),
                        ClockSkew = TimeSpan.Zero,
                    };
                });

            services.AddAuthorization();

            // Add CORS
            var allowedOrigins =
                Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "http://localhost:5173";
            services.AddCors(options =>
            {
                options.AddPolicy(
                    "AllowReactApp",
                    builder =>
                    {
                        builder
                            .WithOrigins(allowedOrigins)
                            .AllowAnyMethod()
                            .AllowAnyHeader()
                            .AllowCredentials();
                    }
                );
            });

            services.AddControllersWithViews();

            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist";
            });
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
                app.UseDeveloperExceptionPage();
            else
                app.UseExceptionHandler("/Error");

            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseRouting();

            // Use CORS
            app.UseCors("AllowReactApp");

            // Add Authentication and Authorization middleware
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                // Map API routes first to ensure they're handled by controllers
                endpoints.MapControllerRoute(
                    name: "api",
                    pattern: "api/{controller}/{action=Index}/{id?}"
                );

                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}"
                );
            });

            // Use conditional SPA proxy - only proxy non-API requests
            app.UseWhen(
                context => !context.Request.Path.StartsWithSegments("/api"),
                appBuilder =>
                {
                    appBuilder.UseSpa(spa =>
                    {
                        spa.Options.SourcePath = "ClientApp";

                        if (env.IsDevelopment())
                        {
                            var frontendUrl =
                                Environment.GetEnvironmentVariable("FRONTEND_URL")
                                ?? "http://localhost:5173";
                            spa.UseProxyToSpaDevelopmentServer(frontendUrl);
                        }
                    });
                }
            );
        }
    }
}
